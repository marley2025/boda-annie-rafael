/* Comportamiento compartido por las 3 propuestas.
   Requiere un objeto global WEDDING = { start, end, title, location } */
(function () {
  const W = typeof WEDDING !== 'undefined' ? WEDDING : window.WEDDING;
  const pad = (n) => String(n).padStart(2, '0');

  /* --- Cuenta regresiva --- */
  const cd = document.querySelector('[data-countdown]');
  if (cd && W) {
    const target = new Date(W.start).getTime();
    const el = (k) => cd.querySelector('[data-' + k + ']');
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
      const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
      const s = Math.floor(diff / 1e3);
      el('d').textContent = d;
      el('h').textContent = pad(h);
      el('m').textContent = pad(m);
      el('s').textContent = pad(s);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* --- Botón flotante RSVP: aparece tras el hero, se oculta en la sección RSVP --- */
  const fab = document.querySelector('[data-fab]');
  const hero = document.querySelector('.hero');
  const rsvp = document.getElementById('rsvp');
  if (fab && hero && rsvp && 'IntersectionObserver' in window) {
    let pastHero = false, atRsvp = false;
    const update = () => fab.classList.toggle('show', pastHero && !atRsvp);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; update(); }, { threshold: 0.1 }).observe(hero);
    new IntersectionObserver(([e]) => { atRsvp = e.isIntersecting; update(); }, { threshold: 0.05 }).observe(rsvp);
    const footer = document.querySelector('footer');
    if (footer) new IntersectionObserver(([e]) => { if (e.isIntersecting) { atRsvp = true; update(); } }).observe(footer);
  }

  /* --- Agregar al calendario: el botón se convierte en liga a Google Calendar --- */
  const toCal = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  document.querySelectorAll('[data-ics]').forEach((btn) => {
    if (!W) return;
    const a = document.createElement('a');
    a.className = btn.className;
    a.innerHTML = btn.innerHTML;
    a.target = '_blank';
    a.rel = 'noopener';
    a.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(W.title)
      + '&dates=' + toCal(W.start) + '/' + toCal(W.end)
      + '&location=' + encodeURIComponent(W.location);
    btn.replaceWith(a);
  });

  /* --- RSVP (demo): validar y mostrar agradecimiento.
         Para producción: conectar a Formspree, Google Forms o similar. --- */
  document.querySelectorAll('[data-rsvp]').forEach((form) => {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = form.querySelector('[name="nombre"]');
      const att = form.querySelector('[name="asistencia"]:checked');
      if (!name.value.trim()) { name.focus(); name.setAttribute('aria-invalid', 'true'); return; }
      if (!att) { form.querySelector('[name="asistencia"]').focus(); return; }
      form.classList.add('sent');
      const t = form.nextElementSibling;
      if (t) { t.setAttribute('tabindex', '-1'); t.focus(); }
    });
  });
})();
