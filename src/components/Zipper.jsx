/**
 * src/components/Zipper.jsx
 * The full zipper rendered as a single inline SVG.
 * Anatomy:
 *  - Reveal layer (gradient bg + headline) — behind everything
 *  - Upper tape (segmented for wave deformation)
 *  - Lower tape (mirrored)
 *  - Upper teeth row
 *  - Lower teeth row (offset by half pitch for interlock)
 *  - Slider (the hero object, animated by GSAP)
 *
 * All refs forwarded to useHeroAnimation for GSAP control.
 */
import React, { forwardRef, useImperativeHandle, useRef, useMemo } from 'react'
import { generateTeeth } from '../utils/generateTeeth'
import Slider from './Slider'

// ── Constants ────────────────────────────────────────────────────────────────
const TAPE_COLOR = '#141B34'
const TAPE_HIGHLIGHT = '#1E2A50'
const PITCH = 18           // px between teeth centers
const TOOTH_W = 22         // tooth bounding width
const TOOTH_H = 14         // tooth bounding height
const TAPE_SEGMENTS = 60   // how many tape segments to use for smooth curve

/**
 * Draw a single tooth shape as an SVG path (centered at 0,0).
 * Rounded top (bulge), slightly narrower bottom.
 */
function toothPath() {
  // Slightly bulged rectangular shape with rounded top
  const hw = TOOTH_W / 2
  const hh = TOOTH_H / 2
  // Using a path with rounded corners and a slight top bulge
  return `M ${-hw} ${hh}
    L ${-hw} ${-hh + 3}
    Q ${-hw} ${-hh - 2} ${-hw + 4} ${-hh - 2}
    L ${hw - 4} ${-hh - 2}
    Q ${hw} ${-hh - 2} ${hw} ${-hh + 3}
    L ${hw} ${hh}
    Z`
}

/**
 * Single Tooth component (memoized for performance).
 * Uses data-tx and data-tooth attributes for GSAP to read x-position.
 */
