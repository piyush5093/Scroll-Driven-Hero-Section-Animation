import React from 'react';

export const Slider = () => {
  return (
    <div className="zipper-slider absolute top-1/2 -translate-y-1/2 left-0 w-[80px] md:w-[120px] h-[60px] md:h-[90px] z-30 will-change-transform flex items-center justify-center -translate-x-[120px]">
      {/* Slider body */}
      <div className="slider-body relative w-full h-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-gray-200 overflow-hidden">
        
        {/* Metallic shine sweep */}
        <div className="slider-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full skew-x-[-20deg]"></div>
        
        {/* Slider internal details */}
        <div className="absolute inset-1 border border-gray-600/50 rounded-md"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[70%] bg-gray-800 rounded-sm"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10%] h-[50%] bg-gray-400 rounded-full"></div>
      </div>
      
      {/* Pull tab */}
      <div className="pull-tab absolute top-[80%] left-1/2 -translate-x-1/2 w-[40px] md:w-[50px] h-[70px] md:h-[100px] origin-top will-change-transform z-40 drop-shadow-xl">
        <div className="w-full h-full bg-gradient-to-b from-gray-400 to-gray-600 rounded-b-full border-2 border-gray-300 relative flex flex-col items-center">
           {/* hole in tab */}
           <div className="w-1/2 h-1/4 bg-gray-800 mt-4 rounded-full shadow-inner"></div>
           <div className="w-full mt-auto h-2 bg-white/20"></div>
        </div>
      </div>
    </div>
  );
};
