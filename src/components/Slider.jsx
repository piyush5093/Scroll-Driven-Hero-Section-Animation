/**
 * src/components/Slider.jsx
 * The zipper slider rendered as SVG — realistic top-view metal slider.
 * Includes: wedge body, brushed-steel gradient, pull tab with hinge ring,
 * diamond hole, raised rim, and a specular shine element.
 *
 * forwardRef exposes:
 *  - sliderRef  (the outer <g> that GSAP moves in X)
 *  - pullTabRef (the pull-tab <g> that GSAP rotates)
 */
import React, { forwardRef, useImperativeHandle, useRef } from 'react'

const Slider = forwardRef(function Slider(_props, ref) {
  const sliderGroupRef = useRef(null)
  const pullTabGroupRef = useRef(null)

  // Expose both refs via the forwarded ref
  useImperativeHandle(ref, () => ({
    sliderEl: sliderGroupRef.current,
    pullTabEl: pullTabGroupRef.current,
  }))

  return (
    <g ref={sliderGroupRef} aria-label="Zipper slider" role="img">
      {/* ── Slider body (wedge/trapezoid, top-view) ── */}
      {/* Dimensions: front (entry) ~24px wide, back (exit) ~64px wide, length ~72px */}
      {/* Oriented horizontally: teeth enter from right (positive x), exit left (open) */}
      <defs>
        {/* Brushed steel gradient for slider body */}
        <linearGradient id="sliderBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8EDF2" />
          <stop offset="25%" stopColor="#C5CDD6" />
          <stop offset="50%" stopColor="#9AA3AD" />
          <stop offset="75%" stopColor="#C5CDD6" />
          <stop offset="100%" stopColor="#7B8690" />
        </linearGradient>

        {/* Pull tab gradient */}
        <linearGradient id="pullTabGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D6DDE4" />
          <stop offset="40%" stopColor="#A8B2BB" />
          <stop offset="100%" stopColor="#6E7880" />
        </linearGradient>

        {/* Inner shadow/rim for depth */}
        <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>

        {/* Specular sweep */}
        <linearGradient id="specularGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Drop shadow filter */}
        <filter id="sliderShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
        </filter>

        {/* Hinge ring gradient */}
        <radialGradient id="hingeGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#D0D8DF" />
          <stop offset="100%" stopColor="#6A7580" />
        </radialGradient>

        {/* Pull tab long shadow */}
        <filter id="tabShadow" x="-30%" y="-30%" width="180%" height="180%">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.55" />
        </filter>
      </defs>

      {/*
        Slider body — trapezoid shape (top-view):
        Front (where teeth enter, right side in open direction): narrow gap ~24px
        Back (where zipper opens, left side): wide gap ~64px
        Body length: ~72px
        Center of slider at (0, 0)
      */}
      <g filter="url(#sliderShadow)">
        {/* Main body polygon */}
        <polygon
          points="-36,-32  36,-12  36,12  -36,32"
          fill="url(#sliderBodyGrad)"
          stroke="#5A6370"
          strokeWidth="1.2"
          rx="4"
        />

        {/* Rim highlight overlay */}
        <polygon
          points="-36,-32  36,-12  36,12  -36,32"
          fill="url(#rimGrad)"
          opacity="0.6"
        />

        {/* Raised outer rim (stroke only) */}
        <polygon
          points="-34,-30  34,-11  34,11  -34,30"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeOpacity="0.35"
        />

        {/* Inner channel (where teeth run through) */}
        <rect x="-28" y="-6" width="56" height="12" rx="3" fill="#1A2030" opacity="0.8" />

        {/* Diamond hole (decorative centre detail) */}
        <polygon
          points="0,-4  6,0  0,4  -6,0"
          fill="none"
          stroke="#7B8690"
          strokeWidth="1"
        />
        <polygon
          points="0,-3  4.5,0  0,3  -4.5,0"
          fill="#0E1520"
        />

        {/* Top specular shine strip */}
        <polygon
          points="-32,-28  30,-10  30,-5  -32,-20"
          fill="url(#specularGrad)"
          opacity="0.5"
        />
      </g>

      {/* ── Pull tab attached below (when horizontal zipper, tab hangs down) ── */}
      {/* Hinge ring at approx (−8, 38) below slider body */}
      <g ref={pullTabGroupRef} style={{ transformOrigin: '-8px 38px' }}>
        {/* Hinge ring */}
        <ellipse
          cx="-8"
          cy="38"
          rx="8"
          ry="5"
          fill="url(#hingeGrad)"
          stroke="#4A5560"
          strokeWidth="1"
        />
        <ellipse
          cx="-8"
          cy="38"
          rx="4"
          ry="2.5"
          fill="none"
          stroke="#7A8590"
          strokeWidth="0.8"
        />

        {/* Pull tab body: rounded rect */}
        <g filter="url(#tabShadow)">
          <rect
            x="-53"
            y="46"
            width="90"
            height="36"
            rx="10"
            fill="url(#pullTabGrad)"
            stroke="#4A5560"
            strokeWidth="1.2"
          />
          {/* Rim highlight */}
          <rect
            x="-51"
            y="48"
            width="86"
            height="32"
            rx="9"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.7"
            strokeOpacity="0.4"
          />
          {/* Horizontal groove lines */}
          <line x1="-40" y1="58" x2="28" y2="58" stroke="#5A6370" strokeWidth="0.8" strokeOpacity="0.7" />
          <line x1="-40" y1="64" x2="28" y2="64" stroke="#5A6370" strokeWidth="0.8" strokeOpacity="0.7" />
          {/* Specular sheen */}
          <rect x="-48" y="48" width="50" height="12" rx="4" fill="white" fillOpacity="0.2" />
        </g>
      </g>
    </g>
  )
})

export default Slider
