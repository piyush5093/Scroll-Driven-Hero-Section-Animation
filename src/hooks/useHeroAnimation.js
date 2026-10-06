import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { lenisInstance } from './useLenis';

export const useHeroAnimation = (containerRef) => {
  const tlRef = useRef();

  useGSAP(() => {
    // Media queries
    let isDesktop = window.innerWidth >= 1024;
    let isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    let isMobile = window.innerWidth < 640;

    // Elements
    const track = containerRef.current.querySelector('.zipper-track');
    const slider = containerRef.current.querySelector('.zipper-slider');
    const sliderBody = containerRef.current.querySelector('.slider-body');
    const sliderShine = containerRef.current.querySelector('.slider-shine');
    const pullTab = containerRef.current.querySelector('.pull-tab');
    const opening = containerRef.current.querySelector('.zipper-opening');
    const headlineChars = containerRef.current.querySelectorAll('.headline-char');
    const topTeeth = containerRef.current.querySelectorAll('.tooth-top');
    const bottomTeeth = containerRef.current.querySelectorAll('.tooth-bottom');
    const scrollHint = containerRef.current.querySelector('.scroll-hint');
    const scrollArrow = containerRef.current.querySelector('.scroll-arrow');
    const statCards = containerRef.current.querySelectorAll('.stat-card');

    // Reset styles for StrictMode double-fire safety
    gsap.set(track, { scaleX: 0 });
    gsap.set(slider, { x: -150, opacity: 0 }); // start offscreen left
    gsap.set(opening, { opacity: 0, clipPath: 'inset(0 100% 0 0)' });
    gsap.set(topTeeth, { opacity: 0, y: 10 });
    gsap.set(bottomTeeth, { opacity: 0, y: -10 });
    gsap.set(statCards, { opacity: 0, y: 40, scale: 0.94 });
    gsap.set(headlineChars, { opacity: 0, y: 20 });
    gsap.set(scrollHint, { opacity: 0 });
    
    // Stop lenis initially
    if (lenisInstance) lenisInstance.stop();

    // INTRO TIMELINE
    const introTl = gsap.timeline({
      onComplete: () => {
        if (lenisInstance) lenisInstance.start();
        
        // Bounce arrow loop
        gsap.to(scrollArrow, {
          y: 8,
          duration: 0.8,
          yoyo: true,
          repeat: -1,
          ease: 'power1.inOut'
        });
      }
    });

    introTl
      // 1. Zipper strip wipes in
      .to(track, { scaleX: 1, duration: 0.9, ease: 'expo.out' })
      // 2. Slider drops/slides in
      .to(slider, { x: 0, opacity: 1, duration: 1, ease: 'back.out(1.4)' }, '-=0.5')
      // Teeth settle
      .to([topTeeth, bottomTeeth], { opacity: 1, y: 0, duration: 0.5, stagger: 0.005, ease: 'power3.out' }, '-=0.8')
      // 3. Headline teaser (show first letter only)
      .to(opening, { opacity: 1, duration: 0.5 }, '-=0.5')
      // 4 & 5. Stat cards appear + count up
      .to(statCards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        onStart() {
          // Count up logic
          statCards.forEach((card, i) => {
            const valEl = card.querySelector('.stat-value');
            const targetVal = parseInt(valEl.getAttribute('data-val'), 10);
            gsap.to(valEl, {
              innerHTML: targetVal,
              duration: 1.5,
              delay: i * 0.15 + 0.2, // sync with stagger
              snap: { innerHTML: 1 },
              ease: 'power2.out',
              onUpdate: function() {
                valEl.innerHTML = Math.round(this.targets()[0].innerHTML) + '%';
              }
            });
          });
        }
      }, '-=0.4')
      // 6. ScrollHint fades in
      .to(scrollHint, { opacity: 1, duration: 0.5 }, '-=0.2');

    // SCROLL TIMELINE
    const scrollDistance = isMobile ? '+=200%' : '+=300%';
    
    // Create function-based values so they recalculate on resize
    const getZipperWidth = () => containerRef.current.querySelector('.zipper-container').offsetWidth;
    const getSliderWidth = () => slider.offsetWidth;
    
    tlRef.current = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: scrollDistance,
        pin: '.stage',
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      }
    });

    const scrollTl = tlRef.current;
    
    // We animate a dummy object to track progress 0 to 1 smoothly
    const progressObj = { value: 0 };
    
    scrollTl.to(progressObj, {
      value: 1,
      ease: 'none',
      duration: 1
    }, 0);

    // Slider moves from 0 to (zipper width)
    scrollTl.to(slider, {
      x: () => getZipperWidth() + 20, // push it slightly off-screen
      ease: 'none',
      duration: 1
    }, 0);

    // Opening clip-path reveals exactly with slider
    scrollTl.to(opening, {
      clipPath: 'inset(0 0% 0 0)',
      ease: 'none',
      duration: 1
    }, 0);

    // Teeth separation (synced with slider movement via stagger)
    const teethDuration = 0.1;
    const teethStagger = 0.9; 
    
    scrollTl.to(topTeeth, {
      y: -30,
      opacity: 0,
      ease: 'power1.in',
      duration: teethDuration,
      stagger: { amount: teethStagger, from: 'start' }
    }, 0);

    scrollTl.to(bottomTeeth, {
      y: 30,
      opacity: 0,
      ease: 'power1.in',
      duration: teethDuration,
      stagger: { amount: teethStagger, from: 'start' }
    }, 0);

    // Headline letters reveal (synced with stagger)
    if (headlineChars.length > 0) {
      scrollTl.to(headlineChars, {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.15,
        stagger: { amount: 0.85, from: 'start' }
      }, 0.05); // slight delay so it happens right after teeth open
    }

    // Extras: slider scale
    scrollTl.to(sliderBody, {
      scale: 1.05,
      duration: 0.5,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: 1
    }, 0);

    // Shine sweep
    scrollTl.to(sliderShine, {
      x: '200%',
      duration: 0.5,
      ease: 'none'
    }, 0.2);

    // Pull tab swing based on velocity
    // Actually, ScrollTrigger velocity is dynamic. We can add a quick to() based on getVelocity()
    const pullTabTo = gsap.quickTo(pullTab, 'rotation', { ease: 'power3', duration: 0.5 });
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: scrollDistance,
      onUpdate: (self) => {
        // limit velocity
        let v = self.getVelocity() / -100;
        v = gsap.utils.clamp(-30, 30, v);
        pullTabTo(v);
      }
    });

    // Stat cards parallax based on progress checkpoints
    // Top cards: card-1, card-2
    // Bottom cards: card-3, card-4
    const card1 = containerRef.current.querySelector('#card-1');
    const card2 = containerRef.current.querySelector('#card-2');
    const card3 = containerRef.current.querySelector('#card-3');
    const card4 = containerRef.current.querySelector('#card-4');

    // Since they already appeared in intro, we'll give them some parallax motion during scroll
    // Top cards enter from above? Wait, if they are already visible, maybe we move them UP slightly 
    // so it looks like they are floating? "with slight parallax"
    if (card1) scrollTl.fromTo(card1, { y: 0 }, { y: isMobile ? -20 : -40, ease: 'power1.inOut', duration: 0.8 }, 0.12);
    if (card3) scrollTl.fromTo(card3, { y: 0 }, { y: isMobile ? 20 : 40, ease: 'power1.inOut', duration: 0.8 }, 0.25);
    if (card2) scrollTl.fromTo(card2, { y: 0 }, { y: isMobile ? -20 : -40, ease: 'power1.inOut', duration: 0.8 }, 0.45);
    if (card4) scrollTl.fromTo(card4, { y: 0 }, { y: isMobile ? 20 : 40, ease: 'power1.inOut', duration: 0.8 }, 0.6);

    // Fade out scroll hint
    scrollTl.to(scrollHint, { opacity: 0, duration: 0.2 }, 0);

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, { scope: containerRef });
};
