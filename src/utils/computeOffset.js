/**
 * src/utils/computeOffset.js
 * Pure function — no DOM access, no side-effects.
 *
 * Given a tooth's x position (centre) and the current slider X position,
 * returns how far the tape at that point should diverge from the centre line.
 *
 * @param {number} toothX     - The tooth's x position in the zipper coordinate space
 * @param {number} sliderX    - The slider's current x position
 * @param {number} maxGap     - Maximum half-gap (tape's half-height × 0.55)
 * @param {number} openLength - Distance over which the gap fully opens (px, ~200)
 * @returns {number} offsetY in px (positive = upper tape moves up, lower moves down)
 */
export function computeOffset(toothX, sliderX, maxGap, openLength) {
  const d = sliderX - toothX
  if (d <= 0) return 0 // tooth is still ahead of the slider → closed

  // easeOutCubic for natural-feeling divergence
  const t = Math.min(d / openLength, 1)
  const eased = 1 - (1 - t) ** 3

  return maxGap * eased
}
