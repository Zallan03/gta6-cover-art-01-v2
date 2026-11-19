// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the exported cover alone.
// Params: photo (one sample) or photos (comma list, one per slot), layout,
// grade, size (1080x1080, 1080x1350, 1920x1080), caption, subtitle, badge,
// zoom. `selftest=export` also exports a PNG and records the result plus the
// page's resource list on <html> so a headless check can read it back.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, api) {
  const pick = (name, fallback) => query.get(name) ?? fallback;
  api.state.layout = pick('layout', 'hero-trio');
  api.state.grade = pick('grade', 'sunset');
  api.state.caption = pick('caption', 'Sunset Heist');
  api.state.subtitle = pick('subtitle', 'Vice City Nights');
  api.state.badge = pick('badge', 'VICE');
  api.state.size = pick('size', '1080x1080');

  const names = (query.get('photos') ?? query.get('photo') ?? 'pier')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const loaded = await Promise.all(names.map((name) => api.loadSample(name)));
  loaded.forEach((img, i) => {
    if (i < 3) {
      api.state.photos[i] = img;
      const thumb = document.getElementById(`thumb-${i}`);
      if (thumb) thumb.src = `./samples/${names[i]}.jpg`;
    }
  });
  const zoom = Number(query.get('zoom') ?? '1');
  if (Number.isFinite(zoom) && zoom > 0) {
    api.state.crops.forEach((crop) => { crop.zoom = zoom; });
  }
  const seed = Number(query.get('seed') ?? '7');
  if (Number.isFinite(seed)) api.state.seed = seed;

  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  api.syncControls();
  await api.fontsReady();
  api.redraw();

  if (query.get('selftest') === 'export') {
    const blob = await api.exportPNG(1080, 1080);
    const bytes = await blob.arrayBuffer();
    const root = document.documentElement;
    root.dataset.exportOk = 'true';
    root.dataset.exportType = blob.type;
    root.dataset.exportBytes = String(bytes.byteLength);
    root.dataset.resources = JSON.stringify(
      performance.getEntriesByType('resource').map((entry) => entry.name),
    );
  }

  // Signal readiness once painted; the timeout is a fallback for headless runs
  // where the compositor stops producing frames after load.
  const markReady = () => {
    if (window.__shotReady) return;
    window.__shotReady = true;
    document.documentElement.dataset.shotReady = 'true';
  };
  requestAnimationFrame(() => requestAnimationFrame(markReady));
  setTimeout(markReady, 1000);
}
