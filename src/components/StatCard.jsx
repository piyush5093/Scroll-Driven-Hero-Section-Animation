/**
 * src/components/StatCard.jsx
 * A single impact metric card with hover lift + tilt effect.
 */
import React, { forwardRef } from 'react'

const ACCENT_CLASSES = {
  lime: 'bg-[#1A2000] border-[#C6F432]/30',
  dark: 'bg-[#0F1629]/90 border-white/10',
  sky: 'bg-[#001A2E] border-[#5BC8FF]/30',
  coral: 'bg-[#2E0A0A] border-[#FF6B6B]/30',
}

const NUMBER_COLORS = {
  lime: 'text-[#C6F432]',
  dark: 'text-white',
  sky: 'text-[#5BC8FF]',
  coral: 'text-[#FF6B6B]',
}

/**
 * @param {object} props
 * @param {number}  props.value      - Numeric percentage value
 * @param {string}  props.label      - Short description label
 * @param {'lime'|'dark'|'sky'|'coral'} props.accent
 * @param {string}  [props.className]
 */
const StatCard = forwardRef(function StatCard(
  { value, label, accent = 'dark', className = '' },
  ref
) {
  return (
    <div
      ref={ref}
      className={[
        'stat-card relative flex flex-col items-start justify-between',
        'rounded-2xl border backdrop-blur-sm p-5',
        'transition-transform duration-300 ease-out cursor-default select-none',
        'hover:-translate-y-2 hover:rotate-1',
        ACCENT_CLASSES[accent],
        className,
      ].join(' ')}
      style={{
        opacity: 0, // initial state for GSAP
        transform: 'translateY(40px) scale(0.94)',
        boxShadow:
          accent === 'lime'
            ? '0 0 30px rgba(198,244,50,0.07)'
            : accent === 'sky'
            ? '0 0 30px rgba(91,200,255,0.07)'
            : accent === 'coral'
            ? '0 0 30px rgba(255,107,107,0.07)'
            : '0 0 20px rgba(255,255,255,0.03)',
      }}
      aria-label={`${value}% — ${label}`}
    >
      <p
        className={[
          'text-5xl font-black leading-none tabular-nums',
          NUMBER_COLORS[accent],
        ].join(' ')}
      >
        {/* data-count used by GSAP counter animation */}
        <span data-count={value}>0%</span>
      </p>
      <p className="mt-3 text-sm font-medium leading-snug text-white/70">{label}</p>
    </div>
  )
})

export default StatCard
