/* NurseDose GH - remembers who is using the app (Student or Professional) and whether the intro was seen.
   Storage is wrapped so the app still works if the phone blocks it. Works in the browser and in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NurseDose = root.NurseDose || {};
    root.NurseDose.mode = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  var MODES = ['student', 'professional'];
  var memory = {};
  var listeners = [];

  function read(key) {
    try { var v = localStorage.getItem(key); return v === null ? (memory[key] || null) : v; }
    catch (e) { return memory[key] || null; }
  }
  function write(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: memory only */ }
  }

  function get() {
    var m = read('nd_mode');
    return MODES.indexOf(m) !== -1 ? m : 'student';
  }

  function apply(m) {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-mode', m);
  }

  function set(m) {
    if (MODES.indexOf(m) === -1) return false;
    var changed = m !== get();
    write('nd_mode', m);
    apply(m);
    if (changed) listeners.slice().forEach(function (cb) { cb(m); });
    return true;
  }

  function isOnboarded() { return read('nd_onboarded') === '1'; }
  function setOnboarded() { write('nd_onboarded', '1'); }
  function onChange(cb) { listeners.push(cb); }

  // Is a menu item shown in this mode? Items without "modes" show in every mode.
  function allowed(item, m) {
    return !item.modes || item.modes.indexOf(m) !== -1;
  }

  apply(get());
  return { get: get, set: set, isOnboarded: isOnboarded, setOnboarded: setOnboarded, onChange: onChange, allowed: allowed, MODES: MODES };
}));
