// ─── Button ───────────────────────────────────────────────────────────────────
// Styled game button with hover and disabled states.

export class Button {
  /**
   * @param {string}   label    - Button text
   * @param {function} onClick  - Click handler
   * @param {{pad?: string, size?: string}} options
   */
  constructor(label, onClick, options = {}) {
    this.el = document.createElement('button');
    this.el.textContent = label;
    this.el.style.cssText =
      `padding:${options.pad || '12px 32px'};` +
      `background:linear-gradient(135deg,#BF00FF,#7c3aed);` +
      `color:#fff;font-weight:800;font-size:${options.size || '14px'};` +
      `letter-spacing:.12em;text-transform:uppercase;` +
      `border:none;cursor:pointer;border-radius:8px;` +
      `box-shadow:0 0 30px rgba(191,0,255,0.5);` +
      `transition:all .15s;font-family:'JetBrains Mono',monospace`;

    this.el.addEventListener('click', onClick);

    this.el.addEventListener('mouseenter', () => {
      if (!this.el.disabled) this.el.style.transform = 'translateY(-2px)';
    });
    this.el.addEventListener('mouseleave', () => {
      this.el.style.transform = '';
    });
  }

  // ── Placement ────────────────────────────────────────────────────────────────

  /** Append this button to a parent DOM element. */
  appendTo(parent) {
    parent.appendChild(this.el);
    return this;
  }

  // ── State mutators ────────────────────────────────────────────────────────────

  setText(t) {
    this.el.textContent = t;
    return this;
  }

  setEnabled(v) {
    this.el.disabled     = !v;
    this.el.style.opacity = v ? '1' : '0.4';
    this.el.style.cursor  = v ? 'pointer' : 'not-allowed';
    return this;
  }

  /** Change the button label colour. */
  setColor(col) {
    this.el.style.background = `linear-gradient(135deg,${col},${col}99)`;
    this.el.style.boxShadow  = `0 0 30px ${col}80`;
    return this;
  }

  remove() {
    this.el.remove();
  }
}
