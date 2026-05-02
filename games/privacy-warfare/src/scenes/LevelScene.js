// ─── LevelScene ───────────────────────────────────────────────────────────────
// Wrapper that sets up a GameScene for a specific campaign zone+level.

export class LevelScene {
  /**
   * @param {HTMLCanvasElement} cv
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} mmCv
   * @param {CanvasRenderingContext2D} mctx
   * @param {GameScene} gameScene
   * @param {number} zone   - 0-indexed zone (0-19)
   * @param {number} level  - 0-indexed level within zone (0-9)
   */
  constructor(cv, ctx, mmCv, mctx, gameScene, zone, level) {
    this.cv        = cv;
    this.ctx       = ctx;
    this.mmCv      = mmCv;
    this.mctx      = mctx;
    this.gameScene = gameScene;
    this.zone      = zone;
    this.level     = level;
  }

  enter() {
    // Map zone+level to a wave number (zones are 10 levels each)
    const waveNum  = this.zone * 10 + this.level + 1;

    // Configure the GameScene
    this.gameScene.wave = waveNum;

    // Start the game at the computed wave
    this.gameScene.startGame();

    // Advance directly to the target wave by overriding the starting wave
    // (startGame resets to wave 1 and calls _startWave(1); we patch it to go
    //  directly to waveNum after the reset)
    // If the GameScene exposes a direct wave-start entry point use it:
    if (typeof this.gameScene._startWave === 'function') {
      // Reset was already called; now jump to the correct wave
      this.gameScene._startWave(waveNum);
    }
  }

  update(dt) {
    this.gameScene.update(dt);
  }

  exit() {
    // Nothing extra needed; GameScene handles its own cleanup
  }
}
