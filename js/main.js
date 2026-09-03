(() => {
  const gate = document.getElementById('elegi-tu-camino');
  const experience = document.getElementById('experience');
  const dynamicPath = document.getElementById('dynamic-path');
  const contact = document.getElementById('contacto');
  const memberWhy = document.getElementById('member-why');
  const pathButtons = [...document.querySelectorAll('[data-path]')];
  const gatePathButtons = [...document.querySelectorAll('.gate__actions [data-path]')];
  const timelineSteps = [...document.querySelectorAll('.timeline__step')];
  const finish = document.querySelector('.timeline__finish');
  const leadForm = document.getElementById('lead-form');
  const referrals = document.querySelector('.referrals');
  const refIntro = document.querySelector('.ref-intro');

  let selectedPath = null;
  let gateReached = false;
  let launchInProgress = false;
  let isClamping = false;
  let touchY = null;
  let audioContext = null;

  /* Final content order: visual referrals first, explanatory intro below it. */
  if (referrals && refIntro && referrals.nextElementSibling !== refIntro) {
    referrals.insertAdjacentElement('afterend', refIntro);
  }

  /* Shared footer for both paths. */
  if (experience && !experience.querySelector('.site-footer')) {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="shell site-footer__inner">
        <div class="site-footer__logo" role="img" aria-label="Automóvil Club Argentino"></div>
        <div class="site-footer__links">
          <a href="https://www.aca.org.ar/condiciones/campana/viaja-a-interlagos/" target="_blank" rel="noopener noreferrer">Bases y Condiciones</a>
          <a href="https://www.aca.org.ar/condiciones/politica-de-privacidad/" target="_blank" rel="noopener noreferrer">Políticas de privacidad</a>
        </div>
      </div>`;
    experience.append(footer);
  }

  function resetTimeline() {
    timelineSteps.forEach(step => step.classList.remove('is-red', 'is-green'));
    finish?.classList.remove('is-visible');
  }

  // La timeline queda en reposo hasta que el usuario elige su camino.
  resetTimeline();

  function getAudioContext() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioContext = new AudioCtx();
    }
    return audioContext;
  }

  function scheduleTone(ctx, frequency, startDelay, duration, volume = 0.055) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + startDelay;
    const end = start + duration;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  function playStartingLightsSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const schedule = () => {
      scheduleTone(ctx, 430, 0.05, 0.12, 0.045);
      scheduleTone(ctx, 430, 0.72, 0.12, 0.05);
      scheduleTone(ctx, 430, 1.39, 0.12, 0.055);
      scheduleTone(ctx, 720, 2.30, 0.16, 0.06);
      scheduleTone(ctx, 930, 2.43, 0.18, 0.045);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(schedule).catch(() => {});
    } else {
      schedule();
    }
  }

  function gateTop() {
    return Math.round(gate.getBoundingClientRect().top + window.scrollY);
  }

  function clampAtGate() {
    if (selectedPath || isClamping) return;
    const top = gateTop();
    if (window.scrollY >= top - 2) {
      gateReached = true;
      if (Math.abs(window.scrollY - top) > 2) {
        isClamping = true;
        window.scrollTo({ top, behavior: 'auto' });
        requestAnimationFrame(() => { isClamping = false; });
      }
      document.body.classList.add('gate-locked');
    }
  }
  window.addEventListener('scroll', clampAtGate, { passive: true });

  function blockForwardScroll(e) {
    if (!gateReached || selectedPath) return;
    if (e.deltaY <= 0) return;
    e.preventDefault();
    window.scrollTo(0, gateTop());
  }
  window.addEventListener('wheel', blockForwardScroll, { passive: false });
  window.addEventListener('touchstart', e => { touchY = e.touches[0]?.clientY ?? null; }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (!gateReached || selectedPath || touchY == null) return;
    const y = e.touches[0]?.clientY ?? touchY;
    const movingForward = y < touchY;
    touchY = y;
    if (movingForward) {
      e.preventDefault();
      window.scrollTo(0, gateTop());
    }
  }, { passive: false });
  window.addEventListener('touchend', () => { touchY = null; }, { passive: true });
  window.addEventListener('keydown', e => {
    if (!gateReached || selectedPath) return;
    if (['ArrowDown','PageDown','End',' '].includes(e.key)) {
      e.preventDefault();
      window.scrollTo(0, gateTop());
    }
  });

  function renderPath(path, shouldScroll = true) {
    selectedPath = path;
    document.body.classList.remove('gate-locked');
    experience.hidden = false;
    dynamicPath.replaceChildren();
    const template = document.getElementById(path === 'member' ? 'member-template' : 'join-template');
    dynamicPath.append(template.content.cloneNode(true));
    memberWhy.hidden = path !== 'member';
    contact.hidden = path !== 'join';

    if (path === 'join') {
      dynamicPath.querySelectorAll('.plans article').forEach(article => {
        if (article.querySelector('.plan-price')) return;
        const price = document.createElement('b');
        price.className = 'plan-price';
        price.textContent = '$20.000';
        article.append(price);
      });
    }

    document.querySelectorAll('.sticky-choice [data-path]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.path === path);
    });

    /* Keep a client-friendly, shareable URL in sync with the selected route. */
    const url = new URL(window.location.href);
    url.searchParams.delete('path');
    url.searchParams.set('tipo', path === 'member' ? 'socio' : 'no-socio');
    history.replaceState(null, '', url);

    if (shouldScroll) {
      requestAnimationFrame(() => experience.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function startLaunch(path) {
    if (launchInProgress || selectedPath) return;
    launchInProgress = true;
    resetTimeline();
    playStartingLightsSound();
    gatePathButtons.forEach(button => { button.disabled = true; });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const redAt = reduced ? [0, 40, 80] : [50, 720, 1390];
    const greenAt = reduced ? 130 : 2300;
    const revealAt = reduced ? 180 : 2700;

    timelineSteps.forEach((step, index) => {
      setTimeout(() => step.classList.add('is-red'), redAt[index]);
    });

    setTimeout(() => {
      timelineSteps.forEach(step => {
        step.classList.remove('is-red');
        step.classList.add('is-green');
      });
      finish?.classList.add('is-visible');
    }, greenAt);

    setTimeout(() => {
      renderPath(path);
      launchInProgress = false;
      gatePathButtons.forEach(button => { button.disabled = false; });
    }, revealAt);
  }

  pathButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.closest('.gate__actions')) {
        startLaunch(btn.dataset.path);
      } else {
        renderPath(btn.dataset.path);
      }
    });
  });

  const params = new URLSearchParams(location.search);
  const legacyPath = params.get('path');
  const tipo = params.get('tipo');
  const directPath =
    legacyPath === 'member' || legacyPath === 'join'
      ? legacyPath
      : tipo === 'socio'
        ? 'member'
        : tipo === 'no-socio' || tipo === 'nosocio'
          ? 'join'
          : null;

  if (directPath) {
    renderPath(directPath, false);
  }

  leadForm?.addEventListener('submit', e => {
    e.preventDefault();
    const msg = leadForm.querySelector('.form-message');
    msg.textContent = 'Formulario preparado para conectar con el destino que defina ACA.';
  });
})();
