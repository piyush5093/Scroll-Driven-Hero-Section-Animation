import React from 'react';
import { Hero } from './components/Hero';
import { NextSection } from './components/NextSection';
import { useLenis } from './hooks/useLenis';

function App() {
  useLenis();

  return (
    <main className="bg-[#0B1020] min-h-screen text-[#F5F7FF] font-sans selection:bg-[#7C3AED] selection:text-white">
      <Hero />
      <NextSection />
    </main>
  );
}

export default App;
