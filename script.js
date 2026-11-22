/* Four Makeup · Taller de Automaquillaje
   - Animaciones de entrada al hacer scroll.
   - Marca como "Finalizado" las fechas que ya pasaron.
   - Arma el mensaje de WhatsApp con nombre y fecha elegida.
   Seguridad: sin innerHTML; solo se abren números de la lista permitida y el texto va codificado. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var ALLOWED = { '5493815560088': 'Augusto', '5493815159941': 'Sofía' };
  var now = Date.now();

  /* Entradas */
  var items = document.querySelectorAll('.reveal');
  var show = function (el) { el.classList.add('in'); };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }
  setTimeout(function () { items.forEach(show); }, 2500);

  /* Fechas pasadas */
  var isPast = function (el) {
    var t = Date.parse(el.getAttribute('data-start'));
    return !isNaN(t) && now > t;
  };
  document.querySelectorAll('.date[data-start]').forEach(function (d) {
    if (!isPast(d)) return;
    d.classList.add('past');
    d.querySelector('.date-done').hidden = false;
  });
  document.querySelectorAll('input[name="fecha"][data-start]').forEach(function (r) {
    if (!isPast(r)) return;
    r.disabled = true;
    r.checked = false;
  });
  if (!document.querySelector('input[name="fecha"]:checked')) {
    var first = document.querySelector('input[name="fecha"]:not(:disabled)');
    if (first) first.checked = true;
  }

  /* Botones de WhatsApp sueltos (personas): mensaje general */
  var general = 'Hola! Quiero información sobre el Taller de Automaquillaje de Four Makeup.';
  document.querySelectorAll('a[data-wa]').forEach(function (a) {
    var n = a.getAttribute('data-wa');
    if (!ALLOWED[n]) return;
    a.href = 'https://wa.me/' + n + '?text=' + encodeURIComponent(general);
  });

  /* Formulario de reserva */
  var form = document.getElementById('reserve-form');
  if (!form) return;
  var lastBtn = null;
  form.querySelectorAll('[data-to]').forEach(function (b) {
    b.addEventListener('click', function () { lastBtn = b; });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.submitter || lastBtn;
    var to = btn ? btn.getAttribute('data-to') : '';
    if (!ALLOWED[to]) return;

    var raw = document.getElementById('r-name').value || '';
    var name = raw.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 50);
    var picked = form.querySelector('input[name="fecha"]:checked');
    var fecha = picked && !picked.disabled ? picked.value : '';

    var msg = 'Hola ' + ALLOWED[to] + '! ' + (name ? 'Soy ' + name + '. ' : '') +
      (fecha
        ? 'Quiero reservar un lugar en el Taller de Automaquillaje de Four Makeup para el ' + fecha + '.'
        : 'Quiero más información sobre el Taller de Automaquillaje de Four Makeup.');
    window.open('https://wa.me/' + to + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  });
})();
