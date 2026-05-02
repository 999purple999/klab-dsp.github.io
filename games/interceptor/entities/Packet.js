export const PACKET_TYPES = {
  NORMAL:     'NORMAL',
  WORM:       'WORM',
  TROJAN:     'TROJAN',
  RANSOMWARE: 'RANSOMWARE',
  BOSS:       'BOSS',
};

const DATA_LABELS = [
  'PASSWORD', 'EMAIL', 'CC #', 'SSN', 'API KEY',
  'SESSION', 'SSH KEY', 'DB PASS', 'GITHUB', 'STRIPE',
  'HEALTH', 'FACE', 'LOCATION', 'COOKIE', 'SLACK', 'BIOMET.',
  'GPS', 'PASS', 'TOKEN', 'CERT',
];

const PALETTE = {
  NORMAL:     '#FF8C00',
  WORM:       '#FF4422',
  TROJAN:     '#FF88CC',
  RANSOMWARE: '#AA0022',
  BOSS:       '#FFD700',
};

export class Packet {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.r = 26;
    this.hp = 1;
    this.maxHp = 1;
    this.type = PACKET_TYPES.NORMAL;
    this.color = PALETTE.NORMAL;
    this.label = 'DATA';
    this.flash = 0;       // frames of white flash
    this.alive = true;
    this.trail = [];
    this.wormAngle = 0;
    this.wormAmplitude = 0;
    this.wormFreq = 0;
    this.wormBaseY = 0;
    this.trojanSplit = false;
    this.isChild = false;  // spawned from trojan split
    this.shieldAngle = 0;
    this.age = 0;          // seconds alive
    this.hitCount = 0;
    this.scoreValue = 120;
    this._glitchTimer = 0;
  }

  init({ x, y, vx, vy, r, type, wave, canvasH, hudH }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;
    this.type = type;
    this.alive = true;
    this.trail = [];
    this.flash = 0;
    this.wormAngle = 0;
    this.trojanSplit = false;
    this.isChild = false;
    this.age = 0;
    this.hitCount = 0;
    this._glitchTimer = 0;
    this.wormBaseY = y;

    const labelIdx = Math.floor(Math.random() * DATA_LABELS.length);
    this.label = DATA_LABELS[labelIdx];

    switch (type) {
      case PACKET_TYPES.NORMAL:
        this.hp = 1; this.maxHp = 1;
        this.color = PALETTE.NORMAL;
        this.scoreValue = 120;
        break;
      case PACKET_TYPES.WORM:
        this.hp = 1; this.maxHp = 1;
        this.color = PALETTE.WORM;
        this.wormAmplitude = 45 + wave * 3;
        this.wormFreq = 2 + wave * 0.15;
        this.scoreValue = 150;
        break;
      case PACKET_TYPES.TROJAN:
        this.hp = 2; this.maxHp = 2;
        this.color = PALETTE.TROJAN;
        this.scoreValue = 200;
        break;
      case PACKET_TYPES.RANSOMWARE:
        this.hp = 2; this.maxHp = 2;
        this.color = PALETTE.RANSOMWARE;
        this.r = r * 1.3;
        this.scoreValue = 250;
        break;
      case PACKET_TYPES.BOSS:
        this.hp = 8; this.maxHp = 8;
        this.color = PALETTE.BOSS;
        this.r = r * 2.0;
        this.shieldAngle = 0;
        this.scoreValue = 800;
        break;
    }
  }

  takeDamage(amt) {
    amt = amt || 1;
    this.hp -= amt;
    this.flash = 8;
    this.hitCount++;
    this._glitchTimer = this.type === PACKET_TYPES.BOSS ? 12 : 0;
    return this.hp <= 0;
  }

  update(dt, canvasH, hudH, isFrozen, slowFactor) {
    if (!this.alive) return;
    this.age += dt;
    this.shieldAngle += dt * 2.5;

    const speedMul = isFrozen ? 0 : (slowFactor || 1);

    if (this._glitchTimer > 0) this._glitchTimer--;

    if (this.type === PACKET_TYPES.WORM) {
      this.wormAngle += dt * this.wormFreq;
      const targetY = this.wormBaseY + Math.sin(this.wormAngle) * this.wormAmplitude;
      this.y = targetY;
    } else {
      this.y += this.vy * dt * speedMul;
    }

    this.x -= this.vx * dt * speedMul;

    // Bounce Y off boundaries (for non-worm)
    if (this.type !== PACKET_TYPES.WORM) {
      const minY = hudH + this.r + 4;
      const maxY = canvasH - this.r - 4;
      if (this.y < minY) { this.y = minY; this.vy = Math.abs(this.vy); }
      if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy); }
    } else {
      // clamp worm too
      const minY = hudH + this.r + 4;
      const maxY = canvasH - this.r - 4;
      if (this.y < minY) this.wormBaseY += (minY - this.y) + 10;
      if (this.y > maxY) this.wormBaseY -= (this.y - maxY) + 10;
    }

    // Update trail
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.pop();

    if (this.flash > 0) this.flash--;

    // Trojan split check: split when hp drops to 50%
    if (
      this.type === PACKET_TYPES.TROJAN &&
      !this.trojanSplit &&
      this.hp <= Math.ceil(this.maxHp / 2)
    ) {
      this.trojanSplit = true;
      return 'SPLIT';
    }

    return null;
  }

  draw(ctx, dpr, showTypeEarly, canvasW) {
    if (!this.alive) return;

    const px = this.x * dpr;
    const py = this.y * dpr;

    // Perspective scale: packets appear smaller from far right
    const perspScale = (1 - this.x / (canvasW || 800)) * 0.35 + 0.65;
    const drawR = this.r * dpr * perspScale;

    const fl = this.flash > 0;

    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const tp = this.trail[i];
      const tf = 1 - (i + 1) / (this.trail.length + 1);
      ctx.globalAlpha = tf * 0.25;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.arc(tp.x * dpr, tp.y * dpr, drawR * tf * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Boss pulsing outer ring
    if (this.type === PACKET_TYPES.BOSS) {
      const pulse = 0.6 + 0.4 * Math.sin(this.age * 5);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3 * dpr;
      ctx.globalAlpha = pulse * 0.5;
      ctx.shadowBlur = 20 * dpr;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(px, py, drawR * 1.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Shield arc animation
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2 * dpr;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(px, py, drawR * 1.2, this.shieldAngle, this.shieldAngle + Math.PI * 0.8);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // RANSOMWARE red glow
    if (this.type === PACKET_TYPES.RANSOMWARE) {
      ctx.shadowBlur = 30 * dpr;
      ctx.shadowColor = '#FF0000';
    }

    // Main body
    ctx.shadowBlur = fl ? 44 * dpr : 22 * dpr;
    ctx.shadowColor = fl ? '#FFFFFF' : this.color;

    ctx.beginPath();
    ctx.arc(px, py, drawR, 0, Math.PI * 2);

    const grad = ctx.createRadialGradient(px, py, 0, px, py, drawR);
    if (fl) {
      grad.addColorStop(0, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(5,5,8,0.9)');
    } else if (this.type === PACKET_TYPES.RANSOMWARE) {
      grad.addColorStop(0, '#330011');
      grad.addColorStop(0.6, '#AA0022');
      grad.addColorStop(1, 'rgba(5,5,8,0.9)');
    } else {
      grad.addColorStop(0, this.color + '30');
      grad.addColorStop(1, 'rgba(5,5,8,0.95)');
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = fl ? '#FFFFFF' : this.color;
    ctx.lineWidth = 2.5 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label text
    const shouldShowType = showTypeEarly || this.type !== PACKET_TYPES.TROJAN;
    const fs = Math.max(8, Math.min(this.r * 0.44, 14)) * dpr * perspScale;
    ctx.font = `700 ${fs}px "JetBrains Mono","Courier New",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fl ? '#FFFFFF' : this.color;
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowColor = this.color;
    ctx.fillText(this.label, px, py);
    ctx.shadowBlur = 0;

    // Show TROJAN label: always visible with packet_info upgrade, otherwise only after splitting
    if (this.type === PACKET_TYPES.TROJAN && (showTypeEarly || this.trojanSplit || this.hitCount > 0)) {
      const sfs = Math.max(6, this.r * 0.22) * dpr * perspScale;
      ctx.font = `600 ${sfs}px "JetBrains Mono","Courier New",monospace`;
      ctx.fillStyle = 'rgba(255,136,204,0.85)';
      ctx.shadowBlur = 6 * dpr;
      ctx.shadowColor = '#FF88CC';
      ctx.fillText('TROJAN', px, py + fs * 0.9);
      ctx.shadowBlur = 0;
    }

    if (this.type === PACKET_TYPES.RANSOMWARE) {
      const sfs = Math.max(6, this.r * 0.2) * dpr * perspScale;
      ctx.font = `600 ${sfs}px "JetBrains Mono","Courier New",monospace`;
      ctx.fillStyle = 'rgba(255,60,60,0.9)';
      ctx.fillText('×2 DMG', px, py + fs * 0.95);
    }

    // HP bar for boss
    if (this.type === PACKET_TYPES.BOSS && this.maxHp > 1) {
      const bw = drawR * 3.5;
      const bh = 7 * dpr;
      const bx = px - bw / 2;
      const by = py - drawR - 20 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(bx, by, bw, bh);
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = pct > 0.6 ? '#00FF41' : pct > 0.3 ? '#FF8C00' : '#FF2222';
      ctx.fillRect(bx, by, bw * pct, bh);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      // HP text
      ctx.font = `600 ${9 * dpr}px "JetBrains Mono","Courier New",monospace`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${this.hp}/${this.maxHp}`, px, by - 2 * dpr);
      ctx.textBaseline = 'middle';
    }

    // Glitch effect for boss on hit
    if (this._glitchTimer > 0 && this.type === PACKET_TYPES.BOSS) {
      this._drawGlitch(ctx, dpr, px, py, drawR);
    }

    ctx.globalAlpha = 1;
  }

  _drawGlitch(ctx, dpr, px, py, r) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    const bands = 5;
    for (let i = 0; i < bands; i++) {
      const offset = (Math.random() - 0.5) * 12 * dpr;
      const yStart = py - r + (r * 2 * i) / bands;
      const bandH = (r * 2) / bands;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0,255,255,0.3)' : 'rgba(255,0,255,0.3)';
      ctx.fillRect(px - r + offset, yStart, r * 2, bandH);
    }
    ctx.restore();
  }
}
