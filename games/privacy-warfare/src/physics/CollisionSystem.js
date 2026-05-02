export class CollisionSystem {
  constructor() {
    this.obstacles = [];
  }

  setObstacles(obs) { this.obstacles = obs; }

  // AABB circle-vs-rect
  circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(rx + rw, cx));
    const ny = Math.max(ry, Math.min(ry + rh, cy));
    return Math.hypot(cx - nx, cy - ny) < cr;
  }

  // Risolvi collisione circle-rect, muove il cerchio fuori
  resolveCircleRect(obj, radius) {
    for (const o of this.obstacles) {
      const nx = Math.max(o.x, Math.min(o.x + o.w, obj.x));
      const ny = Math.max(o.y, Math.min(o.y + o.h, obj.y));
      const dist = Math.hypot(obj.x - nx, obj.y - ny);
      if (dist < radius && dist > 0) {
        const px = (obj.x - nx) / dist;
        const py = (obj.y - ny) / dist;
        obj.x = nx + px * (radius + 1);
        obj.y = ny + py * (radius + 1);
        // Rimbalzo velocità
        if (obj.vx !== undefined) {
          const dot = obj.vx * px + obj.vy * py;
          if (dot < 0) { obj.vx -= 2 * dot * px; obj.vy -= 2 * dot * py; obj.vx *= 0.5; obj.vy *= 0.5; }
        }
      }
    }
  }

  // Controlla se un segmento (proiettile) interseca un ostacolo
  segmentHitsAny(x1, y1, x2, y2) {
    for (const o of this.obstacles) {
      if (this._segmentAABB(x1, y1, x2, y2, o.x, o.y, o.x + o.w, o.y + o.h)) return true;
    }
    return false;
  }

  _segmentAABB(x1, y1, x2, y2, minX, minY, maxX, maxY) {
    const dx = x2 - x1, dy = y2 - y1;
    let tmin = 0, tmax = 1;

    // Slab test — X axis
    if (Math.abs(dx) < 1e-10) {
      if (x1 < minX || x1 > maxX) return false;
    } else {
      const t1 = (minX - x1) / dx, t2 = (maxX - x1) / dx;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
      if (tmin > tmax) return false;
    }

    // Slab test — Y axis
    if (Math.abs(dy) < 1e-10) {
      if (y1 < minY || y1 > maxY) return false;
    } else {
      const t1 = (minY - y1) / dy, t2 = (maxY - y1) / dy;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    }

    return tmin <= tmax;
  }

  // Distanza punto da rettangolo
  pointToRectDist(px, py, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(rx + rw, px));
    const ny = Math.max(ry, Math.min(ry + rh, py));
    return Math.hypot(px - nx, py - ny);
  }
}
