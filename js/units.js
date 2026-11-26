/* NurseDose GH - unit helpers. Works in the browser and in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NurseDose = root.NurseDose || {};
    root.NurseDose.units = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  // How many micrograms are in one of each mass unit.
  var MASS_IN_MCG = { mcg: 1, mg: 1000, g: 1000000 };

  var ALIASES = {
    'mcg': 'mcg', 'ug': 'mcg', '\u00B5g': 'mcg', '\u03BCg': 'mcg', 'microgram': 'mcg', 'micrograms': 'mcg',
    'mg': 'mg', 'milligram': 'mg', 'milligrams': 'mg',
    'g': 'g', 'gram': 'g', 'grams': 'g',
    'ml': 'ml', 'mL': 'ml', 'millilitre': 'ml', 'milliliter': 'ml'
  };

  // Turn what the student typed into one standard name. Returns null if empty.
  function normalize(unit) {
    if (unit === undefined || unit === null) return null;
    var u = String(unit).trim().toLowerCase();
    if (!u) return null;
    return ALIASES[u] || u;
  }

  function isMass(unit) {
    return Object.prototype.hasOwnProperty.call(MASS_IN_MCG, normalize(unit));
  }

  // Convert a value between units. Returns { ok, value } or { ok:false, error }.
  function convert(value, from, to) {
    var f = normalize(from), t = normalize(to);
    if (!f || !t) return { ok: false, error: 'Choose a unit for both the order and the stock.' };
    if (f === t) return { ok: true, value: value, converted: false };
    if (isMass(f) && isMass(t)) {
      return { ok: true, value: value * MASS_IN_MCG[f] / MASS_IN_MCG[t], converted: true };
    }
    return { ok: false, error: 'The order is in ' + f + ' but the stock is in ' + t + '. Check the units.' };
  }

  return { normalize: normalize, isMass: isMass, convert: convert };
}));
