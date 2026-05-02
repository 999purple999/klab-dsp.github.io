import { Storage } from '../data/Storage.js';

export class Modal {
  constructor() {
    this._layer = document.getElementById('ui-layer');
    this._currentTutorial = null;
    this._toasts = [];
  }

  showTutorial(onDismiss) {
    if (Storage.get('dr_tutorial_done', false)) {
      if (onDismiss) onDismiss();
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(5,6,13,0.85); z-index: 100;
      flex-direction: column; gap: 24px;
      font-family: "JetBrains Mono", monospace;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color: #a855f7; font-size: clamp(16px,4vw,24px); font-weight: 800; letter-spacing: 3px;';
    title.textContent = 'HOW TO PLAY';

    const arrowContainer = document.createElement('div');
    arrowContainer.style.cssText = 'display:flex;align-items:center;gap:16px;';

    const arrow = document.createElement('div');
    arrow.style.cssText = `
      width: 0; height: 0;
      border-left: 20px solid transparent; border-right: 20px solid transparent;
      border-bottom: 36px solid #00FFFF;
      animation: tapArrow 0.8s ease-in-out infinite alternate;
    `;

    const tapText = document.createElement('div');
    tapText.style.cssText = 'color: #d4dff4; font-size: clamp(14px,3vw,20px); font-weight: 600;';
    tapText.textContent = 'TAP to flip gravity';

    arrowContainer.appendChild(arrow);
    arrowContainer.appendChild(tapText);

    const desc = document.createElement('div');
    desc.style.cssText = 'color: rgba(212,223,244,0.6); font-size: clamp(11px,2.5vw,15px); text-align:center; max-width:280px;';
    desc.textContent = 'Dodge the red pipes. Collect gold coins. Grab power-ups to survive!';

    const btn = document.createElement('button');
    btn.style.cssText = `
      margin-top: 16px; padding: 14px 40px;
      background: #a855f7; color: #fff; border: none; border-radius: 4px;
      font-family: inherit; font-size: clamp(13px,3vw,16px); font-weight: 800;
      letter-spacing: 2px; cursor: pointer;
      box-shadow: 0 0 24px #a855f7aa;
    `;
    btn.textContent = 'GOT IT';
    btn.addEventListener('click', () => {
      Storage.set('dr_tutorial_done', true);
      overlay.remove();
      this._currentTutorial = null;
      if (onDismiss) onDismiss();
    });

    // Add animation style
    if (!document.getElementById('modal-anim-style')) {
      const style = document.createElement('style');
      style.id = 'modal-anim-style';
      style.textContent = `
        @keyframes tapArrow { from { transform: translateY(0); } to { transform: translateY(12px); } }
        @keyframes toastFadeOut { from { opacity:1; transform: translateY(0); } to { opacity:0; transform: translateY(20px); } }
      `;
      document.head.appendChild(style);
    }

    overlay.appendChild(title);
    overlay.appendChild(arrowContainer);
    overlay.appendChild(desc);
    overlay.appendChild(btn);
    this._layer.appendChild(overlay);
    this._currentTutorial = overlay;
  }

  showAchievementToast(name, desc) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
      background: rgba(5,6,13,0.92); border: 1px solid #a855f7;
      color: #d4dff4; padding: 12px 24px; border-radius: 8px;
      font-family: "JetBrains Mono", monospace;
      box-shadow: 0 0 24px #a855f744;
      z-index: 200;
      text-align: center;
      max-width: 90vw;
    `;

    const achieveName = document.createElement('div');
    achieveName.style.cssText = 'font-size: clamp(11px,3vw,14px); font-weight: 800; color: #a855f7; margin-bottom: 4px;';
    achieveName.textContent = `ACHIEVEMENT: ${name}`;

    const achieveDesc = document.createElement('div');
    achieveDesc.style.cssText = 'font-size: clamp(10px,2.5vw,12px); color: rgba(212,223,244,0.7);';
    achieveDesc.textContent = desc;

    toast.appendChild(achieveName);
    toast.appendChild(achieveDesc);
    this._layer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastFadeOut 0.5s ease-out forwards';
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  }

  showAchievements(list) {
    let delay = 0;
    for (const ach of list) {
      setTimeout(() => this.showAchievementToast(ach.name, ach.desc), delay);
      delay += 600;
    }
  }

  clearTutorial() {
    if (this._currentTutorial) {
      this._currentTutorial.remove();
      this._currentTutorial = null;
    }
  }
}
