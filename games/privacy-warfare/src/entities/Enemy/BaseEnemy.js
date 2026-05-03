export class BaseEnemy {
  constructor(x, y, def, wave) {
    const hpBonus = Math.floor(wave / 3);
    this.x = x; this.y = y;
    this.t = def.type;
    this.col = def.col;
    this.sz = def.sz;
    this.hp = def.hp + hpBonus;
    this.maxHp = this.hp;
    this.spd = def.spd * (1 + wave * 0.07);
    this.pts = def.pts;
    this.vx = 0; this.vy = 0;
    // status
    this.frozen = 0; this.virus = 0; this.al = 1;
    this.hitFlash = 0; this.spawnAnim = 0.5; this.berserk = false;
    // per shooter/doppel
    this.shootTimer = 2 + Math.random() * 2;
    // per cloaker
    this.cloakTimer = 2; this.cloaking = false;
    // per teleport
    this.teleTimer = 4 + Math.random() * 3;
    // per necro
    this.necroTimer = 8;
    // AI state
    this.alertLevel = 0;
    this.patrolTarget = null;
    this.lastSeenX = x; this.lastSeenY = y;

    // Extended timers for new enemy types
    this.chargeTimer  = 3.5 + Math.random() * 2; // crawler
    this.chargeActive = false;
    this.chargeDX = 0; this.chargeDY = 0;
    this.stealTimer   = 3 + Math.random() * 2;   // broker
    this.laserTimer   = 4 + Math.random() * 2;   // hawk
    this.laserActive  = false;
    this.laserHoldTime = 0;
    this.revealed     = false;                    // trojan
    this.copies       = null;                     // mirage
    this.immuneWpn    = -1;                       // zeryday
    this.immuneHits   = {};
    this.bounceDir    = null;                     // bouncer
    this.bounceCount  = 0;
    this.bounceSpd    = 0;
    this.corrupted    = false;                    // corruption zone effect
    this._splitDone   = false;                    // bouncer split guard
  }

  isAlive() { return this.hp > 0; }

  takeDamage(dmg) { this.hp -= dmg; this.hitFlash = 0.13; }

  applyFreeze(t) { this.frozen = Math.max(this.frozen, t); this.vx = 0; this.vy = 0; }

  applyVirus(t) { this.virus = Math.max(this.virus, t); }

  update(dt, px, py, obstacles, enemies, eprojs, burst) {
    // Override in sottoclassi
    this._updateStatus(dt);
    this._updateMovement(dt, px, py, obstacles, enemies);
  }

  _updateStatus(dt) {
    if (this.spawnAnim > 0) this.spawnAnim -= dt * 3;
    if (this.frozen > 0)  { this.frozen -= dt; if (this.hitFlash > 0) this.hitFlash -= dt; }
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.virus > 0)  { this.virus -= dt; this.hp -= 0.3 * dt; }
  }

  _updateMovement(dt, px, py, obstacles, enemies) {
    if (this.frozen > 0) return;
    const tdx = px - this.x, tdy = py - this.y, td = Math.hypot(tdx, tdy) || 1;
    // Separation
    let sx = 0, sy = 0;
    for (const o of enemies) {
      if (o === this) continue;
      const sd = Math.hypot(this.x - o.x, this.y - o.y);
      if (sd < 32 && sd > 0) { sx += (this.x - o.x) / sd; sy += (this.y - o.y) / sd; }
    }
    this.vx += (tdx / td * this.spd - this.vx) * Math.min(1, 4.5 * dt);
    this.vx += sx * 90 * dt;
    this.vy += (tdy / td * this.spd - this.vy) * Math.min(1, 4.5 * dt);
    this.vy += sy * 90 * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    // Obstacle resolve
    for (const o of obstacles) {
      const cx = Math.max(o.x, Math.min(o.x + o.w, this.x));
      const cy = Math.max(o.y, Math.min(o.y + o.h, this.y));
      const dst = Math.hypot(this.x - cx, this.y - cy);
      if (dst < this.sz && dst > 0) {
        const nx = (this.x - cx) / dst, ny = (this.y - cy) / dst;
        this.x = cx + nx * (this.sz + 1); this.y = cy + ny * (this.sz + 1);
        this.vx += nx * 120; this.vy += ny * 120;
      }
    }
  }
}
