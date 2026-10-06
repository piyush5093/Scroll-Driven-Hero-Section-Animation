/**
 * src/components/Hero.jsx — FIXED v3
 *
 * Architecture:
 *  z=1  bg gradient  (CSS div)
 *  z=2  reveal layer (gradient band + headline HTML)  ← behind SVG tapes
 *  z=3  SVG          (tapes + teeth + slider, TRANSPARENT bg)
 *  z=4  stat cards   (absolute quadrant wrappers)
 *
 * Tape opening mechanic:
 *  Each tape is a full rect CLIPPED by a polygon (updated every frame).
 *  The polygon follows the computeOffset V-curve → no per-segment per-element drift.
 *  All tape overlays (gradient, texture, stitching) live inside the clipped <g>
 *  so they ALL disappear from the opening area together.
 *
 * Headline: lives in z=2 HTML div. When tapes (z=3) open, the transparent SVG
 *  gap naturally reveals the z=2 headline. Zero opacity issues.
 *
 * Stat cards: each is wrapped in an absolute-positioned <div> with explicit
 *  top/bottom/left/right. GSAP only animates opacity + translateY on these wrappers,
 *  tied directly to the scroll timeline so they appear one-by-one on scroll.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../lib/gsap'
import { computeOffset } from '../utils/computeOffset'
import StatCard from './StatCard'

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG            = '#080410'          // near-black purple-black
const TAPE_COLOR    = '#0F0A20'          // dark purple tape fabric
const TAPE_HL       = '#1A1440'          // lighter tape edge
// Reveal gradient: electric violet → hot pink → vivid orange
const REVEAL_GRAD   = 'linear-gradient(to right, #8B00FF 0%, #FF0080 52%, #FF6600 100%)'

// ── Zipper geometry ───────────────────────────────────────────────────────────
const PITCH   = 18    // px between tooth centres
const TOOTH_W = 22
const TOOTH_H = 14
const CLIP_N  = 48   // V-curve polygon point count (higher = smoother)

// ── Stat card data ─────────────────────────────────────────────────────────────
// quad: TL / TR / BL / BR
const STATS = [
  { value: 58, label: 'Faster project delivery',     accent: 'gold',  quad: 'TL' },
  { value: 27, label: 'Increase in user engagement', accent: 'teal',  quad: 'TR' },
  { value: 23, label: 'Reduction in page load time', accent: 'pink',  quad: 'BL' },
  { value: 40, label: 'Fewer support requests',      accent: 'blue',  quad: 'BR' },
]

// ── SVG helpers ───────────────────────────────────────────────────────────────
function toothPath() {
  const hw = TOOTH_W / 2, hh = TOOTH_H / 2
  return (
    `M ${-hw} ${hh}` +
    ` L ${-hw} ${-hh + 3}` +
    ` Q ${-hw} ${-hh - 2} ${-hw + 4} ${-hh - 2}` +
    ` L ${hw - 4} ${-hh - 2}` +
    ` Q ${hw} ${-hh - 2} ${hw} ${-hh + 3}` +
    ` L ${hw} ${hh} Z`
  )
}

/**
 * Polygon points for the UPPER tape clip.
 * Shape: top-left → top-right → bottom-right (cy) → V inner edge (right→left) → back to top-left.
 */
function upperClipPoints(sliderX, W, cy, tapeH, maxGap, openLength) {
  const pts = [`0,${cy - tapeH}`, `${W},${cy - tapeH}`, `${W},${cy}`]
  for (let i = CLIP_N; i >= 0; i--) {
    const xi = (i / CLIP_N) * W
    const off = computeOffset(xi, sliderX, maxGap, openLength)
    pts.push(`${xi.toFixed(1)},${(cy - off).toFixed(1)}`)
  }
  return pts.join(' ')
}

/**
 * Polygon points for the LOWER tape clip.
 * Shape: V inner edge (left→right) → bottom-right → bottom-left.
 */
