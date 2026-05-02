export const Steamworks = {
  available: false,
  init() { if(typeof window.SteamAPI !== 'undefined'){ this.available=true; } },
  unlockAchievement(id) { if(this.available) window.SteamAPI.activateAchievement(id); },
  setRichPresence(key, val) { if(this.available) window.SteamAPI.setRichPresence(key, val); },
  submitLeaderboard(name, score) { if(this.available) window.SteamAPI.uploadLeaderboardScore(name, score); },
};
