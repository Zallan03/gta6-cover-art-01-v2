// Fixed scenes for screenshots: ?shot=editor shows the app with photos loaded;
// ?shot=cover shows one exported cover alone, drawn by the app itself at the
// export size. Query params: photo (sample name), photo2, layout, grade, size,
// caption (title), subtitle, badge. window.__shotReady is set once painted.
import { GRADES, LAYOUTS, SIZES } from './cover.js';

/** Applies the scene's query params onto the cover state. */
export function applyScene(query, state) {
  const layout = query.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = query.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = query.get('size');
  if (size && SIZES[size]) state.size = size;
  const title = query.get('caption');
  if (title !== null) state.title = title;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const badge = query.get('badge');
  if (badge !== null) state.badge = badge;
  // Per-panel photo assignment ("panels=0,1,1") and vertical pan ("pans=0.18").
  const panels = query.get('panels');
  if (panels) {
    panels.split(',').forEach((v, i) => {
      const n = Number(v);
      if (state.panels[i] && Number.isInteger(n) && n >= 0 && n < 3) state.panels[i].photo = n;
    });
  }
  const pans = query.get('pans');
  if (pans) {
    pans.split(',').forEach((v, i) => {
      const n = Number(v);
      if (state.panels[i] && Number.isFinite(n)) state.panels[i].oy = n;
    });
  }
}

export async function runShot(shot, query, state, redraw, loadImage) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    window.__shotCover = true;
  }
  applyScene(query, state);
  const first = query.get('photo') ?? 'boulevard';
  const second = query.get('photo2') ?? 'pier';
  let a;
  let b;
  try {
    [a, b] = await Promise.all([
      loadImage(`samples/${first}.jpg`),
      loadImage(`samples/${second}.jpg`),
    ]);
  } catch (err) {
    // A missing sample must not hang the shot: report it and still signal ready.
    window.__shotError = String(err && err.message ? err.message : err);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
      document.documentElement.setAttribute('data-shot-ready', 'true');
    }));
    return;
  }
  state.photos[0] = a;
  state.photos[1] = b;
  await redraw();
  // Two frames, so the fonts and the canvas have settled before the screenshot.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
    document.documentElement.setAttribute('data-shot-ready', 'true');
  }));
}
