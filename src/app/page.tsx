'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Animation presets
const animationPresets = {
  'default': 'Default (Current)',
  'bounce': 'Bouncy & Playful',
  'slide': 'Smooth Slides',
  'zoom': 'Zoom Effects',
  'rotate': 'Spin & Rotate',
  'none': 'No Animations'
} as const;

// Background animation presets
const backgroundPresets = {
  'particles': 'Rainbow Particles',
  'bubbles': 'Floating Bubbles',
  'geometric': 'Geometric Shapes',
  'stars': 'Twinkling Stars',
  'waves': 'Flowing Waves',
  'none': 'No Background'
} as const;

type AnimationType = keyof typeof animationPresets;
type BackgroundType = keyof typeof backgroundPresets;

export default function Home() {
  // Animation state
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('default');
  const [currentBackground, setCurrentBackground] = useState<BackgroundType>('particles');
  const [showSettings, setShowSettings] = useState(false);

  // Refs for GSAP animations
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const featuredRef = useRef<HTMLHeadingElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Enhanced button click animation
  const handleButtonClick = (e: React.MouseEvent) => {
    const button = e.currentTarget;

    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'absolute rounded-full bg-white opacity-60 pointer-events-none';
    ripple.style.width = '0px';
    ripple.style.height = '0px';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';

    button.appendChild(ripple);

    gsap.to(ripple, {
      width: '100px',
      height: '100px',
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    });
  };

  useEffect(() => {
    // Clear any existing animations
    gsap.killTweensOf("*");
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    if (currentAnimation === 'none') return;

    // Create main timeline
    const tl = gsap.timeline();

    // Animation functions
    const runDefaultAnimation = () => {
      // Header entrance animation
      if (headerRef.current) {
        tl.fromTo(headerRef.current,
          { opacity: 0, y: -50 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
        );
      }

      // Title animation with typewriter effect
      if (titleRef.current) {
        tl.fromTo(titleRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
          "-=0.5"
        );
      }

      // Subtitle slide in
      if (subtitleRef.current) {
        tl.fromTo(subtitleRef.current,
          { opacity: 0, x: -100 },
          { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" },
          "-=0.4"
        );
      }

      // Description fade in
      if (descriptionRef.current) {
        tl.fromTo(descriptionRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.4"
        );
      }

      // Featured section
      if (featuredRef.current) {
        tl.fromTo(featuredRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
          "-=0.3"
        );
      }

      // Buttons stagger animation
      if (buttonsRef.current) {
        tl.fromTo(buttonsRef.current.children,
          { opacity: 0, y: 50, scale: 0.8 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.7)"
          },
          "-=0.2"
        );
      }
    };

    const runBounceAnimation = () => {
      // Bouncy entrance
      if (headerRef.current) {
        tl.fromTo(headerRef.current,
          { opacity: 0, y: -100 },
          { opacity: 1, y: 0, duration: 1.2, ease: "bounce.out" }
        );
      }

      if (titleRef.current) {
        tl.fromTo(titleRef.current,
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.5)" },
          "-=0.8"
        );
      }

      if (subtitleRef.current) {
        tl.fromTo(subtitleRef.current,
          { opacity: 0, x: -200 },
          { opacity: 1, x: 0, duration: 1, ease: "bounce.out" },
          "-=0.6"
        );
      }

      if (descriptionRef.current) {
        tl.fromTo(descriptionRef.current,
          { opacity: 0, y: 100 },
          { opacity: 1, y: 0, duration: 1, ease: "bounce.out" },
          "-=0.4"
        );
      }

      if (featuredRef.current) {
        tl.fromTo(featuredRef.current,
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.3)" },
          "-=0.2"
        );
      }

      if (buttonsRef.current) {
        tl.fromTo(buttonsRef.current.children,
          { opacity: 0, y: 100, rotation: 360 },
          {
            opacity: 1,
            y: 0,
            rotation: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "elastic.out(1, 0.5)"
          },
          "-=0.1"
        );
      }
    };

    const runSlideAnimation = () => {
      // Smooth sliding effects
      if (headerRef.current) {
        tl.fromTo(headerRef.current,
          { opacity: 0, x: -window.innerWidth },
          { opacity: 1, x: 0, duration: 1.5, ease: "power3.out" }
        );
      }

      if (titleRef.current) {
        tl.fromTo(titleRef.current,
          { opacity: 0, x: window.innerWidth },
          { opacity: 1, x: 0, duration: 1.2, ease: "power3.out" },
          "-=1"
        );
      }

      if (subtitleRef.current) {
        tl.fromTo(subtitleRef.current,
          { opacity: 0, x: -window.innerWidth },
          { opacity: 1, x: 0, duration: 1, ease: "power3.out" },
          "-=0.8"
        );
      }

      if (descriptionRef.current) {
        tl.fromTo(descriptionRef.current,
          { opacity: 0, x: window.innerWidth },
          { opacity: 1, x: 0, duration: 1, ease: "power3.out" },
          "-=0.6"
        );
      }

      if (featuredRef.current) {
        tl.fromTo(featuredRef.current,
          { opacity: 0, x: -window.innerWidth },
          { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
          "-=0.4"
        );
      }

      if (buttonsRef.current) {
        tl.fromTo(buttonsRef.current.children,
          { opacity: 0, x: window.innerWidth },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out"
          },
          "-=0.2"
        );
      }
    };

    const runZoomAnimation = () => {
      // Zoom-based animations
      if (headerRef.current) {
        tl.fromTo(headerRef.current,
          { opacity: 0, scale: 3 },
          { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }
        );
      }

      if (titleRef.current) {
        tl.fromTo(titleRef.current,
          { opacity: 0, scale: 0.1 },
          { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
          "-=1"
        );
      }

      if (subtitleRef.current) {
        tl.fromTo(subtitleRef.current,
          { opacity: 0, scale: 2 },
          { opacity: 1, scale: 1, duration: 1, ease: "power2.out" },
          "-=0.8"
        );
      }

      if (descriptionRef.current) {
        tl.fromTo(descriptionRef.current,
          { opacity: 0, scale: 0.3 },
          { opacity: 1, scale: 1, duration: 1, ease: "power2.out" },
          "-=0.6"
        );
      }

      if (featuredRef.current) {
        tl.fromTo(featuredRef.current,
          { opacity: 0, scale: 1.5 },
          { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
          "-=0.4"
        );
      }

      if (buttonsRef.current) {
        tl.fromTo(buttonsRef.current.children,
          { opacity: 0, scale: 0 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.7)"
          },
          "-=0.2"
        );
      }
    };

    const runRotateAnimation = () => {
      // Rotation-based animations
      if (headerRef.current) {
        tl.fromTo(headerRef.current,
          { opacity: 0, rotation: 180 },
          { opacity: 1, rotation: 0, duration: 1.5, ease: "power2.out" }
        );
      }

      if (titleRef.current) {
        tl.fromTo(titleRef.current,
          { opacity: 0, rotation: -360, scale: 0.5 },
          { opacity: 1, rotation: 0, scale: 1, duration: 1.2, ease: "power2.out" },
          "-=1"
        );
      }

      if (subtitleRef.current) {
        tl.fromTo(subtitleRef.current,
          { opacity: 0, rotation: 90 },
          { opacity: 1, rotation: 0, duration: 1, ease: "power2.out" },
          "-=0.8"
        );
      }

      if (descriptionRef.current) {
        tl.fromTo(descriptionRef.current,
          { opacity: 0, rotation: -90 },
          { opacity: 1, rotation: 0, duration: 1, ease: "power2.out" },
          "-=0.6"
        );
      }

      if (featuredRef.current) {
        tl.fromTo(featuredRef.current,
          { opacity: 0, rotation: 45 },
          { opacity: 1, rotation: 0, duration: 0.8, ease: "power2.out" },
          "-=0.4"
        );
      }

      if (buttonsRef.current) {
        tl.fromTo(buttonsRef.current.children,
          { opacity: 0, rotation: 720, scale: 0.5 },
          {
            opacity: 1,
            rotation: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out"
          },
          "-=0.2"
        );
      }
    };

    // Run selected animation
    switch (currentAnimation) {
      case 'bounce':
        runBounceAnimation();
        break;
      case 'slide':
        runSlideAnimation();
        break;
      case 'zoom':
        runZoomAnimation();
        break;
      case 'rotate':
        runRotateAnimation();
        break;
      default:
        runDefaultAnimation();
    }

    // Footer animation with ScrollTrigger
    if (footerRef.current && (currentAnimation as string) !== 'none') {
      gsap.fromTo(footerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            end: "bottom 10%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Interactive hover animations for buttons (only if animations are enabled)
    if ((currentAnimation as string) !== 'none') {
      const buttons = document.querySelectorAll('.app-button');
      buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            duration: 0.3,
            ease: "power2.out"
          });
        });

        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.3,
            ease: "power2.out"
          });
        });

        button.addEventListener('click', () => {
          gsap.timeline()
            .to(button, { scale: 0.95, duration: 0.1 })
            .to(button, { scale: 1.05, duration: 0.1 })
            .to(button, { scale: 1, duration: 0.1 });
        });
      });
    }

    // Floating animation for emojis in header only (not buttons)
    if ((currentAnimation as string) !== 'none') {
      const headerEmojis = document.querySelectorAll('.emoji:not(.app-button .emoji)');
      headerEmojis.forEach((emoji, index) => {
        gsap.to(emoji, {
          y: -10,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
          delay: index * 0.2
        });
      });
    }

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [currentAnimation]);

  // Click outside handler for settings panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Add floating particles effect
  useEffect(() => {
    if (currentBackground === 'none') return;

    // Create background animation container
    const createBackgroundAnimation = () => {
      const container = document.createElement('div');
      container.className = 'fixed inset-0 pointer-events-none z-0';
      document.body.appendChild(container);

      const createParticles = () => {
        for (let i = 0; i < 20; i++) {
          const particle = document.createElement('div');
          const rainbowColors = [
            'from-red-400 to-pink-400',
            'from-pink-400 to-purple-400',
            'from-purple-400 to-indigo-400',
            'from-indigo-400 to-blue-400',
            'from-blue-400 to-cyan-400',
            'from-cyan-400 to-teal-400',
            'from-teal-400 to-green-400',
            'from-green-400 to-lime-400',
            'from-lime-400 to-yellow-400',
            'from-yellow-400 to-orange-400',
            'from-orange-400 to-red-400'
          ];

          const randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
          particle.className = `absolute rounded-full bg-gradient-to-r ${randomColor} opacity-30`;
          particle.style.width = `${Math.random() * 198 + 2}px`;
          particle.style.height = particle.style.width;
          particle.style.left = `${Math.random() * 100}%`;
          particle.style.top = `${Math.random() * 100}%`;

          container.appendChild(particle);

          gsap.to(particle, {
            x: `${Math.random() * 200 - 100}px`,
            y: `${Math.random() * 200 - 100}px`,
            duration: Math.random() * 10 + 5,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut",
            delay: Math.random() * 2
          });
        }
      };

      const createBubbles = () => {
        for (let i = 0; i < 15; i++) {
          const bubble = document.createElement('div');
          bubble.className = 'absolute rounded-full bg-white opacity-10 border border-white border-opacity-20';
          bubble.style.width = `${Math.random() * 100 + 20}px`;
          bubble.style.height = bubble.style.width;
          bubble.style.left = `${Math.random() * 100}%`;
          bubble.style.top = `${Math.random() * 100}%`;

          container.appendChild(bubble);

          gsap.to(bubble, {
            y: -window.innerHeight - 100,
            duration: Math.random() * 15 + 10,
            repeat: -1,
            ease: "none",
            delay: Math.random() * 5
          });

          gsap.to(bubble, {
            x: `${Math.random() * 100 - 50}px`,
            duration: Math.random() * 8 + 4,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut"
          });
        }
      };

      const createGeometric = () => {
        const shapes = ['square', 'triangle', 'diamond', 'hexagon'];
        for (let i = 0; i < 12; i++) {
          const shape = document.createElement('div');
          const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
          const size = Math.random() * 60 + 20;

          shape.className = `absolute opacity-20`;
          shape.style.width = `${size}px`;
          shape.style.height = `${size}px`;
          shape.style.left = `${Math.random() * 100}%`;
          shape.style.top = `${Math.random() * 100}%`;

          if (shapeType === 'square') {
            shape.className += ' bg-blue-400';
          } else if (shapeType === 'triangle') {
            shape.className += ' bg-green-400';
            shape.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
          } else if (shapeType === 'diamond') {
            shape.className += ' bg-purple-400';
            shape.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
          } else {
            shape.className += ' bg-pink-400';
            shape.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
          }

          container.appendChild(shape);

          gsap.to(shape, {
            rotation: 360,
            duration: Math.random() * 20 + 10,
            repeat: -1,
            ease: "none"
          });

          gsap.to(shape, {
            x: `${Math.random() * 100 - 50}px`,
            y: `${Math.random() * 100 - 50}px`,
            duration: Math.random() * 15 + 8,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut"
          });
        }
      };

      const createStars = () => {
        for (let i = 0; i < 25; i++) {
          const star = document.createElement('div');
          star.className = 'absolute text-white opacity-60';
          star.style.fontSize = `${Math.random() * 20 + 10}px`;
          star.style.left = `${Math.random() * 100}%`;
          star.style.top = `${Math.random() * 100}%`;
          star.textContent = '✦';

          container.appendChild(star);

          gsap.to(star, {
            opacity: 0.2,
            duration: Math.random() * 3 + 1,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut",
            delay: Math.random() * 2
          });
        }
      };

      const createWaves = () => {
        for (let i = 0; i < 12; i++) {
          const wave = document.createElement('div');
          wave.className = 'absolute opacity-30';
          wave.style.width = '150%';
          wave.style.height = `${Math.random() * 150 + 80}px`;
          wave.style.left = '-25%';
          wave.style.top = `${Math.random() * 100}%`;

          // Create more vibrant wave colors
          const waveColors = [
            'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.6), transparent)', // Blue
            'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.6), transparent)', // Purple
            'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.6), transparent)', // Green
            'linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.6), transparent)', // Pink
            'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.6), transparent)', // Yellow
            'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.6), transparent)', // Cyan
          ];

          wave.style.background = waveColors[Math.floor(Math.random() * waveColors.length)];
          wave.style.borderRadius = '50%';
          wave.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;

          container.appendChild(wave);

          // Multiple wave animations for more dynamic effect
          gsap.to(wave, {
            x: '120%',
            duration: Math.random() * 15 + 8,
            repeat: -1,
            ease: "none",
            delay: Math.random() * 3
          });

          // Add vertical floating motion
          gsap.to(wave, {
            y: `${Math.random() * 60 - 30}px`,
            duration: Math.random() * 6 + 4,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut",
            delay: Math.random() * 2
          });

          // Add subtle rotation
          gsap.to(wave, {
            rotation: Math.random() * 30 - 15,
            duration: Math.random() * 10 + 5,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut"
          });
        }
      };

      // Create background based on selection
      switch (currentBackground) {
        case 'bubbles':
          createBubbles();
          break;
        case 'geometric':
          createGeometric();
          break;
        case 'stars':
          createStars();
          break;
        case 'waves':
          createWaves();
          break;
        default:
          createParticles();
      }

      return container;
    };

    const backgroundContainer = createBackgroundAnimation();

    return () => {
      backgroundContainer.remove();
    };
  }, [currentBackground]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-gray-800 via-gray-900 to-black dark:from-gray-900 dark:via-black dark:to-gray-900">

      {/* Animation Settings Panel */}
      <div className="fixed top-4 right-4 z-50" ref={settingsRef}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          aria-label="Animation Settings"
        >
          <span className="text-xl">🎬</span>
        </button>

        {showSettings && (
          <div className="absolute top-12 right-0 bg-gray-800 text-white p-4 rounded-lg shadow-lg w-64 border border-gray-700 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3">Animation Settings</h3>

            {/* Page Animations */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-gray-300">Page Animations</h4>
              <div className="space-y-2">
                {Object.entries(animationPresets).map(([key, label]) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="animation"
                      value={key}
                      checked={currentAnimation === key}
                      onChange={(e) => setCurrentAnimation(e.target.value as AnimationType)}
                      className="text-blue-500"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Background Animations */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-gray-300">Background Effects</h4>
              <div className="space-y-2">
                {Object.entries(backgroundPresets).map(([key, label]) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="background"
                      value={key}
                      checked={currentBackground === key}
                      onChange={(e) => setCurrentBackground(e.target.value as BackgroundType)}
                      className="text-green-500"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Changes apply immediately
              </p>
            </div>
          </div>
        )}
      </div>

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start relative z-10">
        <div ref={headerRef} className="text-center sm:text-left">
          <h1
            ref={titleRef}
            className="text-4xl sm:text-6xl font-bold text-white mb-4"
          >
            Jolyon Segal
          </h1>
          <h2
            ref={subtitleRef}
            className="text-xl sm:text-2xl text-blue-400 font-medium mb-6"
          >
            <span className="emoji">🚀</span> Web Developer <span className="emoji">⚡</span>
          </h2>
          <p
            ref={descriptionRef}
            className="text-lg text-gray-300 max-w-2xl"
          >
            Welcome to my personal development playground! Explore my collection of web applications
            built with React, Next.js, and modern web technologies.
          </p>
        </div>

        <div className="text-center sm:text-left">
          <h3
            ref={featuredRef}
            className="text-2xl font-semibold text-gray-200 mb-6"
          >
            <span className="emoji">🌟</span> Featured Applications
          </h3>
        </div>

        <div ref={buttonsRef} className="flex gap-2 sm:gap-3 items-center flex-col sm:flex-row flex-wrap justify-center sm:justify-start relative z-10">
          <Link
            href="/todos"
            onClick={handleButtonClick}
            className="app-button relative overflow-hidden rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-1 hover:bg-blue-700 font-medium text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            <span className="emoji">📝</span> Todo List
          </Link>
          <Link
            href="/budget"
            onClick={handleButtonClick}
            className="app-button relative overflow-hidden rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-1 hover:bg-green-700 font-medium text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            <span className="emoji">💰</span> Budget Tracker
          </Link>
          <Link
            href="/cv"
            onClick={handleButtonClick}
            className="app-button relative overflow-hidden rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-gray-700 text-white gap-1 hover:bg-gray-800 font-medium text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            <span className="emoji">📄</span> My CV
          </Link>
          <Link
            href="/gsap-demo"
            onClick={handleButtonClick}
            className="app-button relative overflow-hidden rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-yellow-600 text-white gap-1 hover:bg-yellow-700 font-medium text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            <span className="emoji">✨</span> GSAP Demo
          </Link>
          <Link
            href="/chatbot"
            onClick={handleButtonClick}
            className="app-button relative overflow-hidden rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-indigo-600 text-white gap-1 hover:bg-indigo-700 font-medium text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            <span className="emoji">🤖</span> AI Chatbot
          </Link>
          <Link
            href="/d3-demo"
            onClick={handleButtonClick}
            className="app-button relative overflow-hidden rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-purple-600 text-white gap-1 hover:bg-purple-700 font-medium text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            <span className="emoji">📊</span> D3.js Demo
          </Link>
        </div>
      </main>
      <footer ref={footerRef} className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <div className="text-center text-sm text-gray-400">
          <p>© 2025 Jolyon Segal - Web Developer</p>
          <p className="mt-1">Built with Next.js, React & Tailwind CSS <span className="emoji">❤️</span></p>
        </div>
      </footer>
    </div>
  );
}
