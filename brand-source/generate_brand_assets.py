#!/usr/bin/env python3
"""
Regenerates every ALLROUNDER HELPER brand raster from ONE master file.

  brand-source/logo-master.png   (the complete lockup: opaque near-white canvas, 1217x1217)

Outputs
  src/assets/brand/logo-mark.png     256x256  transparent emblem (no wordmark) - header/footer/hero/dashboard/onboarding
  brand-source/logo-full.png         ~720px   transparent complete lockup (source asset; used to compose the OG cover,
                                                 not shipped in the bundle - no UI surface renders it large enough)
  public/icons/favicon-16|32|48.png           transparent emblem
  public/icons/apple-touch-icon.png  180x180  emblem on brand navy (iOS ignores transparency)
  public/icons/icon-192.png / icon-512.png    transparent emblem, "any" purpose
  public/icons/icon-512-maskable.png 512x512  emblem on solid navy, fully inside the 80% safe-zone circle
  public/icons/og-cover.png          1200x630 social preview

The emblem ("mark") is the master with the wordmark and the two tiny corner glyphs
retouched out of the orange field so nothing unreadable survives at 16-64px. The
laptop, the "A" strokes, the gradient and the triangle border are untouched.

Usage (from repo root):   python3 brand-source/generate_brand_assets.py
Needs: pillow, numpy, scipy, opencv-python(-headless)
"""
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage as ndi
from scipy import sparse
from scipy.sparse.linalg import splu

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / 'brand-source' / 'logo-master.png'
NAVY = (10, 14, 26)          # matches theme_color / background_color in the manifest
NAVY_HEX = '#0a0e1a'


# ----------------------------------------------------------------------------- matte
def load_master():
    return np.array(Image.open(MASTER).convert('RGB')).astype(np.float32)


def build_alpha(rgb):
    """Near-white pixels connected to the image border are background. Interior white
    stripes are enclosed by the navy border, so they are preserved."""
    near_white = rgb.min(axis=2) >= 232
    lab, _ = ndi.label(near_white)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, [v for v in edge if v != 0])
    fg = ~bg
    band = ndi.binary_dilation(bg, iterations=4) & ndi.binary_dilation(fg, iterations=4)
    alpha = fg.astype(np.float32)
    soft = np.clip((250.0 - rgb[..., 0]) / (250.0 - 15.0), 0, 1)  # red channel: navy ~0, white ~255
    alpha[band & bg] = soft[band & bg]
    alpha[band & fg] = 1.0
    return alpha, fg


def decontaminate(rgb, alpha):
    """Anti-aliased edge pixels still carry white from the old canvas. Replace their colour
    with the nearest fully-opaque pixel so the edge is clean on dark backgrounds."""
    solid = alpha >= 0.999
    solid = ndi.binary_erosion(solid, iterations=2)
    idx = ndi.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    out = rgb.copy()
    soft = ~solid
    out[soft] = rgb[idx[0][soft], idx[1][soft]]
    return out


# ----------------------------------------------------------------------------- retouch
def harmonic_fill(img, unknown):
    """Solve Laplace's equation over the `unknown` pixels with the surrounding known pixels as
    boundary values (Neumann at the array edge). Result is seamless with its surroundings."""
    h, w = unknown.shape
    idx = -np.ones((h, w), np.int64)
    ys, xs = np.where(unknown)
    idx[ys, xs] = np.arange(len(ys))
    n = len(ys)
    rows, cols, vals = [], [], []
    rhs = np.zeros((n, img.shape[2]), np.float64)
    diag = np.zeros(n)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        ny, nx = ys + dy, xs + dx
        inside = (ny >= 0) & (ny < h) & (nx >= 0) & (nx < w)
        diag += inside
        ii = np.where(inside)[0]
        nidx = idx[ny[ii], nx[ii]]
        unk = nidx >= 0
        rows.append(ii[unk]); cols.append(nidx[unk]); vals.append(-np.ones(unk.sum()))
        kn = ii[~unk]
        rhs[kn] += img[ny[kn], nx[kn]]
    rows.append(np.arange(n)); cols.append(np.arange(n)); vals.append(diag)
    A = sparse.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(n, n))
    out = img.copy()
    lu = splu(A.tocsc())
    for c in range(img.shape[2]):
        out[ys, xs, c] = lu.solve(rhs[:, c])
    return out


