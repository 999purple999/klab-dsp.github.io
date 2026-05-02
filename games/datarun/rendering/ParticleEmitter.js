import { ObjectPool } from '../utils/ObjectPool.js';

function makeParticle() {
  return { x:0, y:0, vx:0, vy:0, life:0, maxLife:1, color:'#fff', size:2, active:false };
}

function resetParticle(p) {
  p.x=0; p.y=0; p.vx=0; p.vy=0; p.life=0; p.maxLife=1; p.color='#fff'; p.size=2; p.active=false;
}

export class ParticleEmitter {
  constructor() {
    this._pool = new ObjectPool(makeParticle, resetParticle, 200);
    this._gravity = 0;
  }

  emit(x, y, count, color, opts = {}) {
    for (let i = 0; i < count; i++) {
      const p = this._pool.acquire();
      p.x = x;
      p.y = y;
      const angle = opts.angle !== undefined ? opts.angle : Math.random() * Math.PI * 2;
      const speed = opts.speed !== undefined ? opts.speed : (1.5 + Math.random() * 8);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.maxLife = opts.life !== undefined ? opts.life : (0.4 + Math.random() * 0.6);
      p.life = p.maxLife;
      p.color = color;
      p.size = opts.size !== undefined ? opts.size : (1.5 + Math.random() * 3.5);
      p.active = true;
    }
  }

  emitBurst(x, y, count, colors, opts = {}) {
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.emit(x, y, 1, color, opts);
    }
  }

  update(dt) {
    const active = this._pool.active;
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += this._gravity;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= dt;
      if (p.life <= 0) {
        this._pool.release(p);
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this._pool.active) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  clear() {
    this._pool.releaseAll();
  }
}
