// Vice Sunset Cover Studio — editor wiring: photo slots, layout/grade/size picks,
// per-panel crop (photo pick, zoom slider, drag-to-pan) and PNG export.
// One drawCover engine (./cover.js) renders the preview and the export.
import { drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const photoStatus = document.getElementById('photoStatus');
const layoutEl = document.getElementById('layout');
const gradeEl = document.getElementById('grade');
const sizeEl = document.getElementById('size');
const captionEl = document.getElementById('caption');
const subtitleEl = document.getElementById('subtitle');
const badgeEl = document.getElementById('badge');
const panelEl = document.getElementById('panel');
const panelPhotoEl = document.getElementById('panelPhoto');
const zoomEl = document.getElementById('zoom');

// Photo slots: 0..2 are the user's uploads, 3..4 are the bundled kit samples.
const photos = [
  { img: null, zoom: 1.08, panX: 0, panY: 0 },
  { img: null, zoom: 1.08, panX: 0, panY: 0 },
  { img: null, zoom: 1.08, panX: 0, panY: 0 },
  { img: null, zoom: 1.08, panX: 0, panY: 0 },
  { img: null, zoom: 1.08, panX: 0, panY: 0 },
];
const SAMPLE_NAMES = ['Boulevard', 'Pier'];
let panels = [3, 4, 3, 4]; // photo-slot index per panel; hero gets Boulevard, others Pier.
let selectedPanel = 0;
let fontsReady = false;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads the bundled Anton + Pacifico fonts before the first draw. */
export async function loadFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch { /* fall back to system fonts if a font file fails */ }
  fontsReady = true;
}

/** Current editor state in the shape drawCover takes. */
export function currentState() {
  return {
    photos,
    panels: panels.slice(),
    layout: layoutEl.value,
    grade: gradeEl.value,
    caption: captionEl.value,
    subtitle: subtitleEl.value,
    badge: badgeEl.value,
  };
}

/** Sizes the preview canvas to the chosen export aspect (max 720 on a side). */
export function sizePreview() {
  const [w, h] = sizeEl.value.split('x').map(Number);
  const scale = Math.min(1, 720 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
}

/** Rebuilds the panel + photo pickers for the current layout. */
export function rebuildPanelPickers() {
  const count = panelRects(layoutEl.value).length;
  panels = panels.slice(0, count);
  while (panels.length < count) panels.push(panels.length % 2 === 0 ? 3 : 4);
  if (selectedPanel >= count) selectedPanel = 0;
  panelEl.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Panel ${i + 1}${i === 0 ? ' (hero)' : ''}`;
    panelEl.appendChild(opt);
  }
  panelEl.value = String(selectedPanel);
  panelPhotoEl.innerHTML = '';
  const labels = ['Photo 1', 'Photo 2', 'Photo 3', 'Sample: Boulevard', 'Sample: Pier'];
  labels.forEach((label, slot) => {
    const opt = document.createElement('option');
    opt.value = slot;
    opt.textContent = label + (photos[slot].img ? '' : ' (empty)');
    panelPhotoEl.appendChild(opt);
  });
  panelPhotoEl.value = String(panels[selectedPanel]);
  zoomEl.value = String(photos[panels[selectedPanel]].zoom);
}

/** Redraws the preview from the current state. */
export async function redraw() {
  await loadFonts();
  sizePreview();
  drawCover(canvas, currentState());
}

function refreshPhotoStatus() {
  const loaded = photos.filter((p) => p.img).length;
  photoStatus.textContent = loaded
    ? `${loaded} photo${loaded > 1 ? 's' : ''} loaded — pick a panel to crop it.`
    : 'No photo yet — try a sample photo.';
}

/** Loads a user file into a photo slot and redraws. */
export async function loadSlot(slot, file) {
  const img = await loadImage(URL.createObjectURL(file));
  photos[slot] = { img, zoom: 1.08, panX: 0, panY: 0 };
  refreshPhotoStatus();
  rebuildPanelPickers();
  await redraw();
}

[1, 2, 3].forEach((n) => {
  document.getElementById(`photo${n}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await loadSlot(n - 1, file);
  });
});

document.getElementById('sampleA').addEventListener('click', async () => {
  photos[3].img = await loadImage('samples/boulevard.jpg');
  refreshPhotoStatus(); rebuildPanelPickers(); await redraw();
});
document.getElementById('sampleB').addEventListener('click', async () => {
  photos[4].img = await loadImage('samples/pier.jpg');
  refreshPhotoStatus(); rebuildPanelPickers(); await redraw();
});

layoutEl.addEventListener('change', async () => { rebuildPanelPickers(); await redraw(); });
gradeEl.addEventListener('change', redraw);
sizeEl.addEventListener('change', redraw);
captionEl.addEventListener('input', redraw);
subtitleEl.addEventListener('input', redraw);
badgeEl.addEventListener('input', redraw);
panelEl.addEventListener('change', () => {
  selectedPanel = Number(panelEl.value);
  panelPhotoEl.value = String(panels[selectedPanel]);
  zoomEl.value = String(photos[panels[selectedPanel]].zoom);
});
panelPhotoEl.addEventListener('change', async () => {
  panels[selectedPanel] = Number(panelPhotoEl.value);
  zoomEl.value = String(photos[panels[selectedPanel]].zoom);
  await redraw();
});
zoomEl.addEventListener('input', async () => {
  photos[panels[selectedPanel]].zoom = Number(zoomEl.value);
  await redraw();
});

// Drag-to-pan on the preview: moves the selected panel's photo.
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', async (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const slot = photos[panels[selectedPanel]];
  slot.panX += (e.clientX - lastX) / rect.width;
  slot.panY += (e.clientY - lastY) / rect.height;
  slot.panX = Math.max(-0.6, Math.min(0.6, slot.panX));
  slot.panY = Math.max(-0.6, Math.min(0.6, slot.panY));
  lastX = e.clientX; lastY = e.clientY;
  await redraw();
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });

/** Exports the cover at the chosen size as a PNG download, via the same engine. */
export async function exportCover() {
  await loadFonts();
  const [w, h] = sizeEl.value.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off, currentState());
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-sunset-cover-${w}x${h}.png`;
      a.click();
      statusEl.textContent = `Saved vice-sunset-cover-${w}x${h}.png`;
      resolve(blob);
    }, 'image/png');
  });
}

document.getElementById('export').addEventListener('click', exportCover);
// Exposed for headless checks: the export path is the same engine as the preview.
window.__exportCover = exportCover;

// ?shot= scenes for screenshots (./shots.js); otherwise start with the samples loaded.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadImage, loadFonts, redraw, photos, setPanels: (p) => { panels = p; },
    setLayout: (v) => { layoutEl.value = v; },
    setGrade: (v) => { gradeEl.value = v; },
    setSize: (v) => { sizeEl.value = v; },
    setCaption: (v) => { captionEl.value = v; },
    setSubtitle: (v) => { subtitleEl.value = v; },
    setBadge: (v) => { badgeEl.value = v; },
    rebuildPanelPickers, refreshPhotoStatus, canvas,
  });
} else {
  (async () => {
    photos[3].img = await loadImage('samples/boulevard.jpg');
    photos[4].img = await loadImage('samples/pier.jpg');
    refreshPhotoStatus();
    rebuildPanelPickers();
    await redraw();
  })();
}
