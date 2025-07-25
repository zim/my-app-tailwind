'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';

// Types for the Deck of Cards API
interface Card {
    code: string;
    image: string;
    images: {
        svg: string;
        png: string;
    };
    value: string;
    suit: string;
}

interface DeckResponse {
    success: boolean;
    deck_id: string;
    cards?: Card[];
    remaining: number;
    shuffled?: boolean;
}

// Card values for comparison (Ace = 1, Face cards = 11, 12, 13)
const getCardValue = (value: string): number => {
    switch (value) {
        case 'ACE': return 1;
        case 'JACK': return 11;
        case 'QUEEN': return 12;
        case 'KING': return 13;
        default: return parseInt(value);
    }
};

export default function CardsPage() {
    // Game state
    const [deckId, setDeckId] = useState<string>('');
    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [nextCard, setNextCard] = useState<Card | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'game-over'>('waiting');
    const [cardsRemaining, setCardsRemaining] = useState(52);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Refs for animations
    const currentCardRef = useRef<HTMLDivElement>(null);
    const nextCardRef = useRef<HTMLDivElement>(null);
    const scoreRef = useRef<HTMLDivElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);

    // API base URL
    const API_BASE = 'https://deckofcardsapi.com/api/deck';

    // Create a new deck
    const createNewDeck = async () => {
        try {
            setLoading(true);
            setMessage('Creating new deck...');

            const response = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
            const data: DeckResponse = await response.json();

            if (data.success) {
                setDeckId(data.deck_id);
                setCardsRemaining(data.remaining);
                setScore(0);
                setStreak(0);
                setGameStatus('waiting');
                setCurrentCard(null);
                setNextCard(null);
                setMessage('Deck created! Draw your first card to start.');

                // Animate the message
                if (messageRef.current) {
                    gsap.fromTo(messageRef.current,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.5 }
                    );
                }
            }
        } catch (error) {
            setMessage('Error creating deck. Please try again.');
            console.error('Error creating deck:', error);
        } finally {
            setLoading(false);
        }
    };

    // Draw cards from the deck
    const drawCards = async (count: number = 1) => {
        if (!deckId) return null;

        try {
            const response = await fetch(`${API_BASE}/${deckId}/draw/?count=${count}`);
            const data: DeckResponse = await response.json();

            if (data.success && data.cards) {
                setCardsRemaining(data.remaining);
                return data.cards;
            }
            return null;
        } catch (error) {
            console.error('Error drawing cards:', error);
            return null;
        }
    };

    // Start the game by drawing the first card
    const startGame = async () => {
        if (!deckId) return;

        setLoading(true);
        const cards = await drawCards(1);

        if (cards && cards.length > 0) {
            setCurrentCard(cards[0]);
            setGameStatus('playing');
            setMessage('Guess if the next card will be higher or lower!');

            // Get screen size for responsive animations
            const isLaptop = window.innerWidth >= 1024;
            const isTablet = window.innerWidth >= 768;

            // Animate the first card with responsive settings
            if (currentCardRef.current) {
                const animationConfig = {
                    // Responsive animation duration and effects
                    duration: isLaptop ? 1.2 : isTablet ? 1.0 : 0.8,
                    scale: isLaptop ? 1.1 : 1.0, // Slight scale on larger screens
                    ease: "back.out(1.7)"
                };

                gsap.fromTo(currentCardRef.current,
                    { opacity: 0, scale: 0, rotation: 180, y: -50 },
                    {
                        opacity: 1,
                        scale: animationConfig.scale,
                        rotation: 0,
                        y: 0,
                        duration: animationConfig.duration,
                        ease: animationConfig.ease,
                        onComplete: () => {
                            // Subtle floating animation on larger screens
                            if (isLaptop) {
                                gsap.to(currentCardRef.current, {
                                    y: -5,
                                    duration: 2,
                                    repeat: -1,
                                    yoyo: true,
                                    ease: "power2.inOut"
                                });
                            }
                        }
                    }
                );
            }
        }
        setLoading(false);
    };

    // Make a guess (higher or lower)
    const makeGuess = async (guess: 'higher' | 'lower') => {
        if (!currentCard || loading) return;

        setLoading(true);
        const cards = await drawCards(1);

        if (cards && cards.length > 0) {
            const drawnCard = cards[0];
            setNextCard(drawnCard);

            // Get screen size for responsive animations
            const isLaptop = window.innerWidth >= 1024;
            const isTablet = window.innerWidth >= 768;
            const isMobile = window.innerWidth < 768;

            // Animate the new card with responsive positioning
            if (nextCardRef.current) {
                const animationConfig = {
                    opacity: 0,
                    scale: 0,
                    rotation: 180,
                    // Responsive x positioning
                    x: isLaptop ? 150 : isTablet ? 100 : 80,
                    // Responsive animation settings
                    duration: isLaptop ? 1.0 : isTablet ? 0.9 : 0.8,
                    ease: "back.out(1.7)"
                };

                gsap.fromTo(nextCardRef.current,
                    {
                        opacity: animationConfig.opacity,
                        scale: animationConfig.scale,
                        x: animationConfig.x,
                        rotation: animationConfig.rotation
                    },
                    {
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        rotation: 0,
                        duration: animationConfig.duration,
                        ease: animationConfig.ease
                    }
                );
            }

            // Wait for animation, then check result
            setTimeout(() => {
                const currentValue = getCardValue(currentCard.value);
                const nextValue = getCardValue(drawnCard.value);
                let correct = false;

                if (guess === 'higher' && nextValue > currentValue) correct = true;
                if (guess === 'lower' && nextValue < currentValue) correct = true;
                if (nextValue === currentValue) correct = true; // Tie counts as correct

                if (correct) {
                    setScore(score + 1);
                    setStreak(streak + 1);
                    setMessage(`Correct! ${drawnCard.value} of ${drawnCard.suit.toUpperCase()}`);

                    // Animate score
                    if (scoreRef.current) {
                        gsap.fromTo(scoreRef.current,
                            { scale: 1 },
                            { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 }
                        );
                    }
                } else {
                    setStreak(0);
                    setMessage(`Wrong! ${drawnCard.value} of ${drawnCard.suit.toUpperCase()}`);
                }

                // Move next card to current position
                setTimeout(() => {
                    setCurrentCard(drawnCard);
                    setNextCard(null);

                    if (cardsRemaining <= 1) {
                        setGameStatus('game-over');
                        setMessage(`Game Over! Final Score: ${score + (correct ? 1 : 0)}`);
                    } else {
                        setMessage('Guess if the next card will be higher or lower!');
                    }
                }, 1500);
            }, 800);
        }
        setLoading(false);
    };

    // Initialize with a new deck on component mount
    useEffect(() => {
        createNewDeck();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white hover:text-blue-400 mb-4 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
                        🃏 Card Games
                    </h1>
                    <p className="text-xl text-gray-300 mb-6">
                        Interactive card games powered by the Deck of Cards API
                    </p>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 text-center transform transition-all duration-300 hover:scale-105 hover:bg-gray-750">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-400" ref={scoreRef}>
                            {score}
                        </div>
                        <div className="text-sm lg:text-base text-gray-400">Score</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 text-center transform transition-all duration-300 hover:scale-105 hover:bg-gray-750">
                        <div className="text-2xl lg:text-3xl font-bold text-green-400">
                            {streak}
                        </div>
                        <div className="text-sm lg:text-base text-gray-400">Streak</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 text-center transform transition-all duration-300 hover:scale-105 hover:bg-gray-750">
                        <div className="text-2xl lg:text-3xl font-bold text-yellow-400">
                            {cardsRemaining}
                        </div>
                        <div className="text-sm lg:text-base text-gray-400">Cards Left</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 text-center transform transition-all duration-300 hover:scale-105 hover:bg-gray-750">
                        <div className="text-sm lg:text-base font-bold text-purple-400">
                            {gameStatus === 'waiting' ? 'Ready' :
                                gameStatus === 'playing' ? 'Playing' : 'Finished'}
                        </div>
                        <div className="text-sm lg:text-base text-gray-400">Status</div>
                    </div>
                </div>

                {/* Game Message */}
                <div className="text-center mb-8">
                    <div
                        ref={messageRef}
                        className="text-lg text-white bg-gray-800 rounded-lg p-4 inline-block"
                    >
                        {message || 'Welcome to Higher or Lower!'}
                    </div>
                </div>

                {/* Game Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-8">
                    {/* Current Card */}
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-white mb-4">Current Card</h3>
                        <div
                            ref={currentCardRef}
                            className="bg-gray-800 rounded-lg p-6 min-h-[300px] lg:min-h-[350px] flex items-center justify-center transition-all duration-300 hover:bg-gray-750"
                        >
                            {currentCard ? (
                                <img
                                    src={currentCard.image}
                                    alt={`${currentCard.value} of ${currentCard.suit}`}
                                    className="max-w-full max-h-[250px] lg:max-h-[300px] rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
                                />
                            ) : (
                                <div className="text-gray-400 text-center">
                                    <div className="text-6xl lg:text-8xl mb-4">🂠</div>
                                    <div className="text-sm lg:text-base">No card drawn yet</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Next Card / Placeholder */}
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-white mb-4">Next Card</h3>
                        <div
                            ref={nextCardRef}
                            className="bg-gray-800 rounded-lg p-6 min-h-[300px] lg:min-h-[350px] flex items-center justify-center transition-all duration-300 hover:bg-gray-750"
                        >
                            {nextCard ? (
                                <img
                                    src={nextCard.image}
                                    alt={`${nextCard.value} of ${nextCard.suit}`}
                                    className="max-w-full max-h-[250px] lg:max-h-[300px] rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
                                />
                            ) : (
                                <div className="text-gray-400 text-center">
                                    <div className="text-6xl lg:text-8xl mb-4">🂠</div>
                                    <div className="text-sm lg:text-base">Card back</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Game Controls */}
                <div className="text-center space-y-4">
                    {gameStatus === 'waiting' && deckId && (
                        <button
                            onClick={startGame}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 lg:px-12 lg:py-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95 text-sm lg:text-base"
                        >
                            {loading ? 'Drawing...' : 'Draw First Card'}
                        </button>
                    )}

                    {gameStatus === 'playing' && currentCard && !nextCard && (
                        <div className="space-x-4 lg:space-x-6">
                            <button
                                onClick={() => makeGuess('higher')}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 lg:px-12 lg:py-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95 text-sm lg:text-base"
                            >
                                {loading ? 'Drawing...' : 'Higher ⬆️'}
                            </button>
                            <button
                                onClick={() => makeGuess('lower')}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 lg:px-12 lg:py-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95 text-sm lg:text-base"
                            >
                                {loading ? 'Drawing...' : 'Lower ⬇️'}
                            </button>
                        </div>
                    )}

                    {(gameStatus === 'game-over' || !deckId) && (
                        <button
                            onClick={createNewDeck}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 lg:px-12 lg:py-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95 text-sm lg:text-base"
                        >
                            {loading ? 'Creating...' : 'New Game'}
                        </button>
                    )}
                </div>

                {/* Game Rules */}
                <div className="mt-12 bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">How to Play: Higher or Lower</h3>
                    <div className="text-gray-300 space-y-2">
                        <p>• A card is drawn and shown to you</p>
                        <p>• Guess whether the next card will be higher or lower in value</p>
                        <p>• Ace = 1, Jack = 11, Queen = 12, King = 13</p>
                        <p>• If the cards are equal, you get the point!</p>
                        <p>• Try to get the highest score possible before the deck runs out</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
