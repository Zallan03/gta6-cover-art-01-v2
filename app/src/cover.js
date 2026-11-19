// Vice Sunset Cover Studio — one drawCover engine renders both the live preview
// and the exported PNG. Layouts, grades, lettering and effects all live here.
// Photos are drawn per panel, each panel keeping its own crop (zoom + pan).

/** Panel rectangles (fractions of the canvas) for each layout. rot is in degrees. */
export function panelRects(layout, w, h) {
  if (layout === 'grid-four') {
    return [
      { x: 0, y: 0, w: 0.5, h: 0.5, rot: 0 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5, rot: 0 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5, rot: 0 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5, rot: 0 },
    ];
  }
  if (layout === 'full-bleed') {
    return [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }];
  }
  if (layout === 'tilt-collage') {
    return [
      { x: 0.06, y: 0.05, w: 0.56, h: 0.62, rot: -4 },
      { x: 0.48, y: 0.3, w: 0.46, h: 0.5, rot: 3 },
      { x: 0.14, y: 0.58, w: 0.5, h: 0.38, rot: -2 },
    ];
  }
  // hero-trio (default): one large hero panel + three small panels stacked right.
  return [
    { x: 0, y: 0, w: 0.62, h: 1, rot: 0 },
    { x: 0.62, y: 0, w: 0.38, h: 0.333, rot: 0 },
    { x: 0.62, y: 0.333, w: 0.38, h: 0.333, rot: 0 },
    { x: 0.62, y: 0.666, w: 0.38, h: 0.334, rot: 0 },
  ];
}

/** Colour grades: canvas filter + sunset/neon wash + grain strength. */
export const GRADES = {
  'vice-sunset': { filter: 'saturate(1.35) contrast(1.08) brightness(1.03)', wash: ['rgba(255, 122, 24, 0)', 'rgba(255, 41, 117, 0.28)'], grain: 0.05 },
  'neon-nights': { filter: 'saturate(1.55) contrast(1.12) brightness(0.98)', wash: ['rgba(0, 229, 255, 0.10)', 'rgba(255, 41, 117, 0.34)'], grain: 0.07 },
  'golden-hour': { filter: 'saturate(1.25) contrast(1.05) sepia(0.28) brightness(1.05)', wash: ['rgba(255, 214, 64, 0.06)', 'rgba(255, 122, 24, 0.30)'], grain: 0.04 },
  'noir-pop': { filter: 'saturate(1.15) contrast(1.32) grayscale(0.22) brightness(1.0)', wash: ['rgba(140, 30, 255, 0.10)', 'rgba(255, 41, 117, 0.30)'], grain: 0.09 },
};

/** Deterministic pseudo-random generator so grain looks the same every render. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws one photo into a panel rect, cover-fit, with the panel's own zoom and pan. */
export function drawPanelPhoto(ctx, img, rect, zoom, panX, panY) {
  const px = rect.x, py = rect.y, pw = rect.w, ph = rect.h;
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const base = Math.max(pw / iw, ph / ih);
  const scale = base * (zoom || 1);
  const dw = iw * scale, dh = ih * scale;
  let dx = px + (pw - dw) / 2 + (panX || 0) * pw;
  let dy = py + (ph - dh) / 2 + (panY || 0) * ph;
  // Clamp the pan so the photo always covers the whole panel (no bare gaps).
  dx = Math.max(px + pw - dw, Math.min(px, dx));
  dy = Math.max(py + ph - dh, Math.min(py, dy));
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Film grain: tiny deterministic dots over the whole cover. */
export function drawGrain(ctx, w, h, strength) {
  const rand = seededRandom(20261119);
  const count = Math.floor((w * h) / 900);
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < count; i++) {
    const x = rand() * w, y = rand() * h, r = rand() * 1.6 + 0.4;
    ctx.fillRect(x, y, r, r);
  }
  ctx.restore();
}

/** Soft dark vignette pulling the eye to the middle of the cover. */
export function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10, 4, 24, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Big Anton title with a sunset gradient, Pacifico script subtitle with a neon
 *  glow, and a tilted badge ribbon — the poster's lettering. */
