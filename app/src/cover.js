// Vice Sunset Cover Studio — the cover engine.
//
// One function, drawCover, paints a multi-panel GTA-style poster onto any 2D
// canvas at any size. The editor preview and the exported PNG call the same
// function, so the preview is exactly what gets shared.
//
// A cover is: panelled photos (each cropped and positioned by the user) under a
// sunset or neon colour grade, a big Anton title, a Pacifico script subtitle, a
// tilted badge ribbon, film grain, a vignette and an optional white poster
// frame. Everything here is original work: no Rockstar logo, artwork or font.
// The lettering is Anton and Pacifico, both shipped under the SIL Open Font
// License (their OFL texts sit beside them in app/fonts/).

/** The four panel layouts. Each panel is a fraction of the cover, with a tilt in degrees. */
export const LAYOUTS = {
  'hero-trio': {
    label: 'Hero + 3',
    panels: [
      { x: 0.02, y: 0.02, w: 0.96, h: 0.58, rot: 0 },
      { x: 0.02, y: 0.62, w: 0.313, h: 0.24, rot: 0 },
      { x: 0.343, y: 0.62, w: 0.313, h: 0.24, rot: 0 },
      { x: 0.666, y: 0.62, w: 0.313, h: 0.24, rot: 0 },
    ],
  },
  'grid-four': {
    label: 'Grid 2x2',
    panels: [
      { x: 0.02, y: 0.02, w: 0.475, h: 0.41, rot: 0 },
      { x: 0.505, y: 0.02, w: 0.475, h: 0.41, rot: 0 },
      { x: 0.02, y: 0.45, w: 0.475, h: 0.41, rot: 0 },
      { x: 0.505, y: 0.45, w: 0.475, h: 0.41, rot: 0 },
    ],
  },
  'full-bleed': {
    label: 'Full bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }],
  },
  'tilt-collage': {
    label: 'Tilted collage',
    panels: [
      { x: 0.05, y: 0.03, w: 0.62, h: 0.58, rot: -2.5 },
      { x: 0.56, y: 0.30, w: 0.40, h: 0.34, rot: 3 },
      { x: 0.08, y: 0.56, w: 0.44, h: 0.30, rot: -3.5 },
    ],
  },
};

/** The four colour grades: a canvas filter for the photos plus wash colours. */
export const GRADES = {
  'vice-sunset': {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.06) brightness(1.02)',
    wash: ['rgba(255, 94, 98, 0.20)', 'rgba(255, 122, 24, 0.16)', 'rgba(140, 40, 160, 0.22)'],
    title: '#ffffff',
    subtitle: '#ffd166',
  },
  'neon-nights': {
    label: 'Neon Nights',
    filter: 'saturate(1.5) contrast(1.12) brightness(0.96)',
    wash: ['rgba(255, 46, 136, 0.22)', 'rgba(0, 229, 255, 0.14)', 'rgba(80, 20, 160, 0.26)'],
    title: '#ffffff',
    subtitle: '#00e5ff',
  },
  'golden-hour': {
    label: 'Golden Hour',
    filter: 'sepia(0.28) saturate(1.5) contrast(1.04) brightness(1.04)',
    wash: ['rgba(255, 170, 40, 0.22)', 'rgba(255, 120, 40, 0.14)', 'rgba(120, 50, 10, 0.18)'],
    title: '#fff7e0',
    subtitle: '#ffb800',
  },
  'noir-pop': {
    label: 'Noir Pop',
    filter: 'grayscale(0.92) contrast(1.28) brightness(1.02)',
    wash: ['rgba(255, 46, 136, 0.16)', 'rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.20)'],
    title: '#ffffff',
    subtitle: '#ff2e88',
  },
};

/** The three post sizes the bounty asks for. */
export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080x1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080x1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide 1920x1080' },
};

