// ─── Player ───────────────────────────────────────────────────────────────────
// Wave 0: player state is owned by GameScene.
// This file is a stub; it will be populated in Wave 1+ refactors.

export const SKINS = ['#BF00FF', '#00FFFF', '#FF2266', '#00FF41', '#FF8800'];

/** Returns an initial player state object. */
export function createPlayer() {
  return {
    px: 0, py: 0,
    hp: 3, maxHp: 3,
    speed: 260,
    dashTimer: 0, dashVX: 0, dashVY: 0, dashTrail: [],
    ghostActive: false, ghostTimer: 0, invincible: 0,
    overclockActive: false, overclockTimer: 0,
    empShieldActive: false, empShieldTimer: 0,
    timeWarpActive:  false, timeWarpTimer:  0,
    abCDs: { bomb: 0, kp: 0, dash: 0, overclock: 0, empshield: 0, timewarp: 0 },
    abilityCDMult:     1,
    ghostBonusTime:    0,
    comboDecayMult:    1,
    chainExtraTargets: 0,
    skinIdx: 0,
    skins:   SKINS,
  };
}
