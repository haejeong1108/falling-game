export const SCORES_UPDATED = "scores:updated";

export function emitScoresUpdated() {
  window.dispatchEvent(new CustomEvent(SCORES_UPDATED));
}

export function onScoresUpdated(handler: () => void) {
  window.addEventListener(SCORES_UPDATED, handler);
  return () => window.removeEventListener(SCORES_UPDATED, handler);
}
