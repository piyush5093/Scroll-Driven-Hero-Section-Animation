/**
 * src/components/Hero.jsx
 * Hero section — the only section on the page.
 *
 * Layout:
 *  - Pinned .stage (100vh) containing:
 *    ├── Animated background (subtle gradient shift)
 *    ├── Headline (behind the zipper, revealed through the V-gap)
 *    ├── Zipper SVG (full width, vertically centered)
 *    ├── 4 StatCards (zig-zag: 2 above, 2 below the zipper strip)
 *    └── ScrollHint
 *
 * The #hero wrapper is 4× viewport height (300% extra scroll distance).
 * ScrollTrigger pins .stage for this full scroll distance.
 */
import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../lib/gsap'
import { computeOffset } from '../utils/computeOffset'
import StatCard from './StatCard'
import ScrollHint from './ScrollHint'

// ─── Stat card data ──────────────────────────────────────────────────────────
const STATS = [
  { value: 58, label: 'Faster project delivery',    accent: 'lime',  pos: 'above-left'  },
  { value: 27, label: 'Increase in user engagement',accent: 'dark',  pos: 'above-right' },
  { value: 23, label: 'Reduction in page load time',accent: 'sky',   pos: 'below-left'  },
  { value: 40, label: 'Fewer support requests',     accent: 'coral', pos: 'below-right' },
]

// ─── Zipper constants (must match Zipper.jsx) ────────────────────────────────
const PITCH = 18
const TOOTH_W = 22
const TOOTH_H = 14
const TAPE_SEGMENTS = 60
const TAPE_COLOR = '#141B34'
const TAPE_HIGHLIGHT = '#1E2A50'

