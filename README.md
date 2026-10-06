# Scroll-Driven Hero Section Animation — Itzfizz Digital

> Web Development Internship Assignment · Frontend Animation Challenge

Live demo: **https://&lt;your-username&gt;.github.io/Scroll-Driven-Hero-Section-Animation/**

---

## Concept

A **scroll-driven zipper-opening animation** that reveals the company headline.

A photorealistic zipper starts fully closed across the viewport. As the user scrolls, the
metal slider moves right-ward, splitting the fabric tapes apart in a **V-shaped wedge** — 
exactly how a real zipper opens. Behind the tapes, the gradient reveal layer holds the headline
**"W E L C O M E  I T Z F I Z Z"**, which becomes visible only through the growing gap.
At 100 % scroll, the zipper is fully open and the full headline is readable.

**Original concept** — does NOT replicate the reference car animation; only the scroll-binding
mechanic is reused.

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI component tree |
| Vite | 8 | Build tool, dev server |
| Tailwind CSS | 4 (CSS-first) | Utility styling |
| GSAP | 3.15 | Intro timeline + scroll animations |
| @gsap/react | 2.1 | `useGSAP` hook (StrictMode-safe) |
| ScrollTrigger | bundled | Pin + scrub scroll binding |
| Lenis | 1.3 | Smooth scroll, synced to GSAP ticker |

---

## File Structure

```
src/
├── main.jsx               # Entry point — registers GSAP plugins once
├── App.jsx                # Root — initialises Lenis, renders Hero
├── index.css              # Global styles, Tailwind @import, Lenis classes
│
├── lib/
│   └── gsap.js            # GSAP plugin registration (ScrollTrigger + useGSAP)
│
├── hooks/
│   ├── useLenis.js        # Lenis smooth scroll, synced to GSAP ticker
│   └── useHeroAnimation.js# (unused shell — all logic lives in Hero.jsx)
│
├── utils/
│   ├── computeOffset.js   # Pure function: tooth/tape offset per slider position
│   ├── generateTeeth.js   # Pure function: generate tooth descriptor arrays
│   └── splitText.js       # Splits text into letter spans for stagger animation
│
└── components/
    ├── Hero.jsx            # All animation logic + zipper SVG inline render
    ├── Zipper.jsx          # (reference stub, SVG rendered inside Hero)
    ├── Slider.jsx          # (reference stub, slider rendered inside Hero SVG)
    ├── StatCard.jsx        # Impact metric card — hover lift, number count-up
    └── ScrollHint.jsx      # Scroll indicator with GSAP bounce loop
```

---

## Scroll Timeline

| Progress | Event |
|----------|-------|
| 0 %      | Zipper fully closed, slider at far left, stat card 1 hidden |
| 12 %     | Stat card 1 (58 % — Faster delivery) fades in |
| 25 %     | Stat card 3 (23 % — Load time) fades in |
| 40 %     | ~40 % of zipper open, headline partly readable |
| 45 %     | Stat card 2 (27 % — Engagement) fades in |
| 60 %     | Stat card 4 (40 % — Support) fades in |
| 100 %    | Slider exits right, zipper fully open, full headline visible |

---

## How the Zipper Opening Works

```
Tooth at position x, slider at sliderX:

  d = sliderX - x

  d ≤ 0  →  tooth is AHEAD of slider  →  closed (offsetY = 0)
  d > 0  →  tooth is BEHIND slider    →  opens with easeOutCubic:

    t       = min(d / openLength, 1)
    eased   = 1 - (1 - t)³
    offsetY = maxGap × eased

  Upper tape/teeth: translateY(-offsetY), rotate(-6° × progress)
  Lower tape/teeth: translateY(+offsetY), rotate(+6° × progress)
```

The tapes are split into **60 segments** — each segment queries the same
`computeOffset` function so the tape appears to smoothly bend around the slider.

---

## Performance Decisions

- **Only `transform` and `opacity`** animated — no layout properties.
- `gsap.quickSetter` used for all per-frame updates (tooth/tape/slider transforms).
- Sizes cached on `ScrollTrigger.refresh` — no `getBoundingClientRect` in scroll callbacks.
- `will-change: transform` on animated elements set via inline styles.
- `gsap.ticker.lagSmoothing(0)` prevents stutter during tab switch.
- `gsap.matchMedia` reduces tooth count on mobile for smooth 60 fps.
- `prefers-reduced-motion`: pin is skipped; final state shown immediately.

---

## Local Development

```bash
npm install
npm run dev          # → http://localhost:5173/Scroll-Driven-Hero-Section-Animation/
npm run build        # → dist/
npm run preview      # preview production build
```

---

## Deployment to GitHub Pages

### First-time setup

```bash
git init
git remote add origin https://github.com/<your-username>/Scroll-Driven-Hero-Section-Animation.git
git add .
git commit -m "feat: scroll-driven zipper hero animation"
git push -u origin main
```

### Enable GitHub Pages

1. Go to **Settings → Pages** in your repository.
2. Under **Source**, select **GitHub Actions**.
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` runs automatically.
4. Your site will be live at:
   `https://<your-username>.github.io/Scroll-Driven-Hero-Section-Animation/`

> The `VITE_BASE_PATH` env variable in the workflow sets the correct base URL.
> If you rename the repo, update it in `deploy.yml` and `vite.config.js`.

---

## Design Decisions / Assumptions

| Area | Decision |
|------|----------|
| Single-page | Only the hero section exists; page ends after the pin |
| SVG teeth count | 100 desktop / 50 mobile; can be reduced in `Hero.jsx` |
| Scroll distance | 300 % extra on desktop, 200 % on mobile (`+=300%` / `+=200%`) |
| Pull-tab swing | Velocity-based rotation, clamped ±28°, via `quickSetter` |
| Headline opacity | Driven by scroll progress (opacity = min(p × 3, 1)), not time |
| Intro duration | ~2 s total; Lenis stopped until complete |
| Fonts | Syne (headline) + Inter (body) via Google Fonts |
| No Framer Motion | All animation is GSAP only, per requirements |
| No Next.js | Vite + React (not SSR) per requirements |
