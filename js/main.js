(() => {
  const gate = document.getElementById('elegi-tu-camino');
  const experience = document.getElementById('experience');
  const dynamicPath = document.getElementById('dynamic-path');
  const contact = document.getElementById('contacto');
  const memberWhy = document.getElementById('member-why');
  const pathButtons = [...document.querySelectorAll('[data-path]')];
  const timelineSteps = [...document.querySelectorAll('.timeline__step')];
  const finish = document.querySelector('.timeline__finish');
  const leadForm = document.getElementById('lead-form');

  let selectedPath = null;
  let gateReached = false;
  let timelineStarted = false;
  let isClamping = false;
  let touchY = null;

  function runTimeline() {
    if (timelineStarted) return;
    timelineStarted = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const on = reduced ? [0, 20, 40] : [250, 950, 1650];
    const greenAt = reduced ? 70 : 2600;
    timelineSteps.forEach((step, i) => setTimeout(() => step.classList.add('is-red'), on[i]));
    setTimeout(() => {
      timelineSteps.forEach(step => {
        step.classList.remove('is-red');
        step.classList.add('is-green');
      });
      finish.classList.add('is-visible');
    }, greenAt);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio > .35) runTimeline();
    }
  }, { threshold: [.35, .55] });
  observer.observe(gate);

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

    document.querySelectorAll('.sticky-choice [data-path]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.path === path);
    });

    if (shouldScroll) {
      requestAnimationFrame(() => experience.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  pathButtons.forEach(btn => btn.addEventListener('click', () => renderPath(btn.dataset.path)));

  // query param is only useful for QA / screenshots. Normal visitors still choose at the gate.
  const qaPath = new URLSearchParams(location.search).get('path');
  if (qaPath === 'member' || qaPath === 'join') {
    renderPath(qaPath, false);
  }

  leadForm?.addEventListener('submit', e => {
    e.preventDefault();
    const msg = leadForm.querySelector('.form-message');
    msg.textContent = 'Formulario preparado para conectar con el destino que defina ACA.';
  });
})();
