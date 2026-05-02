import { rand } from '../utils/math.js';

export class ParticleEmitter {
  constructor() {
    this.particles = [];
  }

  _spawn(opts) {
    this.particles.push({ ...opts, life: 1.0 });
  }

  // Ash particles: rise up, grey/dark
  emitAsh(x, y, dpr, count = 6) {
    for (let i = 0; i < count; i++) {
      this._spawn({
        type: 'ash',
        x: x * dpr, y: y * dpr,
        vx: rand(-1.5, 1.5),
        vy: rand(-3, -0.5),
        r: rand(1, 3) * dpr,
        col: `hsl(0,0%,${rand(30,70)}%)`,
        decay: rand(0.012, 0.025),
      });
    }
  }

  // Acid drips: fall down, green
  emitAcid(x, y, dpr, count = 5) {
    for (let i = 0; i < count; i++) {
      this._spawn({
        type: 'acid',
        x: x * dpr, y: y * dpr,
        vx: rand(-1, 1),
        vy: rand(0.5, 3),
        r: rand(2, 5) * dpr,
        col: `rgba(57,255,20,${rand(0.6,1)})`,
        decay: rand(0.015, 0.03),
      });
    }
  }

  // Pixel particles: for implode/explode
  emitPixels(x, y, dpr, count = 20, color = '#a855f7') {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2, 10);
      this._spawn({
        type: 'pixel',
        x: x * dpr, y: y * dpr,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: rand(1.5, 4) * dpr,
        col: color,
        gravity: 0.2,
        decay: rand(0.015, 0.03),
      });
    }
  }

  // Sparks: for shred
  emitSparks(x, y, dpr, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.5, 6);
      this._spawn({
        type: 'spark',
        x: x * dpr, y: y * dpr,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: rand(1, 3.5) * dpr,
        col: Math.random() < 0.5 ? '#FF5555' : '#a855f7',
        gravity: 0.14,
        decay: rand(0.022, 0.04),
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      if (p.type === 'ash') p.vx *= 0.98;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.col;
      ctx.shadowBlur = p.type === 'spark' ? 8 : 4;
      ctx.shadowColor = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
