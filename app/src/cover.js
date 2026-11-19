// Vice Sunset Cover Studio — the poster renderer.
//
// A cover is: a white poster frame, one to four photo panels (each with its own
// zoom + pan crop), a colour grade washed over everything, film grain, a
// vignette, and big display type — an Anton title in a sunset gradient, a
// Pacifico subtitle with a neon glow, and a tilted ribbon badge.
//
// State shape (built by main.js, read here):
//   { layout, grade, caption, subtitle, badge, photos: [img|null x3],
//     crops: [{ zoom, ox, oy } x3] }   — ox/oy are pan fractions of panel size.

export const LAYOUTS = {
  'hero-trio': 'Hero Trio',
  'grid-four': 'Grid Four',
  'full-bleed': 'Full Bleed',
  'tilt-collage': 'Tilt Collage',
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.08) sepia(0.16) hue-rotate(-8deg)',
    washTop: 'rgba(255, 150, 60, 0.20)',
    washBottom: 'rgba(255, 41, 117, 0.34)',
    grain: 0.05,
    vignette: 0.30,
    sun: true,
    titleStops: ['#ffe259', '#ff7e2e', '#ff2975'],
    glow: '#ff2975',
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.70) contrast(1.15) hue-rotate(12deg)',
    washTop: 'rgba(0, 229, 255, 0.20)',
    washBottom: 'rgba(255, 41, 117, 0.36)',
    grain: 0.04,
    vignette: 0.38,
    sun: false,
    titleStops: ['#a8ffef', '#00e5ff', '#ff2975'],
    glow: '#00e5ff',
  },
  golden: {
    label: 'Golden Hour',
    filter: 'saturate(1.25) contrast(1.05) sepia(0.35)',
    washTop: 'rgba(255, 214, 90, 0.24)',
    washBottom: 'rgba(214, 120, 20, 0.30)',
    grain: 0.05,
    vignette: 0.26,
    sun: true,
    titleStops: ['#fff3b0', '#ffc93c', '#e07b00'],
    glow: '#ffc93c',
  },
  noir: {
    label: 'Noir Pop',
    filter: 'grayscale(0.85) contrast(1.25) brightness(1.06)',
    washTop: 'rgba(120, 90, 200, 0.14)',
    washBottom: 'rgba(255, 41, 117, 0.22)',
    grain: 0.09,
    vignette: 0.42,
    sun: false,
    titleStops: ['#ffffff', '#ffd319', '#ff2975'],
    glow: '#ff2975',
  },
};

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

/** A fresh per-slot crop: zoom 1 means "cover the panel", ox/oy pan inside it. */
export function makeCrop() {
  return { zoom: 1, ox: 0, oy: 0 };
}

/**
 * Clamp a crop so the photo can never be panned past the panel edge — the
 * panel always stays fully covered, whatever the zoom.
 */
export function clampCrop(crop, panelW, panelH, imgW, imgH) {
  if (!imgW || !imgH || !panelW || !panelH) return crop;
  const base = Math.max(panelW / imgW, panelH / imgH);
  const drawnW = imgW * base * crop.zoom;
  const drawnH = imgH * base * crop.zoom;
  const maxOx = Math.max(0, (drawnW - panelW) / 2 / panelW);
  const maxOy = Math.max(0, (drawnH - panelH) / 2 / panelH);
  crop.ox = Math.min(maxOx, Math.max(-maxOx, crop.ox));
  crop.oy = Math.min(maxOy, Math.max(-maxOy, crop.oy));
  return crop;
}

