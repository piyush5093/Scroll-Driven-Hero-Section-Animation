/**
 * src/components/StatCard.jsx
 * A single impact metric card with hover lift + tilt effect.
 *
 * NOTE: GSAP opacity/transform animation is handled by the parent wrapper in Hero.jsx.
 * This component only handles the inner styling and hover effects.
 */
import React, { forwardRef } from 'react'

const ACCENT_CLASSES = {
  gold: 'bg-[#1A1500]/90 border-[#FFD700]/30',
  teal: 'bg-[#001A1A]/90 border-[#00E5FF]/30',
  pink: 'bg-[#1A000D]/90 border-[#FF0080]/30',
  blue: 'bg-[#000A1A]/90 border-[#0055FF]/30',
}

const NUMBER_COLORS = {
  gold: 'text-[#FFD700]',
  teal: 'text-[#00E5FF]',
  pink: 'text-[#FF0080]',
  blue: 'text-[#3388FF]',
}

const SHADOWS = {
  gold: '0 0 20px rgba(255,215,0,0.1)',
  teal: '0 0 20px rgba(0,229,255,0.1)',
  pink: '0 0 20px rgba(255,0,128,0.1)',
  blue: '0 0 20px rgba(0,85,255,0.1)',
}

/**
 * @param {object} props
 * @param {number}  props.value      - Numeric percentage value
 * @param {string}  props.label      - Short description label
 * @param {'gold'|'teal'|'pink'|'blue'} props.accent
 * @param {string}  [props.className]
 */
const StatCard = forwardRef(function StatCard(
  { value, label, accent = 'gold', className = '' },
  ref
) {
  return (
    <div
      ref={ref}
      className={[
        'stat-card relative flex flex-col items-start justify-between w-full',
        'rounded-2xl border backdrop-blur-md p-5 md:p-6',
        'transition-transform duration-300 ease-out cursor-default select-none',
        'hover:-translate-y-2 hover:rotate-1 hover:scale-105',
        ACCENT_CLASSES[accent],
        className,
      ].join(' ')}
      style={{
        boxShadow: SHADOWS[accent],
      }}
      aria-label={`${value}% — ${label}`}
    >
      <p
        className={[
          'text-5xl md:text-6xl font-black leading-none tabular-nums',
          NUMBER_COLORS[accent],
        ].join(' ')}
      >
        <span data-count={value}>0</span>%
      </p>
      <p className="mt-3 text-sm md:text-base font-medium leading-snug text-white/80">
        {label}
      </p>
    </div>
  )
})

export default StatCard
