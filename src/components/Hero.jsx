import React, { useRef, useState, useEffect } from 'react';
import { StatCard } from './StatCard';
import { Zipper } from './Zipper';
import { ScrollHint } from './ScrollHint';
import { useHeroAnimation } from '../hooks/useHeroAnimation';

export const Hero = () => {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hook handles all GSAP logic
  useHeroAnimation(containerRef);

  return (
    <section id="hero" className="w-full relative" ref={containerRef}>
      <div className="stage h-screen w-full relative overflow-hidden flex flex-col justify-between pt-12 pb-24 md:py-16">
        
        {/* Soft background grid or gradient shift */}
        <div className="bg-shift absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0B1020] to-[#0B1020] opacity-50"></div>
        
        {/* Top Zone */}
        <div className="top-zone relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-2 gap-4 md:gap-8 justify-between">
          <StatCard 
            id="card-1"
            value="58"
            label="Faster project delivery" 
            colorClass="text-[#C6F432]" 
            className="md:w-64 max-w-full justify-self-start"
          />
          <StatCard 
            id="card-2"
            value="27"
            label="Increase in user engagement" 
            colorClass="text-gray-100" 
            className="md:w-64 max-w-full justify-self-end bg-white/10"
          />
        </div>
        
        {/* Middle Zone - Zipper */}
        <div className="middle-zone relative z-20 w-full">
          <Zipper isMobile={isMobile} />
        </div>
        
        {/* Bottom Zone */}
        <div className="bottom-zone relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-2 gap-4 md:gap-8 justify-between">
          <StatCard 
            id="card-3"
            value="23"
            label="Reduction in page load time" 
            colorClass="text-[#5BC8FF]" 
            className="md:w-64 max-w-full justify-self-start"
          />
          <StatCard 
            id="card-4"
            value="40"
            label="Fewer support requests" 
            colorClass="text-[#FF6B6B]" 
            className="md:w-64 max-w-full justify-self-end"
          />
        </div>
        
        {/* Scroll Hint */}
        <ScrollHint />
        
      </div>
    </section>
  );
};
