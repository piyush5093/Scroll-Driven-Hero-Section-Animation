/**
 * src/hooks/useHeroAnimation.js
 * All GSAP animation logic for the Hero section.
 *
 * Two phases:
 *  1. INTRO  – time-based (~2 s) plays on mount; Lenis is stopped until done.
 *  2. SCROLL – scrubbed ScrollTrigger drives zipper progress (p 0→1).
 *
 * Tooth/tape offsets are updated inside ScrollTrigger.onUpdate via gsap.quickSetter
 * so we never touch getBoundingClientRect inside a scroll callback.
 */
import { useRef, useCallback } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../lib/gsap'
import { computeOffset } from '../utils/computeOffset'

/**
 * @param {object} refs – forwarded refs from Hero.jsx
 * @param {React.RefObject} refs.stageRef
 * @param {React.RefObject} refs.sliderRef
 * @param {React.RefObject} refs.pullTabRef
 * @param {React.RefObject} refs.upperTeethGroupRef
 * @param {React.RefObject} refs.lowerTeethGroupRef
 * @param {React.RefObject} refs.upperTapeRef
 * @param {React.RefObject} refs.lowerTapeRef
 * @param {React.RefObject} refs.headlineRef
 * @param {React.RefObject} refs.statCardsRef  – array ref
 * @param {React.RefObject} refs.scrollHintRef
 * @param {React.RefObject} refs.zipperSvgRef
 * @param {React.RefObject} refs.lenisRef
 */