function lowerClipPoints(sliderX, W, cy, tapeH, maxGap, openLength) {
  const pts = []
  for (let i = 0; i <= CLIP_N; i++) {
    const xi = (i / CLIP_N) * W
    const off = computeOffset(xi, sliderX, maxGap, openLength)
    pts.push(`${xi.toFixed(1)},${(cy + off).toFixed(1)}`)
  }
  pts.push(`${W},${cy + tapeH}`, `0,${cy + tapeH}`)
  return pts.join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Hero({ lenisRef }) {
  // ── Section + stage refs ──────────────────────────────────────────────────
  const heroRef  = useRef(null)   // #hero tall scroll wrapper
  const stageRef = useRef(null)   // .stage pinned 100vh

  // ── SVG layer refs ────────────────────────────────────────────────────────
  const svgRef         = useRef(null)
  const upperClipRef   = useRef(null)  // <polygon> inside upperTapeClip
  const lowerClipRef   = useRef(null)  // <polygon> inside lowerTapeClip
  const upperTeethRef  = useRef(null)
  const lowerTeethRef  = useRef(null)
  const sliderGRef     = useRef(null)
  const pullTabGRef    = useRef(null)

  // ── Reveal + UI refs ──────────────────────────────────────────────────────
  const headlineRef   = useRef(null)
  const cardRefs      = useRef([])  // wrapper divs, NOT StatCard internals

  // ── Dimensions (updated on resize, used in SVG render) ───────────────────
  const [dims, setDims] = useState(() => ({
    W: typeof window !== 'undefined' ? window.innerWidth : 1440,
    H: typeof window !== 'undefined' ? window.innerHeight : 900,
  }))

  useEffect(() => {
    const update = () => setDims({ W: window.innerWidth, H: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const { W, H } = dims
  const svgH  = Math.round(H * 0.42)   // SVG occupies 42% of viewport height
  const cy    = svgH / 2
  const tapeH = Math.round(svgH * 0.17) // each tape is 17% of SVG height

  const isMobile    = W < 640
  // Enough teeth to cover the full width + a few extra for safety
  const toothCount  = Math.min(120, Math.ceil(W / PITCH) + 4)

  // Pre-build tooth x arrays (memoized via inline const, re-computed on W change)
  const upperTeethX = []
  const lowerTeethX = []
  for (let i = 0; i < toothCount; i++) {
    upperTeethX.push(i * PITCH)
    lowerTeethX.push(i * PITCH + PITCH / 2)  // half-pitch offset → interlock
  }

  // ── Scroll/animation cache (no DOM reads inside scroll callbacks) ─────────
  const cache = useRef({ W: 0, cy: 0, tapeH: 0, maxGap: 0, openLength: 0 })
  const sliderXQ  = useRef(null)   // gsap.quickSetter for slider translateX
  const pullTabQ  = useRef(null)   // gsap.quickSetter for pull-tab rotation
  const prevSX    = useRef(0)

  const refreshCache = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const { width: sw, height: sh } = stage.getBoundingClientRect()
    const _svgH  = Math.round(sh * 0.42)
    const _cy    = _svgH / 2
    const _tapeH = Math.round(_svgH * 0.17)
    // maxGap: half the gap when fully open. Headline font ≤ 6.5rem ≈ 104px.
    // We need 2 × maxGap > 120px → maxGap > 60px. Use tapeH × 3 for comfort.
    const _maxGap     = _tapeH * 3.2
    const _openLength = 270

    cache.current = { W: sw, cy: _cy, tapeH: _tapeH, maxGap: _maxGap, openLength: _openLength }

    if (sliderGRef.current) sliderXQ.current = gsap.quickSetter(sliderGRef.current, 'x', 'px')
    if (pullTabGRef.current) pullTabQ.current = gsap.quickSetter(pullTabGRef.current, 'rotation', 'deg')
  }, [])

  // ── Initial closed-state clip polygon strings (used in SVG render) ────────
  // These match the closed state (offset = 0 everywhere → full rectangles)
  const initUpperClip = `0,${cy - tapeH} ${W},${cy - tapeH} ${W},${cy} 0,${cy}`
  const initLowerClip = `0,${cy} ${W},${cy} ${W},${cy + tapeH} 0,${cy + tapeH}`

  // ── GSAP animation ────────────────────────────────────────────────────────
  useGSAP(
    () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // ── Reduced-motion: show final state, no pin ─────────────────────────
      if (prefersReduced) {
        const els = [headlineRef.current, ...cardRefs.current.filter(Boolean)]
        gsap.set(els, { opacity: 1, y: 0, scale: 1 })
        if (headlineRef.current) headlineRef.current.style.opacity = '1'
        return
      }

      // Stop scroll during intro
      lenisRef?.current?.stop()

      // ── INTRO TIMELINE (~2 s) ─────────────────────────────────────────────
      const intro = gsap.timeline({
        onComplete: () => {
          lenisRef?.current?.start()
          ScrollTrigger.refresh()
        },
      })

      // a) Zipper strip clip-path wipe from left
      if (svgRef.current) {
        gsap.set(svgRef.current, { clipPath: 'inset(0 100% 0 0)' })
        intro.to(svgRef.current, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.out' }, 0)
      }

      // b) Slider back.out settle
      if (sliderGRef.current) {
        gsap.set(sliderGRef.current, { x: -110, opacity: 0 })
        intro.to(sliderGRef.current, { x: 0, opacity: 1, duration: 0.75, ease: 'back.out(1.4)' }, 0.25)
      }

      // c) Stat card wrappers set to initial hidden state (will animate on scroll)
      const validCards = cardRefs.current.filter(Boolean)
      validCards.forEach((wrapper) => {
        gsap.set(wrapper, { opacity: 0, y: 32, scale: 0.94 })
      })

      // ── SCROLL ANIMATION ──────────────────────────────────────────────────
      ScrollTrigger.addEventListener('refreshInit', refreshCache)
      refreshCache()

      const mm = gsap.matchMedia()
      mm.add(
        { desktop: '(min-width: 1024px)', mobile: '(max-width: 1023px)' },
        (ctx) => {
          const scrollEnd = ctx.conditions.desktop ? '+=300%' : '+=200%'

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
                const { W: sw, cy: scCy, tapeH: sTH, maxGap, openLength } = cache.current

                // Dwell time fix: Finish the zipper animation at 85% of the scroll pin.
                // The final 15% gives the user a buffer where the zipper is fully open
                // and the screen remains pinned, preventing a rushed or abrupt ending.
                const zipperP = Math.min(p / 0.85, 1)

                // sliderX travels until the LAST tooth is fully open
                const sliderX = zipperP * (sw + openLength + 60)

                // 1) Slider position
                sliderXQ.current?.(sliderX)

                // 2) Pull-tab velocity swing
                const vel = sliderX - prevSX.current
                prevSX.current = sliderX
                pullTabQ.current?.(Math.max(-28, Math.min(28, vel * 0.85)))

                // 3) Upper/lower tape clip polygons (no DOM reads — all from cache)
                if (upperClipRef.current) {
                  upperClipRef.current.setAttribute(
                    'points',
                    upperClipPoints(sliderX, sw, scCy, sTH, maxGap, openLength)
                  )
                }
                if (lowerClipRef.current) {
                  lowerClipRef.current.setAttribute(
                    'points',
                    lowerClipPoints(sliderX, sw, scCy, sTH, maxGap, openLength)
                  )
                }

                // 4) Individual teeth (visual interlock accuracy)
                const uTeeth = upperTeethRef.current
                  ? Array.from(upperTeethRef.current.querySelectorAll('[data-tooth]'))
                  : []
                const lTeeth = lowerTeethRef.current
                  ? Array.from(lowerTeethRef.current.querySelectorAll('[data-tooth]'))
                  : []

                for (const el of uTeeth) {
                  const tx = parseFloat(el.dataset.tx)
                  const off = computeOffset(tx, sliderX, maxGap, openLength)
                  gsap.set(el, { y: -off })
                }
                for (const el of lTeeth) {
                  const tx = parseFloat(el.dataset.tx)
                  const off = computeOffset(tx, sliderX, maxGap, openLength)
                  gsap.set(el, { y: off })
                }

                // 5) Headline: fade in as zipper opens
                if (headlineRef.current) {
                  headlineRef.current.style.opacity = String(
                    Math.max(0, Math.min(1, (zipperP - 0.1) / 0.35))
                  )
                }
              },
            },
          })

          // Stat card scroll reveals (staggered sequentially as user scrolls down)
          // TL -> BL -> TR -> BR order
          const checkpoints = [0.05, 0.45, 0.25, 0.65] 
          validCards.forEach((wrapper, i) => {
            const cp = checkpoints[i] ?? 0.2
            
            // Animate card fading/sliding in
            scrollTl.to(wrapper, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.15 }, cp)

            // Animate number count-up natively in the scroll scrub
            const numEl = wrapper.querySelector('[data-count]')
            if (numEl) {
              const target = parseInt(numEl.dataset.count, 10)
              scrollTl.fromTo(numEl,
                { textContent: 0 },
                {
                  textContent: target,
                  duration: 0.15,
                  snap: { textContent: 1 }, // Rounds to nearest integer
                  ease: 'none',
                },
                cp
              )
            }
          })

          return () => scrollTl.kill()
        }
      )

      return () => {
        mm.revert()
        ScrollTrigger.removeEventListener('refreshInit', refreshCache)
      }
    },
    { scope: stageRef, dependencies: [W] }
  )

  // ── Tooth JSX ─────────────────────────────────────────────────────────────
  const toothJSX = (xArr, row) =>
    xArr.map((x, i) => (
      <g
        key={`${row}-${i}`}
        data-tooth="true"
        data-tx={x}
        style={{ transform: `translateX(${x}px)`, willChange: 'transform' }}
        filter="url(#toothShadow)"
      >
        <path d={toothPath()} fill="url(#toothGrad)" />
        {/* Specular highlight top-half */}
        <path
          d={`M${-TOOTH_W / 2 + 2} ${-TOOTH_H / 2 + 1} L${TOOTH_W / 2 - 2} ${-TOOTH_H / 2 + 1} L${TOOTH_W / 2 - 2} 0 L${-TOOTH_W / 2 + 2} 0 Z`}
          fill="white" fillOpacity="0.2"
        />
        {/* Shadow bottom-half */}
        <path
          d={`M${-TOOTH_W / 2 + 2} 1 L${TOOTH_W / 2 - 2} 1 L${TOOTH_W / 2 - 2} ${TOOTH_H / 2} L${-TOOTH_W / 2 + 2} ${TOOTH_H / 2} Z`}
          fill="black" fillOpacity="0.22"
        />
      </g>
    ))

  // ── Card quadrant positioning ─────────────────────────────────────────────
  const quadStyle = (quad) => ({
    position: 'absolute',
    top:    (quad === 'TL' || quad === 'TR') ? '7%'  : undefined,
    bottom: (quad === 'BL' || quad === 'BR') ? '7%'  : undefined,
    left:   (quad === 'TL' || quad === 'BL') ? '3%'  : undefined,
    right:  (quad === 'TR' || quad === 'BR') ? '3%'  : undefined,
    width:  isMobile ? '42vw' : '200px',
    // Opacity + transform managed entirely by GSAP
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
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

        {/* ── z=1: Background ─────────────────────────────────────────── */}
        <div
          className="absolute inset-0"
          style={{
            background: BG,
            backgroundImage: `
              radial-gradient(ellipse 60% 50% at 15% 85%, rgba(139,0,255,0.10) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 85% 15%, rgba(255,102,0,0.08) 0%, transparent 60%)
            `,
          }}
          aria-hidden="true"
        />

        {/* ── z=2: REVEAL LAYER (gradient band + headline) ─────────────
            This lives BEHIND the SVG tapes. When tapes open (SVG gap becomes
            transparent), this layer shines through naturally.              */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 2 }}
          aria-hidden="true"
        >
          {/* Gradient reveal band — same height as SVG reveal area */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              height: `${svgH}px`,
              background: REVEAL_GRAD,
              boxShadow: [
                '0 0 100px 20px rgba(139,0,255,0.25)',
                '0 0 200px 40px rgba(255,0,128,0.15)',
              ].join(','),
            }}
          />
          {/* Headline: white, wide letter-spacing, Syne black weight */}
          <h1
            ref={headlineRef}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 900,
              fontSize:   'clamp(1.6rem, 5vw, 6rem)',
              letterSpacing: '0.22em',
              color:      '#FFFFFF',
              whiteSpace: 'nowrap',
              textAlign:  'center',
              position:   'relative',   // above gradient band
              zIndex:     1,
              opacity:    0,            // driven by scroll onUpdate
              textShadow: '0 2px 30px rgba(0,0,0,0.9)',
              willChange: 'opacity',
            }}
            aria-label="Welcome Itzfizz"
          >
            WELCOME&nbsp;&nbsp;ITZFIZZ
          </h1>
        </div>

        {/* ── z=3: SVG (tapes + teeth + slider, transparent bg) ────────
            NO fill rect — background is transparent so z=2 shows through gaps. */}
        <div
          className="absolute inset-0 flex items-center"
          style={{ zIndex: 3, overflow: 'visible' }}
          aria-hidden="true"
        >
          <svg
            ref={svgRef}
            width="100%"
            height={svgH}
            viewBox={`0 0 ${W} ${svgH}`}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              {/* ── Tape V-shape clip paths ─────────────────────────── */}
              <clipPath id="upperTapeClip" clipPathUnits="userSpaceOnUse">
                <polygon ref={upperClipRef} points={initUpperClip} />
              </clipPath>
              <clipPath id="lowerTapeClip" clipPathUnits="userSpaceOnUse">
                <polygon ref={lowerClipRef} points={initLowerClip} />
              </clipPath>

              {/* ── Woven fabric texture ─────────────────────────────── */}
              <pattern id="wovenPat" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <line x1="0" y1="8" x2="8" y2="0" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.07" />
                <line x1="-2" y1="2" x2="2" y2="-2" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.07" />
                <line x1="6" y1="10" x2="10" y2="6" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.07" />
              </pattern>

              {/* ── Tape colour gradients ────────────────────────────── */}
              <linearGradient id="upperTapeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={TAPE_HL} />
                <stop offset="55%"  stopColor={TAPE_COLOR} />
                <stop offset="100%" stopColor="#050213" />
              </linearGradient>
              <linearGradient id="lowerTapeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#050213" />
                <stop offset="45%"  stopColor={TAPE_COLOR} />
                <stop offset="100%" stopColor={TAPE_HL} />
              </linearGradient>
              {/* Inner-edge shadows (depth) */}
              <linearGradient id="upperInnerShadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
              </linearGradient>
              <linearGradient id="lowerInnerShadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(0,0,0,0.55)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              {/* ── Tooth metallic gradient + drop shadow ─────────────── */}
              <linearGradient id="toothGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#D8DEE6" />
                <stop offset="30%"  stopColor="#B0B8C4" />
                <stop offset="70%"  stopColor="#788090" />
                <stop offset="100%" stopColor="#4A5260" />
              </linearGradient>
              <filter id="toothShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
              </filter>

              {/* ── Slider metallic gradients ────────────────────────── */}
              <linearGradient id="sliderGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#E8EDF2" />
                <stop offset="25%"  stopColor="#C5CDD6" />
                <stop offset="50%"  stopColor="#9AA3AD" />
                <stop offset="75%"  stopColor="#C5CDD6" />
                <stop offset="100%" stopColor="#7B8690" />
              </linearGradient>
              <linearGradient id="pullTabGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#D6DDE4" />
                <stop offset="40%"  stopColor="#A8B2BB" />
                <stop offset="100%" stopColor="#6E7880" />
              </linearGradient>
              <radialGradient id="hingeGrad" cx="40%" cy="35%" r="60%">
                <stop offset="0%"   stopColor="#D0D8DF" />
                <stop offset="100%" stopColor="#6A7580" />
              </radialGradient>
              <filter id="sliderShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="2" dy="5" stdDeviation="7" floodColor="#000" floodOpacity="0.7" />
              </filter>
              <filter id="tabShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* ── UPPER TAPE (entire group is V-clipped) ─────────────── */}
            <g clipPath="url(#upperTapeClip)">
              {/* Base fill */}
              <rect x="0" y={cy - tapeH} width={W} height={tapeH} fill={TAPE_COLOR} />
              {/* Colour gradient */}
              <rect x="0" y={cy - tapeH} width={W} height={tapeH} fill="url(#upperTapeGrad)" />
              {/* Woven texture */}
              <rect x="0" y={cy - tapeH} width={W} height={tapeH} fill="url(#wovenPat)" />
              {/* Outer edge highlight */}
              <line x1="0" y1={cy - tapeH + 2} x2={W} y2={cy - tapeH + 2} stroke={TAPE_HL} strokeWidth="1.5" />
              {/* Stitching dashes near outer edge */}
              <line x1="0" y1={cy - tapeH + 10} x2={W} y2={cy - tapeH + 10}
                stroke="#FFF" strokeWidth="0.9" strokeOpacity="0.18" strokeDasharray="6 5" />
              {/* Inner-edge depth shadow */}
              <rect x="0" y={cy - tapeH} width={W} height={tapeH} fill="url(#upperInnerShadow)" opacity="0.6" />
            </g>

            {/* ── LOWER TAPE (entire group is V-clipped) ─────────────── */}
            <g clipPath="url(#lowerTapeClip)">
              <rect x="0" y={cy} width={W} height={tapeH} fill={TAPE_COLOR} />
              <rect x="0" y={cy} width={W} height={tapeH} fill="url(#lowerTapeGrad)" />
              <rect x="0" y={cy} width={W} height={tapeH} fill="url(#wovenPat)" />
              <line x1="0" y1={cy + tapeH - 2} x2={W} y2={cy + tapeH - 2} stroke={TAPE_HL} strokeWidth="1.5" />
              <line x1="0" y1={cy + tapeH - 10} x2={W} y2={cy + tapeH - 10}
                stroke="#FFF" strokeWidth="0.9" strokeOpacity="0.18" strokeDasharray="6 5" />
              <rect x="0" y={cy} width={W} height={tapeH} fill="url(#lowerInnerShadow)" opacity="0.6" />
            </g>

            {/* ── UPPER TEETH ROW ───────────────────────────────────── */}
            {/* Centered just above the tape inner edge (cy) */}
            <g ref={upperTeethRef} transform={`translate(0, ${cy - TOOTH_H / 2 - 1})`}>
              {toothJSX(upperTeethX, 'u')}
            </g>

            {/* ── LOWER TEETH ROW ───────────────────────────────────── */}
            <g ref={lowerTeethRef} transform={`translate(0, ${cy + TOOTH_H / 2 + 1})`}>
              {toothJSX(lowerTeethX, 'l')}
            </g>

            {/* ── SLIDER ────────────────────────────────────────────── */}
            {/* Initial x=40 (far-left), GSAP adds translateX on top */}
            <g ref={sliderGRef} style={{ transform: 'translateX(40px)', willChange: 'transform' }}>
              <g transform={`translate(0, ${cy + 22})`} filter="url(#sliderShadow)">
                {/* Trapezoid body */}
                <polygon
                  points="-36,-32  36,-12  36,12  -36,32"
                  fill="url(#sliderGrad)" stroke="#5A6370" strokeWidth="1.2"
                />
                {/* Inner rim highlight */}
                <polygon
                  points="-34,-30  34,-11  34,11  -34,30"
                  fill="none" stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.35"
                />
                {/* Inner channel */}
                <rect x="-28" y="-6" width="56" height="12" rx="3" fill="#060210" opacity="0.88" />
                {/* Diamond hole */}
                <polygon points="0,-4  6,0  0,4  -6,0" fill="none" stroke="#7B8690" strokeWidth="1" />
                <polygon points="0,-3  4.5,0  0,3  -4.5,0" fill="#0A0520" />
                {/* Top specular sweep */}
                <polygon points="-32,-28  30,-10  30,-4  -32,-18" fill="white" fillOpacity="0.20" />

                {/* Pull tab */}
                <g ref={pullTabGRef} style={{ transformOrigin: '-8px 38px', willChange: 'transform' }}>
                  {/* Hinge ring */}
                  <ellipse cx="-8" cy="38" rx="8" ry="5" fill="url(#hingeGrad)" stroke="#4A5560" strokeWidth="1" />
                  <ellipse cx="-8" cy="38" rx="4" ry="2.5" fill="none" stroke="#7A8590" strokeWidth="0.8" />
                  {/* Tab body */}
                  <g filter="url(#tabShadow)">
                    <rect x="-53" y="46" width="90" height="36" rx="10"
                      fill="url(#pullTabGrad)" stroke="#4A5560" strokeWidth="1.2" />
                    <rect x="-51" y="48" width="86" height="32" rx="9"
                      fill="none" stroke="#FFF" strokeWidth="0.7" strokeOpacity="0.4" />
                    <line x1="-40" y1="58" x2="28" y2="58" stroke="#5A6370" strokeWidth="0.8" strokeOpacity="0.7" />
                    <line x1="-40" y1="64" x2="28" y2="64" stroke="#5A6370" strokeWidth="0.8" strokeOpacity="0.7" />
                    {/* Sheen */}
                    <rect x="-48" y="48" width="50" height="12" rx="4" fill="white" fillOpacity="0.22" />
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* ── z=4: STAT CARDS — 4 fixed quadrant wrappers ─────────────
            Each wrapper has explicit top/bottom/left/right.
            GSAP animates opacity + translateY on the WRAPPER div.
            StatCard inside is always opacity:1 (no self-set initial state). */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
          {STATS.map((stat, i) => (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el }}
              className="pointer-events-auto"
              style={{
                ...quadStyle(stat.quad),
                // GSAP sets opacity:0, y:32, scale:0.94 immediately in useGSAP
                // so we DON'T set any opacity/transform here to avoid conflicts.
              }}
            >
              <StatCard value={stat.value} label={stat.label} accent={stat.accent} />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
