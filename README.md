# Vice Sunset Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Zallan03/gta6-cover-art-01-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Zallan03/gta6-cover-art-01-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A GTA-style cover art maker for the [gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01) bounty on make.fun. Drop in your own photos, pick a layout and a colour grade, write your words, and export a poster-sized PNG to share.

Referral: https://make.fun/r/tmbrnhrj

## What it does

- **Three photo slots** — upload your own photos or use the two built-in samples. Each slot has its own zoom slider, and you drag the cover to pan the active slot. Panning is clamped, so a photo can never slide off its panel.
- **Four layouts** — Hero Trio (one tall hero panel + two stacked), Grid Four (2×2), Full Bleed (one big panel), and Tilt Collage (three overlapping tilted panels).
- **Four colour grades** — Vice Sunset, Neon Nights, Golden Hour, and Noir Pop. Each grade is a canvas filter plus a colour wash, film grain, a vignette, and a white poster frame.
- **Big display type** — the title is set in Anton with a sunset gradient and a dark outline; the subtitle is Pacifico script with a neon glow; the badge is a tilted ribbon in the top corner.
- **Export PNG** in the three common post sizes: 1080 × 1080, 1080 × 1350, and 1920 × 1080. The preview is live — what you see is what the PNG looks like.

## Shortcuts

- Keys `1`–`4` switch layout, `G` cycles the grade, `E` exports.
- **Surprise me** picks a random layout + grade, keeping your photos and words.
- The film grain is seeded, so the same cover always exports the same pixels.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is plain static files under `app/` with no build step and no network request: every script, image, and font is a file under `app/`, and your photos are read on your own machine, never uploaded.

## Files

- `app/index.html` — the editor page
- `app/style.css` — dusk-purple editor chrome, sunset accents
- `app/src/cover.js` — the poster renderer: layouts, grades, crops, type
- `app/src/main.js` — editor wiring: slots, drag-to-pan, export
- `app/src/shots.js` — fixed `?shot=` scenes for the screenshots
- `app/fonts/` — Anton and Pacifico (SIL Open Font License 1.1, OFL text included)
- `app/samples/` — two sample photos, made for make.fun with an image model
- `main.ts` — hands the app in: copies `app/` + `screenshots/` and writes `dossier.json`
- `shots.json` — the four screenshot scenes

## Notes

- Original work only: no Rockstar Games logo, wordmark, official artwork, character, or font file. The Anton and Pacifico fonts ship under the SIL Open Font License 1.1; their license texts sit next to the font files in `app/fonts/`.
- Screenshots in `screenshots/` are the app's own output: the first is the cover, one shows the editor with a photo loaded, and the rest show exported covers in other sizes.
- Hand in with `MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts`.
