/**
 * src/main.jsx
 * Application entry point.
 * Registers GSAP plugins once via src/lib/gsap.js before React renders.
 */
import './lib/gsap' // register ScrollTrigger + useGSAP once
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
