// ─── Modal ────────────────────────────────────────────────────────────────────
// Reusable overlay modal with dark glass-morphism styling matching the game UI.

export class Modal {
  /**
   * @param {string} title
   * @param {{onClose?: function}} options
   */
  constructor(title, options = {}) {
    this.title   = title;
    this.visible = false;
    this.onClose = options.onClose || null;
    this.el      = null;
  }

  // ── DOM construction ─────────────────────────────────────────────────────────

  /**
   * Create the DOM element and append it to <body>.
   * Call this once before show/hide.
   * @param {string} innerHTML - initial HTML for the modal body
   * @returns {this}
   */
  create(innerHTML) {
    // Outer overlay (backdrop)
    this.el = document.createElement('div');
    this.el.style.cssText =
      'position:fixed;inset:0;z-index:60;display:none;' +
      'align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);' +
      '-webkit-backdrop-filter:blur(8px)';

    // Inner card
    this.el.innerHTML =
      `<div style="background:linear-gradient(160deg,#0d0022,#050508);` +
      `border:1px solid rgba(191,0,255,0.35);border-radius:16px;` +
      `padding:28px;max-width:500px;width:90%;` +
      `box-shadow:0 0 60px rgba(191,0,255,0.15)">` +

        // Title bar
        `<div style="font-family:'JetBrains Mono',monospace;font-size:15px;` +
        `font-weight:900;color:#BF00FF;letter-spacing:.14em;` +
        `text-align:center;margin-bottom:18px;text-transform:uppercase">` +
        `${this.title}</div>` +

        // Body
        `<div class="modal-body" style="font-family:'JetBrains Mono',monospace;` +
        `font-size:13px;color:#ccc;line-height:1.6">` +
        `${innerHTML}</div>` +

      `</div>`;

    // Close on backdrop click
    this.el.addEventListener('click', e => {
      if (e.target === this.el) this.hide();
    });

    document.body.appendChild(this.el);
    return this;
  }

  // ── Visibility ────────────────────────────────────────────────────────────────

  show() {
    if (this.el) {
      this.el.style.display = 'flex';
      this.visible = true;
    }
  }

  hide() {
    if (this.el) {
      this.el.style.display = 'none';
      this.visible = false;
      if (this.onClose) this.onClose();
    }
  }

  // ── Content updates ───────────────────────────────────────────────────────────

  /** Replace the modal body HTML without re-creating the element. */
  updateBody(innerHTML) {
    if (this.el) {
      const body = this.el.querySelector('.modal-body');
      if (body) body.innerHTML = innerHTML;
    }
  }

  /** Update the modal title text. */
  updateTitle(title) {
    this.title = title;
    if (this.el) {
      const titleEl = this.el.querySelector('[data-modal-title]');
      if (titleEl) titleEl.textContent = title;
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────

  destroy() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
    this.visible = false;
  }
}
