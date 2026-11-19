// Fixed scenes for screenshots, driven by query params:
//   ?shot=cover  — the exported cover alone (body.shot-cover hides the editor)
//   ?shot=editor — the editor with photos loaded
// Params: photo (sample for the hero panel), layout, grade, size (WxH),
// caption, subtitle, badge, panels (comma list of photo-slot indices).
// window.__shotReady is set once the scene has painted.
import { drawCover, panelRects } from './cover.js';

const SAMPLE_FILES = { boulevard: 'samples/boulevard.jpg', pier: 'samples/pier.jpg' };

/** Scales an export size down so its long side fits 1280 px (screenshot cap). */
export function shotSize(w, h) {
  const scale = Math.min(1, 1280 / Math.max(w, h));
  return [Math.round(w * scale), Math.round(h * scale)];
}

export async function runShot(shot, query, api) {
  const layout = query.get('layout') || 'hero-trio';
  const grade = query.get('grade') || 'vice-sunset';
  const sizeParam = query.get('size') || '1080x1080';
  const [ew, eh] = sizeParam.split('x').map(Number);
  const caption = query.get('caption') || 'VICE SUNSET';
  const subtitle = query.get('subtitle') || 'chasing the last light';
  const badge = query.get('badge') || 'VICE CITY';
  const heroPhoto = query.get('photo') || 'boulevard';

  api.setLayout(layout);
  api.setGrade(grade);
  api.setSize(sizeParam);
  api.setCaption(caption);
  api.setSubtitle(subtitle);
  api.setBadge(badge);

  // Load both bundled samples into slots 3 and 4, nudged down so faces stay in frame.
  api.photos[3].img = await api.loadImage(SAMPLE_FILES.boulevard);
  api.photos[4].img = await api.loadImage(SAMPLE_FILES.pier);
  api.photos[3].panY = 0.08;
  api.photos[4].panY = 0.06;
  await api.loadFonts();

  // Panels: explicit list, or a sensible default per layout.
  const count = panelRects(layout).length;
  const defaultPanels = {
    'hero-trio': [3, 4, 3, 4],
    'grid-four': [3, 4, 4, 3],
    'full-bleed': [3],
    'tilt-collage': [3, 4, 3],
  };
  const panels = query.get('panels')
    ? query.get('panels').split(',').map(Number)
    : (defaultPanels[layout] || [3, 4, 3, 4]).slice(0, count);
  while (panels.length < count) panels.push(panels.length % 2 === 0 ? 3 : 4);
  // The named hero photo goes in panel 0.
  panels[0] = heroPhoto === 'pier' ? 4 : 3;
  api.setPanels(panels);

  const state = {
    photos: api.photos,
    panels,
    layout,
    grade,
    caption,
    subtitle,
    badge,
  };

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const [sw, sh] = shotSize(ew, eh);
    api.canvas.width = sw;
    api.canvas.height = sh;
    drawCover(api.canvas, state);
  } else {
    api.rebuildPanelPickers();
    api.refreshPhotoStatus();
    await api.redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
    document.documentElement.dataset.shotReady = 'true';
  }));
}
