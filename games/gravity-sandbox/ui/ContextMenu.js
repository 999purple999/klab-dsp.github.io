import { NEON_COLORS } from '../entities/Box.js';
import { EventBus } from '../utils/EventBus.js';

export class ContextMenu {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'context-menu hidden';
    container.appendChild(this.el);
    this.box = null;

    document.addEventListener('click', (e) => {
      if (!this.el.contains(e.target)) this.hide();
    });
    document.addEventListener('touchstart', (e) => {
      if (!this.el.contains(e.target)) this.hide();
    }, { passive: true });
  }

  show(box, x, y) {
    this.box = box;
    this.el.className = 'context-menu';
    this.el.innerHTML = '';

    const items = [
      { label: 'Rename', icon: '✎', action: () => this._rename() },
      { label: 'Change Color', icon: '◈', action: () => this._changeColor() },
      { label: box.locked ? 'Unlock' : 'Lock', icon: box.locked ? '🔓' : '🔒', action: () => this._toggleLock() },
      { label: 'Duplicate', icon: '⧉', action: () => this._duplicate() },
      { label: 'Delete', icon: '✕', action: () => this._delete() },
    ];

    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'ctx-item';
      btn.innerHTML = `<span class="ctx-icon">${item.icon}</span>${item.label}`;
      btn.addEventListener('click', () => { item.action(); this.hide(); });
      this.el.appendChild(btn);
    }

    // Position safely within viewport
    const vw = window.innerWidth, vh = window.innerHeight;
    const pw = 160, ph = items.length * 40;
    const cx = Math.min(x, vw - pw - 8);
    const cy = Math.min(y, vh - ph - 8);
    this.el.style.left = cx + 'px';
    this.el.style.top = cy + 'px';
  }

  hide() {
    this.el.className = 'context-menu hidden';
    this.box = null;
  }

  _rename() {
    if (!this.box) return;
    const name = prompt('Rename box:', this.box.label);
    if (name && name.trim()) {
      this.box.label = name.trim().toUpperCase().slice(0, 10);
      EventBus.emit('box:renamed', this.box);
    }
  }

  _changeColor() {
    if (!this.box) return;
    this.box.setColor((this.box.colorIndex + 1) % NEON_COLORS.length);
    EventBus.emit('box:colorChanged', this.box);
  }

  _toggleLock() {
    if (!this.box) return;
    this.box.locked = !this.box.locked;
    EventBus.emit('box:lockToggled', this.box);
  }

  _duplicate() {
    if (!this.box) return;
    EventBus.emit('box:duplicate', this.box);
  }

  _delete() {
    if (!this.box) return;
    EventBus.emit('box:delete', this.box);
  }
}
