// ─── Device ───────────────────────────────────────────────────────────────────
// Runtime device capability detection and quality settings.
// Automatically downgrades rendering quality when FPS is low.

export const Device = {
  isMobile:  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
  isLowEnd:  false,
  dpr:       Math.min(window.devicePixelRatio || 1, 2),
  quality:   'high',       // 'low' | 'medium' | 'high'

  particleMultiplier: 1.0, // scale applied to all particle counts
  glowEnabled:        true,
  shadowsEnabled:     true,

  // ── Detection ────────────────────────────────────────────────────────────────

  detect() {
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.dpr      = Math.min(window.devicePixelRatio || 1, 2);

    if (this.isMobile && window.innerWidth < 768) {
      this.quality           = 'medium';
      this.particleMultiplier = 0.5;
    }

    // Very old/slow devices: DPR below 1.5 on mobile usually indicates a
    // budget device that cannot handle full-quality rendering.
    if (this.isMobile && this.dpr < 1.5) {
      this.quality            = 'low';
      this.particleMultiplier = 0.3;
      this.glowEnabled        = false;
    }

    return this;
  },

  // ── Quality presets ──────────────────────────────────────────────────────────

  setQuality(q) {
    this.quality            = q;
    this.particleMultiplier = q === 'low' ? 0.3 : q === 'medium' ? 0.6 : 1.0;
    this.glowEnabled        = q !== 'low';
    this.shadowsEnabled     = q === 'high';
    this.isLowEnd           = q !== 'high';
  },

  // ── FPS monitor ──────────────────────────────────────────────────────────────
  // Collect 3 seconds of samples; if average is below threshold, downgrade.

  fpsFrames: [],

  checkFPS(fps) {
    this.fpsFrames.push(fps);

    if (this.fpsFrames.length > 180) { // ~3 seconds at 60 fps
      const avg = this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length;

      if (avg < 45 && this.quality === 'high') {
        this.setQuality('medium');
        console.info('[Device] Auto-downgrade → medium (avg fps:', avg.toFixed(1), ')');
      } else if (avg < 30 && this.quality === 'medium') {
        this.setQuality('low');
        console.info('[Device] Auto-downgrade → low (avg fps:', avg.toFixed(1), ')');
      }

      this.fpsFrames = [];
    }
  },
};

// Run detection immediately on import
Device.detect();
