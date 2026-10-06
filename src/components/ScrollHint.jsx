/**
 * src/components/ScrollHint.jsx
 * Animated scroll indicator shown after intro completes.
 */
import React, { forwardRef } from 'react'

const ScrollHint = forwardRef(function ScrollHint(_props, ref) {
  return (
    <div
      ref={ref}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none select-none"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* Mouse icon */}
      <div className="w-6 h-9 rounded-full border-2 border-white/30 flex justify-center pt-1.5">
        <div className="w-1 h-2 bg-white/60 rounded-full" />
      </div>
      <p className="text-xs font-medium tracking-widest text-white/40 uppercase">Scroll</p>
    </div>
  )
})

export default ScrollHint
