import { clamp, rand } from '../utils/math.js';

export class PhysicsWorld {
  constructor() {
    this.gravity = 9.8;
    this.wind = 0;
    this.mode = 'SANDBOX'; // SANDBOX | ZEROG | CHAOS
    this.totalCollisions = 0;
    this.chaosTimer = 0;
    this.gravOscPhase = 0;
    this.onCollision = null; // callback(boxA, boxB, force)
    this._floorY = 0;
    this._W = 800;
  }

  setDimensions(W, H) {
    this._W = W;
    this._H = H;
    this._floorY = H - 40;
  }

  update(dt, boxes) {
    const { _W, _H, _floorY } = this;
    const dtS = dt / 1000; // ms -> seconds

    // Chaos gravity oscillation
    let grav = this.gravity;
    if (this.mode === 'CHAOS') {
      this.gravOscPhase += dtS * 3;
      grav = this.gravity + Math.sin(this.gravOscPhase) * 20;
      this.chaosTimer -= dt;
      if (this.chaosTimer <= 0) {
        this.chaosTimer = 200;
        for (const b of boxes) {
          if (!b.locked && !b.dragging) {
            b.vx += rand(-12, 12);
            b.vy += rand(-12, 12);
          }
        }
      }
    }

    for (const b of boxes) {
      if (b.locked || b.dragging) {
        b.update(dt);
        continue;
      }

      // Apply gravity & wind
      if (this.mode === 'ZEROG') {
        b.vx += rand(-0.3, 0.3) * dtS * 60;
        b.vy += rand(-0.3, 0.3) * dtS * 60;
      } else {
        b.vy += grav * dtS;
      }
      b.vx += this.wind * dtS;

      // Friction / drag
      b.vx *= Math.pow(0.991, dtS * 60);
      b.vy *= Math.pow(0.991, dtS * 60);
      b.av *= Math.pow(0.93, dtS * 60);

      // Integrate
      b.x += b.vx * dtS * 60;
      b.y += b.vy * dtS * 60;
      b.angle += b.av;

      b.update(dt);

      // Wall bounces
      const e = b.elasticity;
      if (b.y + b.h > _floorY) {
        b.y = _floorY - b.h;
        b.vy *= -e;
        b.vx += rand(-0.5, 0.5);
        b.av += rand(-0.04, 0.04);
        if (Math.abs(b.vy) < 0.7) b.vy = 0;
      }
      if (b.x < 0) { b.x = 0; b.vx *= -e; b.av += rand(-0.05, 0.05); }
      if (b.x + b.w > _W) { b.x = _W - b.w; b.vx *= -e; b.av += rand(-0.05, 0.05); }
      if (b.y < 0) { b.y = 0; b.vy *= -e; }
    }

    // AABB collision between boxes
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.dragging || b.dragging) continue;

        const acx = a.x + a.w / 2, acy = a.y + a.h / 2;
        const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;
        const dx = acx - bcx, dy = acy - bcy;
        const mx2 = (a.w + b.w) / 2, my2 = (a.h + b.h) / 2;

        if (Math.abs(dx) < mx2 && Math.abs(dy) < my2) {
          const ox = mx2 - Math.abs(dx), oy = my2 - Math.abs(dy);
          const e = (a.elasticity + b.elasticity) * 0.5;
          const mA = a.locked ? Infinity : a.mass;
          const mB = b.locked ? Infinity : b.mass;
          const totalM = mA + mB;

          if (ox < oy) {
            const sx = dx < 0 ? -1 : 1;
            if (!a.locked) a.x += sx * ox * (mB / totalM);
            if (!b.locked) b.x -= sx * ox * (mA / totalM);
            if (!a.locked && !b.locked) {
              const relV = a.vx - b.vx;
              const impulse = (2 * relV) / totalM;
              a.vx -= impulse * mB * e;
              b.vx += impulse * mA * e;
            } else if (a.locked) {
              b.vx = -b.vx * e;
            } else {
              a.vx = -a.vx * e;
            }
            a.av += rand(-0.04, 0.04);
            b.av += rand(-0.04, 0.04);
            const force = Math.abs(a.vx - b.vx);
            this._onCollide(a, b, force);
          } else {
            const sy = dy < 0 ? -1 : 1;
            if (!a.locked) a.y += sy * oy * (mB / totalM);
            if (!b.locked) b.y -= sy * oy * (mA / totalM);
            if (!a.locked && !b.locked) {
              const relV = a.vy - b.vy;
              const impulse = (2 * relV) / totalM;
              a.vy -= impulse * mB * e;
              b.vy += impulse * mA * e;
            } else if (a.locked) {
              b.vy = -b.vy * e;
            } else {
              a.vy = -a.vy * e;
            }
            const force = Math.abs(a.vy - b.vy);
            this._onCollide(a, b, force);
          }
        }
      }
    }
  }

  _onCollide(a, b, force) {
    if (force < 0.5) return;
    this.totalCollisions++;
    if (this.onCollision) this.onCollision(a, b, force);
  }
}
