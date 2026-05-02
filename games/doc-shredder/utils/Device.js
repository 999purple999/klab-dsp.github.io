export const isMobile = /Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

export function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}
