// Vice Sunset Cover Studio — wires the editor: photo slots, layout and grade
// pickers, words, crop (zoom slider + drag to pan), and PNG export.
// A `?shot=` query hands control to ./shots.js for a fixed screenshot scene.
import { drawCover, exportCoverPNG, makeCrop, clampCrop, SIZES, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const badgeInput = document.getElementById('badge');
const zoomInput = document.getElementById('zoom');
const zoomLabel = document.getElementById('zoom-slot-label');

const state = {
  layout: 'hero-trio',
  grade: 'sunset',
  caption: 'Sunset Heist',
  subtitle: 'Vice City Nights',
  badge: 'VICE',
  seed: 7,
  size: '1080x1080',
  photos: [null, null, null],
  crops: [makeCrop(), makeCrop(), makeCrop()],
  activeSlot: 0,
};

let lastRects = [];

/** Load an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function loadSample(name) {
  return loadImage(`./samples/${name}.jpg`);
}

/** Wait until the two display fonts are really usable by the canvas. */
export async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('400 80px Anton'),
      document.fonts.load('400 40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fallback fonts still draw; the cover just loses its display type.
  }
}

function sizeOf(name) {
  return SIZES[name] || SIZES['1080x1080'];
}

function redraw() {
  const [w, h] = sizeOf(state.size);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  lastRects = drawCover(canvas, state);
  zoomInput.value = String(state.crops[state.activeSlot].zoom);
  zoomLabel.textContent = String(state.activeSlot + 1);
}

/** Mirror the state back into the form controls (used by screenshot scenes). */
function syncControls() {
  document.querySelectorAll('input[name="layout"]').forEach((r) => {
    r.checked = r.value === state.layout;
  });
  document.querySelectorAll('input[name="grade"]').forEach((r) => {
    r.checked = r.value === state.grade;
  });
  document.querySelectorAll('input[name="size"]').forEach((r) => {
    r.checked = r.value === state.size;
  });
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  badgeInput.value = state.badge;
  document.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('active', i === state.activeSlot);
  });
  document.querySelectorAll('.pick').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.slot) === state.activeSlot);
  });
}

function setSlotPhoto(slot, img, objectUrl) {
  state.photos[slot] = img;
  state.crops[slot] = makeCrop();
  const thumb = document.getElementById(`thumb-${slot}`);
  if (thumb) thumb.src = objectUrl || img.src;
  redraw();
}

// Photo slots: upload, sample, or make active.
document.querySelectorAll('input[type="file"]').forEach((input, slot) => {
  input.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      setSlotPhoto(slot, await loadImage(url), url);
      status.textContent = `Slot ${slot + 1}: ${file.name} loaded.`;
    } catch {
      status.textContent = 'That file could not be read as a photo.';
    }
  });
});
document.querySelectorAll('.sample').forEach((button) => {
  button.addEventListener('click', async () => {
    const slot = Number(button.dataset.slot);
    try {
      setSlotPhoto(slot, await loadSample(button.dataset.sample));
      status.textContent = `Slot ${slot + 1}: sample ${button.dataset.sample} loaded.`;
    } catch {
      status.textContent = 'Sample photo failed to load.';
    }
  });
});
document.querySelectorAll('.pick').forEach((button) => {
  button.addEventListener('click', () => {
    state.activeSlot = Number(button.dataset.slot);
    syncControls();
    redraw();
  });
});

// Layout, grade, export size.
document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.layout = radio.value;
    redraw();
  });
});
document.querySelectorAll('input[name="grade"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.grade = radio.value;
    redraw();
  });
});
document.querySelectorAll('input[name="size"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.size = radio.value;
    redraw();
  });
});

// Words.
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
badgeInput.addEventListener('input', () => { state.badge = badgeInput.value; redraw(); });

// Zoom slider for the active slot.
zoomInput.addEventListener('input', () => {
  state.crops[state.activeSlot].zoom = Number(zoomInput.value);
  redraw();
});

