'use strict';

/*
  Stanislav Matveychuk — Resume / Developer Portfolio
  Enhanced animation script for the provided index.html + style.css

  What this file does:
  - fixed minimum preloader duration, so it never disappears in milliseconds;
  - terminal-style loading animation;
  - premium hero entrance animation;
  - scroll reveal animations for almost every visual block;
  - staggered card / list / timeline animations;
  - animated typing role text;
  - UA / EN switcher;
  - active navigation while scrolling;
  - mobile menu;
  - canvas particle background;
  - soft parallax and micro-interactions.
*/

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CONFIG = {
    // Main fix: the preloader will stay visible at least this long.
    // Increase to 4500 / 5000 if you want an even longer loading scene.
    minPreloaderTime: 4200,
    preloaderFadeDelay: 250,
    revealRootMargin: '0px 0px -90px 0px',
    revealThreshold: 0.12,
    langStorageKey: 'stanislav-portfolio-lang',
  };

  const state = {
    lang: localStorage.getItem(CONFIG.langStorageKey) || 'ua',
    typingTimer: null,
    typingCycleId: 0,
    particles: [],
    rafId: null,
    mouse: { x: 0, y: 0, active: false },
    pageReady: false,
  };

  document.addEventListener('DOMContentLoaded', () => {
    injectAnimationStyles();
    prepareAnimatedElements();
    lockPage();

    initLanguage();
    initNavigation();
    initActiveNavigation();
    initCanvasBackground();
    initTyping();
    initMicroInteractions();
    initScrollProgress();
    initCopyContacts();
    initPreloader();
  });

  window.addEventListener('pagehide', () => {
    if (state.typingTimer) window.clearTimeout(state.typingTimer);
    if (state.rafId) window.cancelAnimationFrame(state.rafId);
  });

  /* =========================================================
     PRELOADER
  ========================================================= */
  function initPreloader() {
    const preloader = $('#preloader');
    const termCmd = $('#termCmd');
    const loadBar = $('#loadBar');
    const loadPct = $('#loadPct');
    const outputs = [$('#termOut1'), $('#termOut2'), $('#termOut3')].filter(Boolean);
    const terminal = $('.preloader__terminal');

    if (!preloader) {
      unlockPage();
      startPageAnimations();
      return;
    }

    // Make sure the preloader is visible even if browser restores styles quickly.
    preloader.classList.remove('hidden');
    preloader.style.opacity = '1';
    preloader.style.visibility = 'visible';
    preloader.style.pointerEvents = 'auto';

    const startedAt = performance.now();

    const stepsUa = [
      { text: 'ініціалізація developer-профілю', pct: 10, delay: 420, type: 'ok' },
      { text: 'перевірка HTML / CSS / JavaScript секцій', pct: 22, delay: 440, type: 'ok' },
      { text: 'підключення API, Postman та CRM-досвіду', pct: 39, delay: 540, type: 'ok' },
      { text: 'підготовка timeline та skill cards', pct: 55, delay: 460, type: 'ok' },
      { text: 'рендер scroll reveal анімацій', pct: 72, delay: 560, type: 'warn' },
      { text: 'запуск canvas background particles', pct: 88, delay: 520, type: 'ok' },
      { text: 'портфоліо готове до перегляду', pct: 100, delay: 620, type: 'ok' },
    ];

    const stepsEn = [
      { text: 'initializing developer profile', pct: 10, delay: 420, type: 'ok' },
      { text: 'checking HTML / CSS / JavaScript sections', pct: 22, delay: 440, type: 'ok' },
      { text: 'connecting API, Postman and CRM experience', pct: 39, delay: 540, type: 'ok' },
      { text: 'preparing timeline and skill cards', pct: 55, delay: 460, type: 'ok' },
      { text: 'rendering scroll reveal animations', pct: 72, delay: 560, type: 'warn' },
      { text: 'starting canvas background particles', pct: 88, delay: 520, type: 'ok' },
      { text: 'portfolio is ready', pct: 100, delay: 620, type: 'ok' },
    ];

    const steps = state.lang === 'en' ? stepsEn : stepsUa;
    const command = 'npm run portfolio:start';

    const run = async () => {
      setProgress(0);
      await wait(260);
      await typeOneLine(termCmd, command, 34);
      await wait(250);

      let previousPct = 0;
      for (let i = 0; i < steps.length; i += 1) {
        const step = steps[i];
        showTerminalLine(i, step.text, step.type);
        await animateProgress(previousPct, step.pct, step.delay + random(120, 260));
        previousPct = step.pct;
        await wait(random(90, 180));
      }

      const elapsed = performance.now() - startedAt;
      const rest = Math.max(0, CONFIG.minPreloaderTime - elapsed);
      await wait(rest);
      await wait(CONFIG.preloaderFadeDelay);

      hidePreloader();
    };

    run();

    function showTerminalLine(index, text, type = 'ok') {
      let line = outputs[index];
      if (!line && terminal) {
        line = document.createElement('div');
        line.className = 'term-line term-line--out';
        terminal.appendChild(line);
        outputs[index] = line;
      }
      if (!line) return;

      const icon = type === 'warn' ? '↻' : '✓';
      const className = type === 'warn' ? 'warn' : 'ok';
      line.innerHTML = `<span class="${className}">${icon}</span> ${escapeHTML(text)}`;
      line.classList.add('visible');
    }

    function setProgress(value) {
      const pct = Math.max(0, Math.min(100, Math.round(value)));
      if (loadBar) loadBar.style.width = `${pct}%`;
      if (loadPct) loadPct.textContent = String(pct);
    }

    function animateProgress(from, to, duration) {
      return new Promise(resolve => {
        const start = performance.now();
        const distance = to - from;

        const frame = now => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = easeOutCubic(progress);
          const pulse = progress < 1 ? Math.sin(progress * Math.PI * 5) * 0.45 : 0;
          setProgress(from + distance * eased + pulse);

          if (progress < 1) requestAnimationFrame(frame);
          else {
            setProgress(to);
            resolve();
          }
        };

        requestAnimationFrame(frame);
      });
    }

    function hidePreloader() {
      preloader.classList.add('hidden');
      unlockPage();
      state.pageReady = true;
      startPageAnimations();

      setTimeout(() => {
        if (preloader.parentNode) preloader.remove();
      }, 900);
    }
  }

  function lockPage() {
    document.body.classList.add('no-scroll');
  }

  function unlockPage() {
    document.body.classList.remove('no-scroll');
  }

  /* =========================================================
     CSS INJECTION + PREPARATION OF ALMOST ALL ANIMATED BLOCKS
  ========================================================= */
  function injectAnimationStyles() {
    if ($('#js-portfolio-animation-styles')) return;

    const style = document.createElement('style');
    style.id = 'js-portfolio-animation-styles';
    style.textContent = `
      .js-scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 2px;
        width: 0%;
        z-index: 10000;
        background: linear-gradient(90deg, rgba(255,255,255,.35), rgba(255,255,255,.95));
        box-shadow: 0 0 18px rgba(255,255,255,.25);
        pointer-events: none;
        transition: width .08s linear;
      }

      .js-reveal {
        opacity: 0;
        will-change: transform, opacity, filter;
        transition-property: opacity, transform, filter;
        transition-duration: var(--reveal-duration, 900ms);
        transition-delay: var(--reveal-delay, 0ms);
        transition-timing-function: cubic-bezier(.22, 1, .36, 1);
      }

      .js-reveal.is-visible {
        opacity: 1;
        transform: translate3d(0,0,0) scale(1) rotate(0deg) !important;
        filter: blur(0) !important;
      }

      .js-reveal--up { transform: translate3d(0, 42px, 0); filter: blur(10px); }
      .js-reveal--left { transform: translate3d(-52px, 18px, 0); filter: blur(10px); }
      .js-reveal--right { transform: translate3d(52px, 18px, 0); filter: blur(10px); }
      .js-reveal--scale { transform: translate3d(0, 32px, 0) scale(.92); filter: blur(10px); }
      .js-reveal--card { transform: translate3d(0, 44px, 0) scale(.96); filter: blur(12px); }
      .js-reveal--flip { transform: perspective(900px) rotateX(10deg) translate3d(0, 42px, 0); transform-origin: 50% 0%; filter: blur(10px); }
      .js-reveal--timeline { transform: translate3d(64px, 0, 0); filter: blur(10px); }
      .js-reveal--pill { transform: translate3d(0, 18px, 0) scale(.86); filter: blur(6px); }

      .js-reveal-line {
        transform-origin: left center;
        transform: scaleX(0);
        transition: transform 900ms cubic-bezier(.22, 1, .36, 1) var(--reveal-delay, 0ms);
      }
      .js-reveal-line.is-visible { transform: scaleX(1); }

      .js-hero-intro {
        opacity: 0;
        transform: translate3d(0, 34px, 0) scale(.98);
        filter: blur(12px);
      }

      .js-hero-intro.is-visible {
        animation: jsHeroIn 1000ms cubic-bezier(.22,1,.36,1) forwards;
        animation-delay: var(--hero-delay, 0ms);
      }

      @keyframes jsHeroIn {
        0% { opacity: 0; transform: translate3d(0, 34px, 0) scale(.98); filter: blur(12px); }
        100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
      }

      .js-float-soft { animation: jsFloatSoft 5.8s ease-in-out infinite; }
      @keyframes jsFloatSoft {
        0%, 100% { transform: translate3d(0,0,0); }
        50% { transform: translate3d(0,-10px,0); }
      }

      .js-shine {
        position: relative;
        overflow: hidden;
      }
      .js-shine::after {
        content: '';
        position: absolute;
        top: -40%;
        left: -85%;
        width: 70%;
        height: 180%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.09), transparent);
        transform: rotate(20deg);
        transition: left 850ms cubic-bezier(.22,1,.36,1);
        pointer-events: none;
      }
      .js-shine:hover::after { left: 120%; }

      .nav__links.open {
        display: flex !important;
        flex-direction: column;
        animation: jsMenuIn 320ms cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes jsMenuIn {
        from { opacity: 0; transform: translateY(-10px) scale(.98); filter: blur(8px); }
        to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .js-reveal, .js-hero-intro, .js-reveal-line {
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
          animation: none !important;
          transition: none !important;
        }
        .js-float-soft { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function prepareAnimatedElements() {
    const groups = [
      { selector: '.section__head', effect: 'left', stagger: 80, duration: 900 },
      { selector: '.section__line', effect: 'line', stagger: 0, duration: 900 },
      { selector: '.about-card', effect: 'card', stagger: 120, duration: 900 },
      { selector: '.skill-block', effect: 'flip', stagger: 110, duration: 950 },
      { selector: '.skill-list li', effect: 'left', stagger: 38, duration: 720 },
      { selector: '.tech-stack', effect: 'scale', stagger: 0, duration: 850 },
      { selector: '.tech-pill', effect: 'pill', stagger: 42, duration: 650 },
      { selector: '.tl-item', effect: 'timeline', stagger: 170, duration: 980 },
      { selector: '.tl-item__list li', effect: 'left', stagger: 42, duration: 720 },
      { selector: '.edu-card', effect: 'scale', stagger: 0, duration: 900 },
      { selector: '.quality', effect: 'right', stagger: 70, duration: 760 },
      { selector: '.why-card', effect: 'card', stagger: 90, duration: 840 },
      { selector: '.contact-card', effect: 'scale', stagger: 0, duration: 980 },
      { selector: '.contact-link', effect: 'right', stagger: 90, duration: 780 },
      { selector: '.footer__logo, .footer__copy, .footer__links', effect: 'up', stagger: 70, duration: 760 },
      { selector: '.stat', effect: 'scale', stagger: 90, duration: 760 },
      { selector: '.btn', effect: 'up', stagger: 90, duration: 760 },
    ];

    groups.forEach(group => {
      const elements = $$(group.selector);
      elements.forEach((element, index) => {
        // Do not animate elements that are inside the preloader.
        if (element.closest('.preloader')) return;

        if (group.effect === 'line') {
          element.classList.add('js-reveal-line');
        } else {
          element.classList.add('js-reveal', `js-reveal--${group.effect}`);
        }

        element.style.setProperty('--reveal-delay', `${index * group.stagger}ms`);
        element.style.setProperty('--reveal-duration', `${group.duration}ms`);
      });
    });

    // Add premium hover shine to cards/buttons where it looks good.
    $$('.about-card, .skill-block, .tl-item__card, .why-card, .contact-card, .btn, .tech-pill').forEach(element => {
      element.classList.add('js-shine');
    });

    // Hero has separate entrance after preloader.
    [
      $('.hero__tag'),
      $('.hero__title'),
      $('.hero__role'),
      $('.hero__desc'),
      $('.hero__actions'),
      $('.hero__stats'),
      $('.hero__visual'),
      $('.scroll-hint'),
    ].filter(Boolean).forEach((element, index) => {
      element.classList.add('js-hero-intro');
      element.style.setProperty('--hero-delay', `${index * 115}ms`);
    });
  }

  function startPageAnimations() {
    startHeroEntrance();
    initRevealAnimations();
    animateNumbers();

    // Let elements already in viewport appear immediately after preloader.
    requestAnimationFrame(() => revealVisibleNow());
  }

  function startHeroEntrance() {
    $$('.js-hero-intro').forEach(element => element.classList.add('is-visible'));

    if (!prefersReducedMotion) {
      const photoFrame = $('.photo-frame');
      if (photoFrame) photoFrame.classList.add('js-float-soft');
    }
  }

  function initRevealAnimations() {
    const elements = $$('.js-reveal, .js-reveal-line, .reveal');
    if (!elements.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach(element => {
        element.classList.add('is-visible', 'visible');
      });
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible', 'visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: CONFIG.revealThreshold,
      rootMargin: CONFIG.revealRootMargin,
    });

    elements.forEach(element => observer.observe(element));
  }

  function revealVisibleNow() {
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    $$('.js-reveal, .js-reveal-line, .reveal').forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportH * 0.94 && rect.bottom > 0) {
        element.classList.add('is-visible', 'visible');
      }
    });
  }

  /* =========================================================
     LANGUAGE + TYPING
  ========================================================= */
  function initLanguage() {
    setLanguage(state.lang, false);

    $$('.lang-btn').forEach(button => {
      button.addEventListener('click', () => {
        const nextLang = button.dataset.lang === 'en' ? 'en' : 'ua';
        setLanguage(nextLang, true);
      });
    });
  }

  function setLanguage(lang, restartTyping = true) {
    state.lang = lang === 'en' ? 'en' : 'ua';
    localStorage.setItem(CONFIG.langStorageKey, state.lang);
    document.documentElement.lang = state.lang === 'en' ? 'en' : 'uk';

    $$('[data-ua][data-en]').forEach(element => {
      const value = element.dataset[state.lang];
      if (typeof value === 'string' && value.trim() !== '') element.textContent = value;
    });

    $$('.lang-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.lang === state.lang);
    });

    if (restartTyping) initTyping(true);
  }

  function initTyping(forceRestart = false) {
    const target = $('#typedRole');
    if (!target) return;

    state.typingCycleId += 1;
    const currentCycle = state.typingCycleId;

    if (state.typingTimer) {
      clearTimeout(state.typingTimer);
      state.typingTimer = null;
    }

    const roles = state.lang === 'en'
      ? ['Junior IT Specialist', 'Support Engineer L2', 'API Integrator', 'Postman / REST API', 'Automation Specialist', 'Junior Developer']
      : ['Junior IT Specialist', 'Support Engineer L2', 'API Integrator', 'Postman / REST API', 'Фахівець з автоматизацій', 'Junior Developer'];

    if (prefersReducedMotion) {
      target.textContent = roles[0];
      return;
    }

    if (forceRestart) target.textContent = '';

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      if (currentCycle !== state.typingCycleId) return;

      const word = roles[roleIndex];
      target.textContent = deleting ? word.slice(0, charIndex - 1) : word.slice(0, charIndex + 1);
      charIndex += deleting ? -1 : 1;

      let delay = deleting ? 30 : random(48, 82);

      if (!deleting && charIndex === word.length) {
        deleting = true;
        delay = 1200;
      }

      if (deleting && charIndex <= 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        delay = 260;
      }

      state.typingTimer = setTimeout(tick, delay);
    };

    tick();
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */
  function initNavigation() {
    const nav = $('.nav');
    const linksContainer = $('.nav__links');
    const burger = $('#navBurger');
    const links = $$('.nav__links a[href^="#"], .nav__logo[href^="#"], .btn[href^="#"]');

    const updateNav = () => {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 12);
    };

    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });

    if (burger && linksContainer) {
      burger.addEventListener('click', () => {
        const opened = linksContainer.classList.toggle('open');
        burger.classList.toggle('open', opened);
        document.body.classList.toggle('no-scroll', opened);
      });
    }

    links.forEach(link => {
      link.addEventListener('click', event => {
        const href = link.getAttribute('href');
        const target = href && href.startsWith('#') ? $(href) : null;
        if (!target) return;

        event.preventDefault();
        closeMobileMenu(linksContainer, burger);
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        history.pushState(null, '', href);
      });
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 960) closeMobileMenu(linksContainer, burger);
    }, 150));

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMobileMenu(linksContainer, burger);
    });
  }

  function closeMobileMenu(linksContainer, burger) {
    if (linksContainer) linksContainer.classList.remove('open');
    if (burger) burger.classList.remove('open');
    if (state.pageReady) document.body.classList.remove('no-scroll');
  }

  function initActiveNavigation() {
    const sections = $$('section[id]');
    const links = $$('.nav__links a[href^="#"]');
    if (!sections.length || !links.length) return;

    const linkById = new Map();
    links.forEach(link => {
      const id = link.getAttribute('href').replace('#', '');
      linkById.set(id, link);
    });

    const setActive = id => {
      links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
    };

    if (!('IntersectionObserver' in window)) {
      const fallback = () => {
        let current = sections[0]?.id || '';
        sections.forEach(section => {
          if (section.getBoundingClientRect().top < window.innerHeight * 0.38) current = section.id;
        });
        setActive(current);
      };
      fallback();
      window.addEventListener('scroll', fallback, { passive: true });
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (linkById.has(entry.target.id)) setActive(entry.target.id);
      });
    }, {
      threshold: 0.18,
      rootMargin: '-24% 0px -58% 0px',
    });

    sections.forEach(section => observer.observe(section));
  }

  /* =========================================================
     BACKGROUND PARTICLES
  ========================================================= */
  function initCanvasBackground() {
    const canvas = $('#bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (prefersReducedMotion) {
      resizeCanvas(canvas, ctx);
      drawStaticParticles(ctx);
      return;
    }

    const resize = () => {
      resizeCanvas(canvas, ctx);
      createParticles();
    };

    const createParticles = () => {
      const area = window.innerWidth * window.innerHeight;
      const count = Math.max(42, Math.min(105, Math.round(area / 16500)));

      state.particles = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: randomFloat(-0.22, 0.22),
        vy: randomFloat(-0.22, 0.22),
        r: randomFloat(0.7, 1.8),
        opacity: randomFloat(0.14, 0.48),
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -30) p.x = window.innerWidth + 30;
        if (p.x > window.innerWidth + 30) p.x = -30;
        if (p.y < -30) p.y = window.innerHeight + 30;
        if (p.y > window.innerHeight + 30) p.y = -30;

        if (state.mouse.active) {
          const dx = p.x - state.mouse.x;
          const dy = p.y - state.mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130 && dist > 1) {
            const force = (130 - dist) / 130;
            p.x += (dx / dist) * force * 0.55;
            p.y += (dy / dist) * force * 0.55;
          }
        }
      });

      drawParticleConnections(ctx, state.particles);
      drawParticles(ctx, state.particles);
      state.rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', debounce(resize, 180));
    window.addEventListener('mousemove', event => {
      state.mouse.x = event.clientX;
      state.mouse.y = event.clientY;
      state.mouse.active = true;
    }, { passive: true });
    window.addEventListener('mouseleave', () => { state.mouse.active = false; });

    resize();
    animate();
  }

  function resizeCanvas(canvas, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawParticles(ctx, particles) {
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 230, 234, ${p.opacity})`;
      ctx.fill();
    });
  }

  function drawParticleConnections(ctx, particles) {
    const distanceLimit = window.innerWidth < 640 ? 92 : 145;

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);

        if (dist < distanceLimit) {
          const alpha = (1 - dist / distanceLimit) * 0.14;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(230, 230, 234, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function drawStaticParticles(ctx) {
    for (let i = 0; i < 45; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * window.innerWidth, Math.random() * window.innerHeight, randomFloat(0.8, 1.8), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 230, 234, ${randomFloat(0.12, 0.28)})`;
      ctx.fill();
    }
  }

  /* =========================================================
     MICRO-INTERACTIONS / PARALLAX / NUMBERS
  ========================================================= */
  function initMicroInteractions() {
    if (prefersReducedMotion) return;

    initMagneticEffect();
    initParallaxHero();
    initCardTilt();
  }

  function initMagneticEffect() {
    const elements = $$('.btn, .contact-link:not(.contact-link--info), .tech-pill');

    elements.forEach(element => {
      element.addEventListener('mousemove', event => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate3d(${x * 0.045}px, ${y * 0.07}px, 0)`;
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = '';
      });
    });
  }

  function initParallaxHero() {
    const photoFrame = $('.photo-frame');
    const heroName = $('.hero__name');
    const glow1 = $('.bg-glow--1');
    const glow2 = $('.bg-glow--2');

    if (!photoFrame && !heroName && !glow1 && !glow2) return;

    window.addEventListener('mousemove', event => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;

      if (photoFrame) photoFrame.style.transform = `translate3d(${x * 11}px, ${y * 9}px, 0) rotateX(${-y * 2}deg) rotateY(${x * 2}deg)`;
      if (heroName) heroName.style.textShadow = `${x * 12}px ${y * 12}px 38px rgba(255,255,255,.08)`;
      if (glow1) glow1.style.transform = `translate3d(${x * 18}px, ${y * 14}px, 0)`;
      if (glow2) glow2.style.transform = `translate3d(${-x * 16}px, ${-y * 12}px, 0)`;
    }, { passive: true });
  }

  function initCardTilt() {
    const cards = $$('.about-card, .skill-block, .why-card, .tl-item__card, .edu-card, .contact-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 3.2}deg) rotateY(${x * 3.2}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  function animateNumbers() {
    const stats = $$('.stat__val');
    if (!stats.length || prefersReducedMotion) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const text = element.textContent.trim();
        const number = parseInt(text, 10);

        if (!Number.isFinite(number)) {
          observer.unobserve(element);
          return;
        }

        const suffix = text.replace(String(number), '');
        animateCounter(element, 0, number, 850, suffix);
        observer.unobserve(element);
      });
    }, { threshold: 0.45 });

    stats.forEach(stat => observer.observe(stat));
  }

  function animateCounter(element, from, to, duration, suffix = '') {
    const start = performance.now();
    const frame = now => {
      const p = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (to - from) * easeOutCubic(p));
      element.textContent = `${value}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'js-scroll-progress';
    document.body.appendChild(bar);

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', debounce(update, 150));
  }

  function initCopyContacts() {
    const values = $$('a[href^="mailto:"] .contact-link__val, a[href^="tel:"] .contact-link__val');

    values.forEach(element => {
      element.style.cursor = 'copy';
      element.title = state.lang === 'en' ? 'Click to copy' : 'Натисніть, щоб скопіювати';

      element.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        copyText(element.textContent.trim(), element);
      });
    });
  }

  async function copyText(text, element) {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      const original = element.textContent;
      element.textContent = state.lang === 'en' ? 'Copied ✓' : 'Скопійовано ✓';
      setTimeout(() => { element.textContent = original; }, 900);
    } catch (_) {
      // Clipboard can be blocked when opening the file directly from disk.
    }
  }

  /* =========================================================
     HELPERS
  ========================================================= */
  function typeOneLine(element, text, speed = 34) {
    return new Promise(resolve => {
      if (!element) {
        resolve();
        return;
      }

      element.textContent = '';
      let index = 0;
      const timer = setInterval(() => {
        element.textContent += text[index] || '';
        index += 1;
        if (index >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  function debounce(fn, delay = 150) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();