// ─── Tooth path ──────────────────────────────────────────────────────────────
function toothPath() {
  const hw = TOOTH_W / 2
  const hh = TOOTH_H / 2
  return `M ${-hw} ${hh}
    L ${-hw} ${-hh + 3}
    Q ${-hw} ${-hh - 2} ${-hw + 4} ${-hh - 2}
    L ${hw - 4} ${-hh - 2}
    Q ${hw} ${-hh - 2} ${hw} ${-hh + 3}
    L ${hw} ${hh}
    Z`
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Hero({ lenisRef }) {
  const heroRef   = useRef(null)   // #hero outer wrapper (tall scroll area)
  const stageRef  = useRef(null)   // .stage pinned 100vh element
  const svgRef    = useRef(null)   // the zipper SVG
  const sliderGRef = useRef(null)  // slider <g> for x translation
  const pullTabGRef = useRef(null) // pull-tab <g> for rotation
  const upperTeethRef = useRef(null)
  const lowerTeethRef = useRef(null)
  const upperTapeGRef = useRef(null)
  const lowerTapeGRef = useRef(null)
  const headlineRef = useRef(null)
  const scrollHintRef = useRef(null)
  const statCardEls = useRef([])

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toothCount = isMobile ? 50 : 100

  // ── Cache ref for scroll callback (no DOM reads inside scroll) ──────────────
  const cache = useRef({
    stageW: 0, stageH: 0, sliderW: 80,
    maxGap: 0, openLength: 200,
    upperTeethEls: [], lowerTeethEls: [],
    upperSegEls: [], lowerSegEls: [],
  })

  const sliderXSetter = useRef(null)
  const pullTabRotSetter = useRef(null)

  const refreshCache = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const r = stage.getBoundingClientRect()
    cache.current.stageW = r.width
    cache.current.stageH = r.height
    const tapeH = r.height * 0.14
    cache.current.maxGap = tapeH * 0.55 * 2.5 // enough to fit headline
    cache.current.openLength = 220

    if (upperTeethRef.current)
      cache.current.upperTeethEls = Array.from(upperTeethRef.current.querySelectorAll('[data-tooth]'))
    if (lowerTeethRef.current)
      cache.current.lowerTeethEls = Array.from(lowerTeethRef.current.querySelectorAll('[data-tooth]'))
    if (upperTapeGRef.current)
      cache.current.upperSegEls = Array.from(upperTapeGRef.current.querySelectorAll('[data-tape-seg]'))
    if (lowerTapeGRef.current)
      cache.current.lowerSegEls = Array.from(lowerTapeGRef.current.querySelectorAll('[data-tape-seg]'))

    if (sliderGRef.current)
      sliderXSetter.current = gsap.quickSetter(sliderGRef.current, 'x', 'px')
    if (pullTabGRef.current)
      pullTabRotSetter.current = gsap.quickSetter(pullTabGRef.current, 'rotation', 'deg')
  }, [])

  // ── Main GSAP context ─────────────────────────────────────────────────────
  useGSAP(
    () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (prefersReduced) {
        // Show everything without animation
        gsap.set([headlineRef.current, scrollHintRef.current, ...statCardEls.current.filter(Boolean)],
          { opacity: 1, y: 0, scale: 1 })
        return
      }

      // Stop scroll during intro
      if (lenisRef?.current) lenisRef.current.stop()

      // ── INTRO TIMELINE ──────────────────────────────────────────────────
      const intro = gsap.timeline({
        onComplete: () => {
          if (lenisRef?.current) lenisRef.current.start()
          ScrollTrigger.refresh()
        },
      })

      // a) Zipper strip fades in via clip-path
      if (svgRef.current) {
        gsap.set(svgRef.current, { clipPath: 'inset(0 100% 0 0)' })
        intro.to(svgRef.current, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.out' }, 0)
      }

      // b) Slider settles from left with overshoot
      if (sliderGRef.current) {
        gsap.set(sliderGRef.current, { x: -140, opacity: 0 })
        intro.to(sliderGRef.current, { x: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.4)' }, 0.25)
      }

      // c) Shimmer hint on the headline area (subtle, so page doesn't look empty)
      if (headlineRef.current) {
        gsap.set(headlineRef.current, { opacity: 0.08 })
        intro.to(headlineRef.current, { opacity: 0.12, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 0 }, 0)
      }

      // d) Stat cards one-by-one with number count-up
      const validCards = statCardEls.current.filter(Boolean)
      validCards.forEach((card, i) => {
        gsap.set(card, { opacity: 0, y: 40, scale: 0.94 })
        intro.to(card, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }, 0.6 + i * 0.15)

        const numEl = card.querySelector('[data-count]')
        if (numEl) {
          const target = parseInt(numEl.dataset.count, 10)
          const obj = { val: 0 }
          intro.to(obj, {
            val: target, duration: 0.8, ease: 'power2.out',
            onUpdate() { numEl.textContent = Math.round(obj.val) + '%' },
          }, 0.65 + i * 0.15)
        }
      })

      // e) Scroll hint
      if (scrollHintRef.current) {
        gsap.set(scrollHintRef.current, { opacity: 0, y: 10 })
        intro.to(scrollHintRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 1.5)
        intro.add(() => {
          gsap.to(scrollHintRef.current, {
            y: 8, duration: 0.65, ease: 'sine.inOut', yoyo: true, repeat: -1,
          })
        }, 2.0)
      }

      // ── SCROLL ANIMATION ────────────────────────────────────────────────
      ScrollTrigger.addEventListener('refreshInit', refreshCache)
      refreshCache()

      let prevX = 0

      const mm = gsap.matchMedia()
      mm.add(
        {
          desktop: '(min-width: 1024px)',
          tablet:  '(min-width: 640px) and (max-width: 1023px)',
          mobile:  '(max-width: 639px)',
        },
        (ctx) => {
          const scrollEnd = ctx.conditions.mobile ? '+=200%' : '+=300%'

          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: heroRef.current,
              start: 'top top',
              end: scrollEnd,
              pin: stageRef.current,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefresh: refreshCache,
              onUpdate(self) {
                const p = self.progress
                const { stageW, sliderW, maxGap, openLength } = cache.current
                const sliderX = p * (stageW + sliderW)

                // Move slider
                if (sliderXSetter.current) sliderXSetter.current(sliderX)

                // Pull tab velocity swing
                const vel = sliderX - prevX
                prevX = sliderX
                if (pullTabRotSetter.current) {
                  const rot = Math.max(-28, Math.min(28, vel * 0.9))
                  pullTabRotSetter.current(rot)
                }

                // Upper teeth
                const uTeeth = cache.current.upperTeethEls
                for (let i = 0; i < uTeeth.length; i++) {
                  const el = uTeeth[i]
                  const tx = parseFloat(el.dataset.tx || 0)
                  const off = computeOffset(tx, sliderX, maxGap, openLength)
                  gsap.set(el, { y: -off, rotation: -Math.min(off / maxGap, 1) * 6 })
                }
                // Lower teeth
                const lTeeth = cache.current.lowerTeethEls
                for (let i = 0; i < lTeeth.length; i++) {
                  const el = lTeeth[i]
                  const tx = parseFloat(el.dataset.tx || 0)
                  const off = computeOffset(tx, sliderX, maxGap, openLength)
                  gsap.set(el, { y: off, rotation: Math.min(off / maxGap, 1) * 6 })
                }
                // Upper tape segments
                const uSegs = cache.current.upperSegEls
                for (let i = 0; i < uSegs.length; i++) {
                  const seg = uSegs[i]
                  const tx = parseFloat(seg.dataset.tx || 0)
                  const off = computeOffset(tx, sliderX, maxGap, openLength)
                  gsap.set(seg, { y: -off })
                }
                // Lower tape segments
                const lSegs = cache.current.lowerSegEls
                for (let i = 0; i < lSegs.length; i++) {
                  const seg = lSegs[i]
                  const tx = parseFloat(seg.dataset.tx || 0)
                  const off = computeOffset(tx, sliderX, maxGap, openLength)
                  gsap.set(seg, { y: off })
                }

                // Headline reveal: becomes more visible as p increases
                if (headlineRef.current) {
                  gsap.set(headlineRef.current, { opacity: Math.min(p * 3, 1) })
                }
              },
            },
          })

          // Stat card checkpoints: card1@0.12, card3@0.25, card2@0.45, card4@0.60
          const checkpoints = [0.12, 0.45, 0.25, 0.60]
          validCards.forEach((card, i) => {
            const cp = checkpoints[i] ?? 0.2 + i * 0.15
            scrollTl.to(card, { opacity: 1, y: 0, scale: 1, ease: 'power2.out' }, cp)
          })

          return () => scrollTl.kill()
        }
      )

      return () => {
        mm.revert()
        ScrollTrigger.removeEventListener('refreshInit', refreshCache)
      }
    },
    { scope: stageRef, dependencies: [isMobile] }
  )

  // ── Geometry ───────────────────────────────────────────────────────────────
  // SVG dimensions — driven off viewport, updated on resize via inline style
  const svgW = typeof window !== 'undefined' ? window.innerWidth : 1440
  const svgH = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.45) : 350
  const cy = svgH / 2
  const tapeH = svgH * 0.14
  const segW = svgW / TAPE_SEGMENTS

  // Generate tooth x positions
  const upperTeethData = []
  const lowerTeethData = []
  for (let i = 0; i < toothCount; i++) {
    upperTeethData.push({ id: `u${i}`, x: i * PITCH })
    lowerTeethData.push({ id: `l${i}`, x: i * PITCH + PITCH / 2 }) // half-pitch offset for interlock
  }

  return (
    /*
     * #hero — the tall scroll container (height = 4× 100vh for desktop).
     * .stage — the pinned 100vh child that GSAP pins.
     */
    <section
      id="hero"
      ref={heroRef}
      className="relative"
      aria-label="Itzfizz Digital — Scroll-driven zipper hero"
    >
      <div
        ref={stageRef}
        className="stage relative w-full overflow-hidden"
        style={{ height: '100vh' }}
      >
        {/* ── Animated background ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, #0D1635 0%, #0B1020 70%)',
          }}
        />
        {/* Subtle animated gradient orbs */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: `
              radial-gradient(ellipse 40% 30% at 20% 80%, rgba(124,58,237,0.06) 0%, transparent 60%),
              radial-gradient(ellipse 40% 30% at 80% 20%, rgba(34,211,238,0.06) 0%, transparent 60%)
            `,
          }}
        />

        {/* ── Headline layer (behind zipper, revealed by scroll) ── */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
          style={{ zIndex: 1 }}
        >
          <h1
            ref={headlineRef}
            className="font-[Syne] font-black uppercase whitespace-nowrap text-[#F5F7FF] text-center"
            style={{
              fontSize: 'clamp(2rem, 7vw, 8rem)',
              letterSpacing: '0.25em',
              opacity: 0,
              textShadow: '0 0 60px rgba(34,211,238,0.4), 0 0 120px rgba(124,58,237,0.3)',
            }}
            aria-label="Welcome Itzfizz"
          >
            W&nbsp;E&nbsp;L&nbsp;C&nbsp;O&nbsp;M&nbsp;E&nbsp;&nbsp;I&nbsp;T&nbsp;Z&nbsp;F&nbsp;I&nbsp;Z&nbsp;Z
          </h1>
        </div>

        {/* ── Zipper SVG layer ── */}
        <div
          className="absolute inset-0 flex items-center"
          style={{ zIndex: 2 }}
          aria-hidden="true"
        >
          <svg
            ref={svgRef}
            width="100%"
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              {/* Woven texture */}
              <pattern id="wovenPat" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <line x1="0" y1="8" x2="8" y2="0" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.06"/>
                <line x1="-2" y1="2" x2="2" y2="-2" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.06"/>
                <line x1="6" y1="10" x2="10" y2="6" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.06"/>
              </pattern>

              {/* Tape gradients */}
              <linearGradient id="upperTapeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TAPE_HIGHLIGHT}/>
                <stop offset="50%" stopColor={TAPE_COLOR}/>
                <stop offset="100%" stopColor="#0A1020"/>
              </linearGradient>
              <linearGradient id="lowerTapeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A1020"/>
                <stop offset="50%" stopColor={TAPE_COLOR}/>
                <stop offset="100%" stopColor={TAPE_HIGHLIGHT}/>
              </linearGradient>
              <linearGradient id="upperInnerShadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.45)"/>
              </linearGradient>
              <linearGradient id="lowerInnerShadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,0,0,0.45)"/>
                <stop offset="100%" stopColor="transparent"/>
              </linearGradient>

              {/* Reveal gradient */}
              <linearGradient id="revealGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7C3AED"/>
                <stop offset="50%" stopColor="#4F46E5"/>
                <stop offset="100%" stopColor="#22D3EE"/>
              </linearGradient>
              <filter id="revealGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="16" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Tooth gradient + shadow */}
              <linearGradient id="toothGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D8DEE6"/>
                <stop offset="30%" stopColor="#B0B8C4"/>
                <stop offset="70%" stopColor="#788090"/>
                <stop offset="100%" stopColor="#4A5260"/>
              </linearGradient>
              <filter id="toothShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.45"/>
              </filter>

              {/* Slider defs */}
              <linearGradient id="sliderBodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#E8EDF2"/>
                <stop offset="25%"  stopColor="#C5CDD6"/>
                <stop offset="50%"  stopColor="#9AA3AD"/>
                <stop offset="75%"  stopColor="#C5CDD6"/>
                <stop offset="100%" stopColor="#7B8690"/>
              </linearGradient>
              <linearGradient id="pullTabGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#D6DDE4"/>
                <stop offset="40%"  stopColor="#A8B2BB"/>
                <stop offset="100%" stopColor="#6E7880"/>
              </linearGradient>
              <radialGradient id="hingeGrad" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#D0D8DF"/>
                <stop offset="100%" stopColor="#6A7580"/>
              </radialGradient>
              <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.5"/>
                <stop offset="50%"  stopColor="#FFFFFF" stopOpacity="0.0"/>
                <stop offset="100%" stopColor="#000000" stopOpacity="0.3"/>
              </linearGradient>
              <filter id="sliderShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.6"/>
              </filter>
              <filter id="tabShadow" x="-30%" y="-30%" width="180%" height="180%">
                <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000" floodOpacity="0.55"/>
              </filter>
            </defs>

            {/* ── Reveal layer behind tapes ── */}
            <rect
              x="0"
              y={cy - tapeH * 2.6}
              width={svgW}
              height={tapeH * 5.2}
              fill="url(#revealGrad)"
              opacity="0.88"
              filter="url(#revealGlow)"
            />
            <ellipse
              cx={svgW / 2} cy={cy}
              rx={svgW * 0.35} ry={tapeH * 2.2}
              fill="#22D3EE" fillOpacity="0.1"
            />

            {/* ── Upper tape segments ── */}
            <g ref={upperTapeGRef}>
              {Array.from({ length: TAPE_SEGMENTS }, (_, i) => {
                const segX = i * segW
                const segCX = segX + segW / 2
                return (
                  <rect
                    key={`us-${i}`}
                    data-tape-seg="true"
                    data-tx={segCX}
                    x={segX}
                    y={cy - tapeH}
                    width={segW + 0.5}
                    height={tapeH}
                    fill={TAPE_COLOR}
                  />
                )
              })}
              {/* Gradient overlay */}
              <rect x="0" y={cy - tapeH} width={svgW} height={tapeH} fill="url(#upperTapeGrad)" pointerEvents="none"/>
              {/* Woven texture */}
              <rect x="0" y={cy - tapeH} width={svgW} height={tapeH} fill="url(#wovenPat)" pointerEvents="none"/>
              {/* Edge highlight */}
              <line x1="0" y1={cy - tapeH + 2} x2={svgW} y2={cy - tapeH + 2} stroke={TAPE_HIGHLIGHT} strokeWidth="1.5"/>
              {/* Stitching dashes */}
              <line x1="0" y1={cy - tapeH + 9} x2={svgW} y2={cy - tapeH + 9}
                stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="6 5"/>
              {/* Inner shadow */}
              <rect x="0" y={cy - tapeH} width={svgW} height={tapeH} fill="url(#upperInnerShadow)" opacity="0.5" pointerEvents="none"/>
            </g>

            {/* ── Lower tape segments ── */}
            <g ref={lowerTapeGRef}>
              {Array.from({ length: TAPE_SEGMENTS }, (_, i) => {
                const segX = i * segW
                const segCX = segX + segW / 2
                return (
                  <rect
                    key={`ls-${i}`}
                    data-tape-seg="true"
                    data-tx={segCX}
                    x={segX}
                    y={cy}
                    width={segW + 0.5}
                    height={tapeH}
                    fill={TAPE_COLOR}
                  />
                )
              })}
              <rect x="0" y={cy} width={svgW} height={tapeH} fill="url(#lowerTapeGrad)" pointerEvents="none"/>
              <rect x="0" y={cy} width={svgW} height={tapeH} fill="url(#wovenPat)" pointerEvents="none"/>
              <line x1="0" y1={cy + tapeH - 2} x2={svgW} y2={cy + tapeH - 2} stroke={TAPE_HIGHLIGHT} strokeWidth="1.5"/>
              <line x1="0" y1={cy + tapeH - 9} x2={svgW} y2={cy + tapeH - 9}
                stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="6 5"/>
              <rect x="0" y={cy} width={svgW} height={tapeH} fill="url(#lowerInnerShadow)" opacity="0.5" pointerEvents="none"/>
            </g>

            {/* ── Upper teeth row ── */}
            {/* y positioned just below upper tape inner edge */}
            <g ref={upperTeethRef} transform={`translate(0, ${cy - TOOTH_H / 2 - 2})`}>
              {upperTeethData.map((t) => (
                <g
                  key={t.id}
                  data-tooth="true"
                  data-tx={t.x}
                  style={{ transform: `translateX(${t.x}px)` }}
                  filter="url(#toothShadow)"
                >
                  <path d={toothPath()} fill="url(#toothGrad)"/>
                  <path
                    d={`M${-TOOTH_W/2+2} ${-TOOTH_H/2+1} L${TOOTH_W/2-2} ${-TOOTH_H/2+1} L${TOOTH_W/2-2} 0 L${-TOOTH_W/2+2} 0 Z`}
                    fill="white" fillOpacity="0.18"
                  />
                  <path
                    d={`M${-TOOTH_W/2+2} 1 L${TOOTH_W/2-2} 1 L${TOOTH_W/2-2} ${TOOTH_H/2} L${-TOOTH_W/2+2} ${TOOTH_H/2} Z`}
                    fill="black" fillOpacity="0.2"
                  />
                  <line x1={-TOOTH_W/2+4} y1="0" x2={TOOTH_W/2-4} y2="0"
                    stroke="#3A4250" strokeWidth="0.7" strokeOpacity="0.6"/>
                </g>
              ))}
            </g>

            {/* ── Lower teeth row ── */}
            <g ref={lowerTeethRef} transform={`translate(0, ${cy + TOOTH_H / 2 + 2})`}>
              {lowerTeethData.map((t) => (
                <g
                  key={t.id}
                  data-tooth="true"
                  data-tx={t.x}
                  style={{ transform: `translateX(${t.x}px)` }}
                  filter="url(#toothShadow)"
                >
                  <path d={toothPath()} fill="url(#toothGrad)"/>
                  <path
                    d={`M${-TOOTH_W/2+2} ${-TOOTH_H/2+1} L${TOOTH_W/2-2} ${-TOOTH_H/2+1} L${TOOTH_W/2-2} 0 L${-TOOTH_W/2+2} 0 Z`}
                    fill="white" fillOpacity="0.18"
                  />
                  <path
                    d={`M${-TOOTH_W/2+2} 1 L${TOOTH_W/2-2} 1 L${TOOTH_W/2-2} ${TOOTH_H/2} L${-TOOTH_W/2+2} ${TOOTH_H/2} Z`}
                    fill="black" fillOpacity="0.2"
                  />
                  <line x1={-TOOTH_W/2+4} y1="0" x2={TOOTH_W/2-4} y2="0"
                    stroke="#3A4250" strokeWidth="0.7" strokeOpacity="0.6"/>
                </g>
              ))}
            </g>

            {/* ── Slider ── */}
            {/* Initial translateX = 40 (far left) */}
            <g ref={sliderGRef} style={{ transform: 'translateX(40px)' }}>
              <g transform={`translate(0, ${cy + 20})`} filter="url(#sliderShadow)">
                {/* Slider body */}
                <polygon points="-36,-32  36,-12  36,12  -36,32" fill="url(#sliderBodyGrad)" stroke="#5A6370" strokeWidth="1.2"/>
                <polygon points="-36,-32  36,-12  36,12  -36,32" fill="url(#rimGrad)" opacity="0.6"/>
                <polygon points="-34,-30  34,-11  34,11  -34,30" fill="none" stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.35"/>
                {/* Inner channel */}
                <rect x="-28" y="-6" width="56" height="12" rx="3" fill="#1A2030" opacity="0.8"/>
                {/* Diamond hole */}
                <polygon points="0,-4  6,0  0,4  -6,0" fill="none" stroke="#7B8690" strokeWidth="1"/>
                <polygon points="0,-3  4.5,0  0,3  -4.5,0" fill="#0E1520"/>
                {/* Specular */}
                <polygon points="-32,-28  30,-10  30,-5  -32,-20" fill="white" fillOpacity="0.18"/>

                {/* Pull tab */}
                <g
                  ref={pullTabGRef}
                  style={{ transformOrigin: '-8px 38px' }}
                >
                  {/* Hinge ring */}
                  <ellipse cx="-8" cy="38" rx="8" ry="5" fill="url(#hingeGrad)" stroke="#4A5560" strokeWidth="1"/>
                  <ellipse cx="-8" cy="38" rx="4" ry="2.5" fill="none" stroke="#7A8590" strokeWidth="0.8"/>
                  {/* Tab body */}
                  <g filter="url(#tabShadow)">
                    <rect x="-53" y="46" width="90" height="36" rx="10" fill="url(#pullTabGrad)" stroke="#4A5560" strokeWidth="1.2"/>
                    <rect x="-51" y="48" width="86" height="32" rx="9" fill="none" stroke="#FFF" strokeWidth="0.7" strokeOpacity="0.4"/>
                    <line x1="-40" y1="58" x2="28" y2="58" stroke="#5A6370" strokeWidth="0.8" strokeOpacity="0.7"/>
                    <line x1="-40" y1="64" x2="28" y2="64" stroke="#5A6370" strokeWidth="0.8" strokeOpacity="0.7"/>
                    <rect x="-48" y="48" width="50" height="12" rx="4" fill="white" fillOpacity="0.2"/>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* ── Stat Cards (zig-zag layout) ── */}
        {/*
          Positions:
          above-left  → top-left area
          above-right → top-right area
          below-left  → bottom-left area
          below-right → bottom-right area
          Cards must not overlap the zipper strip (vertically centred region ±14% vh).
        */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} aria-hidden="false">
          {STATS.map((stat, i) => {
            const isAbove = stat.pos.startsWith('above')
            const isLeft  = stat.pos.endsWith('left')
            return (
              <StatCard
                key={stat.value + stat.label}
                ref={(el) => { statCardEls.current[i] = el }}
                value={stat.value}
                label={stat.label}
                accent={stat.accent}
                className={[
                  'absolute w-44 lg:w-52 pointer-events-auto',
                  isAbove ? 'top-[8%]' : 'bottom-[8%]',
                  isLeft  ? 'left-[4%] lg:left-[6%]' : 'right-[4%] lg:right-[6%]',
                  // Slight zig-zag vertical shift
                  isAbove && isLeft  ? 'mt-4'  : '',
                  isAbove && !isLeft ? 'mt-0'  : '',
                  !isAbove && isLeft ? 'mb-0'  : '',
                  !isAbove && !isLeft? 'mb-4'  : '',
                ].join(' ')}
              />
            )
          })}
        </div>

        {/* ── Scroll hint ── */}
        <ScrollHint ref={scrollHintRef} />
      </div>
    </section>
  )
}
