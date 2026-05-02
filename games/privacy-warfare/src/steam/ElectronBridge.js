export const ElectronBridge = {
  available: typeof window !== 'undefined' && !!window.electronAPI,
  send(channel, ...args) { if(this.available) window.electronAPI.send(channel, ...args); },
  on(channel, cb) { if(this.available) window.electronAPI.on(channel, cb); },
  saveFile(path, data) { this.send('save-file', path, data); },
  loadFile(path) { if(!this.available) return null; return window.electronAPI.loadFile(path); },
};
