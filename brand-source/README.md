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
| `src/assets/brand/logo-full.png` | `<Logo variant="full" />` - complete lockup, only for surfaces >= ~160px tall (About page) |
| `brand-source/logo-full.png` | same lockup at 720px, source copy used to compose the OG cover |

The emblem ("mark") is the master with ONLY the "Allrounder Helper" wordmark removed (the band it sat
in is re-solved from the surrounding orange field). Laptop, A, light bar, document/gear glyph, tablet
glyph, stripes and border are the master's own pixels. `logo-master.png` is pixel-identical to the
original artwork supplied by the owner. Coordinates in `build_mark_rgb()` are true master pixels.

UI sizing scale (`Logo.tsx`): 40 nav (header/footer), 48 dashboard title, 56 onboarding/static pages,
56 (mobile) / 88 (desktop) hero, 160 full lockup.

Do not put the logo in an `overflow-hidden` or opaque wrapper: the emblem is a triangle.
`logo-master.png` is deliberately NOT under `public/` so it is neither served nor precached (1 MB).
