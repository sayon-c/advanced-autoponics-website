/**
 * Advanced Autoponics first-party pageview beacon.
 * Sends path (+ referrer host context) to /api/analytics/collect.
 * Skips admin/invoice portals and file:// previews.
 */
(function () {
  try {
    if (typeof navigator === 'undefined' || typeof location === 'undefined') return;
    if (location.protocol === 'file:') return;

    var path = location.pathname || '/';
    var lower = path.toLowerCase();
    if (
      lower.indexOf('/api/') === 0 ||
      lower === '/admin' ||
      lower.indexOf('/admin/') === 0 ||
      lower.indexOf('/admin-') === 0 ||
      lower.indexOf('/aa-billing-desk') === 0 ||
      lower.indexOf('/admin-invoices') === 0 ||
      lower === '/invoices' ||
      lower.indexOf('/invoices.') === 0 ||
      lower.indexOf('/invoices/') === 0
    ) {
      return;
    }

    // Basic client-side bot skip (server also filters).
    var ua = navigator.userAgent || '';
    if (!ua || /bot|crawl|spider|headless|lighthouse|preview/i.test(ua)) return;

    var payload = JSON.stringify({
      path: path,
      referrer: document.referrer || ''
    });
    var url = '/api/analytics/collect';
    var blob = new Blob([payload], { type: 'application/json' });

    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url, blob)) {
      return;
    }

    if (typeof fetch === 'function') {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        credentials: 'same-origin',
        mode: 'same-origin',
        cache: 'no-store'
      }).catch(function () {});
    }
  } catch (_) {
    /* never break the page */
  }
})();
