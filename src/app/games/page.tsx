'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function GamesHub() {
    const headerRef = useRef<HTMLDivElement>(null);
    const gamesGridRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Header animation
        if (headerRef.current) {
            gsap.fromTo(headerRef.current,
                { opacity: 0, y: -50 },
                { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
            );
        }

        // Games grid stagger animation
        if (gamesGridRef.current) {
            gsap.fromTo(gamesGridRef.current.children,
                { opacity: 0, y: 50, scale: 0.8 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "back.out(1.7)",
                    delay: 0.3
                }
            );
        }

        // Features animation
        if (featuresRef.current) {
            gsap.fromTo(featuresRef.current,
                { opacity: 0, x: -100 },
                { opacity: 1, x: 0, duration: 0.8, ease: "power2.out", delay: 0.8 }
            );
        }
    }, []);

    const games = [
        {
            title: "Higher or Lower",
            description: "Classic card guessing game. Predict if the next card will be higher or lower!",
            emoji: "🔺",
            href: "/cards",
            color: "bg-red-600 hover:bg-red-700",
            difficulty: "Easy",
            players: "1 Player"
        },
        {
            title: "Blackjack",
            description: "Beat the dealer by getting as close to 21 as possible without going over.",
            emoji: "🃏",
            href: "/blackjack",
            color: "bg-green-600 hover:bg-green-700",
            difficulty: "Medium",
            players: "1 Player"
        },
        {
            title: "War",
            description: "Classic card battle game. Higher card wins the round!",
            emoji: "⚔️",
            href: "/war",
            color: "bg-blue-600 hover:bg-blue-700",
            difficulty: "Easy",
            players: "1 Player"
        },
        {
            title: "Memory Match",
            description: "Flip cards to find matching pairs. Test your memory skills!",
            emoji: "🧠",
            href: "/memory",
            color: "bg-purple-600 hover:bg-purple-700",
            difficulty: "Medium",
            players: "1 Player"
        },
        {
            title: "Card Flick",
            description: "Flick cards toward the wall! Closest card wins in this physics-based game.",
            emoji: "🎯",
            href: "/card-flick",
            color: "bg-orange-600 hover:bg-orange-700",
            difficulty: "Medium",
            players: "1 Player"
        },
        {
            title: "Solitaire",
            description: "Classic Klondike Solitaire. Stack cards in order to win!",
            emoji: "♠️",
            href: "/solitaire",
            color: "bg-yellow-600 hover:bg-yellow-700",
            difficulty: "Hard",
            players: "1 Player"
        },
        {
            title: "Deck Manager",
            description: "Advanced deck and pile management with full API capabilities.",
            emoji: "🎴",
            href: "/deck-manager",
            color: "bg-orange-600 hover:bg-orange-700",
            difficulty: "Advanced",
            players: "Utility"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div ref={headerRef} className="text-center mb-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white hover:text-purple-400 mb-6 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                    <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
                        🎮 Card Games Hub
                    </h1>
                    <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto">
                        Welcome to your personal card game collection! Choose from classic games,
                        modern variations, and powerful deck management tools.
                    </p>
                </div>

                {/* Games Grid */}
                <div ref={gamesGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {games.map((game, index) => (
                        <Link
                            key={game.title}
                            href={game.href}
                            className={`group relative overflow-hidden rounded-xl ${game.color} p-6 text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
                        >
                            <div className="relative z-10">
                                <div className="text-4xl mb-4">{game.emoji}</div>
                                <h3 className="text-2xl font-bold mb-3">{game.title}</h3>
                                <p className="text-gray-200 mb-4 leading-relaxed">{game.description}</p>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                        {game.difficulty}
                                    </span>
                                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                        {game.players}
                                    </span>
                                </div>
                            </div>

                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

                            {/* Animated border */}
                            <div className="absolute inset-0 rounded-xl border-2 border-white opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </Link>
                    ))}
                </div>

                {/* Features Section */}
                <div ref={featuresRef} className="bg-gray-800 bg-opacity-50 rounded-2xl p-8">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">🌟 Features</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl mb-3">🃏</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Real Deck API</h3>
                            <p className="text-gray-300 text-sm">
                                Powered by Deck of Cards API for authentic card behavior
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="text-3xl mb-3">📱</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Responsive Design</h3>
                            <p className="text-gray-300 text-sm">
                                Optimized for desktop, tablet, and mobile devices
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="text-3xl mb-3">✨</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Smooth Animations</h3>
                            <p className="text-gray-300 text-sm">
                                GSAP-powered animations for engaging gameplay
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="text-3xl mb-3">🎯</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Score Tracking</h3>
                            <p className="text-gray-300 text-sm">
                                Keep track of your performance and achievements
                            </p>
                        </div>
                    </div>
                </div>

                {/* Coming Soon Section */}
                <div className="mt-12 text-center">
                    <h2 className="text-2xl font-bold text-white mb-6">🚀 Coming Soon</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800 bg-opacity-30 rounded-lg p-4 text-white">
                            <div className="text-2xl mb-2">🃠</div>
                            <p className="text-sm">Poker Texas Hold'em</p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-30 rounded-lg p-4 text-white">
                            <div className="text-2xl mb-2">🎲</div>
                            <p className="text-sm">Multiplayer Games</p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-30 rounded-lg p-4 text-white">
                            <div className="text-2xl mb-2">🏆</div>
                            <p className="text-sm">Tournaments</p>
                        </div>
                        <div className="bg-gray-800 bg-opacity-30 rounded-lg p-4 text-white">
                            <div className="text-2xl mb-2">💾</div>
                            <p className="text-sm">Save Progress</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
