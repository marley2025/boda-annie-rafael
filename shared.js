/* Comportamiento compartido por las 3 propuestas.
   Requiere un objeto global WEDDING = { start, end, title, location } */
(function () {
  const W = typeof WEDDING !== 'undefined' ? WEDDING : window.WEDDING;
  const pad = (n) => String(n).padStart(2, '0');
  const calma = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Animaciones (sutiles). Se desactivan si el usuario pide reducir movimiento --- */
  const css = `
  /* Ramitas: vaivén de viento, cada una a su ritmo */
  @keyframes viento{0%,100%{rotate:-1.8deg}50%{rotate:2.6deg}}
  .rama{transform-origin:50% 100%;animation:viento 5.6s ease-in-out infinite}
  .rama:nth-of-type(2n){animation-duration:6.9s;animation-delay:-2.3s}
  .rama:nth-of-type(3n){animation-duration:4.8s;animation-delay:-1.1s}
  .rama:nth-of-type(4n){animation-duration:7.6s;animation-delay:-3.4s}

  /* Entrada de la portada, elemento por elemento */
  @keyframes subir{from{opacity:0;translate:0 16px}to{opacity:1;translate:0 0}}
  .hero-seq > :not(.rama):not(.botan){animation:subir 1.1s cubic-bezier(.2,.7,.2,1) both}
  .hero-seq > .botan:not(.rama){animation:subir 1.3s cubic-bezier(.2,.7,.2,1) both}
  ${Array.from({length: 12}, (_, i) => `.hero-seq > :nth-child(${i+1}){animation-delay:${(0.08 + i*0.14).toFixed(2)}s}`).join('\n')}
  .hero-seq > .rama{animation-delay:-1s}

  /* El sol del ícono flota despacio */
  @keyframes sol{0%,100%{translate:0 0}50%{translate:0 -3px}}
  #mark circle{animation:sol 6s ease-in-out infinite}

  /* Secciones que aparecen al hacer scroll */
  .rv{opacity:0;translate:0 22px;transition:opacity .9s ease,translate .9s cubic-bezier(.2,.7,.2,1)}
  .rv.in{opacity:1;translate:0 0}

  /* Segundos de la cuenta regresiva */
  @keyframes tic{from{opacity:.35;translate:0 -5px}to{opacity:1;translate:0 0}}
  [data-s].tic{display:inline-block;animation:tic .5s ease-out}

  /* Botón flotante entra deslizándose */
  .fab{transition:transform .5s cubic-bezier(.2,.8,.2,1)}
  `;
  if (!calma) {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }

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
      const sEl = el('s'), sv = pad(s);
      if (sEl.textContent !== sv) {
        sEl.textContent = sv;
        if (!calma) { sEl.classList.remove('tic'); void sEl.offsetWidth; sEl.classList.add('tic'); }
      }
    };
    tick();
    setInterval(tick, 1000);
  }

  /* --- Aparición al hacer scroll (solo si hay soporte y no se pidió reducir movimiento) --- */
  if (!calma && 'IntersectionObserver' in window) {
    const sel = ['main h2', 'main .label', 'main .eyebrow', 'main .kicker', 'main .sep', 'main .lead',
      'main .card', 'main .tile', 'main .ticket', 'main .photo', 'main .ph', 'main .frame',
      'main .t-item', 'main .trail li', 'main .menu li', 'main details', 'main .travel-grid article',
      'main .three article', 'main .tones', 'main .swatches', 'main .tips > div', 'main .two > div:not(.vr)',
      'main .form-card', 'main .rsvp-card', 'main .deadline', 'main .quote', 'main .actions'].join(',');
    let els = Array.from(document.querySelectorAll(sel));
    els = els.filter((e) => !els.some((o) => o !== e && o.contains(e)) && !e.closest('.hero'));
    const io = new IntersectionObserver((entries) => {
      let i = 0;
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = (i++ * 0.08).toFixed(2) + 's';
        e.target.classList.add('in'); io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    els.forEach((e) => { e.classList.add('rv'); io.observe(e); });
    // Red de seguridad: revisa posiciones al desplazarse y, pase lo que pase, nunca deja nada oculto.
    const revisar = () => {
      const lim = window.innerHeight * 0.95; let i = 0;
      els.forEach((e) => {
        if (!e.classList.contains('in') && e.getBoundingClientRect().top < lim) {
          e.style.transitionDelay = (i++ * 0.08).toFixed(2) + 's'; e.classList.add('in'); io.unobserve(e);
        }
      });
    };
    window.addEventListener('scroll', revisar, { passive: true });
    window.addEventListener('resize', revisar);
    revisar();
    window.addEventListener('beforeprint', () => els.forEach((e) => e.classList.add('in')));
    setTimeout(() => {   // si el navegador no reporta nada en 6 s, muestra lo que ya pasó de largo
      if (!document.querySelector('.rv.in')) els.forEach((e) => e.classList.add('in'));
    }, 6000);
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
      const done = () => {
        form.classList.add('sent');
        const t = form.nextElementSibling;
        if (t) { t.setAttribute('tabindex', '-1'); t.focus(); }
      };
      const url = form.dataset.endpoint;
      if (!url) { done(); return; }
      const btn = form.querySelector('[type="submit"]');
      const label = btn.textContent;
      let err = form.querySelector('.rsvp-error');
      if (err) err.remove();
      btn.disabled = true; btn.textContent = 'Enviando…';
      // Apps Script no devuelve CORS: se envía como formulario simple y se da por recibido si la red responde
      fetch(url, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(new FormData(form)) })
        .then(done)
        .catch(() => {
          btn.disabled = false; btn.textContent = label;
          err = document.createElement('p');
          err.className = 'rsvp-error'; err.setAttribute('role', 'alert');
          err.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.';
          btn.insertAdjacentElement('afterend', err);
        });
    });
  });
})();
