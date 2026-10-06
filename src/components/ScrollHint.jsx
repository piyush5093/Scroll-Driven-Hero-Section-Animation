import React from 'react';
import { gsap, useGSAP } from '../lib/gsap';

export const ScrollHint = () => {
  return (
    <div className="scroll-hint opacity-0 flex flex-col items-center justify-center text-gray-400 absolute bottom-8 left-1/2 -translate-x-1/2">
      <span className="text-sm tracking-widest uppercase mb-2 font-medium">Scroll</span>
      <svg 
        className="w-5 h-5 scroll-arrow text-gray-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  );
};
