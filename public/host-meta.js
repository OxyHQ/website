/**
 * Host-aware document metadata.
 *
 * The same SPA serves Oxy on oxy.so and FairCoin on fairco.in. Before React
 * mounts, swap the favicon, web manifest and theme-color so the browser tab,
 * Add-to-Home-Screen and PWA install reflect the right brand on first paint.
 *
 * Runs synchronously, no dependencies, no console output. Safe to run on every
 * page load — a no-op when the host doesn't match.
 *
 * To add another brand-specific tag: give the element an `id`, then add an
 * entry to OVERRIDES below. Each entry is `[id, attribute, value]`.
 */
(function () {
  var host = location.hostname;
  var isFairCoin = host === 'fairco.in' || host === 'www.fairco.in';
  if (!isFairCoin) return;

  var OVERRIDES = [
    ['site-favicon', 'href', '/favicon-faircoin.png'],
    ['site-favicon', 'type', 'image/png'],
    ['site-manifest', 'href', '/manifest-faircoin.webmanifest'],
    ['site-theme-color', 'content', '#07120c'],
  ];

  for (var i = 0; i < OVERRIDES.length; i++) {
    var entry = OVERRIDES[i];
    var el = document.getElementById(entry[0]);
    if (el) el.setAttribute(entry[1], entry[2]);
  }

  document.title = 'FairCoin — community-run cryptocurrency';
})();
