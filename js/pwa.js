/* NurseDose GH - registers the service worker (offline mode) and handles the install button. */
(function () {
  var statusEl = document.getElementById('offline-status');
  var installBtn = document.getElementById('installBtn');
  var standaloneNote = document.getElementById('standalone-note');
  var deferredPrompt = null;

  function say(text) { if (statusEl) statusEl.textContent = text; }

  // Already opened from the home screen?
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;
  if (standalone && standaloneNote) standaloneNote.hidden = false;

  // Android / Chrome can show a one-tap install button.
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn && !standalone) installBtn.hidden = false;
  });
  if (installBtn) {
    installBtn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt = null;
      installBtn.hidden = true;
    });
  }
  window.addEventListener('appinstalled', function () {
    if (installBtn) installBtn.hidden = true;
    if (standaloneNote) standaloneNote.hidden = false;
  });

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
