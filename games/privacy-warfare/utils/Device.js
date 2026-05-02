// utils/Device.js — Device capability wrappers

class Device {
  constructor() {
    this.hapticEnabled = true;
  }

  setHaptic(enabled) {
    this.hapticEnabled = enabled;
  }

  /**
   * Trigger vibration. pattern is ms or array of [vibrate, pause, vibrate, …]
   * Silently ignores if not supported or disabled.
   */
  vibrate(pattern) {
    if (!this.hapticEnabled) return;
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* noop */ }
  }

  // Named patterns
  shoot()  { this.vibrate(10); }
  hit()    { this.vibrate([30, 10, 30]); }
  death()  { this.vibrate([50, 30, 50, 30, 100]); }
  pickup() { this.vibrate(15); }
}

export const device = new Device();
