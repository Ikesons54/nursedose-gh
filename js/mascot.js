/* NurseDose GH - "Dosi", the app mascot. An original character drawn as SVG (no image files needed).
   Moods: 'wave' (waves hello), 'calm' (just floats and blinks). */
(function () {
  window.NurseDose = window.NurseDose || {};
  var count = 0;

  function svg(mood) {
    var id = 'dosi-body-' + (count++);
    return '' +
'<svg class="mascot-svg" viewBox="0 0 160 184" role="img" aria-label="Dosi, the NurseDose mascot">' +
'<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
'<stop offset="0" stop-color="#34B093"/><stop offset="1" stop-color="#0F5C4D"/></linearGradient></defs>' +
'<ellipse class="m-shadow" cx="80" cy="176" rx="40" ry="6" fill="#000" opacity=".16"/>' +
'<g class="m-float">' +
  '<path d="M80 30 Q80 16 88 10" stroke="#0A3F35" stroke-width="4" fill="none" stroke-linecap="round"/>' +
  '<g class="m-spark"><path d="M90 0 L93 7 L100 10 L93 13 L90 20 L87 13 L80 10 L87 7 Z" fill="#F2B632"/></g>' +
  '<ellipse cx="58" cy="166" rx="17" ry="8" fill="#0A3F35"/><ellipse cx="102" cy="166" rx="17" ry="8" fill="#0A3F35"/>' +
  '<path d="M80 30 C124 30 142 64 142 102 C142 142 120 166 80 166 C40 166 18 142 18 102 C18 64 36 30 80 30 Z" fill="url(#' + id + ')"/>' +
  '<ellipse cx="60" cy="62" rx="17" ry="9" fill="#fff" opacity=".2" transform="rotate(-25 60 62)"/>' +
  '<ellipse cx="20" cy="114" rx="9" ry="15" fill="#1B7F68" transform="rotate(18 20 114)"/>' +
  '<g class="m-arm"><ellipse cx="142" cy="108" rx="9" ry="15" fill="#1B7F68" transform="rotate(-18 142 108)"/></g>' +
  '<g class="m-eye"><ellipse cx="60" cy="90" rx="13" ry="17" fill="#fff"/><circle cx="62" cy="92" r="8" fill="#14231F"/><circle cx="65" cy="88" r="3" fill="#fff"/></g>' +
  '<g class="m-eye"><ellipse cx="100" cy="90" rx="13" ry="17" fill="#fff"/><circle cx="102" cy="92" r="8" fill="#14231F"/><circle cx="105" cy="88" r="3" fill="#fff"/></g>' +
  '<ellipse cx="42" cy="114" rx="8" ry="5" fill="#F2B632" opacity=".6"/><ellipse cx="118" cy="114" rx="8" ry="5" fill="#F2B632" opacity=".6"/>' +
  '<path d="M68 116 Q80 130 92 116" stroke="#14231F" stroke-width="4" fill="none" stroke-linecap="round"/>' +
  '<rect x="74" y="136" width="12" height="4" rx="2" fill="#F2B632"/><rect x="78" y="132" width="4" height="12" rx="2" fill="#F2B632"/>' +
'</g></svg>';
  }

  // Put the mascot inside a container. The markup is fixed text written above, never user input.
  function mount(container, mood, sizeClass) {
    if (!container) return;
    container.className = (container.className ? container.className + ' ' : '') + 'mascot ' + (mood === 'wave' ? 'wave ' : '') + (sizeClass || '');
    container.innerHTML = svg(mood);
  }

  window.NurseDose.mascot = { svg: svg, mount: mount };
})();
