// ─── HUD ──────────────────────────────────────────────────────────────────────
// All DOM-update functions for the in-game heads-up display.

let _msgTO = null;
let _streakTO = null;

export function updateHpHud(hp, maxHp) {
  const FILL  = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:-2px;margin:0 1px"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z"/></svg>';
  const EMPTY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin:0 1px;opacity:.35"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z"/></svg>';
  let s = '';
  for (let i = 0; i < hp; i++) s += FILL;
  for (let i = hp; i < maxHp; i++) s += EMPTY;
  document.getElementById('hp-hearts').innerHTML = s;
}

export function setWpn(idx, wpns) {
  const w = wpns[idx];
  document.getElementById('wpn-name-txt').textContent = w.n;
  const dot = document.getElementById('wpn-col-dot');
  dot.style.background = w.col;
  dot.style.boxShadow = '0 0 6px ' + w.col;
  document.getElementById('wpn-cd').style.background = w.col;
}

export function updateScore(score) {
  document.getElementById('score-val').textContent = Math.floor(score);
}

export function updateCredits(credits) {
  const el = document.getElementById('credits-val');
  if (el) el.textContent = credits;
}

export function showMsg(title, sub, dur) {
  const mt = document.getElementById('msg-title'), ms = document.getElementById('msg-sub');
  mt.textContent = title; ms.textContent = sub || ''; mt.style.opacity = '1'; ms.style.opacity = '1';
  if (_msgTO) clearTimeout(_msgTO);
  _msgTO = setTimeout(() => { mt.style.opacity = '0'; ms.style.opacity = '0'; }, dur || 2200);
}

export function showStreak(text, col, count) {
  const b = document.getElementById('streak-banner');
  document.getElementById('streak-txt').textContent = text;
  document.getElementById('streak-txt').style.color = col || '#FFFF00';
  document.getElementById('streak-sub').textContent = count + ' KILLS';
  b.style.opacity = '1'; b.style.transform = 'translate(-50%,-50%) scale(1)';
  if (_streakTO) clearTimeout(_streakTO);
  _streakTO = setTimeout(() => { b.style.opacity = '0'; b.style.transform = 'translate(-50%,-50%) scale(0.8)'; }, 1200);
}

export function updateWave(wave) {
  document.getElementById('wave-txt').textContent = 'WAVE ' + wave;
}

export function updateEnemyCount(count) {
  document.getElementById('enemy-count').textContent = count + ' THREATS';
}

export function updateWeather(weather) {
  const wb = document.getElementById('weather-badge');
  wb.textContent = weather === 'CLEAR' ? '' : weather.replace('_', ' ');
}

export function updateAbilityUI(abCDs, abilityCDMult) {
  // Only F and G slots remain — X/V/C/Z removed
  ['f', 'g'].forEach(l => {
    const el   = document.getElementById('cd-' + l);
    const slot = document.getElementById('slot-' + l);
    if (!el || !slot) return;
    // Look up which gadget is in this slot from the slot's data attribute
    const gadKey = slot.dataset.gadget;
    const t = gadKey ? (abCDs[gadKey] ?? 0) : 0;
    el.textContent = t > 0 ? t.toFixed(1) + 's' : 'READY';
    el.style.color = t > 0 ? 'rgba(255,120,80,0.8)' : 'rgba(0,255,65,0.8)';
    slot.classList.toggle('ready', t <= 0);
  });
}

export function updateWeaponCD(wpnIdx, wpnCDs, wpns, overclockActive) {
  const pct = wpnCDs[wpnIdx] > 0 ? 1 - wpnCDs[wpnIdx] / wpns[wpnIdx].cd : 1;
  const bar = document.getElementById('wpn-cd');
  bar.style.width = (pct * 100) + '%';
  bar.style.background = overclockActive ? '#FFFF00' : wpns[wpnIdx].col;
}

export function updateCombo(combo) {
  const cv2 = document.getElementById('combo-val');
  if (combo >= 1.5) {
    cv2.textContent = 'x' + combo.toFixed(1) + ' COMBO';
    cv2.style.color = combo >= 5 ? '#FF4400' : combo >= 3 ? '#FF8800' : '#BF00FF';
  } else {
    cv2.textContent = '';
  }
}

export function updateStyleMeter(pct, overdrive) {
  const bar = document.getElementById('style-bar');
  const lbl = document.getElementById('style-lbl');
  const wrap = document.getElementById('style-wrap');
  if (!bar || !lbl || !wrap) return;
  wrap.style.opacity = pct > 0.04 ? '1' : '0.25';
  bar.style.width = Math.min(100, pct * 100) + '%';
  if (overdrive) {
    bar.style.background = 'linear-gradient(90deg,#00FFFF,#FF00FF,#00FFFF)';
    bar.style.boxShadow  = '0 0 18px #00FFFF, 0 0 40px rgba(255,0,255,0.5)';
    lbl.textContent = 'OVERDRIVE';
    lbl.style.color = '#00FFFF';
    lbl.style.textShadow = '0 0 10px #00FFFF';
  } else {
    bar.style.background = 'linear-gradient(90deg,#BF00FF,#00FFFF)';
    bar.style.boxShadow  = '0 0 10px rgba(191,0,255,0.6)';
    lbl.textContent = 'STYLE';
    lbl.style.color = 'rgba(191,0,255,0.55)';
    lbl.style.textShadow = '';
  }
}