// Drag to pan the active slot; a plain click on a panel makes it active.
let dragging = false;
let dragMoved = 0;
let lastX = 0;
let lastY = 0;

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * (canvas.width / box.width),
    y: (event.clientY - box.top) * (canvas.height / box.height),
  };
}

function panelAt(point) {
  for (let i = lastRects.length - 1; i >= 0; i -= 1) {
    const r = lastRects[i];
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragMoved = 0;
  const p = canvasPoint(event);
  lastX = p.x;
  lastY = p.y;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const p = canvasPoint(event);
  const dx = p.x - lastX;
  const dy = p.y - lastY;
  dragMoved += Math.abs(dx) + Math.abs(dy);
  lastX = p.x;
  lastY = p.y;
  const slot = state.activeSlot;
  const rect = lastRects[slot % lastRects.length];
  const img = state.photos[slot];
  if (!rect || !img) return;
  const crop = state.crops[slot];
  crop.ox += dx / rect.w;
  crop.oy += dy / rect.h;
  clampCrop(crop, rect.w, rect.h, img.naturalWidth, img.naturalHeight);
  redraw();
});
canvas.addEventListener('pointerup', (event) => {
  if (dragging && dragMoved < 6) {
    const hit = panelAt(canvasPoint(event));
    if (hit >= 0) {
      state.activeSlot = hit % state.photos.length;
      syncControls();
      redraw();
    }
  }
  dragging = false;
});

// Export the PNG at the chosen post size.
document.getElementById('exportBtn').addEventListener('click', async () => {
  const [w, h] = sizeOf(state.size);
  status.textContent = 'Exporting…';
  try {
    const blob = await exportCoverPNG(state, w, h);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-sunset-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-sunset-cover-${w}x${h}.png (${Math.round(blob.size / 1024)} KiB).`;
  } catch {
    status.textContent = 'Export failed — try again.';
  }
});

// Surprise me: a random layout + grade, same photos and words.
document.getElementById('shuffleBtn').addEventListener('click', () => {
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  syncControls();
  redraw();
  status.textContent = `Surprise: ${state.layout} + ${state.grade}.`;
});

// Keyboard: 1-4 layout, G cycles grade, E exports (ignored while typing).
document.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea')) return;
  const layouts = ['hero-trio', 'grid-four', 'full-bleed', 'tilt-collage'];
  if (event.key >= '1' && event.key <= '4') {
    state.layout = layouts[Number(event.key) - 1];
    syncControls();
    redraw();
  } else if (event.key === 'g' || event.key === 'G') {
    const grades = ['sunset', 'neon', 'golden', 'noir'];
    state.grade = grades[(grades.indexOf(state.grade) + 1) % grades.length];
    syncControls();
    redraw();
  } else if (event.key === 'e' || event.key === 'E') {
    document.getElementById('exportBtn').click();
  }
});

// Headless check hook: export the current cover at any size, as a PNG blob.
window.__exportCover = (width, height) => {
  const [w, h] = width && height ? [width, height] : sizeOf(state.size);
  return exportCoverPNG(state, w, h);
};

// Boot: two sample photos in, display fonts ready, first paint.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const api = {
  state,
  loadSample,
  fontsReady,
  syncControls,
  redraw,
  exportPNG: (w, h) => exportCoverPNG(state, w, h),
};

if (shot) {
  runShot(shot, params, api);
} else {
  Promise.all([loadSample('pier'), loadSample('boulevard')])
    .then(([pier, boulevard]) => {
      state.photos[0] = pier;
      state.photos[1] = boulevard;
      document.getElementById('thumb-0').src = './samples/pier.jpg';
      document.getElementById('thumb-1').src = './samples/boulevard.jpg';
      return fontsReady();
    })
    .catch(() => undefined)
    .finally(() => {
      syncControls();
      redraw();
    });
}
