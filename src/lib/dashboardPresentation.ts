export function dashboardPresentation(search: string | URLSearchParams, nativeFullscreen = false, windowFullscreen = false) {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const fullscreen = params.get('fullscreen') === 'true' || nativeFullscreen || windowFullscreen;
  const fullscreenLayout = fullscreen && params.get('fullscreenLayout') !== 'false';
  const requestedRows = params.get('widgetRows');
  const widgetRows: 1 | 2 = requestedRows === '1' ? 1 : requestedRows === '2' ? 2 : fullscreenLayout ? 1 : 2;
  const hideControls = params.get('hideControls') === 'true';
  return { fullscreen, fullscreenLayout, widgetRows, hideControls };
}
