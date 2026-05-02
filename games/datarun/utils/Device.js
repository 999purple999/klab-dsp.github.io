const DeviceObj = {
  isMobile: false,
  dpr: 1,
  isLowEnd: false,
  _fpsFrames: 0,
  _fpsTotal: 0,
  _fpsLast: 0,
  _fpsChecked: false,

  init() {
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  },

  recordFrame(now) {
    if (this._fpsChecked) return;
    if (this._fpsLast > 0) {
      const delta = now - this._fpsLast;
      if (delta > 0) {
        this._fpsTotal += 1000 / delta;
        this._fpsFrames++;
      }
    }
    this._fpsLast = now;
    if (this._fpsFrames >= 60) {
      const avgFps = this._fpsTotal / this._fpsFrames;
      if (avgFps < 45) {
        this.isLowEnd = true;
        this.dpr = 1;
      }
      this._fpsChecked = true;
    }
  }
};

DeviceObj.init();
export const Device = DeviceObj;
