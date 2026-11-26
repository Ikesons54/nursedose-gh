/* NurseDose GH - registers the service worker so the app works offline. */
(function () {
  var statusEl = document.getElementById('offline-status');
  function say(text) { if (statusEl) statusEl.textContent = text; }

  if (!('serviceWorker' in navigator)) {
    say('Offline mode is not available in this browser.');
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function () {
      return navigator.serviceWorker.ready;
    }).then(function () {
      say('Offline mode is ready. You can use the app without internet.');
    }).catch(function () {
      say('Offline mode needs the app to be opened from its web link.');
    });
  });
})();
