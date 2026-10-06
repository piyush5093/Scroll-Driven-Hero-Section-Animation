import React from 'react';

/**
 * Splits text into individual span elements for character-level animation.
 * Keeps words together in inline-block to prevent line-break issues.
 */
export const splitTextToChars = (text) => {
  return text.split(' ').map((word, wordIndex) => {
    return (
      <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap mr-[0.25em]">
        {word.split('').map((char, charIndex) => (
          <span 
            key={`char-${wordIndex}-${charIndex}`} 
            className="inline-block headline-char opacity-0 translate-y-[20px] will-change-transform"
            aria-hidden="true"
          >
            {char}
          </span>
        ))}
      </span>
    );
  });
};
