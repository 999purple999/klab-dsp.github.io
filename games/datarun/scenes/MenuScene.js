import { EventBus } from '../utils/EventBus.js';
import { Device } from '../utils/Device.js';

export class MenuScene {
  constructor(game) {
    this._game = game;
    this._t = 0;
    this._particles = [];
    this._tapHandler = null;
    this._initParticles();
  }

  _initParticles() {
    const W = this._game.W;
    const H = this._game.H;
    for (let i = 0; i < 60; i++) {
      this._particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.5,
        r: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.5,
        color: Math.random() < 0.5 ? '#a855f7' : '#00FFFF'
      });
    }
  }

  enter() {
    this._tapHandler = (data) => this._onTap(data);
    EventBus.on('tap', this._tapHandler);
  }

  exit() {
    if (this._tapHandler) {
      EventBus.off('tap', this._tapHandler);
      this._tapHandler = null;
    }
  }

  _onTap(data) {
    const W = this._game.W;
    const H = this._game.H;
    const x = data.x;
    const y = data.y;

    this._game.audioManager.initOnInteraction();

    // PLAY button area
    const playBtnX = W * 0.5;
    const playBtnY = H * 0.58;
    const playBtnW = Math.min(W * 0.4, 200);
    const playBtnH = 52;
    if (Math.abs(x - playBtnX) < playBtnW / 2 && Math.abs(y - playBtnY) < playBtnH / 2) {
      this._game.startGame();
      return;
    }

    // ZEN button area
    const zenBtnX = W * 0.5;
    const zenBtnY = H * 0.68;
    const zenBtnW = Math.min(W * 0.3, 160);
    const zenBtnH = 44;
    if (Math.abs(x - zenBtnX) < zenBtnW / 2 && Math.abs(y - zenBtnY) < zenBtnH / 2) {
      this._game.startZen();
      return;
    }

    // Fullscreen button (top right)
    if (x > W - 60 && y < 60) {
      this._toggleFullscreen();
      return;
    }

    // Tap anywhere else = start game
    this._game.startGame();
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  update(dt) {
    this._t += dt;
    const W = this._game.W;
    const H = this._game.H;

    for (const p of this._particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    }
  }

  render(ctx) {
    const game = this._game;
    const dpr = Device.dpr;
    const W = game.W;
    const H = game.H;
    const t = this._t;

    // Background
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, W * dpr, H * dpr);

    // Animated particles
    for (const p of this._particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6 * dpr;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Pulse glow bg
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
    const g = ctx.createRadialGradient(W * dpr / 2, H * dpr * 0.4, 0, W * dpr / 2, H * dpr * 0.4, Math.max(W, H) * dpr * 0.55);
    g.addColorStop(0, `rgba(80,0,160,${0.25 * pulse})`);
    g.addColorStop(1, 'rgba(5,6,13,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W * dpr, H * dpr);

    // Title
    const titleFs = Math.max(32, Math.min(W * 0.11, 78)) * dpr;
    ctx.save();
    ctx.font = `800 ${titleFs}px "JetBrains Mono","Courier New",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 60 * dpr;
    ctx.shadowColor = '#a855f7';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('DATARUN', W * dpr / 2, H * dpr * 0.3);
    ctx.shadowBlur = 0;

    // Subtitle
    const subFs = Math.max(10, Math.min(W * 0.028, 16)) * dpr;
    ctx.font = `600 ${subFs}px "JetBrains Mono",monospace`;
    ctx.fillStyle = 'rgba(212,223,244,0.5)';
    ctx.fillText('K-PERCEPTION', W * dpr / 2, H * dpr * 0.38);
    ctx.restore();

    // PLAY button
    const playBtnW = Math.min(W * 0.4, 200);
    const playBtnH = 52;
    const playBtnX = W * 0.5 - playBtnW / 2;
    const playBtnY = H * 0.58 - playBtnH / 2;
    ctx.save();
    ctx.shadowBlur = 24 * dpr;
    ctx.shadowColor = '#a855f7';
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(playBtnX * dpr, playBtnY * dpr, playBtnW * dpr, playBtnH * dpr);
    ctx.shadowBlur = 0;
    ctx.font = `800 ${Math.max(14, Math.min(W * 0.042, 22)) * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('PLAY', W * dpr / 2, H * dpr * 0.58);
    ctx.restore();

    // ZEN button
    const zenBtnW = Math.min(W * 0.3, 160);
    const zenBtnH = 44;
    const zenBtnX = W * 0.5 - zenBtnW / 2;
    const zenBtnY = H * 0.68 - zenBtnH / 2;
    ctx.save();
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2 * dpr;
    ctx.shadowBlur = 12 * dpr;
    ctx.shadowColor = '#00FFFF';
    ctx.strokeRect(zenBtnX * dpr, zenBtnY * dpr, zenBtnW * dpr, zenBtnH * dpr);
    ctx.shadowBlur = 0;
    ctx.font = `700 ${Math.max(12, Math.min(W * 0.035, 18)) * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00FFFF';
    ctx.fillText('ZEN MODE', W * dpr / 2, H * dpr * 0.68);
    ctx.restore();

    // Blink prompt
    const blink = Math.sin(t * 3.5) > 0;
    if (blink) {
      const bfs = Math.max(10, Math.min(W * 0.028, 15)) * dpr;
      ctx.save();
      ctx.font = `600 ${bfs}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(212,223,244,0.4)';
      ctx.fillText('TAP ANYWHERE TO START', W * dpr / 2, H * dpr * 0.49);
      ctx.restore();
    }

    // Leaderboard top 3
    const top5 = game.leaderboard.getTop5();
    if (top5.length > 0) {
      const lbX = W * 0.5;
      const lbY = H * 0.79;
      const lbfs = Math.max(9, Math.min(W * 0.025, 13)) * dpr;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = `bold ${lbfs}px monospace`;
      ctx.fillStyle = 'rgba(168,85,247,0.6)';
      ctx.fillText('TOP RUNS', lbX * dpr, lbY * dpr);
      for (let i = 0; i < Math.min(3, top5.length); i++) {
        const e = top5[i];
        ctx.font = `${i === 0 ? 'bold ' : ''}${lbfs * 0.9}px monospace`;
        ctx.fillStyle = i === 0 ? '#FFD700' : 'rgba(212,223,244,0.55)';
        ctx.fillText(`#${i+1}  ${e.score}pts`, lbX * dpr, (lbY + 16 + i * 15) * dpr);
      }
      ctx.restore();
    }

    // Fullscreen button (top right)
    ctx.save();
    ctx.strokeStyle = 'rgba(168,85,247,0.5)';
    ctx.lineWidth = 2 * dpr;
    const fsBtnX = (W - 44) * dpr;
    const fsBtnY = 14 * dpr;
    const fsBtnS = 28 * dpr;
    ctx.strokeRect(fsBtnX, fsBtnY, fsBtnS, fsBtnS);
    ctx.fillStyle = 'rgba(168,85,247,0.5)';
    ctx.font = `${12 * dpr}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛶', fsBtnX + fsBtnS / 2, fsBtnY + fsBtnS / 2);
    ctx.restore();
  }
}