export function drawLettering(ctx, w, h, caption, subtitle, badge) {
  const frame = Math.min(w, h) * 0.028;
  const left = frame * 1.6, bottom = h - frame * 1.7;
  // Title block: dark band so the words read on any photo.
  const bandH = h * 0.2;
  const band = ctx.createLinearGradient(0, h - bandH - frame, 0, h);
  band.addColorStop(0, 'rgba(12, 4, 28, 0)');
  band.addColorStop(1, 'rgba(12, 4, 28, 0.72)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH - frame, w, bandH + frame);
  // Title.
  const title = (caption || '').trim().toUpperCase() || 'VICE SUNSET';
  let size = h * 0.115;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(title).width > w * 0.88 && size > 16) {
    size -= 2;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  const grad = ctx.createLinearGradient(left, bottom - size, left, bottom);
  grad.addColorStop(0, '#ffd319');
  grad.addColorStop(0.55, '#ff7a18');
  grad.addColorStop(1, '#ff2975');
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.strokeStyle = 'rgba(20, 4, 32, 0.9)';
  ctx.strokeText(title, left, bottom);
  ctx.fillStyle = grad;
  ctx.fillText(title, left, bottom);
  // Subtitle in neon script above the title, so it never runs past the frame.
  const sub = (subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(18, h * 0.038);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, left + 2, bottom - size - subSize * 0.25);
    ctx.shadowBlur = 0;
  }
  // Tilted badge ribbon, top right — measured first so it stays inside the frame.
  const badgeText = (badge || '').trim().toUpperCase();
  if (badgeText) {
    const bSize = Math.max(14, h * 0.026);
    ctx.font = `${bSize}px Anton, sans-serif`;
    const tw = ctx.measureText(badgeText).width;
    const bw = tw + bSize * 1.6, bh = bSize * 2.1;
    ctx.save();
    ctx.translate(w - frame - bw / 2 - bSize * 0.5, frame + bh / 2 + bSize * 0.5);
    ctx.rotate(-0.14);
    ctx.fillStyle = '#ff2975';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, bSize * 0.08);
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 0, 1);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }
}

/**
 * Draws the whole cover onto `canvas` (its own width/height).
 * state: { photos, panels, layout, grade, caption, subtitle, badge }
 * photos: [{ img, zoom, panX, panY }] — slots 0..2 are the user's photos,
 *   slots 3..4 are the bundled samples. panels: photo-slot index per panel.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const grade = GRADES[state.grade] || GRADES['vice-sunset'];
  const rects = panelRects(state.layout || 'hero-trio', w, h);
  const frame = Math.min(w, h) * 0.028;
  ctx.save();
  ctx.fillStyle = '#1b0b2e';
  ctx.fillRect(0, 0, w, h);
  // Panels.
  rects.forEach((r, i) => {
    const slot = state.panels ? state.panels[i] : 0;
    const photo = state.photos ? state.photos[slot] : null;
    const px = r.x * w, py = r.y * h, pw = r.w * w, ph = r.h * h;
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate((r.rot || 0) * Math.PI / 180);
    ctx.translate(-pw / 2, -ph / 2);
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    if (photo && photo.img) {
      ctx.filter = grade.filter;
      drawPanelPhoto(ctx, photo.img, { x: 0, y: 0, w: pw, h: ph }, photo.zoom, photo.panX, photo.panY);
      ctx.filter = 'none';
    } else {
      // Empty panel: warm placeholder gradient so the poster still reads.
      const g = ctx.createLinearGradient(0, 0, pw, ph);
      g.addColorStop(0, '#3d1a5e');
      g.addColorStop(1, '#ff2975');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, pw, ph);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${Math.max(14, ph * 0.06)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', pw / 2, ph / 2);
    }
    ctx.restore();
    // White poster frame line around each panel.
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate((r.rot || 0) * Math.PI / 180);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.008);
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
    ctx.restore();
  });
  // Sunset / neon colour wash over the whole poster.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  drawGrain(ctx, w, h, grade.grain);
  drawVignette(ctx, w, h);
  // Outer white poster frame.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = frame;
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
  drawLettering(ctx, w, h, state.caption, state.subtitle, state.badge);
  ctx.restore();
}
