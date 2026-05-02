// physics/CollisionSystem.js — Obstacle collision utilities

import { dist } from '../utils/math.js';

export class CollisionSystem {
  constructor() {
    this.obstacles = [];
  }

  setObstacles(list) {
    this.obstacles = list;
  }

  /** Returns the first obstacle that overlaps the circle, else null */
  checkCircle(x, y, r) {
    for (const o of this.obstacles) {
      const cx = Math.max(o.x, Math.min(o.x + o.w, x));
      const cy = Math.max(o.y, Math.min(o.y + o.h, y));
      if (dist(x, y, cx, cy) < r) return o;
    }
    return null;
  }

  /** Push an object (with .x/.y) out of all obstacles */
  resolveCircle(obj, r) {
    for (const o of this.obstacles) {
      const cx = Math.max(o.x, Math.min(o.x + o.w, obj.x));
      const cy = Math.max(o.y, Math.min(o.y + o.h, obj.y));
      const d = dist(obj.x, obj.y, cx, cy);
      if (d < r && d > 0) {
        const nx = (obj.x - cx) / d;
        const ny = (obj.y - cy) / d;
        obj.x = cx + nx * (r + 1);
        obj.y = cy + ny * (r + 1);
      }
    }
  }

  /** Bounce entity (with .vx/.vy) off obstacles */
  bounceCircle(entity, r) {
    for (const o of this.obstacles) {
      const cx = Math.max(o.x, Math.min(o.x + o.w, entity.x));
      const cy = Math.max(o.y, Math.min(o.y + o.h, entity.y));
      const d = dist(entity.x, entity.y, cx, cy);
      if (d < r && d > 0) {
        const nx = (entity.x - cx) / d;
        const ny = (entity.y - cy) / d;
        entity.x = cx + nx * (r + 1);
        entity.y = cy + ny * (r + 1);
        entity.vx += nx * 120;
        entity.vy += ny * 120;
      }
    }
  }
}
