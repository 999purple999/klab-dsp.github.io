// rendering/Renderer.js — Canvas setup and world-render helpers

export class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.dpr = 1;
    this.W = 0; this.H = 0;
    this.lW = 0; this.lH = 0;
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.lW = window.innerWidth;
    this.lH = window.innerHeight;
    this.W = this.canvas.width = this.lW * this.dpr;
    this.H = this.canvas.height = this.lH * this.dpr;
    this.canvas.style.width = this.lW + 'px';
    this.canvas.style.height = this.lH + 'px';
  }

  clear(bg) {
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.W, this.H);
  }

  /** Draw the scrolling grid */
  drawGrid(camX, camY, gridSize, strokeStyle) {
    const { ctx, W, H, dpr } = this;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    const gs = gridSize * dpr;
    const offX = ((-camX * dpr) % gs + gs) % gs;
    const offY = ((-camY * dpr) % gs + gs) % gs;
    ctx.beginPath();
    for (let x = offX; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = offY; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }
}
