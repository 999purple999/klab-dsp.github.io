// ui/HUD.js — DOM-based HUD overlay management

import { bus } from '../utils/EventBus.js';

export class HUD {
  constructor() {
    this._elements = {};
    this._msgTO = null;
    this._streakTO = null;
    this._build();
    this._bindSP();
  }

  _q(id) {
    if (!this._elements[id]) this._elements[id] = document.getElementById(id);
    return this._elements[id];
  }

  _build() {
    // All HUD elements exist in index.html; we just reference them.
  }

  _bindSP() {
    bus.on('sp:changed', sp => {
      const el = document.getElementById('sp-hud');
      if (el) el.textContent = 'SP: ' + sp;
    });
  }

  updateScore(score) {
    const el = this._q('score-val');
    if (el) el.textContent = Math.floor(score);
  }

  updateCombo(combo) {
    const el = this._q('combo-val');
    if (!el) return;
    if (combo >= 1.5) {
      el.textContent = 'x' + combo.toFixed(1) + ' COMBO';
      el.style.color = combo >= 5 ? '#FF4400' : combo >= 3 ? '#FF8800' : '#BF00FF';
    } else {
      el.textContent = '';
    }
  }

  updateWave(wave) {
    const el = this._q('wave-txt');
    if (el) el.textContent = 'WAVE ' + wave;
  }

  updateEnemyCount(n) {
    const el = this._q('enemy-count');
    if (el) el.textContent = n + ' THREATS';
  }

  updateWeather(weather) {
    const el = this._q('weather-badge');
    if (el) el.textContent = weather === 'CLEAR' ? '' : weather.replace('_', ' ');
  }

  updateHP(hp, maxHp) {
    const el = this._q('hp-hearts');
    if (!el) return;
    const FILL = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:-2px;margin:0 1px"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z"/></svg>';
    const EMPTY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin:0 1px;opacity:.35"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z"/></svg>';
    let s = '';
    for (let i = 0; i < hp; i++) s += FILL;
    for (let i = hp; i < maxHp; i++) s += EMPTY;
    el.innerHTML = s;
  }

  updateShield(active, pct) {
    const wrap = this._q('shield-bar-wrap');
    const bar = this._q('shield-bar');
    if (!wrap || !bar) return;
    wrap.style.display = active ? 'block' : 'none';
    if (active) bar.style.width = Math.max(0, pct * 100) + '%';
  }

  updateWeapon(weapon, overclockActive) {
    const nameEl = this._q('wpn-name-txt');
    const dot = this._q('wpn-col-dot');
    const cdEl = this._q('wpn-cd');
    if (nameEl) nameEl.textContent = weapon.n;
    if (dot) { dot.style.background = weapon.col; dot.style.boxShadow = '0 0 6px ' + weapon.col; }
    if (cdEl) cdEl.style.background = overclockActive ? '#FFFF00' : weapon.col;
  }

  updateWeaponCD(pct, overclockActive, weaponCol) {
    const cdEl = this._q('wpn-cd');
    if (cdEl) {
      cdEl.style.width = (pct * 100) + '%';
      cdEl.style.background = overclockActive ? '#FFFF00' : weaponCol;
    }
  }

  updateCredits(credits) {
    const el = this._q('credits-hud');
    if (el) el.innerHTML = '&#x2B21; ' + credits;
  }

  updateNukeBar(pct, visible) {
    const wrap = document.getElementById('nuke-charge');
    const bar = document.getElementById('nuke-bar');
    if (wrap) wrap.style.display = visible ? 'block' : 'none';
    if (bar && visible) bar.style.width = (pct * 100) + '%';
  }

  updateAbilities(abCDs, abilityCDMult) {
    const abKeys = ['f','g','x','v','c','z'];
    const abNames = ['bomb','kp','dash','overclock','empshield','timewarp'];
    abKeys.forEach((l, i) => {
      const cdEl = document.getElementById('cd-' + l);
      const slot = document.getElementById('slot-' + l);
      if (!cdEl || !slot) return;
      const t = abCDs[abNames[i]];
      cdEl.textContent = t > 0 ? t.toFixed(1) + 's' : 'READY';
      cdEl.style.color = t > 0 ? 'rgba(255,120,80,0.8)' : 'rgba(0,255,65,0.8)';
      slot.classList.toggle('ready', t <= 0);
    });
  }

  showMsg(title, sub, dur = 2200) {
    const mt = this._q('msg-title'), ms = this._q('msg-sub');
    if (!mt) return;
    mt.textContent = title; if (ms) ms.textContent = sub || '';
    mt.style.opacity = '1'; if (ms) ms.style.opacity = '1';
    if (this._msgTO) clearTimeout(this._msgTO);
    this._msgTO = setTimeout(() => {
      mt.style.opacity = '0'; if (ms) ms.style.opacity = '0';
    }, dur);
  }

  showStreak(text, col, killCount) {
    const b = document.getElementById('streak-banner');
    const t = document.getElementById('streak-txt');
    const sub = document.getElementById('streak-sub');
    if (!b) return;
    if (t) { t.textContent = text; t.style.color = col || '#FFFF00'; }
    if (sub) sub.textContent = killCount + ' KILLS';
    b.style.opacity = '1';
    b.style.transform = 'translate(-50%,-50%) scale(1)';
    if (this._streakTO) clearTimeout(this._streakTO);
    this._streakTO = setTimeout(() => {
      b.style.opacity = '0';
      b.style.transform = 'translate(-50%,-50%) scale(0.8)';
    }, 1200);
  }

  showMapName(name) {
    const el = document.getElementById('map-name-flash');
    if (!el) return;
    el.style.opacity = '1'; el.textContent = name;
    setTimeout(() => el.style.opacity = '0', 2300);
  }

  showSurvivalWave(wave) {
    const el = document.getElementById('survival-wave');
    if (el) { el.textContent = 'SURVIVAL WAVE ' + wave; el.style.display = 'block'; }
  }

  hideSurvivalWave() {
    const el = document.getElementById('survival-wave');
    if (el) el.style.display = 'none';
  }
}
