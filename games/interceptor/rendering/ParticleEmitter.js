import { randRange } from '../utils/math.js';

const POOL_SIZE = 300;

function makeParticle() {
  return {
    x: 0, y: 0, vx: 0, vy: 0,
    alpha: 0, r: 3, col: '#FFF',
    kind: 'dot',  // 'dot' | 'binary' | 'square' | 'spark' | 'ice' | 'ring'
    text: '0',
    lifetime: 0, maxLifetime: 1,
    ringR: 0,
    alive: false,
  };
}

export class ParticleEmitter {
  constructor() {
    this._pool = [];
    this._active = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      this._pool.push(makeParticle());
    }
  }

  _get() {
    const p = this._pool.length > 0 ? this._pool.pop() : makeParticle();
    p.alive = true;
    this._active.push(p);
    return p;
  }

  _release(p) {
    p.alive = false;
    this._pool.push(p);
  }

  // Packet explode: binary particles
  packetExplode(lx, ly, color, n) {
    n = n || 22;
    for (let i = 0; i < n; i++) {
      const p = this._get();
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(2, 12);
      p.x = lx;
      p.y = ly;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.alpha = 1;
      p.r = randRange(2, 5);
      p.col = color;
      p.kind = Math.random() < 0.5 ? 'binary' : 'dot';
      p.text = Math.random() < 0.5 ? '1' : '0';
      p.lifetime = 0;
      p.maxLifetime = randRange(0.4, 0.9);
    }
  }

  // Pixel burst (colored squares)
  pixelBurst(lx, ly, color, n) {
    n = n || 15;
    for (let i = 0; i < n; i++) {
      const p = this._get();
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(3, 14);
      p.x = lx;
      p.y = ly;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.alpha = 1;
      p.r = randRange(3, 8);
      p.col = color;
      p.kind = 'square';
      p.lifetime = 0;
      p.maxLifetime = randRange(0.3, 0.7);
    }
  }

  // Firewall hit sparks
  firewallHit(lx, ly, n) {
    n = n || 18;
    for (let i = 0; i < n; i++) {
      const p = this._get();
      const angle = randRange(-Math.PI * 0.35, Math.PI * 0.35);
      const speed = randRange(4, 16);
      p.x = lx;
      p.y = ly;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.alpha = 1;
      p.r = randRange(2, 4);
      p.col = '#FF3333';
      p.kind = 'spark';
      p.lifetime = 0;
      p.maxLifetime = randRange(0.2, 0.5);
    }
  }

  // Freeze: ice crystals
  freezeEffect(lx, ly, n) {
    n = n || 16;
    for (let i = 0; i < n; i++) {
      const p = this._get();
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(1, 7);
      p.x = lx;
      p.y = ly;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.alpha = 1;
      p.r = randRange(6, 14);
      p.col = '#88CCFF';
      p.kind = 'ice';
      p.lifetime = 0;
      p.maxLifetime = randRange(0.5, 1.0);
    }
  }

  // PowerUp collect: expanding rings
  powerUpCollect(lx, ly, color) {
    for (let i = 0; i < 3; i++) {
      const p = this._get();
      p.x = lx;
      p.y = ly;
      p.vx = 0;
      p.vy = 0;
      p.alpha = 1;
      p.r = 0;
      p.col = color;
      p.kind = 'ring';
      p.ringR = 10 + i * 18;
      p.lifetime = i * 0.08;
      p.maxLifetime = 0.6;
    }
  }

  update(dt) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const p = this._active[i];
      p.lifetime += dt;
      const t = p.lifetime / p.maxLifetime;

      if (t >= 1) {
        this._active.splice(i, 1);
        this._release(p);
        continue;
      }

      p.alpha = 1 - t;

      if (p.kind === 'ring') {
        p.r = p.ringR + t * 60;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
      }
    }
  }

  draw(ctx, dpr) {
    for (const p of this._active) {
      if (!p.alive) continue;

      ctx.globalAlpha = p.alpha;

      switch (p.kind) {
        case 'dot':
          ctx.fillStyle = p.col;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.col;
          ctx.beginPath();
          ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;

        case 'binary':
          ctx.fillStyle = p.col;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.col;
          ctx.font = `bold ${Math.max(8, p.r * 2) * dpr}px "JetBrains Mono","Courier New",monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.text, p.x * dpr, p.y * dpr);
          ctx.shadowBlur = 0;
          break;

        case 'square':
          ctx.fillStyle = p.col;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.col;
          ctx.fillRect(
            (p.x - p.r / 2) * dpr,
            (p.y - p.r / 2) * dpr,
            p.r * dpr,
            p.r * dpr
          );
          ctx.shadowBlur = 0;
          break;

        case 'spark':
          ctx.strokeStyle = p.col;
          ctx.lineWidth = 2 * dpr;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.col;
          ctx.beginPath();
          ctx.moveTo(p.x * dpr, p.y * dpr);
          ctx.lineTo((p.x - p.vx * 3) * dpr, (p.y - p.vy * 3) * dpr);
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;

        case 'ice': {
          // 6-point star
          const px = p.x * dpr;
          const py = p.y * dpr;
          const ir = p.r * dpr;
          ctx.strokeStyle = p.col;
          ctx.lineWidth = 1.5 * dpr;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.col;
          ctx.beginPath();
          for (let pt = 0; pt < 6; pt++) {
            const angle = (pt * Math.PI) / 3;
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.cos(angle) * ir, py + Math.sin(angle) * ir);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;
        }

        case 'ring':
          ctx.strokeStyle = p.col;
          ctx.lineWidth = (2 * (1 - p.lifetime / p.maxLifetime)) * dpr;
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.col;
          ctx.beginPath();
          ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  get activeCount() {
    return this._active.length;
  }
}