/** Panel rectangles for a layout, inside the white poster frame. */
export function panelRects(layout, w, h, gap) {
  const m = Math.round(Math.min(w, h) * 0.028);
  const x0 = m;
  const y0 = m;
  const w0 = w - 2 * m;
  const h0 = h - 2 * m;
  if (layout === 'grid-four') {
    const cw = Math.round((w0 - gap) / 2);
    const ch = Math.round((h0 - gap) / 2);
    return [
      { x: x0, y: y0, w: cw, h: ch, rot: 0 },
      { x: x0 + cw + gap, y: y0, w: cw, h: ch, rot: 0 },
      { x: x0, y: y0 + ch + gap, w: cw, h: ch, rot: 0 },
      { x: x0 + cw + gap, y: y0 + ch + gap, w: cw, h: ch, rot: 0 },
    ];
  }
  if (layout === 'full-bleed') {
    return [{ x: x0, y: y0, w: w0, h: h0, rot: 0 }];
  }
  if (layout === 'tilt-collage') {
    const bw = Math.round(w0 * 0.62);
    const bh = Math.round(h0 * 0.60);
    return [
      { x: x0 + Math.round(w0 * 0.05), y: y0 + Math.round(h0 * 0.30), w: bw, h: bh, rot: -0.06 },
      { x: x0 + w0 - bw - Math.round(w0 * 0.04), y: y0 + Math.round(h0 * 0.03), w: bw, h: bh, rot: 0.07 },
      { x: x0 + Math.round(w0 * 0.30), y: y0 + h0 - Math.round(h0 * 0.40), w: Math.round(w0 * 0.55), h: Math.round(h0 * 0.40), rot: -0.03 },
    ];
  }
  // hero-trio: one tall hero panel left, two stacked panels right.
  const leftW = Math.round(w0 * 0.60);
  const halfH = Math.round((h0 - gap) / 2);
  return [
    { x: x0, y: y0, w: leftW, h: h0, rot: 0 },
    { x: x0 + leftW + gap, y: y0, w: w0 - leftW - gap, h: halfH, rot: 0 },
    { x: x0 + leftW + gap, y: y0 + halfH + gap, w: w0 - leftW - gap, h: halfH, rot: 0 },
  ];
}

function firstPhoto(photos) {
  for (const p of photos) if (p) return p;
  return null;
}

/** Fill a panel with a photo (cover-fit + crop) or a placeholder gradient. */
function paintPanel(ctx, rect, img, crop, grade) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (rect.rot) ctx.rotate(rect.rot);
  ctx.beginPath();
  ctx.rect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(-rect.w / 2, -rect.h / 2, rect.w / 2, rect.h / 2);
    g.addColorStop(0, '#3d1150');
    g.addColorStop(1, '#8c1eff');
    ctx.fillStyle = g;
    ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `400 ${Math.max(14, rect.w * 0.045)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOUR PHOTO HERE', 0, 0);
    ctx.restore();
    return;
  }
  clampCrop(crop, rect.w, rect.h, img.naturalWidth, img.naturalHeight);
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const dw = img.naturalWidth * base * crop.zoom;
  const dh = img.naturalHeight * base * crop.zoom;
  const dx = -dw / 2 + crop.ox * rect.w;
  const dy = -dh / 2 + crop.oy * rect.h;
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

let grainTile = null;

/** Deterministic pseudo-random generator, so one seed always draws one grain. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A small tile of grey noise, reused as the grain pattern (seeded per cover). */
function grainPattern(ctx, seed) {
  if (!grainTile || grainTile.seed !== seed) {
    const rand = mulberry32(seed);
    grainTile = document.createElement('canvas');
    grainTile.seed = seed;
    grainTile.width = 96;
    grainTile.height = 96;
    const g = grainTile.getContext('2d');
    const data = g.createImageData(96, 96);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 110 + Math.floor(rand() * 90);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  return ctx.createPattern(grainTile, 'repeat');
}

/** Fit a line of Anton to the content width, shrinking until it fits. */
function fitTitle(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `400 ${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 2;
    ctx.font = `400 ${size}px Anton, sans-serif`;
  }
  return size;
}

