export class AIController {
  constructor(enemy, config = {}) {
    this.enemy = enemy;
    this.detectionRange = config.detectionRange || 350;
    this.attackRange    = config.attackRange    || 200;
    this.hearingRange   = config.hearingRange   || 180;
    this.losCheckInterval = 0.3;
    this.losTimer = Math.random() * this.losCheckInterval;
    this.hasLOS = false;  // line of sight
    this.state = 'patrol';  // patrol | alert | attack | flee | callHelp
    this.alertTimer = 0;
    this.fleeHP = 0.2;  // fuggi sotto 20% HP
  }

  update(dt, px, py, obstacles, allEnemies, sounds) {
    const e = this.enemy;
    if (!e.isAlive()) return;

    // Aggiorna LOS ogni 300ms
    this.losTimer -= dt;
    if (this.losTimer <= 0) {
      this.losTimer = this.losCheckInterval;
      this.hasLOS = this._checkLOS(e.x, e.y, px, py, obstacles);
    }

    const dist = Math.hypot(px - e.x, py - e.y);

    // State machine
    switch (this.state) {
      case 'patrol':
        if (this.hasLOS && dist < this.detectionRange) {
          this.state = 'alert'; this.alertTimer = 0.5;
        }
        break;
      case 'alert':
        this.alertTimer -= dt;
        if (this.alertTimer <= 0) this.state = 'attack';
        // CallHelp: avvisa nemici vicini
        if (allEnemies) {
          allEnemies.forEach(other => {
            if (other !== e && Math.hypot(e.x - other.x, e.y - other.y) < this.hearingRange) {
              if (other._ai) other._ai.state = 'attack';
            }
          });
        }
        break;
      case 'attack':
        if (!this.hasLOS && dist > this.detectionRange * 1.5) this.state = 'patrol';
        if (e.hp / e.maxHp < this.fleeHP) this.state = 'flee';
        break;
      case 'flee':
        if (e.hp / e.maxHp > 0.4) this.state = 'attack';
        // Muoviti nella direzione opposta al player
        e.vx += (e.x - px) / (dist || 1) * e.spd * dt * 2;
        e.vy += (e.y - py) / (dist || 1) * e.spd * dt * 2;
        return;
    }
  }

  _checkLOS(x1, y1, x2, y2, obstacles) {
    for (const o of obstacles) {
      // Simple AABB segment test
      const minX = Math.min(x1, x2) - 1, maxX = Math.max(x1, x2) + 1;
      const minY = Math.min(y1, y2) - 1, maxY = Math.max(y1, y2) + 1;
      if (maxX < o.x || minX > o.x + o.w || maxY < o.y || minY > o.y + o.h) continue;
      return false; // blocked
    }
    return true;
  }

  isInAttackState() { return this.state === 'attack'; }
}
