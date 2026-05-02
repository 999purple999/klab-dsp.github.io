// ─── CampaignScene ────────────────────────────────────────────────────────────
// Campaign map scene. 20 zones × 10 levels each. Arrow-key nav, Enter to launch.

import { CampaignSave }  from '../data/CampaignSave.js';
import { CampaignMapUI } from '../ui/CampaignMapUI.js';

// Zone metadata
const ZONE_DATA = [
  { name: 'FIREWALL'  }, { name: 'PHISH NET'  }, { name: 'DARKWEB'   }, { name: 'BOTNET'    }, { name: 'RANSOMWARE' },
  { name: 'SPYWARE'   }, { name: 'TROJANS'    }, { name: 'ROOTKIT'   }, { name: 'CRYPTOVAULT'}, { name: 'ZERO-DAY'  },
  { name: 'DDOS CORE' }, { name: 'MITM NODE'  }, { name: 'EXFILTRAT' }, { name: 'DEEPFAKE'  }, { name: 'AI THREAT' },
  { name: 'SHADOWNET' }, { name: 'QUANTUM ERR'}, { name: 'VOID SHARD'}, { name: 'SYS ADMIN' }, { name: 'NEXUS'     },
];

export class CampaignScene {
  constructor(cv, ctx, gameScene) {
    this.cv        = cv;
    this.ctx       = ctx;
    this.gameScene = gameScene;

    this.selectedZone  = 0;
    this.selectedLevel = 0;
    this.save          = new CampaignSave();

    this._ui           = new CampaignMapUI(cv, ctx);
    this._inputBound   = (e) => this._handleInput(e);

    // Transition animation state
    this._flash        = 0;
  }

  enter() {
    document.addEventListener('keydown', this._inputBound);
    this.save._load(); // refresh from localStorage
    this._flash = 0;
  }

  exit() {
    document.removeEventListener('keydown', this._inputBound);
  }

  update(dt) {
    if (this._flash > 0) this._flash = Math.max(0, this._flash - dt * 4);
    this.render();
  }

  render() {
    this._ui.render(ZONE_DATA, this.selectedZone, this.selectedLevel, this.save);

    // Flash overlay for zone select feedback
    if (this._flash > 0.01) {
      const ctx = this.ctx;
      ctx.fillStyle = `rgba(191,0,255,${this._flash * 0.25})`;
      ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    }
  }

  _handleInput(e) {
    const COLS = 5;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (this.selectedZone % COLS < COLS - 1) this.selectedZone++;
        this.selectedLevel = 0;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (this.selectedZone % COLS > 0) this.selectedZone--;
        this.selectedLevel = 0;
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (this.selectedZone + COLS < 20) {
          this.selectedZone += COLS;
        } else {
          // Navigate within level list
          if (this.selectedLevel < 9) this.selectedLevel++;
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.selectedZone >= COLS) {
          this.selectedZone -= COLS;
        } else {
          if (this.selectedLevel > 0) this.selectedLevel--;
        }
        break;
      case 'Tab':
        e.preventDefault();
        // Cycle levels within selected zone
        if (this.save.isZoneUnlocked(this.selectedZone)) {
          this.selectedLevel = (this.selectedLevel + 1) % 10;
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._launchSelected();
        break;
      case 'Escape':
        // No parent menu in this implementation; could hook up later
        break;
      default:
        break;
    }
  }

  _launchSelected() {
    const z = this.selectedZone;
    const l = this.selectedLevel;
    if (!this.save.isZoneUnlocked(z)) {
      // Flash error
      this._flash = 0.8;
      return;
    }
    this._flash = 1;

    // Configure and start the game scene for this zone+level
    const waveNum = z * 10 + l + 1;
    this.gameScene.wave = waveNum;

    // Hook into game over to record completion
    const originalGameOver = this.gameScene.gameOver.bind(this.gameScene);
    this.gameScene.gameOver = () => {
      originalGameOver();
      // Restore
      this.gameScene.gameOver = originalGameOver;
    };

    const originalKillBoss = this.gameScene._killBoss.bind(this.gameScene);
    this.gameScene._killBoss = () => {
      originalKillBoss();
      // Stars based on remaining HP
      const hpPct = this.gameScene.hp / this.gameScene.maxHp;
      const stars = hpPct > 0.66 ? 3 : hpPct > 0.33 ? 2 : 1;
      this.save.completeLevel(z, l, stars);
      this.gameScene._killBoss = originalKillBoss;
    };

    this.gameScene.startGame();
  }
}