/** A fresh cover state: two sample photos, hero layout, Vice Sunset grade. */
export function freshCoverState() {
  return {
    layout: 'hero-trio',
    grade: 'vice-sunset',
    size: '1080x1080',
    title: 'VICE SUNSET',
    subtitle: 'one last ride',
    badge: 'LAUNCH WEEK',
    grain: true,
    frame: true,
    photos: [null, null, null],
    panels: [
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
    ],
  };
}

/** Panels of the current layout, in cover fractions. */
export function layoutPanels(state) {
  return LAYOUTS[state.layout].panels;
}

/** How far a panel's photo may be panned (in panel fractions) and still cover it. */
export function panLimits(photo, rect, panel) {
  if (!photo) return { x: 0, y: 0 };
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  return {
    x: Math.max(0, (dw - rect.w) / 2 / rect.w),
    y: Math.max(0, (dh - rect.h) / 2 / rect.h),
  };
}

/** Clamps a panel's pan so its photo always covers the panel — never a gap. */
export function clampPanelPan(state, rect, i) {
  const panel = state.panels[i];
  if (!panel) return;
  const photo = state.photos[panel.photo] || null;
  const limits = panLimits(photo, rect, panel);
  panel.ox = Math.max(-limits.x, Math.min(limits.x, panel.ox || 0));
  panel.oy = Math.max(-limits.y, Math.min(limits.y, panel.oy || 0));
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  const px = rect.x;
  const py = rect.y;
  const pw = rect.w;
  const ph = rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (!photo) {
    // Empty panel: a dusk gradient with a sun-and-sea motif drawn in, so the
    // cover never shows a hole before the user loads a photo.
    const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, '#3b115f');
    g.addColorStop(0.55, '#c22e6e');
    g.addColorStop(1, '#ff7a18');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(255, 240, 200, 0.9)';
    ctx.beginPath();
    ctx.arc(px + pw * 0.5, py + ph * 0.62, Math.min(pw, ph) * 0.20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20, 9, 31, 0.55)';
    ctx.fillRect(px, py + ph * 0.62, pw, ph * 0.38);
    ctx.restore();
    return;
  }
  const base = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  // Clamp the pan here too, so even a state built elsewhere can never expose a gap.
  const limits = panLimits(photo, rect, panel);
  const ox = Math.max(-limits.x, Math.min(limits.x, panel.ox || 0));
  const oy = Math.max(-limits.y, Math.min(limits.y, panel.oy || 0));
  const dx = px + (pw - dw) / 2 + ox * pw;
  const dy = py + (ph - dh) / 2 + oy * ph;
  ctx.filter = grade.filter;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

/** A deterministic grain tile, built once and reused for every cover. */
let grainTile = null;
export function makeGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(160, 160);
  let seed = 20261119;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = tile;
  return tile;
}

