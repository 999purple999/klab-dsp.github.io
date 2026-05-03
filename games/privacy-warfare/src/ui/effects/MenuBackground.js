// ─── MenuBackground – Wave A ──────────────────────────────────────────────────
// Matrix rain + grid + particles on a fixed canvas behind all UI.
// Call initMenuBackground() once after DOM ready.

export function initMenuBackground() {
  const cv = document.createElement('canvas');
  cv.id = 'menu-bg-cv';
  cv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.insertBefore(cv, document.body.firstChild);

  const ctx = cv.getContext('2d');
  let W, H, cols, drops, particles;
  const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/[]{}#@';
  const FONT_SIZE = 14;

  function resize() {
    W = cv.width  = window.innerWidth;
    H = cv.height = window.innerHeight;
    cols  = Math.floor(W / FONT_SIZE);
    drops = Array.from({ length: cols }, () => Math.random() * -80);
    particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
      r: Math.random() * 1.5 + .5, o: Math.random() * .3 + .2,
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  let lastT = 0, raf;
  const FPS = 30, INTERVAL = 1000 / FPS;

  function draw(t) {
    raf = requestAnimationFrame(draw);
    if (t - lastT < INTERVAL) return;
    lastT = t;

    // Fade trail
    ctx.fillStyle = 'rgba(2,2,10,0.18)';
    ctx.fillRect(0, 0, W, H);

    // Matrix rain
    ctx.font = `${FONT_SIZE}px monospace`;
    drops.forEach((y, i) => {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x  = i * FONT_SIZE;
      // Lead character brighter
      ctx.fillStyle = `rgba(0,240,255,0.85)`;
      ctx.fillText(ch, x, y * FONT_SIZE);
      // Trail
      ctx.fillStyle = `rgba(176,38,255,0.35)`;
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, (y-1) * FONT_SIZE);
      ctx.fillStyle = `rgba(176,38,255,0.15)`;
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, (y-2) * FONT_SIZE);

      if (y * FONT_SIZE > H && Math.random() > 0.975) drops[i] = 0;
      drops[i] += .6 + Math.random() * .4;
    });

    // Floating particles
    ctx.save();
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,200,255,${p.o})`;
      ctx.fill();
    });
    ctx.restore();
  }

  raf = requestAnimationFrame(draw);

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(draw);
  });
}
