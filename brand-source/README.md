# Brand source

`logo-master.png` is the ONE master artwork (complete lockup, opaque near-white canvas, 1217x1217).
Every shipped brand raster is generated from it:

    pip install pillow numpy scipy opencv-python-headless
    python3 brand-source/generate_brand_assets.py

| Output | Used for |
| --- | --- |
| `src/assets/brand/logo-mark.png` | `<Logo />` - header, footer, hero, dashboard, onboarding, loading skeleton |
| `public/icons/favicon-16/32/48.png` | browser tabs |
| `public/icons/apple-touch-icon.png` | iOS home screen (navy tile; iOS paints transparency black) |
| `public/icons/icon-192.png`, `icon-512.png` | PWA "any" icons, splash (transparent emblem) |
| `public/icons/icon-512-maskable.png` | PWA maskable icon (solid navy, emblem inside the 40% safe-zone circle) |
| `public/icons/og-cover.png` | OpenGraph / Twitter preview (1200x630, uses the full lockup) |
| `brand-source/logo-full.png` | transparent full lockup, source asset only (wordmark needs ~200px+ to be legible) |

The emblem ("mark") is the master with the "Allrounder Helper" wordmark and the two small corner
glyphs retouched out (Laplace fill of the orange field; white stripes, laptop and border untouched).
Coordinates in `build_mark_rgb()` are true pixels of the 1217x1217 master.

Do not put the logo in an `overflow-hidden` or opaque wrapper: the emblem is a triangle.
`logo-master.png` is deliberately NOT under `public/` so it is neither served nor precached (1 MB).
