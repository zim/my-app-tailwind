'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function GSAPDemoPage() {
    const titleRef = useRef<HTMLHeadingElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const interactiveRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Title animation
        if (titleRef.current) {
            gsap.fromTo(titleRef.current,
                { opacity: 0, y: -50 },
                { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
            );
        }

        // Cards stagger animation
        if (cardsRef.current) {
            gsap.fromTo(cardsRef.current.children,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.2,
                    ease: "back.out(1.7)",
                    delay: 0.5
                }
            );
        }

        // Timeline animation with ScrollTrigger
        if (timelineRef.current) {
            const timelineItems = timelineRef.current.querySelectorAll('.timeline-item');
            timelineItems.forEach((item, index) => {
                gsap.fromTo(item,
                    { opacity: 0, x: index % 2 === 0 ? -100 : 100 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.8,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: item,
                            start: "top 80%",
                            end: "bottom 20%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );
            });
        }

        // Interactive hover animations
        const interactiveItems = document.querySelectorAll('.interactive-item');
        interactiveItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                gsap.to(item, { scale: 1.1, duration: 0.3, ease: "power2.out" });
            });
            item.addEventListener('mouseleave', () => {
                gsap.to(item, { scale: 1, duration: 0.3, ease: "power2.out" });
            });
        });

        // Cleanup function
        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const button = e.currentTarget;

        // Button click animation
        gsap.timeline()
            .to(button, { scale: 0.95, duration: 0.1 })
            .to(button, { scale: 1, duration: 0.1 })
            .to(button, {
                backgroundColor: "#10b981",
                duration: 0.3,
                ease: "power2.out"
            })
            .to(button, {
                backgroundColor: "#3b82f6",
                duration: 0.3,
                ease: "power2.out",
                delay: 0.2
            });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-4 sm:py-6 lg:py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                </div>

                {/* Animated Title */}
                <div className="text-center mb-12">
                    <h1
                        ref={titleRef}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-4"
                    >
                        ✨ GSAP Animation Demo
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore the power of GSAP (GreenSock Animation Platform) with these interactive examples
                    </p>
                </div>

                {/* Animation Cards */}
                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow interactive-item">
                        <div className="text-4xl mb-4">🎭</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Entrance Animations</h3>
                        <p className="text-gray-600">Elements fade in with smooth stagger effects</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow interactive-item">
                        <div className="text-4xl mb-4">🚀</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Scroll Triggers</h3>
                        <p className="text-gray-600">Animations triggered by scroll position</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow interactive-item">
                        <div className="text-4xl mb-4">🎨</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Interactive Elements</h3>
                        <p className="text-gray-600">Hover and click animations with GSAP</p>
                    </div>
                </div>

                {/* Interactive Button */}
                <div className="text-center mb-12">
                    <button
                        onClick={handleButtonClick}
                        className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium text-lg hover:bg-blue-600 transition-colors"
                    >
                        🎯 Click for Animation!
                    </button>
                </div>

                {/* Timeline Animation */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
                        📈 Scroll-Triggered Timeline
                    </h2>
                    <div ref={timelineRef} className="space-y-8">
                        <div className="timeline-item flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                1
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">GSAP Installation</h3>
                                <p className="text-gray-600">Successfully installed GSAP 3.13.0 with pnpm</p>
                            </div>
                        </div>
                        <div className="timeline-item flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                                2
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Basic Animations</h3>
                                <p className="text-gray-600">Implemented fade-in, slide, and scale animations</p>
                            </div>
                        </div>
                        <div className="timeline-item flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                3
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">ScrollTrigger Plugin</h3>
                                <p className="text-gray-600">Added scroll-based animations for enhanced UX</p>
                            </div>
                        </div>
                        <div className="timeline-item flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                                4
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Interactive Elements</h3>
                                <p className="text-gray-600">Created hover and click animations for better engagement</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Code Example */}
                <div className="bg-gray-900 rounded-lg p-6 mb-12">
                    <h2 className="text-xl font-semibold text-white mb-4">💻 Code Example</h2>
                    <pre className="text-green-400 text-sm overflow-x-auto">
                        {`// Basic GSAP animation
gsap.fromTo(element, 
    { opacity: 0, y: 50 }, 
    { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
);

// Stagger animation
gsap.fromTo(elements, 
    { opacity: 0, scale: 0.8 }, 
    { 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        stagger: 0.2,
        ease: "back.out(1.7)"
    }
);

// ScrollTrigger animation
gsap.fromTo(element, 
    { opacity: 0, x: -100 }, 
    {
        opacity: 1,
        x: 0,
        scrollTrigger: {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none reverse"
        }
    }
);`}
                    </pre>
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                        🌟 Why GSAP?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="interactive-item">
                            <h3 className="text-lg font-semibold text-blue-600 mb-2">🚀 Performance</h3>
                            <p className="text-gray-600">Hardware-accelerated animations that run at 60fps</p>
                        </div>
                        <div className="interactive-item">
                            <h3 className="text-lg font-semibold text-green-600 mb-2">🎯 Precise Control</h3>
                            <p className="text-gray-600">Fine-grained control over timing and easing</p>
                        </div>
                        <div className="interactive-item">
                            <h3 className="text-lg font-semibold text-purple-600 mb-2">🔧 Versatile</h3>
                            <p className="text-gray-600">Works with any JavaScript framework or vanilla JS</p>
                        </div>
                        <div className="interactive-item">
                            <h3 className="text-lg font-semibold text-red-600 mb-2">📱 Cross-Platform</h3>
                            <p className="text-gray-600">Consistent animations across all devices and browsers</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