def build_mark_rgb(rgb, fg):
    """Remove the wordmark + corner glyphs from the master. Coordinates are true pixels of
    the 1217x1217 master (see brand-source/README.md)."""
    # stay clear of the border ring: it is the only large blue-dominant (b > r) area near the edges
    blue = (rgb[..., 2] > rgb[..., 0] + 15) & fg
    lab, n = ndi.label(blue)
    sizes = ndi.sum(blue, lab, range(1, n + 1))
    big = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz > 5000])   # ring + blue stripe, not glyph edge pixels
    ring = ndi.binary_dilation(big, iterations=7)
    interior = ndi.binary_erosion(fg, iterations=50) & ~ring

    region = np.zeros(rgb.shape[:2], bool)
    region[978:1090, 80:1140] = True     # "Allrounder Helper" band, full field width
    region[892:1090, 90:240] = True      # document + gear glyph (bottom-left)
    region[906:1090, 948:1135] = True    # tablet glyph (bottom-right)
    region &= interior

    white = rgb.min(axis=2) > 225
    stripes = ndi.binary_dilation(white, iterations=2) & interior

    # work in a crop around the bottom of the field
    y0, y1, x0, x1 = 860, 1106, 60, 1160
    crop = rgb[y0:y1, x0:x1].astype(np.float64)
    unknown = (region | stripes)[y0:y1, x0:x1]
    solved = harmonic_fill(crop, unknown)
    out = rgb.copy()
    write = (region & ~stripes)[y0:y1, x0:x1]         # stripes are restored from the master
    out[y0:y1, x0:x1][write] = solved[write]
    return out, None


# ----------------------------------------------------------------------------- helpers
def to_rgba(rgb, alpha):
    a = np.clip(alpha * 255 + 0.5, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a]), 'RGBA')


