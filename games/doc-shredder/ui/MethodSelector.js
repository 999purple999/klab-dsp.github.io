export const METHODS = ['SHRED', 'BURN', 'DISSOLVE', 'IMPLODE'];

const METHOD_DESC = {
  SHRED:   'Drag to slice strips — they fly off',
  BURN:    'Hold to ignite sections with fire',
  DISSOLVE:'Drag to apply acid — green dissolve',
  IMPLODE: 'Tap once — all pixels implode then explode',
};

const METHOD_COLORS = {
  SHRED:   '#a855f7',
  BURN:    '#FF8C00',
  DISSOLVE:'#39FF14',
  IMPLODE: '#00FFFF',
};

export class MethodSelector {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
    this.selected = 'SHRED';
    this._previewAnims = [];
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="method-title">SELECT DESTRUCTION METHOD</div>
      <div class="method-cards" id="method-cards"></div>
    `;
    const cards = document.getElementById('method-cards');
    for (const method of METHODS) {
      const card = document.createElement('div');
      card.className = `method-card ${method === this.selected ? 'selected' : ''}`;
      card.dataset.method = method;
      const col = METHOD_COLORS[method];

      card.innerHTML = `
        <canvas class="method-preview" width="80" height="60" data-method="${method}"></canvas>
        <div class="method-name" style="color:${col}">${method}</div>
        <div class="method-desc">${METHOD_DESC[method]}</div>
      `;
      card.addEventListener('click', () => {
        this.selected = method;
        document.querySelectorAll('.method-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (this.onSelect) this.onSelect(method);
      });
      cards.appendChild(card);

      // Draw preview animation
      const previewCanvas = card.querySelector('.method-preview');
      this._startPreview(previewCanvas, method, col);
    }
  }

  _startPreview(canvas, method, color) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    let frame = 0;
    let rafId = null;

    const draw = () => {
      ctx.fillStyle = '#0d0f1a';
      ctx.fillRect(0, 0, W, H);

      // Small document rect
      const dw = W * 0.65, dh = H * 0.8;
      const dx = (W - dw) / 2, dy = (H - dh) / 2;

      ctx.fillStyle = '#161b22';
      ctx.fillRect(dx, dy, dw, dh);

      // Draw fake lines
      for (let i = 0; i < 6; i++) {
        const lx = dx + 4, lw2 = dw * (0.4 + Math.random() * 0.45);
        const ly = dy + 8 + i * ((dh - 10) / 6);
        ctx.fillStyle = i === 2 ? '#FF5555' : 'rgba(120,140,180,0.4)';
        ctx.fillRect(lx, ly, lw2, 2);
      }

      frame++;

      if (method === 'SHRED') {
        // Strips flying off
        const t = (frame % 60) / 60;
        const stripsOff = Math.floor(t * 8);
        for (let i = 0; i < 8; i++) {
          const sy = dy + i * (dh / 8);
          const sh = dh / 8;
          if (i < stripsOff) {
            const xOff = (i % 2 === 0 ? -1 : 1) * t * dw * 0.7 * (stripsOff - i) / stripsOff;
            ctx.globalAlpha = Math.max(0, 1 - Math.abs(xOff) / (dw * 0.7));
            ctx.drawImage(canvas, dx, sy, dw, sh, dx + xOff, sy, dw, sh);
            ctx.globalAlpha = 1;
          }
        }
        // Color spark
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(frame * 0.2);
        ctx.fillRect(dx, dy, dw, 1);
        ctx.globalAlpha = 1;
      } else if (method === 'BURN') {
        // Expanding fire circle
        const r = (Math.sin(frame * 0.07) * 0.5 + 0.5) * dw * 0.35 + 4;
        const cx = dx + dw * 0.5, cy = dy + dh * 0.55;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, 'rgba(255,255,100,0.9)');
        grad.addColorStop(0.4, 'rgba(255,140,0,0.7)');
        grad.addColorStop(0.8, 'rgba(150,50,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      } else if (method === 'DISSOLVE') {
        // Green expanding blobs
        const t2 = (frame % 90) / 90;
        const r = t2 * dw * 0.45;
        const grad = ctx.createRadialGradient(dx + dw * 0.5, dy + dh * 0.5, 0, dx + dw * 0.5, dy + dh * 0.5, r);
        grad.addColorStop(0, 'rgba(0,0,0,0.9)');
        grad.addColorStop(0.7, 'rgba(57,255,20,0.5)');
        grad.addColorStop(1, 'rgba(57,255,20,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(dx + dw * 0.5, dy + dh * 0.5, r, 0, Math.PI * 2); ctx.fill();
      } else if (method === 'IMPLODE') {
        // Pixels flying inward
        const t3 = (frame % 80) / 80;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + frame * 0.05;
          const dist = (1 - t3) * dw * 0.45;
          const px2 = dx + dw * 0.5 + Math.cos(angle) * dist;
          const py2 = dy + dh * 0.5 + Math.sin(angle) * dist;
          ctx.globalAlpha = 0.7 + 0.3 * Math.sin(frame * 0.15 + i);
          ctx.fillStyle = color;
          ctx.fillRect(px2, py2, 2, 2);
        }
        ctx.globalAlpha = 1;
        // Center flash
        if (t3 > 0.8) {
          const flash = (t3 - 0.8) / 0.2;
          ctx.globalAlpha = flash * 0.7;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(dx + dw * 0.5, dy + dh * 0.5, flash * dw * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    this._previewAnims.push(rafId);
  }

  destroy() {
    for (const id of this._previewAnims) cancelAnimationFrame(id);
    this._previewAnims = [];
  }

  getSelected() { return this.selected; }
}