/** Fits a one-line title into a width, shrinking the Anton size until it fits. */
export function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 18) {
    size -= 2;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

/** Draws the whole cover: panels, grade washes, title block, badge, grain, frame. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade];
  const panels = layoutPanels(state);
  const gap = Math.max(6, W * 0.008);

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#14091f';
  ctx.fillRect(0, 0, W, H);

  // Panels, each inset by half the gutter so the dark backing reads as gutters.
  // A panel that touches an edge (the full-bleed layout) gets no inset on that side.
  panels.forEach((def, i) => {
    const leftGap = def.x > 0 ? gap / 2 : 0;
    const rightGap = def.x + def.w < 1 ? gap / 2 : 0;
    const topGap = def.y > 0 ? gap / 2 : 0;
    const bottomGap = def.y + def.h < 1 ? gap / 2 : 0;
    const rect = {
      x: def.x * W + leftGap,
      y: def.y * H + topGap,
      w: def.w * W - leftGap - rightGap,
      h: def.h * H - topGap - bottomGap,
    };
    ctx.save();
    if (def.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((def.rot * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      rect.x = 0;
      rect.y = 0;
    }
    // A white snapshot border on tilted panels, like taped-up prints.
    if (def.rot) {
      ctx.fillStyle = '#fffaf3';
      ctx.fillRect(-W * 0.012, -W * 0.012, rect.w + W * 0.024, rect.h + W * 0.024);
    }
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    drawPanelPhoto(ctx, state.photos[panel.photo] || null, rect, panel, grade);
    // A thin white keyline around every panel, poster style.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });

  // Grade washes over the whole cover: warm top, hot middle, deep bottom.
  const wash = ctx.createLinearGradient(0, 0, W * 0.4, H);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(0.55, grade.wash[1]);
  wash.addColorStop(1, grade.wash[2]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // Title block: a dark band rising from the foot, title in Anton, subtitle in script.
  const bandH = H * (state.layout === 'full-bleed' ? 0.26 : 0.16);
  const band = ctx.createLinearGradient(0, H - bandH * 1.8, 0, H);
  band.addColorStop(0, 'rgba(20, 9, 31, 0)');
  band.addColorStop(1, 'rgba(20, 9, 31, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, H - bandH * 1.8, W, bandH * 1.8);

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const pad = W * 0.045;
    const titleSize = fitTitleFont(ctx, title, W - pad * 2, H * 0.105);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const ty = H - H * 0.045;
    // Sunset gradient fill with a dark outline, so the title pops on any photo.
    const tg = ctx.createLinearGradient(0, ty - titleSize, 0, ty);
    tg.addColorStop(0, '#ffffff');
    tg.addColorStop(0.55, '#ffe9c9');
    tg.addColorStop(1, '#ff9a3d');
    ctx.lineWidth = Math.max(3, titleSize * 0.09);
    ctx.strokeStyle = 'rgba(20, 9, 31, 0.9)';
    ctx.lineJoin = 'round';
    ctx.strokeText(title, pad, ty);
    ctx.fillStyle = tg;
    ctx.fillText(title, pad, ty);
    const sub = (state.subtitle || '').trim();
    if (sub) {
      const subSize = Math.max(18, titleSize * 0.34);
      ctx.font = `${subSize}px Pacifico, cursive`;
      ctx.shadowColor = grade.subtitle;
      ctx.shadowBlur = subSize * 0.7;
      ctx.fillStyle = grade.subtitle;
      ctx.fillText(sub, pad + titleSize * 0.06, ty - titleSize * 1.08);
      ctx.shadowBlur = 0;
    }
  }

  // Badge ribbon, top right, tilted like a sticker. Cap its width so a long
  // badge can never run off the cover's edge.
  const badge = (state.badge || '').trim().toUpperCase();
  if (badge) {
    const bSize = Math.max(16, H * 0.024);
    ctx.font = `bold ${bSize}px system-ui, sans-serif`;
    const bw = Math.min(ctx.measureText(badge).width + bSize * 1.6, W * 0.92);
    const bh = bSize * 2.1;
    ctx.save();
    ctx.translate(W - bw * 0.62, bh * 0.85);
    ctx.rotate(0.06);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, 0, bSize * 0.06);
    ctx.restore();
  }

  if (state.grain) {
    // Vignette first, then grain over everything, poster-print feel.
    const vg = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    vg.addColorStop(0, 'rgba(20, 9, 31, 0)');
    vg.addColorStop(1, 'rgba(20, 9, 31, 0.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    const tile = makeGrainTile();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  if (state.frame) {
    const fw = Math.max(4, W * 0.006);
    ctx.strokeStyle = '#fffaf3';
    ctx.lineWidth = fw;
    ctx.strokeRect(fw / 2, fw / 2, W - fw, H - fw);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = Math.max(1, W * 0.0012);
    ctx.strokeRect(fw * 3, fw * 3, W - fw * 6, H - fw * 6);
  }
  ctx.restore();
}

/** Which panel (if any) contains a point on the canvas, in canvas pixels. */
export function panelAt(state, canvasW, canvasH, x, y) {
  const panels = layoutPanels(state);
  for (let i = panels.length - 1; i >= 0; i--) {
    const d = panels[i];
    if (x >= d.x * canvasW && x <= (d.x + d.w) * canvasW
      && y >= d.y * canvasH && y <= (d.y + d.h) * canvasH) {
      return i;
    }
  }
  return -1;
}
