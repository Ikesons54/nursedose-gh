/* NurseDose GH - Sources screen: the reference documents, with edition and link. */
(function () {
  var el = window.NurseDose.ui.el;
  var listEl = document.getElementById('src-list');
  var noteEl = document.getElementById('src-note');

  fetch('data/sources.json').then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function (data) {
    listEl.textContent = '';
    data.sources.forEach(function (s) {
      var card = el('div', 'ref-card');
      card.appendChild(el('h2', null, s.title));
      card.appendChild(el('p', null, s.publisher + ' \u00B7 ' + s.edition));
      card.appendChild(el('p', 'muted', s.note));
      card.appendChild(el('p', 'src-status', s.usedInApp ? 'Used in app content' : 'Reference only: not yet used in app content'));
      var a = el('a', 'textlink', 'Open the official page \u2192');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      card.appendChild(a);
      listEl.appendChild(card);
    });
    noteEl.textContent = 'Links last checked ' + data.checked + '. Editions change, so always confirm you are using the current one.';
  }).catch(function () {
    noteEl.textContent = 'Could not load the sources. Connect to the internet once, then they will work offline.';
  });
})();
