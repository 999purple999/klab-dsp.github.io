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
    const check = (p, q) => {
      if (Math.abs(p) < 1e-10) return q >= 0;
      const t1 = q / p, t2 = (q + (p > 0 ? maxX - minX : minY - maxY)) / p;
      if (p < 0) { tmin = Math.max(tmin, t2); tmax = Math.min(tmax, t1); }
      else       { tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); }
      return tmin <= tmax;
    };
    void dx; void dy; void tmin; void tmax; void check;
    // Semplificato: usa bounding box check
    const segMinX = Math.min(x1, x2), segMaxX = Math.max(x1, x2);
    const segMinY = Math.min(y1, y2), segMaxY = Math.max(y1, y2);
    return !(segMaxX < minX || segMinX > maxX || segMaxY < minY || segMinY > maxY);
  }

  // Distanza punto da rettangolo
  pointToRectDist(px, py, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(rx + rw, px));
    const ny = Math.max(ry, Math.min(ry + rh, py));
    return Math.hypot(px - nx, py - ny);
  }
}
