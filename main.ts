// Vice Sunset Cover Studio — a gta6-cover-art-01 entry (Node 22, standard library only).
// The app is this directory's app/ folder: plain static files a desktop browser loads offline
// (app/index.html and its ES modules, no library and no network request). It turns up to three
// photos and a caption into GTA-style multi-panel cover art with a Vice City sunset or neon
// grade, and exports it as a PNG in the common post sizes 1080 x 1080, 1080 x 1350 and
// 1920 x 1080. Its two sample photos (app/samples/) were made for make.fun with an image model
// and are free to use. This program hands the app in: it copies app/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the judge reads,
// with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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

// Preflight: refuse to hand in screenshots the gate would refuse (over 256 KiB),
// and report the dossier size so a local run shows the entry is inside the caps.
const shotDir = join(out, 'screenshots');
for (const name of readdirSync(shotDir)) {
  const bytes = statSync(join(shotDir, name)).size;
  if (bytes > 262144) throw new Error(`screenshot ${name} is ${bytes} bytes (cap 262144)`);
}
const dossierBytes = statSync(join(out, 'dossier.json')).size;

// Vice Sunset Cover Studio, built fresh in this session: app/ + screenshots/ handed in.
console.log(`Vice Sunset Cover Studio dossier written to ${join(out, 'dossier.json')} (${dossierBytes} bytes)`);
