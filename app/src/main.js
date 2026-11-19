// Wires the page: photos in, layout / grade / words chosen, panels cropped by
// drag, and the cover exported as a PNG at 1080x1080, 1080x1350 or 1920x1080.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, freshCoverState, layoutPanels, panelAt, clampPanelPan, GRADES, LAYOUTS, SIZES } from './cover.js';

const canvas = document.getElementById('cover');
const panelBar = document.getElementById('panel-bar');
const status = document.getElementById('status');
const state = freshCoverState();
let selectedPanel = 0;
let drag = null;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The preview canvas follows the chosen export size's aspect, capped for the screen.
 * A cover screenshot scene draws at the full export size instead, so the shot is sharp. */
export function fitPreviewCanvas() {
  const size = SIZES[state.size];
  if (window.__shotCover === true) {
    canvas.width = size.w;
    canvas.height = size.h;
    return;
  }
  const scale = Math.min(720 / size.w, 720 / size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
}

/** Draws the live preview, waiting for the Anton and Pacifico fonts first. */
export async function redraw() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch {
    // The system fallback still draws if a font file fails to load.
  }
  fitPreviewCanvas();
  drawCover(canvas, state);
  renderPanelBar();
}

/** The panel cards under the preview: pick a photo and a zoom per panel. */
export function renderPanelBar() {
  const panels = layoutPanels(state);
  if (selectedPanel >= panels.length) selectedPanel = 0;
  panelBar.innerHTML = '';
  panels.forEach((def, i) => {
    const panel = state.panels[i];
    const card = document.createElement('div');
    card.className = 'panel-card' + (i === selectedPanel ? ' selected' : '');
    card.innerHTML = `<h3>Panel ${i + 1}${i === 0 ? ' · hero' : ''}</h3>`;
    const pick = document.createElement('div');
    pick.className = 'photo-pick';
    [0, 1, 2].forEach((n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = state.photos[n] ? `Photo ${n + 1}` : `Photo ${n + 1} · empty`;
      if (panel.photo === n) b.classList.add('active');
      b.addEventListener('click', () => {
        state.panels[i].photo = n;
        selectedPanel = i;
        redraw();
      });
      pick.appendChild(b);
    });
    card.appendChild(pick);
    const zoomLabel = document.createElement('label');
    zoomLabel.textContent = 'Zoom';
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.5';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom || 1);
    zoom.addEventListener('input', () => {
      state.panels[i].zoom = Number(zoom.value);
      selectedPanel = i;
      // Zooming in widens the allowed pan; re-clamp so the photo still covers.
      const def = layoutPanels(state)[i];
      clampPanelPan(state, { w: def.w * canvas.width, h: def.h * canvas.height }, i);
      redraw();
    });
    zoomLabel.appendChild(zoom);
    card.appendChild(zoomLabel);
    card.addEventListener('click', () => {
      selectedPanel = i;
      renderPanelBar();
    });
    panelBar.appendChild(card);
  });
}

// Photo inputs: read the file on this machine, never upload it anywhere.
[0, 1, 2].forEach((n) => {
  document.getElementById(`photo-${n}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.photos[n] = await loadImage(URL.createObjectURL(file));
    status.textContent = `Photo ${n + 1} loaded — ${file.name}`;
    redraw();
  });
});

document.getElementById('samples').addEventListener('click', async () => {
  const [a, b] = await Promise.all([
    loadImage('samples/boulevard.jpg'),
    loadImage('samples/pier.jpg'),
  ]);
  state.photos[0] = a;
  state.photos[1] = b;
  status.textContent = 'Sample photos loaded — drag a panel to move its photo.';
  redraw();
});

// Layout, grade and size buttons.
document.getElementById('layouts').addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout]');
  if (!b || !LAYOUTS[b.dataset.layout]) return;
  state.layout = b.dataset.layout;
  document.querySelectorAll('#layouts button').forEach((x) => x.classList.toggle('active', x === b));
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grade]');
  if (!b || !GRADES[b.dataset.grade]) return;
  state.grade = b.dataset.grade;
  document.querySelectorAll('#grades button').forEach((x) => x.classList.toggle('active', x === b));
  redraw();
});
document.getElementById('sizes').addEventListener('click', (e) => {
  const b = e.target.closest('[data-size]');
  if (!b || !SIZES[b.dataset.size]) return;
  state.size = b.dataset.size;
  document.querySelectorAll('#sizes button').forEach((x) => x.classList.toggle('active', x === b));
  redraw();
});

// Words and finish toggles.
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('frame').addEventListener('change', (e) => { state.frame = e.target.checked; redraw(); });

// Drag on the preview to pan the photo inside the panel under the pointer.
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(state, canvas.width, canvas.height, p.x, p.y);
  if (i < 0) return;
  selectedPanel = i;
  canvas.setPointerCapture(e.pointerId);
  drag = { panel: i, x: p.x, y: p.y };
  renderPanelBar();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[drag.panel];
  const def = layoutPanels(state)[drag.panel];
  panel.ox += (p.x - drag.x) / (def.w * canvas.width);
  panel.oy += (p.y - drag.y) / (def.h * canvas.height);
  clampPanelPan(state, { w: def.w * canvas.width, h: def.h * canvas.height }, drag.panel);
  drag.x = p.x;
  drag.y = p.y;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

/** Draws the current cover at full export size and returns its PNG blob. */
export async function exportCoverBlob() {
  const size = SIZES[state.size];
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out, state);
  return new Promise((resolve) => out.toBlob(resolve, 'image/png'));
}

// Export: draw the same cover at full post size and download it as a PNG.
document.getElementById('export').addEventListener('click', async () => {
  const size = SIZES[state.size];
  const blob = await exportCoverBlob();
  if (!blob) {
    status.textContent = 'Export failed — please try again.';
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-sunset-cover-${size.w}x${size.h}.png`;
  a.click();
  status.textContent = `Saved vice-sunset-cover-${size.w}x${size.h}.png`;
});

// Headless check hook: exportCoverBlob is exposed so a test can verify the
// export path without clicking the button.
window.__exportCover = exportCoverBlob;

// Screenshot scenes, or the live editor with the sample photos preloaded.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  const { runShot } = await import('./shots.js');
  runShot(shot, query, state, redraw, loadImage);
} else {
  document.getElementById('samples').click();
}
