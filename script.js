/* Four Makeup · Taller de Automaquillaje (v2)
   Intro, logo 3D que sigue el dedo/mouse, títulos animados, carrusel de reels con videos,
   galería con filtros y visor, tarjetas que giran, cuenta regresiva y reserva por WhatsApp
   con vista previa del mensaje.
   Seguridad: nada de innerHTML; los números de WhatsApp salen de una lista fija y los textos
   que escribe la persona se limpian y se codifican antes de ir al link. */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  var DATA = window.FOUR_DATA || { reels: [], photos: [], names: {} };
  var WA = { '5493815560088': 'Augusto', '5493815159941': 'Sofía' };
  var $ = function (id) { return doc.getElementById(id); };
  var el = function (tag, cls, attrs) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  };
  var finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ── Intro ── */
  var intro = $('intro');
  var hideIntro = function () { if (intro) { intro.classList.add('out'); setTimeout(function () { intro.hidden = true; }, 1200); } };
  window.addEventListener('load', function () { setTimeout(hideIntro, 1300); });
  setTimeout(hideIntro, 3500);

  /* ── Títulos palabra por palabra ── */
  doc.querySelectorAll('.split').forEach(function (h) {
    var parts = [];
    h.childNodes.forEach(function (node) {
      var isEm = node.nodeType === 1 && node.tagName === 'EM';
      (node.textContent || '').split(/\s+/).filter(Boolean).forEach(function (word) { parts.push({ word: word, em: isEm }); });
    });
    h.textContent = '';
    parts.forEach(function (p, i) {
      var w = el('span', 'w');
      var mover = el('span');
      mover.style.transitionDelay = (i * 70) + 'ms';
      if (p.em) { var em = el('em'); em.textContent = p.word; mover.appendChild(em); } else { mover.textContent = p.word; }
      w.appendChild(mover);
      h.appendChild(w);
      if (i < parts.length - 1) h.appendChild(doc.createTextNode(' '));
    });
  });

  /* ── Entradas al aparecer ── */
  var revealables = doc.querySelectorAll('.reveal, .split');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    revealables.forEach(function (n, i) {
      if (n.classList.contains('reveal')) n.style.transitionDelay = (i % 4) * 80 + 'ms';
      io.observe(n);
    });
  }
  setTimeout(function () { revealables.forEach(function (n) { n.classList.add('in'); }); }, 6000);

  /* ── Scroll: barra de progreso, barra superior, franja y letras de fondo ── */
  var bar = $('progress'), topbar = $('topbar'), band = $('band');
  var ghost = doc.querySelector('.ghost-letters');
  var lastY = 0, bandX = 0, ticking = false;
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.tb-nav a'));
  var sections = navLinks.map(function (a) { return doc.querySelector(a.getAttribute('href')); });
  function onScroll() {
    var y = window.scrollY;
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (topbar) topbar.classList.toggle('hide', y > lastY && y > 400);
    var speed = Math.min(40, Math.abs(y - lastY));
    bandX -= 0.6 + speed * 0.4;
    if (band) {
      var half = band.scrollWidth / 2;
      if (-bandX > half) bandX += half;
      band.style.transform = 'translate3d(' + bandX + 'px,0,0)';
    }
    if (ghost) ghost.style.transform = 'translate3d(0,' + (y * 0.08) + 'px,0)';
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('on', i === current); });
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  (function loopBand() { if (!ticking) { bandX -= 0.6; if (band) { var half = band.scrollWidth / 2; if (-bandX > half) bandX += half; band.style.transform = 'translate3d(' + bandX + 'px,0,0)'; } } requestAnimationFrame(loopBand); })();

  /* ── Logo 3D: gira con el mouse o el dedo; en reposo se balancea ── */
  var logo = $('logo3d');
  if (logo) {
    var tx = 0, ty = 0, cx = 0, cy = 0, idle = true, idleTimer;
    var setTarget = function (x, y) {
      var r = logo.getBoundingClientRect();
      tx = ((y - (r.top + r.height / 2)) / window.innerHeight) * -30;
      ty = ((x - (r.left + r.width / 2)) / window.innerWidth) * 50;
      idle = false; clearTimeout(idleTimer); idleTimer = setTimeout(function () { idle = true; }, 2500);
    };
    window.addEventListener('pointermove', function (e) { setTarget(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('touchmove', function (e) { if (e.touches[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    (function spin(t) {
      if (idle) { tx = Math.sin(t / 1400) * 10; ty = Math.sin(t / 1900) * 26; }
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      logo.style.setProperty('--rx', cx.toFixed(2) + 'deg');
      logo.style.setProperty('--ry', cy.toFixed(2) + 'deg');
      requestAnimationFrame(spin);
    })(0);
  }

  /* ── Tarjetas con inclinación 3D ── */
  doc.querySelectorAll('.tilt').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((px - 0.5) * 16).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - py) * 14).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (px * 100).toFixed(0) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(0) + '%');
    });
    card.addEventListener('pointerleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });

  /* ── Video de portada: pausar fuera de pantalla ── */
  var heroVid = $('hero-video');
  if (heroVid && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { var p = heroVid.play(); if (p && p.catch) p.catch(function () {}); } else heroVid.pause();
    }).observe(heroVid);
  }

  /* ── Fechas: cuenta regresiva y fechas pasadas ── */
  var now = function () { return Date.now(); };
  var dateCards = Array.prototype.slice.call(doc.querySelectorAll('.date[data-start]'));
  var starts = dateCards.map(function (d) { return Date.parse(d.getAttribute('data-start')); });
  dateCards.forEach(function (d, i) {
    if (now() > starts[i]) { d.classList.add('past'); d.querySelector('.date-done').hidden = false; d.querySelector('.date-btn').hidden = true; }
  });
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function tick() {
    var next = starts.filter(function (t) { return t > now(); })[0];
    if (!next) { $('count-label').textContent = 'Nuevas fechas muy pronto · consultanos'; $('count').classList.add('done'); return; }
    var s = Math.floor((next - now()) / 1000);
    $('cd-d').textContent = pad(Math.floor(s / 86400));
    $('cd-h').textContent = pad(Math.floor(s % 86400 / 3600));
    $('cd-m').textContent = pad(Math.floor(s % 3600 / 60));
    $('cd-s').textContent = pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  /* ── Reels: carrusel con efecto 3D ── */
  var rail = $('reel-rail'), dots = $('reel-dots');
  var reelEls = [];
  DATA.reels.forEach(function (r, i) {
    var item = el('div', 'reel');
    var btn = el('button', 'reel-btn', { type: 'button', 'aria-label': 'Ver reel: ' + r.title + ' de ' + (DATA.names[r.by] || '') });
    var v = el('video', '', { muted: '', loop: '', playsinline: '', preload: 'none', poster: 'media/' + r.poster + '.webp' });
    v.muted = true;
    v.dataset.src = 'media/reel-' + r.id + '.mp4';
    var meta = el('span', 'reel-meta');
    var b = el('b'); b.textContent = r.title;
    var by = el('span'); by.textContent = DATA.names[r.by] || '';
    meta.appendChild(b); meta.appendChild(by);
    var play = el('span', 'reel-play', { 'aria-hidden': 'true' }); play.textContent = '▶';
    btn.appendChild(v); btn.appendChild(meta); btn.appendChild(play);
    btn.addEventListener('click', function () { openPlayer(r); });
    item.appendChild(btn); rail.appendChild(item);
    reelEls.push({ item: item, video: v });
    dots.appendChild(el('i'));
  });
  var activeReel = -1;
  function railFx() {
    var rr = rail.getBoundingClientRect(), mid = rr.left + rr.width / 2, best = -1, bestD = 1e9;
    reelEls.forEach(function (o, i) {
      var r = o.item.getBoundingClientRect();
      var d = (r.left + r.width / 2 - mid) / rr.width;
      var ad = Math.abs(d);
      o.item.style.setProperty('--rot', (d * -40).toFixed(2) + 'deg');
      o.item.style.setProperty('--sc', (1 - Math.min(ad, 0.6) * 0.35).toFixed(3));
      o.item.style.setProperty('--op', (1 - Math.min(ad, 0.8) * 0.6).toFixed(3));
      if (ad < bestD) { bestD = ad; best = i; }
    });
    if (best !== activeReel) setActiveReel(best);
  }
  function setActiveReel(i) {
    activeReel = i;
    Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === i); });
    reelEls.forEach(function (o, k) {
      var v = o.video;
      if (k === i && railVisible) {
        if (!v.getAttribute('src')) v.setAttribute('src', v.dataset.src);
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else { v.pause(); }
    });
  }
  var railVisible = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { railVisible = en[0].isIntersecting; setActiveReel(activeReel < 0 ? 0 : activeReel); }, { threshold: 0.3 }).observe(rail);
  }
  rail.addEventListener('scroll', function () { requestAnimationFrame(railFx); }, { passive: true });
  window.addEventListener('resize', railFx);
  var go = function (dir) {
    var target = reelEls[Math.max(0, Math.min(reelEls.length - 1, activeReel + dir))];
    if (target) target.item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };
  $('reel-prev').addEventListener('click', function () { go(-1); });
  $('reel-next').addEventListener('click', function () { go(1); });
  rail.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
  requestAnimationFrame(railFx);

  /* ── Reproductor con sonido ── */
  var player = $('player'), plVideo = $('pl-video'), plCap = $('pl-cap'), lastFocus = null;
  function openPlayer(r) {
    lastFocus = doc.activeElement;
    reelEls.forEach(function (o) { o.video.pause(); });
    plVideo.setAttribute('src', 'media/reel-' + r.id + '.mp4');
    plVideo.setAttribute('poster', 'media/' + r.poster + '.webp');
    plCap.textContent = r.title + ' · ' + (DATA.names[r.by] || '');
    player.hidden = false; root.style.overflow = 'hidden';
    var p = plVideo.play(); if (p && p.catch) p.catch(function () {});
    $('pl-close').focus();
  }
  function closePlayer() {
    plVideo.pause(); plVideo.removeAttribute('src'); plVideo.load();
    player.hidden = true; root.style.overflow = '';
    if (lastFocus) lastFocus.focus();
    setActiveReel(activeReel);
  }
  $('pl-close').addEventListener('click', closePlayer);
  player.addEventListener('click', function (e) { if (e.target === player) closePlayer(); });

  /* ── Tira de fotos en movimiento ── */
  var stripFiles = DATA.photos.map(function (p) { return p.file; }).concat(DATA.reels.map(function (r) { return r.poster; }));
  [['strip-a', 0], ['strip-b', 1]].forEach(function (cfg) {
    var row = $(cfg[0]); if (!row) return;
    var list = stripFiles.filter(function (_, i) { return i % 2 === cfg[1]; });
    list.concat(list).concat(list).concat(list).forEach(function (f) {
      row.appendChild(el('img', '', { src: 'media/' + f + '.webp', alt: '', loading: 'lazy', width: '150', height: '200' }));
    });
  });

  /* ── Galería con filtros y visor ── */
  var gallery = $('gallery');
  // fotos y reels intercalados: un reel cada dos fotos
  var photosQ = DATA.photos.map(function (p) { return { kind: 'photo', file: p.file, by: p.by, cat: p.cat }; });
  var reelsQ = DATA.reels.map(function (r) { return { kind: 'reel', file: r.poster, by: r.by, cat: /art/i.test(r.title) ? 'artistico' : 'social', reel: r }; });
  var items = [];
  while (photosQ.length || reelsQ.length) {
    if (photosQ.length) items.push(photosQ.shift());
    if (photosQ.length) items.push(photosQ.shift());
    if (reelsQ.length) items.push(reelsQ.shift());
  }
  var gNodes = items.map(function (it, idx) {
    var who = DATA.names[it.by] || '';
    var b = el('button', 'g-item', { type: 'button', 'aria-label': (it.kind === 'reel' ? 'Ver reel de ' : 'Ampliar foto de ') + who });
    b.appendChild(el('img', '', { src: 'media/' + it.file + '.webp', alt: (it.kind === 'reel' ? 'Reel' : 'Makeup') + ' de ' + who, loading: 'lazy', width: '480', height: '640' }));
    var tag = el('span', 'g-tag'); tag.textContent = who; b.appendChild(tag);
    if (it.kind === 'reel') { var pl = el('span', 'g-play', { 'aria-hidden': 'true' }); pl.textContent = '▶'; b.appendChild(pl); }
    b.addEventListener('click', function () { if (it.kind === 'reel') openPlayer(it.reel); else openLightbox(idx); });
    gallery.appendChild(b);
    return b;
  });
  var currentFilter = 'all';
  var visible = function () { return items.map(function (it, i) { return i; }).filter(function (i) { return !gNodes[i].classList.contains('out') && items[i].kind === 'photo'; }); };
  doc.querySelectorAll('.filters .chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      currentFilter = chip.getAttribute('data-filter');
      doc.querySelectorAll('.filters .chip').forEach(function (c) { c.classList.toggle('on', c === chip); });
      items.forEach(function (it, i) {
        var show = currentFilter === 'all' || it.by === currentFilter || it.cat === currentFilter;
        gNodes[i].classList.toggle('out', !show);
        if (show) { gNodes[i].classList.remove('pop'); void gNodes[i].offsetWidth; gNodes[i].classList.add('pop'); }
      });
    });
  });

  var lb = $('lightbox'), lbImg = $('lb-img'), lbCap = $('lb-cap'), lbIndex = 0;
  function showLb(i) {
    lbIndex = i;
    var it = items[i];
    lbImg.setAttribute('src', 'media/' + it.file + '.webp');
    lbImg.setAttribute('alt', 'Makeup de ' + (DATA.names[it.by] || ''));
    lbCap.textContent = DATA.names[it.by] || '';
  }
  function openLightbox(i) { lastFocus = doc.activeElement; showLb(i); lb.hidden = false; root.style.overflow = 'hidden'; $('lb-close').focus(); }
  function closeLightbox() { lb.hidden = true; root.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  function stepLb(dir) {
    var vis = visible(); if (!vis.length) return;
    var pos = vis.indexOf(lbIndex); pos = (pos + dir + vis.length) % vis.length; showLb(vis[pos]);
  }
  $('lb-close').addEventListener('click', closeLightbox);
  $('lb-prev').addEventListener('click', function () { stepLb(-1); });
  $('lb-next').addEventListener('click', function () { stepLb(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (touchX === null) return; var dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) stepLb(dx < 0 ? 1 : -1); touchX = null; });
  doc.addEventListener('keydown', function (e) {
    if (!lb.hidden) { if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowRight') stepLb(1); if (e.key === 'ArrowLeft') stepLb(-1); }
    if (!player.hidden && e.key === 'Escape') closePlayer();
    if (!fabMenu.hidden && e.key === 'Escape') toggleFab(false);
  });

  /* ── Tarjetas del equipo que giran ── */
  doc.querySelectorAll('.flip').forEach(function (card) {
    var flip = function (e) { if (e.target.closest('a')) return; card.classList.toggle('on'); };
    card.addEventListener('click', flip);
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.toggle('on'); } });
  });

  /* ── WhatsApp: mensaje general para los botones sueltos ── */
  var general = 'Hola! Quiero información sobre el Taller de Automaquillaje de Four Makeup.';
  doc.querySelectorAll('a[data-wa]').forEach(function (a) {
    var n = a.getAttribute('data-wa'); if (!WA[n]) return;
    a.href = 'https://wa.me/' + n + '?text=' + encodeURIComponent(general);
  });
  var fab = $('fab-btn'), fabMenu = $('fab-menu');
  function toggleFab(open) { fabMenu.hidden = !open; fab.setAttribute('aria-expanded', String(open)); }
  fab.addEventListener('click', function () { toggleFab(fabMenu.hidden); });
  doc.addEventListener('click', function (e) { if (!fabMenu.hidden && !e.target.closest('#fab')) toggleFab(false); });

  /* ── Reserva con vista previa del mensaje ── */
  var form = $('reserve-form'), nameIn = $('r-name'), countOut = $('r-count'), msgEl = $('ph-msg'), phTo = $('ph-to');
  var people = 1, target = '5493815560088';
  doc.querySelectorAll('input[name="fecha"][data-start]').forEach(function (r) {
    if (now() > Date.parse(r.getAttribute('data-start'))) { r.disabled = true; r.checked = false; }
  });
  if (!form.querySelector('input[name="fecha"]:checked')) { var f0 = form.querySelector('input[name="fecha"]:not(:disabled)'); if (f0) f0.checked = true; }
  var cleanName = function () { return (nameIn.value || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 50); };
  function buildMsg() {
    var name = cleanName();
    var picked = form.querySelector('input[name="fecha"]:checked');
    var fecha = picked && !picked.disabled ? picked.value : '';
    var quien = people > 1 ? ' para ' + people + ' personas' : '';
    return 'Hola ' + WA[target] + '! ' + (name ? 'Soy ' + name + '. ' : '') +
      (fecha ? 'Quiero reservar' + quien + ' en el Taller de Automaquillaje de Four Makeup para el ' + fecha + '.'
             : 'Quiero más información sobre el Taller de Automaquillaje de Four Makeup' + quien + '.');
  }
  function renderMsg() { msgEl.textContent = buildMsg(); phTo.textContent = WA[target] + ' · Four Makeup'; }
  form.addEventListener('input', renderMsg);
  form.addEventListener('change', renderMsg);
  $('r-minus').addEventListener('click', function () { people = Math.max(1, people - 1); countOut.textContent = people; renderMsg(); });
  $('r-plus').addEventListener('click', function () { people = Math.min(10, people + 1); countOut.textContent = people; renderMsg(); });
  var lastBtn = null;
  form.querySelectorAll('[data-to]').forEach(function (b) {
    b.addEventListener('click', function () { lastBtn = b; });
    b.addEventListener('pointerenter', function () { target = b.getAttribute('data-to'); renderMsg(); });
    b.addEventListener('focus', function () { target = b.getAttribute('data-to'); renderMsg(); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.submitter || lastBtn;
    var to = btn ? btn.getAttribute('data-to') : '';
    if (!WA[to]) return;
    target = to; renderMsg();
    window.open('https://wa.me/' + to + '?text=' + encodeURIComponent(buildMsg()), '_blank', 'noopener,noreferrer');
  });
  // los botones "Elegir esta fecha" marcan la fecha en el formulario
  doc.querySelectorAll('.date-btn[data-pick]').forEach(function (a) {
    a.addEventListener('click', function () {
      var radios = form.querySelectorAll('input[name="fecha"]');
      var r = radios[+a.getAttribute('data-pick')];
      if (r && !r.disabled) { r.checked = true; renderMsg(); }
    });
  });
  renderMsg();
})();