def crop_to_content(img, pad_frac=0.0, square=False):
    bbox = img.getchannel('A').point(lambda v: 255 if v > 4 else 0).getbbox()
    im = img.crop(bbox)
    w, h = im.size
    side_w, side_h = w, h
    if square:
        side_w = side_h = max(w, h)
    pad = int(round(max(side_w, side_h) * pad_frac))
    canvas = Image.new('RGBA', (side_w + 2 * pad, side_h + 2 * pad), (0, 0, 0, 0))
    canvas.paste(im, ((side_w - w) // 2 + pad, (side_h - h) // 2 + pad), im)
    return canvas


def resize_sharp(img, size, sharpen=True):
    out = img.resize(size, Image.LANCZOS)
    if sharpen and max(size) <= 64:
        out = out.filter(ImageFilter.UnsharpMask(radius=0.6, percent=70, threshold=0))
    return out


def on_navy(mark, canvas, fill_frac):
    """Mark centred on a solid navy square, longest side = fill_frac of the canvas."""
    bg = Image.new('RGBA', (canvas, canvas), NAVY + (255,))
    side = int(round(canvas * fill_frac))
    m = mark.resize((side, side), Image.LANCZOS)
    bg.paste(m, ((canvas - side) // 2, (canvas - side) // 2), m)
    return bg.convert('RGB')


def maskable(mark_hi, canvas=512, safe_radius_frac=0.385):
    """Fit the mark's opaque pixels inside a circle of safe_radius_frac*canvas, centred.
    (Maskable safe zone = circle of radius 40% of the canvas; 38.5% leaves a margin.)"""
    a = np.array(mark_hi.getchannel('A'))
    ys, xs = np.where(a > 128)
    pts = np.column_stack([xs, ys]).astype(np.float32)
    (cx, cy), r = cv2.minEnclosingCircle(pts)
    scale = (canvas * safe_radius_frac) / r
    new = mark_hi.resize((round(mark_hi.width * scale), round(mark_hi.height * scale)), Image.LANCZOS)
    bg = Image.new('RGBA', (canvas, canvas), NAVY + (255,))
    ox = round(canvas / 2 - cx * scale)
    oy = round(canvas / 2 - cy * scale)
    bg.alpha_composite(new, (ox, oy))
    return bg.convert('RGB'), scale * r / canvas


def find_font(bold=True):
    names = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'] if bold else ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
    for n in names:
        if Path(n).exists():
            return n
    return None


# ----------------------------------------------------------------------------- main
def main():
    rgb = load_master()
    alpha, fg = build_alpha(rgb)
    clean = decontaminate(rgb, alpha)

    # complete lockup
    full = crop_to_content(to_rgba(clean, alpha), pad_frac=0.012)
    full_out = full.resize((720, round(720 * full.height / full.width)), Image.LANCZOS)

    # emblem (no wordmark / corner glyphs)
    mark_rgb, _ = build_mark_rgb(clean, fg)
    mark_full = crop_to_content(to_rgba(mark_rgb, alpha), pad_frac=0.0, square=True)
    mark_hi = mark_full.resize((1024, 1024), Image.LANCZOS)
    mark_256 = crop_to_content(mark_hi, pad_frac=0.02, square=True).resize((256, 256), Image.LANCZOS)

    brand = ROOT / 'src' / 'assets' / 'brand'
    icons = ROOT / 'public' / 'icons'
    brand.mkdir(parents=True, exist_ok=True)
    full_out.save(ROOT / 'brand-source' / 'logo-full.png', optimize=True)
    mark_256.save(brand / 'logo-mark.png', optimize=True)

    # favicons: emblem fills the canvas (1px breathing room), transparent
    padded = crop_to_content(mark_hi, pad_frac=0.03, square=True)
    for s in (16, 32, 48):
        resize_sharp(padded, (s, s)).save(icons / f'favicon-{s}.png', optimize=True)

    # "any" PWA icons: transparent emblem with ~4% margin
    any_src = crop_to_content(mark_hi, pad_frac=0.04, square=True)
    any_src.resize((192, 192), Image.LANCZOS).save(icons / 'icon-192.png', optimize=True)
    any_src.resize((512, 512), Image.LANCZOS).save(icons / 'icon-512.png', optimize=True)

    # apple-touch-icon: iOS paints transparency black, so use the intended navy tile
    on_navy(crop_to_content(mark_hi, square=True), 180, 0.74).save(icons / 'apple-touch-icon.png', optimize=True)

    # genuine maskable icon: solid navy full-bleed, emblem inside the safe-zone circle
    m_img, r_frac = maskable(crop_to_content(mark_hi, square=True))
    m_img.save(icons / 'icon-512-maskable.png', optimize=True)
    print(f'maskable: emblem radius = {r_frac*100:.1f}% of canvas (safe zone limit 40%)')

    # OG / Twitter cover 1200x630
    W, H = 1200, 630
    og = Image.new('RGB', (W, H))
    top, bot = np.array([10, 14, 26]), np.array([22, 27, 51])
    grad = np.linspace(0, 1, H)[:, None, None] * (bot - top) + top
    og = Image.fromarray(np.repeat(grad, W, axis=1).astype(np.uint8), 'RGB').convert('RGBA')
    logo_h = 470
    lockup = full.resize((round(logo_h * full.width / full.height), logo_h), Image.LANCZOS)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((20, 40, 620, 600), fill=(255, 160, 40, 46))
    og.alpha_composite(glow.filter(ImageFilter.GaussianBlur(70)))
    lx, ly = 88, (H - lockup.height) // 2
    og.alpha_composite(lockup, (lx, ly))
    d = ImageDraw.Draw(og)
    f = find_font(True)
    f_title = ImageFont.truetype(f, 66)
    f_tag = ImageFont.truetype(find_font(False), 31)
    tx = 606
    d.text((tx, 190), 'ALLROUNDER', font=f_title, fill=(255, 255, 255))
    d.text((tx, 268), 'HELPER', font=f_title, fill=(59, 108, 255))
    d.text((tx, 372), 'The Ultimate Student', font=f_tag, fill=(184, 190, 224))
    d.text((tx, 414), 'Productivity Platform', font=f_tag, fill=(184, 190, 224))
    og.convert('RGB').save(icons / 'og-cover.png', optimize=True)

    print('wrote assets; lockup', full_out.size, 'mark', mark_256.size)


if __name__ == '__main__':
    main()
