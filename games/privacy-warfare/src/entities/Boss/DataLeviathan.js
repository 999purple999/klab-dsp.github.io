// ─── DataLeviathan ────────────────────────────────────────────────────────────
// Boss 8. Theme: data serpent — submerges and re-emerges across the arena.
// Phase 1: slow circles + periodic submerge dive-bomb from above.
// Phase 2 (enraged): flood mode — dense projectile spirals from emerge points.

import { BossBase } from './BossBase.js';

export class DataLeviathan extends BossBase {
  constructor(x, y, wave) {
    super(x, y, wave);
    this.col = '#0088FF';
    this.sz  = 40;
    this.hp  = 260 + wave * 38;
    this.maxHp = this.hp;
    this.attackCooldown = 3;
    this.attackTimer    = 2;
    this._submerged    = false;
    this._submergeTimer = 0;
    this._emergeX      = x;
    this._emergeY      = y;
    this._emergeTimer  = 0;
    this._segments     = Array.from({ length: 6 }, (_, i) => ({ x, y, delay: i * 0.12 }));
    this._segHistory   = [{ x, y }];
    this._al = 1;
  }

  _move(dt, player) {
    if (this._submerged) {
      // Move invisibly toward emerge point
      this._submergeTimer -= dt;
      this._al = 0;
      if (this._submergeTimer <= 0) {
        this._submerged = false;
        this.x = this._emergeX; this.y = this._emergeY;
        this._al = 1;
      }
      return;
    }
    this._al = 1;
    this._orbitPlayer(dt, player, 260, 100);
    // Trail history for segments
    this._segHistory.unshift({ x: this.x, y: this.y });
    if (this._segHistory.length > 60) this._segHistory.pop();
  }

  _attack(dt, player, projectiles) {
    if (this._submerged) return;
    this.attackTimer -= dt;
    if (this.attackTimer > 0) return;
    this.attackTimer = this.enraged ? 1.8 : this.attackCooldown;

    if (Math.random() < 0.45) {
      // Submerge + emerge at player position
      this._submerged = true;
      this._submergeTimer = 1.4;
      const jitter = 80;
      this._emergeX = player.px + (Math.random() - 0.5) * jitter;
      this._emergeY = player.py + (Math.random() - 0.5) * jitter;
    } else {
      // Spiral burst
      const count = this.enraged ? 20 : 12;
      this._fireRadial(count, projectiles, 145, 6, this.col, this.angle);
      if (this.enraged) {
        this._fireRadial(count, projectiles, 195, 5, '#00FFFF', this.angle + Math.PI / count);
      }
    }
  }

  render(ctx, camX, camY, DPR) {
    if (this._submerged) return;
    // Draw segment trail
    ctx.save();
    this._segments.forEach((seg, i) => {
      const histIdx = Math.min(Math.floor(i * 8), this._segHistory.length - 1);
      const hist = this._segHistory[histIdx] || { x: this.x, y: this.y };
      const sx2 = (hist.x - camX) * DPR;
      const sy2 = (hist.y - camY) * DPR;
      const segR = (this.sz - i * 3) * DPR * 0.55;
      if (segR <= 0) return;
      const alpha = 1 - i * 0.14;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = this.col + (i === 0 ? '' : '88');
      ctx.shadowBlur = 18; ctx.shadowColor = this.col;
      ctx.beginPath(); ctx.arc(sx2, sy2, Math.max(segR, 4), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.restore();
    // Main head via base render
    super.render(ctx, camX, camY, DPR);
    // Eye glow
    const sx = (this.x - camX) * DPR, sy = (this.y - camY) * DPR;
    ctx.save();
    ctx.fillStyle = '#FFFFFF'; ctx.shadowBlur = 16; ctx.shadowColor = '#00FFFF';
    ctx.beginPath(); ctx.arc(sx + 6 * DPR, sy - 4 * DPR, 4 * DPR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx - 6 * DPR, sy - 4 * DPR, 4 * DPR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
