// ui/Minimap.js — Canvas-based minimap

export class Minimap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.MW = 120; this.MH = 84;
    if (this.canvas) {
      this.canvas.width = this.MW;
      this.canvas.height = this.MH;
    }
  }

  render(gameState) {
    const { ctx } = this;
    if (!ctx) return;
    const { enemies, boss, player, projManager, obstacleManager, camera, mapName, skinIdx, SKINS } = gameState;
    const { ww, wh } = camera;
    const MW = this.MW, MH = this.MH;
    const sx = MW / ww, sy = MH / wh;

    ctx.clearRect(0, 0, MW, MH);
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, MW, MH);

    // Obstacles
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (const o of obstacleManager.list)
      ctx.fillRect(o.x * sx, o.y * sy, o.w * sx, o.h * sy);

    // Enemy projectiles
    ctx.fillStyle = 'rgba(255,100,100,0.5)';
    for (const p of projManager.list)
      ctx.fillRect(p.x * sx - 1, p.y * sy - 1, 2, 2);

    // Enemies
    for (const e of enemies) {
      ctx.fillStyle = e.col;
      ctx.fillRect(e.x * sx - 1.5, e.y * sy - 1.5, 3, 3);
    }

    // Boss
    if (boss) {
      ctx.shadowBlur = 8; ctx.shadowColor = boss.col || '#FF0000';
      ctx.fillStyle = boss.col || '#FF0000';
      ctx.beginPath(); ctx.arc(boss.x * sx, boss.y * sy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Player
    const skin = SKINS[skinIdx];
    ctx.shadowBlur = 6; ctx.shadowColor = skin;
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(player.x * sx, player.y * sy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Viewport rect
    ctx.strokeStyle = 'rgba(191,0,255,0.6)'; ctx.lineWidth = 1;
    ctx.strokeRect(camera.x * sx, camera.y * sy, camera.vw * sx, camera.vh * sy);

    // Map label
    ctx.fillStyle = 'rgba(191,0,255,0.4)';
    ctx.font = '7px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(mapName || '', 2, MH - 2);
  }
}
