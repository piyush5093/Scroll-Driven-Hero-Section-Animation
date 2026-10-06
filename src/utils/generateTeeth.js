/**
 * src/utils/generateTeeth.js
 * Returns an array of tooth descriptor objects.
 * No DOM access — pure data generation.
 *
 * @param {object} opts
 * @param {number} opts.count       - Number of teeth per row
 * @param {number} opts.pitch       - Spacing between tooth centres (px)
 * @param {number} opts.startX      - X of first tooth centre
 * @param {'upper'|'lower'} opts.row
 * @returns {Array<{id:string, x:number, row:string, offset:number}>}
 */
export function generateTeeth({ count, pitch, startX, row }) {
  const teeth = []
  // Upper and lower rows are offset by half a pitch so they interlock when closed
  const rowOffset = row === 'lower' ? pitch / 2 : 0
  for (let i = 0; i < count; i++) {
    teeth.push({
      id: `${row}-${i}`,
      x: startX + i * pitch + rowOffset,
      row,
    })
  }
  return teeth
}
