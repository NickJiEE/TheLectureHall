(() => {
  const finePointer = window.matchMedia?.('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer) return;

  const root = document.documentElement;
  root.classList.add('lh-custom-cursor');

  const trail = document.createElement('canvas');
  const halo = document.createElement('div');
  const ring = document.createElement('div');
  const spark = document.createElement('div');
  const mobius = document.createElement('div');
  const dot = document.createElement('div');

  trail.className = 'lh-cursor-trail';
  halo.className = 'lh-cursor-halo';
  ring.className = 'lh-cursor-ring';
  spark.className = 'lh-cursor-spark';
  mobius.className = 'lh-cursor-mobius';
  dot.className = 'lh-cursor-dot';

  mobius.setAttribute('aria-hidden', 'true');
  mobius.innerHTML = `
    <svg viewBox="0 0 120 76" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lhMobiusGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8a4f06"></stop>
          <stop offset="22%" stop-color="#f0b748"></stop>
          <stop offset="50%" stop-color="#fff2c7"></stop>
          <stop offset="78%" stop-color="#f0b748"></stop>
          <stop offset="100%" stop-color="#8a4f06"></stop>
        </linearGradient>
        <filter id="lhMobiusGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.15" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
      </defs>
      <path class="mobius-shadow" d="M12 38 C12 16 36 16 60 38 C84 60 108 60 108 38 C108 16 84 16 60 38 C36 60 12 60 12 38" pathLength="100"></path>
      <path class="mobius-base" d="M12 38 C12 16 36 16 60 38 C84 60 108 60 108 38 C108 16 84 16 60 38 C36 60 12 60 12 38" pathLength="100"></path>
      <path class="mobius-flow" d="M12 38 C12 16 36 16 60 38 C84 60 108 60 108 38 C108 16 84 16 60 38 C36 60 12 60 12 38" pathLength="100"></path>
    </svg>`;

  document.body.append(trail, halo, ring, spark, mobius, dot);

  const ctx = trail.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const interactiveSelector = [
    'a', 'button', '[role="button"]', 'summary',
    '.topic-card', '.module-card', '.pill', '.lh-button', '.replay-intro', '.intro-skip',
    '.tab', '.tab-btn', '.mode-btn',
    'input[type="range"]', 'input[type="checkbox"]', 'input[type="radio"]'
  ].join(',');
  const textSelector = 'input[type="text"], input[type="search"], textarea, [contenteditable="true"]';
  const dragSelector = '#three-canvas, [data-cursor="drag"]';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const easeByFrameTime = (baseEase, frameScale) => 1 - Math.pow(1 - baseEase, frameScale);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let followerX = mouseX;
  let followerY = mouseY;
  let lastFollowerX = followerX;
  let lastFollowerY = followerY;
  let velocityX = 0;
  let velocityY = 0;
  let pointerSpeed = 0;
  let visible = false;
  let rafId = 0;
  let lastFrameTime = performance.now();
  let lastMoveTime = lastFrameTime;
  let lastRecordedX = mouseX;
  let lastRecordedY = mouseY;
  let lastRecordedTime = lastFrameTime;
  let previousTrailBounds = null;
  let hoverState = false;
  let dragState = false;

  const points = [];
  const MAX_POINTS = reducedMotion ? 18 : 34;

  const place = (element, x, y, extra = 'translate(-50%,-50%)') => {
    element.style.transform = `translate3d(${x}px, ${y}px, 0) ${extra}`;
  };

  const clearPreviousTrail = () => {
    if (!previousTrailBounds) return;
    const { x, y, width, height } = previousTrailBounds;
    ctx.clearRect(x, y, width, height);
    previousTrailBounds = null;
  };

  const resizeTrail = () => {
    // DPR 1 is deliberate: a full-viewport high-DPI canvas was the main source of lag.
    trail.width = Math.max(1, Math.round(window.innerWidth));
    trail.height = Math.max(1, Math.round(window.innerHeight));
    trail.style.width = `${window.innerWidth}px`;
    trail.style.height = `${window.innerHeight}px`;
    previousTrailBounds = null;
  };

  const requestTick = () => {
    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  const updateHoverState = (target) => {
    if (!(target instanceof Element)) return;

    const text = !!target.closest(textSelector);
    const drag = !!target.closest(dragSelector);
    const hover = !text && !!target.closest(interactiveSelector);

    hoverState = hover || drag;
    dragState = drag;

    root.classList.toggle('lh-cursor-text', text);
    root.classList.toggle('lh-cursor-drag', drag);
    root.classList.toggle('lh-cursor-hover', hoverState);
  };

  const recordPoint = (x, y, time, force = false) => {
    const distance = Math.hypot(x - lastRecordedX, y - lastRecordedY);
    const elapsed = Math.max(1, time - lastRecordedTime);

    // Sample lightly. The path itself is smoothed, so hundreds of coalesced points are unnecessary.
    if (!force && distance < 2.2 && elapsed < 12) return;

    const instantaneousSpeed = distance / elapsed * 16.667;
    pointerSpeed = lerp(pointerSpeed, instantaneousSpeed, 0.35);

    points.push({ x, y, time });
    if (points.length > MAX_POINTS) points.splice(0, points.length - MAX_POINTS);

    lastRecordedX = x;
    lastRecordedY = y;
    lastRecordedTime = time;
  };

  const buildSmoothPath = () => {
    const count = points.length;
    if (count < 2) return false;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < count - 1; index += 1) {
      const point = points[index];
      const next = points[index + 1];
      const midpointX = (point.x + next.x) * 0.5;
      const midpointY = (point.y + next.y) * 0.5;
      ctx.quadraticCurveTo(point.x, point.y, midpointX, midpointY);
    }

    const beforeLast = points[count - 2];
    const last = points[count - 1];
    ctx.quadraticCurveTo(beforeLast.x, beforeLast.y, last.x, last.y);
    return true;
  };

  const getTrailBounds = () => {
    if (!points.length) return null;

    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    const padding = 18;
    const x = Math.max(0, Math.floor(minX - padding));
    const y = Math.max(0, Math.floor(minY - padding));
    const right = Math.min(trail.width, Math.ceil(maxX + padding));
    const bottom = Math.min(trail.height, Math.ceil(maxY + padding));

    return {
      x,
      y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y)
    };
  };

  const drawTrail = (now) => {
    clearPreviousTrail();
    if (!visible || points.length < 2) return;

    const baseLife = reducedMotion ? 75 : 115;
    const maxLife = reducedMotion ? 105 : 205;
    const life = clamp(baseLife + pointerSpeed * (reducedMotion ? 1.8 : 4.1), baseLife, maxLife);

    while (points.length && now - points[0].time > life) points.shift();
    if (points.length < 2) return;

    previousTrailBounds = getTrailBounds();

    const tailPoint = points[0];
    const headPoint = points[points.length - 1];
    const gradient = ctx.createLinearGradient(tailPoint.x, tailPoint.y, headPoint.x, headPoint.y);
    const stateScale = hoverState ? 0.62 : dragState ? 0.7 : 1;

    gradient.addColorStop(0, 'rgba(240, 192, 96, 0)');
    gradient.addColorStop(0.4, `rgba(240, 192, 96, ${0.10 * stateScale})`);
    gradient.addColorStop(0.78, `rgba(240, 192, 96, ${0.30 * stateScale})`);
    gradient.addColorStop(1, `rgba(255, 244, 214, ${0.84 * stateScale})`);

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // One wide translucent stroke gives the glow without expensive shadowBlur.
    if (buildSmoothPath()) {
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 5.4;
      ctx.globalAlpha = 0.22;
      ctx.stroke();
    }

    // One crisp filament on top. Two total strokes per frame instead of hundreds.
    if (buildSmoothPath()) {
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.45;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    ctx.restore();
  };

  const show = () => {
    if (visible) return;
    visible = true;
    root.classList.add('lh-cursor-visible');
    const now = performance.now();
    lastRecordedX = mouseX;
    lastRecordedY = mouseY;
    lastRecordedTime = now;
    recordPoint(mouseX, mouseY, now, true);
  };

  const hide = () => {
    visible = false;
    points.length = 0;
    clearPreviousTrail();
    root.classList.remove(
      'lh-cursor-visible',
      'lh-cursor-hover',
      'lh-cursor-drag',
      'lh-cursor-text',
      'lh-cursor-down'
    );
  };

  function tick(time) {
    rafId = 0;

    const deltaMs = Math.min(34, Math.max(8, time - lastFrameTime));
    const frameScale = deltaMs / 16.667;
    lastFrameTime = time;

    const followerEase = reducedMotion ? 0.5 : easeByFrameTime(0.3, frameScale);
    const velocityEase = reducedMotion ? 0.46 : easeByFrameTime(0.3, frameScale);

    followerX = lerp(followerX, mouseX, followerEase);
    followerY = lerp(followerY, mouseY, followerEase);

    const frameVX = followerX - lastFollowerX;
    const frameVY = followerY - lastFollowerY;
    lastFollowerX = followerX;
    lastFollowerY = followerY;

    velocityX = lerp(velocityX, frameVX, velocityEase);
    velocityY = lerp(velocityY, frameVY, velocityEase);
    pointerSpeed *= reducedMotion ? 0.78 : 0.88;

    const speed = Math.hypot(velocityX, velocityY);
    const bank = reducedMotion ? 0 : clamp(velocityX * 2.8, -10, 10);
    const flowDuration = reducedMotion
      ? '2.6s'
      : `${clamp(1.9 - speed * 0.05, 1.08, 1.8).toFixed(2)}s`;

    mobius.style.setProperty('--lh-mobius-bank', `${bank.toFixed(2)}deg`);
    mobius.style.setProperty('--lh-flow-speed', flowDuration);

    if (visible && time - lastRecordedTime > 22) {
      recordPoint(mouseX, mouseY, time);
    }

    drawTrail(time);

    place(dot, mouseX, mouseY);
    place(halo, followerX, followerY);
    place(ring, followerX, followerY);
    place(spark, followerX, followerY, 'translate(-50%,-50%) rotate(-18deg)');
    place(mobius, followerX, followerY);

    const followerDistance = Math.hypot(mouseX - followerX, mouseY - followerY);
    const trailActive = points.length > 1;
    const recentlyMoved = time - lastMoveTime < 90;

    if (visible && (followerDistance > 0.08 || speed > 0.025 || trailActive || recentlyMoved)) {
      requestTick();
    }
  }

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    lastMoveTime = performance.now();

    show();
    recordPoint(mouseX, mouseY, lastMoveTime);
    requestTick();
  }, { passive: true });

  document.addEventListener('pointerover', (event) => {
    updateHoverState(event.target);
    requestTick();
  }, { passive: true });

  window.addEventListener('pointerdown', () => {
    root.classList.add('lh-cursor-down');
    requestTick();
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    root.classList.remove('lh-cursor-down');
    requestTick();
  }, { passive: true });

  window.addEventListener('pointerleave', hide, { passive: true });
  window.addEventListener('blur', hide);
  window.addEventListener('resize', () => {
    resizeTrail();
    requestTick();
  }, { passive: true });

  // iframes swallow pointermove events so the parent cursor freezes when the mouse
  // crosses into one. Each interactive iframe posts its local mouse coords back via
  // postMessage. We translate those local coords into parent-space by offsetting with
  // the iframe's getBoundingClientRect, then feed them into the normal cursor pipeline.
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;
    const { type, x, y } = event.data;

    if (type === 'lh-mousemove') {
      // Find the sending iframe and get its position in the parent viewport.
      const frames = document.querySelectorAll('iframe');
      let rect = null;
      for (const frame of frames) {
        try {
          if (frame.contentWindow === event.source) {
            rect = frame.getBoundingClientRect();
            break;
          }
        } catch (_) {}
      }
      mouseX = (rect ? rect.left : 0) + x;
      mouseY = (rect ? rect.top  : 0) + y;
      lastMoveTime = performance.now();
      show();
      recordPoint(mouseX, mouseY, lastMoveTime);
      requestTick();
    }

    if (type === 'lh-mouseleave') {
      // Mouse exited the iframe — parent pointermove will resume naturally.
      visible = false;
    }
  }, { passive: true });

  resizeTrail();
})();
