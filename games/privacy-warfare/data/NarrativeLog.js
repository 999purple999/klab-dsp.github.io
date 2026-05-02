// data/NarrativeLog.js — "INTERCEPTED TRANSMISSION" wave log

const ENTRIES = [
  '>> WAVE_DATA: tracker_ids=EMAIL,GPS,CC confirmed hostile',
  '>> Subject: RE: data breach — recommend immediate action',
  '>> Surveillance log: location pinged 1,847 times today',
  '>> ALERT: facial recognition match at 94.7% confidence',
  '>> Data broker sold your profile to 23 companies',
  '>> Your search history: analyzed, monetized, sold.',
  '>> K-PERCEPTION: the only vault they can\'t read.',
  '>> Biometric data harvested from your device',
  '>> End-to-end encryption: activated. They see nothing.',
  '>> Privacy restored. K-Perception deployed.',
];

export class NarrativeLog {
  constructor() {
    this._index = 0;
    this._modal = null;
    this._timer = null;
    this._build();
  }

  _build() {
    this._modal = document.createElement('div');
    this._modal.id = 'narrative-modal';
    Object.assign(this._modal.style, {
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '55',
      background: 'rgba(0,0,0,0.92)',
      border: '1px solid rgba(57,255,20,0.35)',
      borderRadius: '8px',
      padding: '14px 20px',
      maxWidth: '520px',
      width: '88vw',
      fontFamily: "'JetBrains Mono','Courier New',monospace",
      fontSize: '12px',
      color: '#39FF14',
      letterSpacing: '.08em',
      lineHeight: '1.6',
      display: 'none',
      cursor: 'pointer',
      boxShadow: '0 0 30px rgba(57,255,20,0.12)',
      textShadow: '0 0 8px rgba(57,255,20,0.5)',
      userSelect: 'none',
    });

    const label = document.createElement('div');
    Object.assign(label.style, {
      fontSize: '9px',
      color: 'rgba(57,255,20,0.5)',
      letterSpacing: '.25em',
      marginBottom: '6px',
      textTransform: 'uppercase',
    });
    label.textContent = 'INTERCEPTED TRANSMISSION';

    this._text = document.createElement('div');

    this._modal.appendChild(label);
    this._modal.appendChild(this._text);
    this._modal.addEventListener('click', () => this.hide());
    document.body.appendChild(this._modal);
  }

  show() {
    const entry = ENTRIES[this._index % ENTRIES.length];
    this._index++;
    this._text.textContent = entry;
    this._modal.style.display = 'block';
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.hide(), 2000);
  }

  hide() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._modal.style.display = 'none';
  }
}
