(() => {
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer) return;

  const root = document.documentElement;
  root.classList.add('lh-custom-cursor');

  const dot = document.createElement('div');
  const ring = document.createElement('div');
  const tail = document.createElement('div');
  const spark = document.createElement('div');
  dot.className = 'lh-cursor-dot';
  ring.className = 'lh-cursor-ring';
  tail.className = 'lh-cursor-tail';
  spark.className = 'lh-cursor-spark';
  document.body.append(ring, tail, spark, dot);

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
  const shortestAngleDelta = (from, to) => ((to - from + 540) % 360) - 180;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let lastRingX = ringX;
  let lastRingY = ringY;
  let velocityX = 0;
  let velocityY = 0;
  let tailAngle = -18;
  let tailLength = 0;
  let visible = false;
  let ticking = false;
  let lastTime = performance.now();

  const place = (el, x, y, extra = 'translate(-50%,-50%)') => {
    el.style.transform = `translate3d(${x}px, ${y}px, 0) ${extra}`;
  };

  const updateHoverState = (target) => {
    const text = !!target.closest(textSelector);
    const drag = !!target.closest(dragSelector);
    const hover = !text && !!target.closest(interactiveSelector);
    root.classList.toggle('lh-cursor-text', text);
    root.classList.toggle('lh-cursor-drag', drag);
    root.classList.toggle('lh-cursor-hover', hover || drag);
  };

  const show = () => {
    if (visible) return;
    visible = true;
    root.classList.add('lh-cursor-visible');
  };

  const hide = () => {
    visible = false;
    tailLength = 0;
    tail.style.height = '0px';
    tail.style.opacity = '0';
    spark.style.opacity = '0';
    root.classList.remove('lh-cursor-visible', 'lh-cursor-hover', 'lh-cursor-drag', 'lh-cursor-text', 'lh-cursor-down');
  };

  const tick = (time) => {
    const deltaMs = Math.min(40, Math.max(8, time - lastTime));
    const frameScale = reducedMotion ? 1 : deltaMs / 16.667;
    lastTime = time;

    const ringEase = reducedMotion ? 1 : easeByFrameTime(0.2, frameScale);
    const velocityEase = reducedMotion ? 1 : easeByFrameTime(0.18, frameScale);
    const angleEase = reducedMotion ? 1 : easeByFrameTime(0.16, frameScale);
    const tailEase = reducedMotion ? 1 : easeByFrameTime(0.24, frameScale);

    ringX = lerp(ringX, mouseX, ringEase);
    ringY = lerp(ringY, mouseY, ringEase);

    const frameVX = ringX - lastRingX;
    const frameVY = ringY - lastRingY;
    lastRingX = ringX;
    lastRingY = ringY;

    // Smooth the velocity vector first, then derive the angle from that vector.
    // This removes the old frame-by-frame angle snapping that made the tail feel discrete.
    velocityX = lerp(velocityX, frameVX, velocityEase);
    velocityY = lerp(velocityY, frameVY, velocityEase);

    const speed = Math.hypot(velocityX, velocityY);
    if (speed > 0.015) {
      const desiredAngle = Math.atan2(velocityY, velocityX) * 180 / Math.PI + 90;
      tailAngle += shortestAngleDelta(tailAngle, desiredAngle) * angleEase;
    }

    const targetTailLength = speed > 0.045 ? clamp(8 + speed * 4.4, 8, 42) : 0;
    tailLength = lerp(tailLength, targetTailLength, tailEase);
    const tailOpacity = visible ? clamp(tailLength / 22, 0, 0.82) : 0;

    tail.style.height = `${tailLength.toFixed(2)}px`;
    tail.style.opacity = tailOpacity.toFixed(3);

    place(dot, mouseX, mouseY);
    place(ring, ringX, ringY);
    place(spark, ringX, ringY, 'translate(-50%,-50%) rotate(-18deg)');
    place(tail, ringX, ringY, `translate(-50%, 2px) rotate(${tailAngle.toFixed(2)}deg)`);

    ticking = true;
    requestAnimationFrame(tick);
  };

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    show();
    if (event.target instanceof Element) updateHoverState(event.target);
  }, { passive: true });

  window.addEventListener('pointerdown', () => root.classList.add('lh-cursor-down'), { passive: true });
  window.addEventListener('pointerup', () => root.classList.remove('lh-cursor-down'), { passive: true });
  window.addEventListener('pointerleave', hide, { passive: true });
  window.addEventListener('blur', hide);

  if (!ticking) requestAnimationFrame(tick);
})();
