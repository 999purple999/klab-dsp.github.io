export const CollisionSystem = {
  /**
   * AABB collision
   * rect1: {x,y,w,h} center-based or top-left — provide as {left,top,right,bottom}
   */
  aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    // ax,ay = center, aw,ah = full width/height
    const aLeft = ax - aw / 2;
    const aRight = ax + aw / 2;
    const aTop = ay - ah / 2;
    const aBottom = ay + ah / 2;
    const bLeft = bx;
    const bRight = bx + bw;
    const bTop = by;
    const bBottom = by + bh;
    return aRight > bLeft && aLeft < bRight && aBottom > bTop && aTop < bBottom;
  },

  /**
   * Circle vs Circle
   */
  circleCircle(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distSq = dx * dx + dy * dy;
    const rSum = r1 + r2;
    return distSq <= rSum * rSum;
  },

  /**
   * Circle vs AABB (rect is top-left based)
   */
  circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nearX = Math.max(rx, Math.min(cx, rx + rw));
    const nearY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearX;
    const dy = cy - nearY;
    return dx * dx + dy * dy <= cr * cr;
  },

  /**
   * Player (circle) vs pipe pair obstacle
   * pipe: {x, gapY, gapH, w}
   */
  playerVsPipe(px, py, pr, pipe) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.w;
    const topPipeBottom = pipe.gapY;
    const botPipeTop = pipe.gapY + pipe.gapH;

    // Only check if player x overlaps pipe x
    if (px + pr < pipeLeft || px - pr > pipeRight) return false;

    // Check top pipe collision
    if (this.circleRect(px, py, pr, pipeLeft, 0, pipe.w, topPipeBottom)) return true;
    // Check bottom pipe collision (bottom pipe extends from botPipeTop to infinity)
    if (this.circleRect(px, py, pr, pipeLeft, botPipeTop, pipe.w, 9999)) return true;

    return false;
  },

  /**
   * Player vs laser (vertical line at x, flashing)
   * laser: {x, active}
   */
  playerVsLaser(px, py, pr, laser, W, H) {
    if (!laser.active) return false;
    // Laser is a thin vertical line at laser.x
    return this.circleRect(px, py, pr, laser.x - 4, 0, 8, H);
  }
};
