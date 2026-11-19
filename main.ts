// Vice Sunset Cover Studio — a gta6-cover-art-01 entry (Node 22, standard library only): the app is this
// directory's app/ folder, plain static files a desktop browser loads offline (app/index.html and its ES modules, no
// library and no network request), and the program hands it in. It copies app/ and screenshots/ from beside this file
// to /output and writes /output/dossier.json, the summary the judge reads, with the vendored make.fun library.
// Rebuild 2: the cover engine, editor and screenshots were rewritten in a fresh recorded session after the first
// attempt's README was edited outside its recording.
// The app turns up to three of the person's own photos (or the two bundled samples) into multi-panel GTA-style poster
// cover art — four layouts, four colour grades, Anton title with a sunset gradient, Pacifico script subtitle, badge
// ribbon, film grain and a white poster frame — exported as a 1080x1080, 1080x1350 or 1920x1080 PNG.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
