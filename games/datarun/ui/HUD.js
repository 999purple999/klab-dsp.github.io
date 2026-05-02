import { Storage } from '../data/Storage.js';

export class HUD {
  constructor() {
    this._coinCount = Storage.get('dr_total_coins', 0);
  }

  setCoins(n) {
    this._coinCount = n;
  }

  draw(ctx, dpr, W, H, score, coins, powerup, powerupTimer, powerupMaxTimer, progression, gravDir, t, dailyChallenge) {
    const lW = W;
    const lH = H;

    ctx.save();

    // Score (top center)
    const fs = Math.max(20, Math.min(lW * 0.072, 52)) * dpr;
    ctx.font = `800 ${fs}px "JetBrains Mono","Courier New",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur = 30 * dpr;
    ctx.shadowColor = '#a855f7';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(String(score), lW * 0.5 * dpr, 18 * dpr);
    ctx.shadowBlur = 0;

    // Coin counter (top left)
    const cf = Math.max(12, Math.min(lW * 0.032, 18)) * dpr;
    ctx.font = `bold ${cf}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    // Coin icon circle
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowColor = '#FFD700';
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(22 * dpr, 28 * dpr, 8 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(212,223,244,0.9)';
    ctx.fillText(`${coins}`, 36 * dpr, 22 * dpr);

    // Powerup timer bar
    if (powerup && powerupTimer > 0 && powerupMaxTimer > 0) {
      const barW = 120 * dpr;
      const barH = 8 * dpr;
      const bx = (lW * 0.5 - 60) * dpr;
      const by = (fs / dpr + 24) * dpr;

      const colors = { SHIELD: '#3b82f6', SLOW: '#EAB308', MAGNET: '#F97316', INVINCIBLE: '#ffffff' };
      const c = colors[powerup] || '#a855f7';
      const frac = powerupTimer / powerupMaxTimer;

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = c;
      ctx.shadowBlur = 8 * dpr;
      ctx.shadowColor = c;
      ctx.fillRect(bx, by, barW * frac, barH);
      ctx.shadowBlur = 0;

      ctx.font = `bold ${9 * dpr}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(powerup, (lW * 0.5) * dpr, by + barH * 0.5);
    }

    // XP bar (bottom)
    if (progression) {
      const xpFrac = progression.getXPProgress();
      const barW = Math.min(lW * 0.4, 200) * dpr;
      const barH = 6 * dpr;
      const bx = (lW * 0.5 - barW / (2 * dpr)) * dpr;
      const by = (lH - 30) * dpr;

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#a855f7';
      ctx.shadowBlur = 6 * dpr;
      ctx.shadowColor = '#a855f7';
      ctx.fillRect(bx, by, barW * xpFrac, barH);
      ctx.shadowBlur = 0;

      // Level badge
      const lv = progression.getLevel();
      ctx.font = `bold ${11 * dpr}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(168,85,247,0.8)';
      ctx.fillText(`LV${lv}`, lW * 0.5 * dpr, (lH - 34) * dpr);
    }

    // Daily challenge badge (top right)
    if (dailyChallenge) {
      const tfont = Math.max(9, Math.min(lW * 0.022, 12)) * dpr;
      ctx.font = `bold ${tfont}px monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = dailyChallenge.completed ? '#39FF14' : 'rgba(168,85,247,0.7)';
      ctx.fillText('DAILY', (lW - 14) * dpr, 14 * dpr);
      ctx.font = `${tfont * 0.85}px monospace`;
      ctx.fillStyle = 'rgba(212,223,244,0.5)';
      ctx.fillText(`${dailyChallenge.targetScore}+`, (lW - 14) * dpr, (14 + tfont / dpr + 3) * dpr);
    }

    // Gravity arrow halo (near player, but drawn in player)
    // Signature
    ctx.globalAlpha = 0.25;
    ctx.font = `600 ${11 * dpr}px monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('K-PERCEPTION', (lW - 14) * dpr, (lH - 14) * dpr);
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
