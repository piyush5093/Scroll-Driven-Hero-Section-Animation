import React, { useMemo } from 'react';
import { Slider } from './Slider';
import { splitTextToChars } from '../utils/splitText';
import { generateTeeth } from '../utils/generateTeeth';

export const Zipper = ({ isMobile }) => {
  const teethCount = isMobile ? 30 : 60;
  
  const topTeeth = useMemo(() => generateTeeth(teethCount, true), [teethCount]);
  const bottomTeeth = useMemo(() => generateTeeth(teethCount, false), [teethCount]);

  return (
    <div className="zipper-container relative w-full h-[28vh] flex items-center justify-center my-auto">
      
      {/* The base track that wiping in during intro */}
      <div className="zipper-track absolute left-0 right-0 h-4 bg-[#141B34] z-10 scale-x-0 origin-left will-change-transform flex flex-col justify-between"></div>

      {/* Opening inner gradient layer, starts hidden (clip-path inset 100% on right?) 
          Actually clip-path inset(0 100% 0 0) to hide it, and we reveal it to 0% */}
      <div className="zipper-opening absolute left-0 right-0 h-[28vh] bg-gradient-to-r from-violet-600/20 to-cyan-400/20 z-0 flex items-center justify-center overflow-hidden border-y border-white/5 opacity-0">
         {/* Inner glowing effect */}
         <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/10 via-transparent to-[#22D3EE]/10"></div>
         
         <h1 className="headline relative z-10 uppercase font-black text-[#F5F7FF] whitespace-nowrap text-[clamp(2rem,7vw,8rem)] tracking-[0.25em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
           {splitTextToChars("WELCOME ITZFIZZ")}
         </h1>
      </div>

      {/* Top Teeth Row */}
      <div className="teeth-row top-row absolute top-1/2 left-0 right-0 h-4 -translate-y-full z-20 flex opacity-0">
        {topTeeth.map((tooth) => (
          <div 
            key={tooth.id}
            className="tooth tooth-top absolute bottom-0 h-full bg-gray-400 rounded-t-sm border border-gray-600 will-change-transform"
            style={{ left: tooth.left, width: tooth.width }}
          >
            <div className="w-full h-1/2 bg-gradient-to-b from-gray-300 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Bottom Teeth Row */}
      <div className="teeth-row bottom-row absolute top-1/2 left-0 right-0 h-4 z-20 flex opacity-0">
        {bottomTeeth.map((tooth) => (
          <div 
            key={tooth.id}
            className="tooth tooth-bottom absolute top-0 h-full bg-gray-500 rounded-b-sm border border-gray-700 will-change-transform"
            style={{ left: `calc(${tooth.left} + ${0.5 * parseFloat(tooth.width)}%)`, width: tooth.width }}
          >
             <div className="w-full h-1/2 mt-auto bg-gradient-to-t from-gray-400 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* The slider object */}
      <Slider />

    </div>
  );
};
