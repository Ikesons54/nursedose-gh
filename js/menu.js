/* NurseDose GH - side menu and screen switching.
   To hide a menu item, set enabled:false. To show a "New" badge, set highlight:true.
   To show an item only in some modes, set modes:['student'] (or ['professional']).
   Later features are listed at the bottom, switched off until they are built. */
(function () {
  var mode = window.NurseDose.mode;

  var ITEMS = [
    { id: 'calculator', label: 'Calculator', view: 'calculator' },
    { id: 'iv', label: 'IV fluids', view: 'iv' },
    { id: 'practice-mode', label: 'Practice mode', view: 'practice-mode', modes: ['student'] },
    { id: 'exam', label: 'Exam mode', view: 'exam', modes: ['student'], highlight: true },
    { id: 'practice', label: 'Question bank', view: 'practice', filter: 'all', modes: ['student'], children: [
      { id: 'practice-tablets', label: 'Tablets', view: 'practice', filter: 'tablets' },
      { id: 'practice-syrups', label: 'Syrups', view: 'practice', filter: 'syrups' },
      { id: 'practice-injections', label: 'Injections', view: 'practice', filter: 'injections' }
    ] },
    { id: 'formulas', label: 'Formula library', view: 'formulas' },
    { id: 'reference', label: 'Quick reference', view: 'reference' },
    { id: 'sources', label: 'Sources', view: 'sources' },
    { id: 'install', label: 'Install the app', view: 'install' },
    { id: 'about', label: 'About and safety', view: 'about' }

    // Later (switched off until built):
    // { id: 'progress', label: 'My progress', view: 'progress', enabled: false },
    // { id: 'pharmacy', label: 'Pharmacy tools', view: 'pharmacy', enabled: false, highlight: true }
  ];

  var drawer = document.getElementById('drawer');
  var scrim = document.getElementById('scrim');
  var menuBtn = document.getElementById('menuBtn');
  var closeBtn = document.getElementById('closeBtn');
  var listEl = document.getElementById('menu-list');
  var main = document.querySelector('main');
  var footer = document.querySelector('footer');

  var routes = {};       // id -> item
  var links = {};        // id -> <a>
  var currentId = null;

  function isOn(item) { return item.enabled !== false && mode.allowed(item, mode.get()); }

  function makeLink(item) {
    var a = document.createElement('a');
    a.href = '#' + item.id;
    a.textContent = item.label;
    if (item.highlight) {
      var badge = document.createElement('span');
      badge.className = 'new';
      badge.textContent = 'New';
      a.appendChild(badge);
    }
    a.addEventListener('click', function (e) {
      e.preventDefault();
      go(item.id);
      closeDrawer(false);
    });
    links[item.id] = a;
    routes[item.id] = item;
    return a;
  }

  function buildMenu() {
    listEl.textContent = '';
    routes = {};
    links = {};
    ITEMS.filter(isOn).forEach(function (item) {
      var li = document.createElement('li');
      li.appendChild(makeLink(item));
      var kids = (item.children || []).filter(isOn);
      if (kids.length) {
        var sub = document.createElement('ul');
        sub.className = 'sub';
        kids.forEach(function (k) {
          var kli = document.createElement('li');
          kli.appendChild(makeLink(k));
          sub.appendChild(kli);
        });
        li.appendChild(sub);
      }
      listEl.appendChild(li);
    });
  }

  function setInert(on) {
    main.inert = on;
    footer.inert = on;
  }

  function openDrawer() {
    drawer.inert = false;
    drawer.classList.add('open');
    scrim.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    setInert(true);
    var cur = links[currentId] || listEl.querySelector('a');
    if (cur) cur.focus();
  }

  function closeDrawer(returnFocus) {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawer.inert = true;
    scrim.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    setInert(false);
    if (returnFocus !== false) menuBtn.focus();
  }

  function showRoute(id, force) {
    var item = routes[id] || routes.calculator;
    if (item.id === currentId && !force) return;
    currentId = item.id;

    Array.prototype.forEach.call(document.querySelectorAll('[data-view]'), function (sec) {
      sec.hidden = sec.getAttribute('data-view') !== item.view;
    });

    Object.keys(links).forEach(function (k) {
      if (k === item.id) links[k].setAttribute('aria-current', 'page');
      else links[k].removeAttribute('aria-current');
    });

    document.title = item.id === 'calculator' ? 'NurseDose GH' : item.label + ' | NurseDose GH';

    if (item.filter && window.NurseDose.questions) window.NurseDose.questions.setFilter(item.filter);
    if (item.view === 'practice-mode' && window.NurseDose.practice) window.NurseDose.practice.onShow();
    if (item.view === 'exam' && window.NurseDose.exam) window.NurseDose.exam.onShow();

    window.scrollTo(0, 0);
    var view = document.querySelector('[data-view="' + item.view + '"]');
    var heading = view && view.querySelector('h1');
    if (heading) heading.focus({ preventScroll: true });
  }

  function go(id) {
    if (!routes[id]) id = 'calculator';
    if (location.hash !== '#' + id) {
      history.pushState(null, '', '#' + id);
    }
    showRoute(id, true);
  }

  menuBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', function () { closeDrawer(true); });
  scrim.addEventListener('click', function () { closeDrawer(true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer(true);
  });
  window.addEventListener('hashchange', function () { showRoute(location.hash.slice(1)); });
  window.addEventListener('popstate', function () { showRoute(location.hash.slice(1)); });

  // The menu follows the chosen mode.
  mode.onChange(function () {
    buildMenu();
    if (routes[currentId]) showRoute(currentId, true);
    else go('calculator');
  });

  buildMenu();
  window.NurseDose.nav = { go: go, closeDrawer: closeDrawer };
  showRoute(location.hash.slice(1), true);
})();