const Tooth = React.memo(function Tooth({ x, row, sign, index }) {
  const gradId = `toothGrad-${row}-${index}`
  const shadowId = `toothShadow-${row}-${index}`

  return (
    <g
      data-tooth="true"
      data-tx={x}
      style={{ transform: `translateX(${x}px)` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D8DEE6" />
          <stop offset="30%" stopColor="#B0B8C4" />
          <stop offset="70%" stopColor="#788090" />
          <stop offset="100%" stopColor="#4A5260" />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        {/* Main tooth body */}
        <path d={toothPath()} fill={`url(#${gradId})`} />
        {/* Specular highlight on top half */}
        <path
          d={`M ${-TOOTH_W / 2 + 2} ${-TOOTH_H / 2 + 1} L ${TOOTH_W / 2 - 2} ${-TOOTH_H / 2 + 1} L ${TOOTH_W / 2 - 2} 0 L ${-TOOTH_W / 2 + 2} 0 Z`}
          fill="white"
          fillOpacity="0.18"
        />
        {/* Bottom shadow */}
        <path
          d={`M ${-TOOTH_W / 2 + 2} 1 L ${TOOTH_W / 2 - 2} 1 L ${TOOTH_W / 2 - 2} ${TOOTH_H / 2} L ${-TOOTH_W / 2 + 2} ${TOOTH_H / 2} Z`}
          fill="black"
          fillOpacity="0.2"
        />
        {/* Centre indentation line (realism) */}
        <line
          x1={-TOOTH_W / 2 + 4}
          y1="0"
          x2={TOOTH_W / 2 - 4}
          y2="0"
          stroke="#3A4250"
          strokeWidth="0.7"
          strokeOpacity="0.6"
        />
      </g>
    </g>
  )
})

/**
 * TapeSegment — a single slice of the tape for smooth deformation.
 * data-tx is the x centre of this segment, read by GSAP.
 */
function TapeSegment({ x, width, height, row, index }) {
  return (
    <rect
      data-tape-seg="true"
      data-tx={x + width / 2}
      x={x}
      y={row === 'upper' ? -height : 0}
      width={width}
      height={height}
      fill={TAPE_COLOR}
      aria-hidden="true"
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const Zipper = forwardRef(function Zipper(
  { width = 1440, height = 500, isMobile = false },
  ref
) {
  const sliderRef = useRef(null)
  const pullTabRef = useRef(null)
  const upperTeethGroupRef = useRef(null)
  const lowerTeethGroupRef = useRef(null)
  const upperTapeRef = useRef(null)
  const lowerTapeRef = useRef(null)
  const headlineRef = useRef(null)
  const svgRef = useRef(null)

  // Expose refs
  useImperativeHandle(ref, () => ({
    svgEl: svgRef.current,
    sliderEl: sliderRef.current?.sliderEl,
    pullTabEl: sliderRef.current?.pullTabEl,
    upperTeethGroupEl: upperTeethGroupRef.current,
    lowerTeethGroupEl: lowerTeethGroupRef.current,
    upperTapeEl: upperTapeRef.current,
    lowerTapeEl: lowerTapeRef.current,
    headlineEl: headlineRef.current,
  }))

  // ── Geometry ─────────────────────────────────────────────────────────────
  const toothCount = isMobile ? 50 : 100
  const svgW = width
  const svgH = height
  const cx = svgW / 2  // horizontal center
  const cy = svgH / 2  // vertical center of zipper strip

  // Tape strip: each tape is tapeH px tall. They meet at cy.
  const tapeH = svgH * 0.14  // 14% of stage height per tape

  // Generate teeth data
  const upperTeeth = useMemo(
    () =>
      generateTeeth({
        count: toothCount,
        pitch: PITCH,
        startX: 0,
        row: 'upper',
      }),
    [toothCount]
  )

  const lowerTeeth = useMemo(
    () =>
      generateTeeth({
        count: toothCount,
        pitch: PITCH,
        startX: 0,
        row: 'lower',
      }),
    [toothCount]
  )

  // Tape segments for deformation
  const segmentW = svgW / TAPE_SEGMENTS

  return (
    <svg
      ref={svgRef}
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {/* ── Woven texture for tapes ── */}
        <pattern id="wovenPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="8" x2="8" y2="0" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.06" />
          <line x1="-2" y1="2" x2="2" y2="-2" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.06" />
          <line x1="6" y1="10" x2="10" y2="6" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.06" />
        </pattern>

        {/* ── Tape inner edge gradient (depth) ── */}
        <linearGradient id="upperEdgeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TAPE_HIGHLIGHT} />
          <stop offset="40%" stopColor={TAPE_COLOR} />
          <stop offset="100%" stopColor="#0A1020" />
        </linearGradient>
        <linearGradient id="lowerEdgeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A1020" />
          <stop offset="60%" stopColor={TAPE_COLOR} />
          <stop offset="100%" stopColor={TAPE_HIGHLIGHT} />
        </linearGradient>

        {/* ── Inner shadow on tape edges (depth) ── */}
        <linearGradient id="upperInnerShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </linearGradient>
        <linearGradient id="lowerInnerShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>

        {/* ── Reveal gradient (violet → cyan) behind tapes ── */}
        <linearGradient id="revealGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>

        {/* Glow filter for reveal layer */}
        <filter id="revealGlow" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="18" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stitching dash line clip */}
        <clipPath id="upperTapeClip">
          <rect x="0" y={cy - tapeH - 4} width={svgW} height={tapeH + 4} />
        </clipPath>
        <clipPath id="lowerTapeClip">
          <rect x="0" y={cy} width={svgW} height={tapeH + 4} />
        </clipPath>
      </defs>

      {/* ══ LAYER 1: Reveal layer (behind everything) ══ */}
      <g aria-hidden="true">
        {/* Full reveal gradient background spanning zipper height */}
        <rect
          x="0"
          y={cy - tapeH * 2.2}
          width={svgW}
          height={tapeH * 4.4}
          fill="url(#revealGrad)"
          opacity="0.9"
          filter="url(#revealGlow)"
        />
        {/* Subtle radial glow in center */}
        <ellipse
          cx={svgW / 2}
          cy={cy}
          rx={svgW * 0.35}
          ry={tapeH * 2}
          fill="#22D3EE"
          fillOpacity="0.12"
        />
      </g>

      {/* ══ LAYER 2: Upper tape (segmented rectangles) ══ */}
      <g ref={upperTapeRef} clipPath="url(#upperTapeClip)">
        {/* Tape base layer */}
        {Array.from({ length: TAPE_SEGMENTS }, (_, i) => (
          <TapeSegment
            key={`upper-seg-${i}`}
            x={i * segmentW}
            width={segmentW + 1} /* +1 to avoid sub-pixel gaps */
            height={tapeH}
            row="upper"
            index={i}
          />
        ))}
        {/* Gradient overlay on tape */}
        <rect
          x="0"
          y={cy - tapeH}
          width={svgW}
          height={tapeH}
          fill="url(#upperEdgeGrad)"
          pointerEvents="none"
        />
        {/* Woven texture overlay */}
        <rect
          x="0"
          y={cy - tapeH}
          width={svgW}
          height={tapeH}
          fill="url(#wovenPattern)"
          pointerEvents="none"
        />
        {/* Outer edge highlight line */}
        <line
          x1="0" y1={cy - tapeH + 2}
          x2={svgW} y2={cy - tapeH + 2}
          stroke={TAPE_HIGHLIGHT}
          strokeWidth="1.5"
        />
        {/* Dashed stitching line near outer edge */}
        <line
          x1="0" y1={cy - tapeH + 8}
          x2={svgW} y2={cy - tapeH + 8}
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeOpacity="0.18"
          strokeDasharray="6 5"
        />
        {/* Inner shadow for depth */}
        <rect
          x="0"
          y={cy - tapeH}
          width={svgW}
          height={tapeH}
          fill="url(#upperInnerShadow)"
          pointerEvents="none"
          opacity="0.5"
        />
      </g>

      {/* ══ LAYER 3: Lower tape (segmented, mirrored) ══ */}
      <g ref={lowerTapeRef} clipPath="url(#lowerTapeClip)">
        {Array.from({ length: TAPE_SEGMENTS }, (_, i) => (
          <TapeSegment
            key={`lower-seg-${i}`}
            x={i * segmentW}
            width={segmentW + 1}
            height={tapeH}
            row="lower"
            index={i}
          />
        ))}
        <rect
          x="0"
          y={cy}
          width={svgW}
          height={tapeH}
          fill="url(#lowerEdgeGrad)"
          pointerEvents="none"
        />
        <rect
          x="0"
          y={cy}
          width={svgW}
          height={tapeH}
          fill="url(#wovenPattern)"
          pointerEvents="none"
        />
        {/* Outer edge highlight */}
        <line
          x1="0" y1={cy + tapeH - 2}
          x2={svgW} y2={cy + tapeH - 2}
          stroke={TAPE_HIGHLIGHT}
          strokeWidth="1.5"
        />
        {/* Dashed stitching */}
        <line
          x1="0" y1={cy + tapeH - 8}
          x2={svgW} y2={cy + tapeH - 8}
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeOpacity="0.18"
          strokeDasharray="6 5"
        />
        {/* Inner shadow */}
        <rect
          x="0"
          y={cy}
          width={svgW}
          height={tapeH}
          fill="url(#lowerInnerShadow)"
          pointerEvents="none"
          opacity="0.5"
        />
      </g>

      {/* ══ LAYER 4: Upper teeth row ══ */}
      {/* Upper teeth sit just below the upper tape's inner edge (at cy - ~7px) */}
      <g
        ref={upperTeethGroupRef}
        transform={`translate(0, ${cy - TOOTH_H / 2 - 1})`}
      >
        {upperTeeth.map((tooth, i) => (
          <Tooth
            key={tooth.id}
            x={tooth.x}
            row="upper"
            sign={-1}
            index={i}
          />
        ))}
      </g>

      {/* ══ LAYER 5: Lower teeth row ══ */}
      {/* Lower teeth at cy + ~7px */}
      <g
        ref={lowerTeethGroupRef}
        transform={`translate(0, ${cy + TOOTH_H / 2 + 1})`}
      >
        {lowerTeeth.map((tooth, i) => (
          <Tooth
            key={tooth.id}
            x={tooth.x}
            row="lower"
            sign={1}
            index={i}
          />
        ))}
      </g>

      {/* ══ LAYER 6: Slider ══ */}
      {/* Initial position: far left (x = sliderWidth/2) — GSAP will translateX */}
      <g transform={`translate(40, ${cy + 20})`}>
        <Slider ref={sliderRef} />
      </g>
    </svg>
  )
})

export default Zipper
