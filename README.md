# Vice Sunset Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Zallan03/gta6-cover-art-01-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Zallan03/gta6-cover-art-01-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Competition:** [gta6-cover-art-01 — Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01)

**Try it with my referral:** https://make.fun/r/tmbrnhrj

An offline web app that turns your own photos and a caption into GTA 6-style
poster cover art — the multi-panel look, bold caption lettering and a Vice City
sunset or neon colour grade — and exports it as a PNG to share.

## What it does

- **Any photo:** load up to three photos from your machine (or the two bundled
  samples). Fill several panels with one photo or give each panel its own.
- **Crop and position:** click a panel in the preview to select it, drag to move
  its photo, use the zoom slider — every panel keeps its own crop, and the pan
  is clamped so a photo always covers its panel (never an empty gap).
- **Four layouts:** Hero + 3, Grid 2×2, Full bleed, and a tilted snapshot collage.
- **Four colour grades:** Vice Sunset, Neon Nights, Golden Hour and Noir Pop —
  each a photo filter plus a sunset/neon wash, with film grain and a vignette.
- **Words:** a big Anton title with a sunset gradient, a Pacifico script
  subtitle with a neon glow, and a tilted badge ribbon.
- **Fast and easy:** photo → cover in a few clicks, exported as a PNG in
  1080×1080, 1080×1350 or 1920×1080.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: every file the app loads lives under `app/`
(the two fonts are vendored under the SIL Open Font License, with their OFL
texts beside them). Photos are read on your machine and never uploaded.

## Original work

Everything here is the author's own design. No Rockstar Games logo, wordmark,
official artwork, character or font is used. The lettering is
[Anton](https://github.com/googlefonts/AntonFont) and
[Pacifico](https://github.com/googlefonts/Pacifico), both SIL OFL 1.1.
The two sample photos (`app/samples/`) were made with an image model for
make.fun and are free to use.

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with the kit's
`vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots in `screenshots/` were taken by the app's maker in headless
Chromium, from the app running on a local static server: the first is an
exported cover, the second the editor with photos loaded, the rest exported
covers in the other post sizes.

## Verification

- Headless Chromium: `__shotReady` true on every shot scene, the export path
  (`window.__exportCover`) returns a PNG blob (2.7–4.6 MB per size), zero
  console errors, and all requests stayed local (localhost only).
- `main.ts` run twice with different `MAKEFUN_OUTPUT_DIR` values produced
  byte-identical output (`dossier.json` cmp clean, `diff -r` clean).
  `dossier.json` is 761,790 bytes (< 1.5 MiB); `app/` is 660,665 bytes
  (< 48 MiB).
- `node --check` passes for `main.ts` and every app JS file (`serve.ts` is the
  kit's file with a TypeScript type annotation, which `node --check` cannot
  strip — it runs and serves HTTP 200 under `node serve.ts`).
- Screenshots (all JPEG, long side ≤ 1280, short side ≥ 480, each ≤ 256 KiB):
  `1-cover.jpg` 1280×720, 103,524 bytes; `2-editor.jpg` 1280×720, 103,143
  bytes; `3-cover.jpg` 1024×1280, 177,524 bytes; `4-cover.jpg` 1080×1080,
  160,711 bytes. Each was checked visually: faces in frame, badges unclipped,
  no empty panels.
