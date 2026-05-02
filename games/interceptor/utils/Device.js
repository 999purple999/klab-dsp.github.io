export const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

export const dpr = Math.min(window.devicePixelRatio || 1, 2);

export function isLowEnd() {
  // Heuristic: low DPR + mobile + older HW concurrency
  const cores = navigator.hardwareConcurrency || 4;
  const memoryGb = navigator.deviceMemory || 4;
  return isMobile && (cores <= 2 || memoryGb <= 1);
}

export function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
