// rendering/Camera.js — Camera with world-space clamping and shake

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.shakeAmt = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this._offX = 0;
    this._offY = 0;
  }

  /** Set world size so camera can clamp */
  setWorld(ww, wh, vw, vh) {
    this.ww = ww; this.wh = wh;
    this.vw = vw; this.vh = vh;
  }

  /** Clamp camera to world bounds */
  clamp() {
    this.x = Math.max(0, Math.min(this.ww - this.vw, this.x));
    this.y = Math.max(0, Math.min(this.wh - this.vh, this.y));
  }

  /** Convert world coord to canvas coord (factoring in DPR and shake) */
  wx(worldX, dpr) { return (worldX - this.x) * dpr + this._offX; }
  wy(worldY, dpr) { return (worldY - this.y) * dpr + this._offY; }

  /** Is world point visible? */
  onScreen(worldX, worldY, margin = 0) {
    return worldX > this.x - margin && worldX < this.x + this.vw + margin &&
           worldY > this.y - margin && worldY < this.y + this.vh + margin;
  }

  shakeDir(srcX, srcY, playerX, playerY, amt) {
    this.shakeAmt = amt;
    this.shakeX = playerX - srcX;
    this.shakeY = playerY - srcY;
  }

  update(dt) {
    if (this.shakeAmt > 0.4) {
      this._offX = (Math.random() - 0.5) * this.shakeAmt * 2;
      this._offY = (Math.random() - 0.5) * this.shakeAmt * 2;
    } else {
      this._offX = 0; this._offY = 0;
    }
    this.shakeAmt = Math.max(0, this.shakeAmt - this.shakeAmt * 5.5 * dt - 0.05);
  }
}
