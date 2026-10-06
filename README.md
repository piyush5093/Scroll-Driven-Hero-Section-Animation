# Scroll-Driven Hero Section Animation

This project is a fully autonomous solution for the Itzfizz Digital Web Development Internship assignment. It recreates the concept of a scroll-driven pinned hero animation, featuring an original **Zipper** design instead of a car.

## Concept & Design
- **The Zipper**: A metallic slider head moves from left to right as the user scrolls, perfectly synchronized with the page's scroll progress.
- **The Teeth & Opening**: As the slider passes, the upper and lower zipper teeth separate, revealing a vibrant gradient layer underneath.
- **The Headline**: The headline "WELCOME ITZFIZZ" is revealed exactly where the zipper opens.
- **Stat Cards**: Four animated stat cards enter during the scroll animation with a smooth parallax effect.

## Tech Stack
- **React.js** (Vite)
- **Tailwind CSS v4**
- **GSAP** & `@gsap/react` for complex timelines and ScrollTrigger
- **Lenis** for premium smooth scrolling

## Scroll Timeline (Progress Checkpoints)
| Progress | Action / Visual State |
| --- | --- |
| `0.00` | Slider at left edge, zipper fully closed, opening hidden. |
| `0.00 - 1.00` | Slider moves across the zipper track (`0%` to `100%`). |
| `0.00 - 1.00` | Teeth separate `translateY(-30)` / `(+30)` precisely synced with slider. |
| `0.00 - 1.00` | Headline letters revealed exactly when teeth separate. |
| `0.12` | Stat Card 1 parallax motion. |
| `0.25` | Stat Card 3 parallax motion. |
| `0.45` | Stat Card 2 parallax motion. |
| `0.60` | Stat Card 4 parallax motion. |
| `1.00` | Zipper fully open, slider exited, hero unpins. |

## How the Zipper Effect Works
The entire core animation runs off a single `GSAP ScrollTrigger` timeline tied to the pinned `.stage` container.
- The **slider**'s X translation is driven by the scroll scrub.
- The **opening layer** uses a `clip-path: inset()` synced identically.
- The **teeth** rows are generated programmatically, and their separation is animated using GSAP's `stagger` property. By setting the stagger duration perfectly in tune with the timeline scrub, each tooth parts exactly as the slider object hits its position.

## Local Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.
4. Run `npm run build` to build for production.

## Deployment (GitHub Pages)
This repository is configured to deploy automatically to GitHub Pages.
1. Push your code to GitHub.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. The workflow will automatically build and deploy to GitHub Pages on every push to the main branch.
