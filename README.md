# Vice Sunset Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Zallan03/gta6-cover-art-01-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Zallan03/gta6-cover-art-01-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Built for the make.fun bounty — join make.fun via my referral: https://make.fun/r/tmbrnhrj

An entry for [gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01): an offline web app
that turns your photo and a caption into GTA 6-style cover art — a multi-panel poster
with bold sunset-gradient lettering and a Vice City sunset or neon grade — exported as
a PNG to share.

## What it does

- **Any photo:** load up to 3 photos from your machine (never uploaded), plus the 2
  bundled sample photos. Fill several panels with one photo or several.
- **Crop & position each panel:** pick a photo per panel, zoom with a slider, drag on
  the preview to pan. Every panel keeps its own crop.
- **4 layouts:** Hero + 3 panels, Grid 2×2, Full bleed, Tilted snapshot collage.
- **4 grades:** Vice Sunset, Neon Nights, Golden Hour, Noir Pop — canvas filter plus a
  sunset/neon colour wash, film grain and vignette, inside a white poster frame.
- **Lettering:** big Anton title with a sunset gradient, Pacifico script subtitle with a
  neon glow, and a tilted badge ribbon. Caption, subtitle and badge are all editable.
- **Fast & easy:** photo → live preview → one click exports a PNG at 1080×1080,
  1080×1350 or 1920×1080.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Everything the app loads is a file under `app/` — no network request at runtime.
Fonts (Anton + Pacifico, SIL Open Font License 1.1) live under `app/fonts/` with their
license texts beside them. The photos in the screenshots are the kit's bundled sample
photos, made with an image model for make.fun and free to use.

## Screenshots

`screenshots/` holds 4 real captures from headless Chromium: the exported covers
(hero-trio / Vice Sunset at 1920×1080, grid 2×2 / Neon Nights at 1080×1350, tilted
collage / Golden Hour at 1080×1080) and the editor with photos loaded. Each shot is
driven by a `?shot=` scene in `app/src/shots.js` — see `shots.json` for the exact
queries and window sizes.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output dir and writes
`dossier.json` with the vendored `vendor/makefun-app.ts` library.

## License

MIT — see [LICENSE](LICENSE).
