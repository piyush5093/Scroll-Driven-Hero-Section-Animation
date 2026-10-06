/**
 * Generates an array of teeth configurations.
 * 
 * @param {number} count Number of teeth
 * @param {boolean} isTop Whether this is the top row of teeth
 * @returns {Array} Array of objects containing styles and config for each tooth
 */
export const generateTeeth = (count, isTop) => {
  return Array.from({ length: count }).map((_, i) => {
    // Top and bottom teeth stagger to interlock
    const leftPercent = (i / count) * 100;
    
    return {
      id: `tooth-${isTop ? 'top' : 'bottom'}-${i}`,
      left: `${leftPercent}%`,
      width: `${100 / count + 0.2}%`, // slight overlap to avoid gaps
    };
  });
};
