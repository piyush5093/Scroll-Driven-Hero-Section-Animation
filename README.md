# Scroll-Driven Hero Section Animation — Itzfizz Digital

> Web Development Internship Assignment — Frontend Animation Challenge

**Live demo:** [https://piyush5093.github.io/Scroll-Driven-Hero-Section-Animation/](https://piyush5093.github.io/Scroll-Driven-Hero-Section-Animation/)

---

## Concept

A **scroll-driven zipper-opening animation** that reveals the company headline.

A photorealistic zipper starts fully closed across the viewport. As the user scrolls, the metal slider moves right-ward, splitting the fabric tapes apart in a **V-shaped wedge** — exactly how a real zipper opens. Behind the tapes, the gradient reveal layer holds the headline **"W E L C O M E  I T Z F I Z Z"**, which becomes visible only through the growing gap. At 100% scroll, the zipper is fully open and the full headline is readable.

**Original concept:** Does NOT replicate the reference car animation; only the scroll-binding mechanic is reused with an original, highly technical SVG zipper implementation.

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI component tree |
| Vite | 8 | Build tool, dev server |
| Tailwind CSS | 4 | CSS-first utility styling |
| GSAP | 3.15 | Intro timeline + scroll animations |
| @gsap/react | 2.1 | `useGSAP` hook (StrictMode-safe) |
| ScrollTrigger | bundled | Pin + scrub scroll binding |
| Lenis | 1.3 | Smooth scroll, synced to GSAP ticker |

---

## File Structure

```text
src/
├── main.jsx               # Entry point — registers GSAP plugins once
├── App.jsx                # Root — initialises Lenis, renders Hero
├── index.css              # Global styles, Tailwind @import, Lenis classes
│
├── lib/
│   └── gsap.js            # GSAP plugin registration (ScrollTrigger + useGSAP)
│
├── hooks/
│   └── useLenis.js        # Lenis smooth scroll, synced to GSAP ticker
│
├── utils/
│   └── computeOffset.js   # Pure function: mathematical V-curve divergence
│
└── components/
    ├── Hero.jsx           # All animation logic + zipper SVG inline render
    └── StatCard.jsx       # Impact metric card — hover lift, number count-up
```

---

## Scroll Timeline

| Progress | Event |
|----------|-------|
| 0%       | Zipper fully closed, slider at far left. Cards hidden. |
| 5%       | **Top-Left** Card (58% — Faster delivery) reveals & counts up. |
| 25%      | **Bottom-Left** Card (23% — Load time) reveals & counts up. |
| 40%      | ~40% of zipper open, headline partly readable. |
| 45%      | **Top-Right** Card (27% — Engagement) reveals & counts up. |
| 65%      | **Bottom-Right** Card (40% — Support) reveals & counts up. |
| 85%      | Slider exits right, zipper fully open. 15% dwell time buffer begins. |
| 100%     | Dwell time ends, scroll pin releases. |

---

## How the Zipper Opening Works

Instead of manipulating heavy DOM segments, the zipper is rendered as a highly optimized inline SVG.

**The V-Curve Algorithm:**
For a tooth at horizontal position `x` with the slider at `sliderX`:
`d = sliderX - x`
- If `d <= 0`: Tooth is ahead of the slider (Closed, `offsetY = 0`)
- If `d > 0`: Tooth is behind the slider (Opening). 
  It diverges using an `easeOutCubic` curve:
  `t = min(d / openLength, 1)`
  `eased = 1 - (1 - t)^3`
  `offsetY = maxGap * eased`

**Seamless Fabric:**
The upper and lower fabric tapes are not individual segments. They are full rectangles masked by dynamic SVG `<clipPath>` polygons. These polygons are mathematically redrawn every frame (`requestAnimationFrame` via GSAP `onUpdate`) to perfectly match the V-curve algorithm. This guarantees zero visual gaps or stitching artifacts.

---

## Performance Decisions

- **Only `transform`, `opacity`, and `points` (SVG)** animated — no layout property reflows.
- **`gsap.quickSetter`** used for all heavy per-frame DOM updates (slider position).
- **DOM Read Caching:** Dimensions cached on `ScrollTrigger.refresh`. Absolutely zero `getBoundingClientRect` calls happen during scrolling.
- **Hardware Acceleration:** `will-change: transform` set on animated teeth and slider.
- **Tick Sync:** `gsap.ticker.add` used to sync GSAP and Lenis into a single, unified RequestAnimationFrame loop. `lagSmoothing(0)` prevents stutter during tab switches.
- **Accessibility:** `prefers-reduced-motion` is respected. If enabled, the pin is skipped and the final fully-open state is shown immediately.

---

## Local Development

```bash
npm install
npm run dev          # ➔ http://localhost:5173/Scroll-Driven-Hero-Section-Animation/
npm run build        # ➔ dist/
```

---

## Deployment (GitHub Pages)

The repository uses **GitHub Actions** for CI/CD deployment.

1. Go to **Settings > Pages** in your repository.
2. Under **Source**, select **GitHub Actions**.
3. Push code to the `master` branch — the workflow in `.github/workflows/deploy.yml` runs automatically.
4. Your site will be built and deployed securely.

> The `VITE_BASE_PATH` env variable in the workflow overrides the base URL to match the repository name exactly.

---

## Design Decisions / Assumptions

| Area | Decision |
|------|----------|
| **Single-page Scope** | Only the hero section exists; the page ends cleanly after the pin. |
| **SVG Teeth Count** | ~100 teeth on desktop / ~50 on mobile for optimal 60fps performance. |
| **Scroll Distance** | 300% extra scroll depth on desktop, 200% on mobile. |
| **Pull-tab Swing** | Pull tab rotates dynamically based on scroll velocity (clamped ±28°). |
| **Dwell Time** | Animation finishes at 85% scroll progress, giving a 15% buffer before unpinning to avoid a rushed ending. |
| **Stack Integrity** | Uses strictly React + GSAP. No Framer Motion, No Next.js, as per constraints. |
