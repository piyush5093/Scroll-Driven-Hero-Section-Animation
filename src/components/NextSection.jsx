import React from 'react';

export const NextSection = () => {
  return (
    <section id="next" className="w-full bg-[#141B34] py-24 px-4 md:px-8 relative z-10 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black mb-12 text-center text-[#F5F7FF]">What we build</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-[#0B1020] rounded-2xl p-8 border border-white/5 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-400 mb-6 flex items-center justify-center text-white font-bold">
                {item}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Innovation Area {item}</h3>
              <p className="text-gray-400">
                Crafting digital experiences that merge cutting-edge technology with seamless design. 
                Our approach ensures scalability and performance.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
