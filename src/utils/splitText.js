/**
 * src/utils/splitText.js
 * Split a string into individual letter spans for staggered animation.
 * Returns an array of React elements.
 *
 * @param {string} text
 * @param {string} className - CSS class for each span
 * @returns {JSX.Element[]}
 */
export function splitLetters(text, className = '') {
  return text.split('').map((char, i) => (
    <span
      key={i}
      className={className}
      style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
      aria-hidden="true"
    >
      {char}
    </span>
  ))
}