export function useHeroAnimation(refs) {
  const {
    stageRef,
    sliderRef,
    pullTabRef,
    upperTeethGroupRef,
    lowerTeethGroupRef,
    upperTapeRef,
    lowerTapeRef,
    headlineRef,
    statCardsRef,
    scrollHintRef,
    zipperSvgRef,
    lenisRef,
  } = refs

  // Cache sizing values to avoid repeated DOM reads in scroll callbacks
  const cache = useRef({
    zipperWidth: 0,
    sliderWidth: 0,
    maxGap: 0,
    openLength: 200,
    upperTeethEls: [],
    lowerTeethEls: [],
    upperTapeSegments: [],
    lowerTapeSegments: [],
  })

  // Setters created once per scroll setup (gsap.quickSetter is cheap)
  const setterCache = useRef({})

  // ─── Helper: refresh cached sizes ────────────────────────────────────────
  const refreshCache = useCallback(() => {
    const stage = stageRef.current
    const slider = sliderRef.current
    if (!stage || !slider) return
    const stageRect = stage.getBoundingClientRect()
    const sliderRect = slider.getBoundingClientRect()
    cache.current.zipperWidth = stageRect.width
    cache.current.sliderWidth = sliderRect.width
    // maxGap: ~55% of half the zipper strip height (the strip is ~28% viewport)
    const zipperStripH = stageRect.height * 0.28
    cache.current.maxGap = zipperStripH * 0.55

    // Cache upper/lower tooth elements for fast iteration
    if (upperTeethGroupRef.current) {
      cache.current.upperTeethEls = Array.from(
        upperTeethGroupRef.current.querySelectorAll('[data-tooth]')
      )
    }
    if (lowerTeethGroupRef.current) {
      cache.current.lowerTeethEls = Array.from(
        lowerTeethGroupRef.current.querySelectorAll('[data-tooth]')
      )
    }
    // Cache tape segment elements
    if (upperTapeRef.current) {
      cache.current.upperTapeSegments = Array.from(
        upperTapeRef.current.querySelectorAll('[data-tape-seg]')
      )
    }
    if (lowerTapeRef.current) {
      cache.current.lowerTapeSegments = Array.from(
        lowerTapeRef.current.querySelectorAll('[data-tape-seg]')
      )
    }

    // Build/rebuild quickSetters for slider and pull tab
    if (sliderRef.current) {
      setterCache.current.sliderX = gsap.quickSetter(sliderRef.current, 'x', 'px')
    }
    if (pullTabRef.current) {
      setterCache.current.pullTabRotate = gsap.quickSetter(pullTabRef.current, 'rotation', 'deg')
    }
  }, [stageRef, sliderRef, pullTabRef, upperTeethGroupRef, lowerTeethGroupRef, upperTapeRef, lowerTapeRef])

  // ─── GSAP context (StrictMode-safe) ──────────────────────────────────────
  useGSAP(
    () => {
      // --- reduced-motion: skip intro, show final state, no pin ---
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced) {
        // Show everything immediately
        gsap.set(
          [
            stageRef.current,
            sliderRef.current,
            headlineRef.current,
            ...(statCardsRef.current || []),
            scrollHintRef.current,
          ],
          { opacity: 1, y: 0, scale: 1 }
        )
        return
      }

      // Stop scroll during intro
      if (lenisRef.current) lenisRef.current.stop()

      // ══ PHASE 1: INTRO TIMELINE (time-based, ~2s) ══
      const intro = gsap.timeline({
        onComplete: () => {
          if (lenisRef.current) lenisRef.current.start()
        },
      })

      // 1a – Zipper strip fades/scales in from the left (clip-path scaleX)
      if (zipperSvgRef.current) {
        gsap.set(zipperSvgRef.current, { clipPath: 'inset(0 100% 0 0)', opacity: 1 })
        intro.to(
          zipperSvgRef.current,
          {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.9,
            ease: 'expo.out',
          },
          0
        )
      }

      // 1b – Slider settles at far left with slight overshoot
      if (sliderRef.current) {
        gsap.set(sliderRef.current, { x: -120, opacity: 0 })
        intro.to(
          sliderRef.current,
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'back.out(1.4)',
          },
          0.3
        )
      }

      // 1c – Stat cards one-by-one (stagger 0.15s), with number count-up
      const cards = statCardsRef.current || []
      cards.forEach((card, i) => {
        if (!card) return
        gsap.set(card, { opacity: 0, y: 40, scale: 0.94 })
        intro.to(
          card,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: 'power3.out',
          },
          0.6 + i * 0.15
        )

        // Animate number counter
        const numEl = card.querySelector('[data-count]')
        if (numEl) {
          const target = parseInt(numEl.dataset.count, 10)
          const counter = { val: 0 }
          intro.to(
            counter,
            {
              val: target,
              duration: 0.8,
              ease: 'power2.out',
              onUpdate() {
                numEl.textContent = Math.round(counter.val) + '%'
              },
            },
            0.7 + i * 0.15
          )
        }
      })

      // 1d – Scroll hint fades in with looping bounce
      if (scrollHintRef.current) {
        gsap.set(scrollHintRef.current, { opacity: 0, y: 10 })
        intro.to(
          scrollHintRef.current,
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
          1.4
        )
        // Bounce loop
        intro.add(() => {
          gsap.to(scrollHintRef.current, {
            y: 8,
            duration: 0.6,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          })
        }, 1.9)
      }

      // ══ PHASE 2: SCROLL ANIMATION ══
      // Set up after a tick so ScrollTrigger sees correct geometry
      ScrollTrigger.refresh()

      // Refresh cache before each ScrollTrigger refresh
      ScrollTrigger.addEventListener('refreshInit', refreshCache)

      // Initial cache fill
      refreshCache()

      let prevSliderX = 0

      // matchMedia for responsive scroll distance
      const mm = gsap.matchMedia()

      mm.add(
        {
          isDesktop: '(min-width: 1024px)',
          isTablet: '(min-width: 640px) and (max-width: 1023px)',
          isMobile: '(max-width: 639px)',
        },
        (context) => {
          const { isDesktop } = context.conditions
          const scrollDist = isDesktop ? '+=300%' : '+=200%'

          // Master scroll timeline
          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: '#hero',
              start: 'top top',
              end: scrollDist,
              pin: '.stage',
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefresh: refreshCache,
              onUpdate(self) {
                const p = self.progress
                const { zipperWidth, sliderWidth, maxGap, openLength } = cache.current

                // sliderX: moves from 0 to zipperWidth + sliderWidth
                const sliderX = p * (zipperWidth + sliderWidth)

                // Move slider
                if (setterCache.current.sliderX) {
                  setterCache.current.sliderX(sliderX)
                }

                // Velocity for pull-tab swing
                const velocity = sliderX - prevSliderX
                prevSliderX = sliderX
                if (setterCache.current.pullTabRotate) {
                  const targetRot = Math.max(-25, Math.min(25, velocity * 0.8))
                  setterCache.current.pullTabRotate(targetRot)
                }

                // Update teeth positions
                const updateTeeth = (els, sign) => {
                  for (let i = 0; i < els.length; i++) {
                    const el = els[i]
                    const tx = parseFloat(el.dataset.tx || 0)
                    const offsetY = computeOffset(tx, sliderX, maxGap, openLength)
                    gsap.set(el, {
                      y: sign * offsetY,
                      rotation: sign * Math.min(offsetY / maxGap, 1) * 6,
                    })
                  }
                }
                updateTeeth(cache.current.upperTeethEls, -1)
                updateTeeth(cache.current.lowerTeethEls, 1)

                // Update tape segments
                const updateSegments = (segs, sign) => {
                  for (let i = 0; i < segs.length; i++) {
                    const seg = segs[i]
                    const tx = parseFloat(seg.dataset.tx || 0)
                    const offsetY = computeOffset(tx, sliderX, maxGap, openLength)
                    gsap.set(seg, {
                      y: sign * offsetY,
                    })
                  }
                }
                updateSegments(cache.current.upperTapeSegments, -1)
                updateSegments(cache.current.lowerTapeSegments, 1)
              },
            },
          })

          // Stat card reveals at checkpoints (opacity + y + scale only)
          const checkpoints = [0.12, 0.45, 0.25, 0.6]
          cards.forEach((card, i) => {
            if (!card) return
            const cp = checkpoints[i] || 0.2 + i * 0.15
            scrollTl.to(
              card,
              {
                opacity: 1,
                y: 0,
                scale: 1,
                ease: 'power2.out',
              },
              cp
            )
          })

          return () => {
            scrollTl.kill()
          }
        }
      )

      return () => {
        mm.revert()
        ScrollTrigger.removeEventListener('refreshInit', refreshCache)
      }
    },
    { scope: stageRef, dependencies: [] }
  )
}
