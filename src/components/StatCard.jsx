import React, { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';

export const StatCard = ({ value, label, colorClass, className = "", id }) => {
  const valueRef = useRef(null);
  
  // We will let the main timeline handle the intro animation (opacity, y, scale)
  // but we can manage the counter animation here if we want, or just expose it.
  // Actually, animating the number can be done via a custom object in GSAP.
  
  useGSAP(() => {
    // The main timeline will control a class or data-attribute when it appears, 
    // but the prompt said "Numbers count up from 0 to their value as each card appears."
    // Let's hook into ScrollTrigger or the main intro timeline for this.
    // For simplicity, we can watch for the opacity of the parent and trigger the count.
    // Or better, let the parent timeline handle it by giving a standard class to the number.
  }, { scope: valueRef });

  return (
    <div 
      className={`stat-card opacity-0 translate-y-[40px] scale-[0.94] will-change-transform
      bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-center 
      transition-all duration-300 hover:-translate-y-1.5 hover:rotate-1 hover:shadow-lg hover:shadow-white/5 ${className}`}
      id={id}
    >
      <div 
        ref={valueRef}
        className={`stat-value text-5xl md:text-6xl font-black mb-2 ${colorClass}`}
        data-val={value}
      >
        0
      </div>
      <div className="stat-label text-sm md:text-base text-gray-300 font-medium">
        {label}
      </div>
    </div>
  );
};
