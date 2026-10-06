/**
 * src/App.jsx
 * Root application component.
 * Initialises Lenis smooth scroll and renders the single Hero section.
 */
import './index.css'
import Hero from './components/Hero'
import { useLenis } from './hooks/useLenis'

export default function App() {
  const lenisRef = useLenis()

  return (
    <main>
      <Hero lenisRef={lenisRef} />
    </main>
  )
}