/**
 * Draw the whole cover onto `canvas` at its own pixel size.
 * Returns the panel rectangles (canvas pixels) for hit-testing in the editor.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const gap = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  const m = Math.round(Math.min(w, h) * 0.028);
  const contentW = w - 2 * m;
  const contentH = h - 2 * m;

  ctx.save();
  ctx.filter = 'none';
  // White poster frame.
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, w, h);

  // Photo panels.
  const rects = panelRects(state.layout, w, h, gap);
  const photos = state.photos || [];
  rects.forEach((rect, i) => {
    const img = photos[i % photos.length] || firstPhoto(photos);
    const crop = (state.crops && state.crops[i % state.crops.length]) || makeCrop();
    paintPanel(ctx, rect, img, crop, grade);
  });

  // Colour wash over the photo area.
  const wash = ctx.createLinearGradient(0, m, 0, m + contentH);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(m, m, contentW, contentH);

  // Low sun disc for the sunset grades.
  if (grade.sun) {
    const sx = m + contentW * 0.78;
    const sy = m + contentH * 0.16;
    const sr = Math.min(w, h) * 0.15;
    const sun = ctx.createRadialGradient(sx, sy, sr * 0.1, sx, sy, sr);
    sun.addColorStop(0, 'rgba(255, 247, 192, 0.85)');
    sun.addColorStop(0.6, 'rgba(255, 180, 80, 0.35)');
    sun.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Film grain + vignette.
  ctx.globalAlpha = grade.grain;
  ctx.fillStyle = grainPattern(ctx, state.seed ?? 7);
  ctx.fillRect(m, m, contentW, contentH);
  ctx.globalAlpha = 1;
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.72,
  );
  vig.addColorStop(0, 'rgba(10, 0, 20, 0)');
  vig.addColorStop(1, `rgba(10, 0, 20, ${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(m, m, contentW, contentH);

  // Scrim behind the title block so the words stay readable.
  const scrim = ctx.createLinearGradient(0, h - m - contentH * 0.26, 0, h - m);
  scrim.addColorStop(0, 'rgba(8, 0, 16, 0)');
  scrim.addColorStop(1, 'rgba(8, 0, 16, 0.62)');
  ctx.fillStyle = scrim;
  ctx.fillRect(m, h - m - contentH * 0.26, contentW, contentH * 0.26);

  // Badge ribbon, top right, tilted.
  const badge = (state.badge || '').trim().toUpperCase();
  if (badge) {
    ctx.save();
    ctx.font = `400 ${Math.round(w * 0.032)}px Anton, sans-serif`;
    const bw = ctx.measureText(badge).width + w * 0.05;
    const bh = Math.round(h * 0.052);
    ctx.translate(w - m - bw / 2, m + bh * 0.9);
    ctx.rotate(-0.09);
    const bg = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    bg.addColorStop(0, '#ff2975');
    bg.addColorStop(1, '#ff7e2e');
    ctx.fillStyle = bg;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.round(w * 0.012);
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, 0, 1);
    ctx.restore();
  }

  // Title: big Anton capitals in a sunset gradient, dark outline.
  const title = (state.caption || '').trim().toUpperCase();
  if (title) {
    const titleSize = fitTitle(ctx, title, contentW * 0.94, Math.round(w * 0.115));
    const ty = h - m - h * 0.088;
    const grad = ctx.createLinearGradient(0, ty - titleSize, 0, ty);
    grad.addColorStop(0, grade.titleStops[0]);
    grad.addColorStop(0.55, grade.titleStops[1]);
    grad.addColorStop(1, grade.titleStops[2]);
    ctx.font = `400 ${titleSize}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, titleSize * 0.045);
    ctx.strokeStyle = 'rgba(20, 5, 30, 0.9)';
    ctx.strokeText(title, w / 2, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, w / 2, ty);
  }

  // Subtitle: Pacifico script with a neon glow.
  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    let subSize = Math.round(w * 0.042);
    ctx.font = `400 ${subSize}px Pacifico, cursive`;
    while (ctx.measureText(subtitle).width > contentW * 0.9 && subSize > 12) {
      subSize -= 1;
      ctx.font = `400 ${subSize}px Pacifico, cursive`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = Math.round(subSize * 0.7);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitle, w / 2, h - m - h * 0.022);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
  return rects;
}

/** Render the cover at an export size onto a fresh canvas. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}

/** Render the cover at an export size and hand back a PNG blob. */
export function exportCoverPNG(state, width, height) {
  return new Promise((resolve, reject) => {
    renderCover(state, width, height).toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG export failed'));
    }, 'image/png');
  });
}
