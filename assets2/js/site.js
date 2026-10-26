/* andriksantos.com — interacciones ligeras (sin dependencias) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var WA = '50496679577';

  function track(name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (_) {}
    try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, params || {})); } catch (_) {}
  }

  /* Header + barra móvil */
  var header = d.querySelector('.site-header');
  var bar = d.querySelector('.mobile-bar');
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (bar) bar.classList.toggle('is-visible', y > 480);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menú móvil */
  var toggle = d.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = d.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    d.querySelectorAll('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        d.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Dropdown accesible (click en táctil / teclado) */
  d.querySelectorAll('.nav-drop').forEach(function (drop) {
    var btn = drop.querySelector('.nav-trigger');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var open = drop.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    d.addEventListener('click', function (e) {
      if (!drop.contains(e.target)) { drop.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { drop.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  });

  /* Medición de clics a WhatsApp / teléfono / correo */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('wa.me') > -1 || href.indexOf('whatsapp.com') > -1) {
      track('generate_lead', { method: 'whatsapp', link_text: (a.textContent || '').trim().slice(0, 60), page_path: location.pathname });
    } else if (href.indexOf('mailto:') === 0) {
      track('generate_lead', { method: 'email', page_path: location.pathname });
    }
  });

  /* Animación de entrada */
  var els = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && els.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('is-in'); }); }

  /* Formularios → correo (FormSubmit) + WhatsApp con el mensaje armado */
  d.querySelectorAll('form[data-lead]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {}, fd = new FormData(form), needs = [];
      fd.forEach(function (v, k) {
        if (k === 'necesidad') needs.push(v); else data[k] = String(v).trim();
      });
      if (needs.length) data.necesidad = needs.join(', ');
      if (form.hasAttribute('data-require-need') && !needs.length) {
        var g = form.querySelector('.chips'); if (g) { g.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        alertInline(form, 'Elige al menos una opción para orientarte mejor.');
        return;
      }
      var missing = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (el) { return !el.value.trim(); });
      if (missing.length) { missing[0].focus(); alertInline(form, 'Escribe tu nombre y tu WhatsApp para poder responderte.'); return; }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = 'Enviando…'; }

      var lines = ['Hola Andrik, vengo de andriksantos.com.'];
      if (data.nombre) lines.push('Soy ' + data.nombre + (data.empresa ? ' de ' + data.empresa : '') + '.');
      if (data.necesidad) lines.push('Necesito: ' + data.necesidad + '.');
      if (data.servicio) lines.push('Servicio: ' + data.servicio + '.');
      if (data.mensaje) lines.push(data.mensaje);
      var waText = encodeURIComponent(lines.join('\n'));

      var payload = Object.assign({ _subject: 'Nuevo cliente potencial — andriksantos.com', _template: 'table', pagina: location.href }, data);
      fetch('https://formsubmit.co/ajax/andricksantos1@gmail.com', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload)
      }).catch(function () {}).finally(function () {
        track('generate_lead', { method: 'form', form_id: form.id || 'form', page_path: location.pathname });
        var ok = form.parentNode.querySelector('.form-ok');
        if (ok) { form.hidden = true; ok.classList.add('is-visible'); var l = ok.querySelector('a[data-wa]'); if (l) l.href = 'https://wa.me/' + WA + '?text=' + waText; }
        if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
      });
    });
  });
  function alertInline(form, msg) {
    var n = form.querySelector('.form-error');
    if (!n) { n = d.createElement('p'); n.className = 'form-note form-error'; n.setAttribute('role', 'alert'); n.style.color = '#C2410C'; form.insertBefore(n, form.querySelector('button[type="submit"]')); }
    n.textContent = msg;
  }

  var y = d.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
