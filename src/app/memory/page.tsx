'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';

interface Card {
    code: string;
    image: string;
    value: string;
    suit: string;
}

interface MemoryCard extends Card {
    id: number;
    isFlipped: boolean;
    isMatched: boolean;
}

interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    bestMoves: number;
    bestTime: number;
}

export default function MemoryPage() {
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<number>(0);
    const [moves, setMoves] = useState<number>(0);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
    const [message, setMessage] = useState<string>('Click "Start Game" to begin!');
    const [loading, setLoading] = useState<boolean>(false);
    const [stats, setStats] = useState<GameStats>({ gamesPlayed: 0, gamesWon: 0, bestMoves: Infinity, bestTime: Infinity });
    const [startTime, setStartTime] = useState<number>(0);
    const [gameTime, setGameTime] = useState<number>(0);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    const messageRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<HTMLDivElement>(null);

    const API_BASE = 'https://deckofcardsapi.com/api/deck';

    // Difficulty settings
    const difficultySettings = {
        easy: { pairs: 6, gridCols: 'grid-cols-3', cardSize: 'w-24 h-36' },
        medium: { pairs: 8, gridCols: 'grid-cols-4', cardSize: 'w-20 h-32' },
        hard: { pairs: 12, gridCols: 'grid-cols-4', cardSize: 'w-18 h-28' }
    };

    // Create shuffled deck of pairs
    const createMemoryDeck = async (): Promise<MemoryCard[]> => {
        try {
            const pairsNeeded = difficultySettings[difficulty].pairs;

            // Create new deck and draw required cards
            const response = await fetch(`${API_BASE}/new/draw/?count=${pairsNeeded}`);
            const data = await response.json();

            if (data.success && data.cards) {
                const memoryCards: MemoryCard[] = [];

                // Create pairs - each card appears twice
                data.cards.forEach((card: Card, index: number) => {
                    // First instance
                    memoryCards.push({
                        ...card,
                        id: index * 2,
                        isFlipped: false,
                        isMatched: false
                    });

                    // Second instance (pair)
                    memoryCards.push({
                        ...card,
                        id: index * 2 + 1,
                        isFlipped: false,
                        isMatched: false
                    });
                });

                // Shuffle the cards
                return shuffleArray(memoryCards);
            }
        } catch (error) {
            console.error('Error creating memory deck:', error);
        }
        return [];
    };

    // Shuffle array using Fisher-Yates algorithm
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Start new game
    const startNewGame = async () => {
        setLoading(true);
        setGameStatus('playing');
        setMessage('Memorize the cards!');
        setMoves(0);
        setMatchedPairs(0);
        setFlippedCards([]);
        setStartTime(Date.now());
        setGameTime(0);

        try {
            const newCards = await createMemoryDeck();
            setCards(newCards);

            // Show all cards briefly at start
            const revealedCards = newCards.map(card => ({ ...card, isFlipped: true }));
            setCards(revealedCards);

            // Hide cards after preview
            setTimeout(() => {
                const hiddenCards = revealedCards.map(card => ({ ...card, isFlipped: false }));
                setCards(hiddenCards);
                setMessage('Find the matching pairs!');

                // Animate cards into position
                setTimeout(() => {
                    animateCardsIn();
                }, 100);
            }, 2000);

        } catch (error) {
            console.error('Error starting game:', error);
            setMessage('Error starting game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle card click
    const handleCardClick = (cardId: number) => {
        if (gameStatus !== 'playing' || loading) return;

        const card = cards.find(c => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return;

        // If two cards already flipped, ignore click
        if (flippedCards.length >= 2) return;

        // Flip the card
        setCards(prev => prev.map(c =>
            c.id === cardId ? { ...c, isFlipped: true } : c
        ));

        const newFlippedCards = [...flippedCards, cardId];
        setFlippedCards(newFlippedCards);

        // Animate card flip
        animateCardFlip(cardId);

        // Check for match when two cards are flipped
        if (newFlippedCards.length === 2) {
            setMoves(prev => prev + 1);
            setTimeout(() => {
                checkForMatch(newFlippedCards);
            }, 1000);
        }
    };

    // Check if two flipped cards match
    const checkForMatch = (flippedCardIds: number[]) => {
        const [firstId, secondId] = flippedCardIds;
        const firstCard = cards.find(c => c.id === firstId);
        const secondCard = cards.find(c => c.id === secondId);

        if (firstCard && secondCard && firstCard.code === secondCard.code) {
            // Match found!
            setCards(prev => prev.map(c =>
                c.id === firstId || c.id === secondId
                    ? { ...c, isMatched: true }
                    : c
            ));

            setMatchedPairs(prev => prev + 1);
            setMessage('🎉 Match found!');

            // Animate matched cards
            animateMatch([firstId, secondId]);

            // Check if game is complete
            const newMatchedPairs = matchedPairs + 1;
            if (newMatchedPairs === difficultySettings[difficulty].pairs) {
                setTimeout(() => {
                    endGame();
                }, 1000);
            } else {
                setTimeout(() => {
                    setMessage('Keep going! Find more pairs!');
                }, 1500);
            }
        } else {
            // No match - flip cards back
            setTimeout(() => {
                setCards(prev => prev.map(c =>
                    c.id === firstId || c.id === secondId
                        ? { ...c, isFlipped: false }
                        : c
                ));
                setMessage('Not a match. Try again!');

                // Animate cards flipping back
                animateCardFlipBack([firstId, secondId]);
            }, 500);
        }

        // Reset flipped cards
        setFlippedCards([]);
    };

    // End game
    const endGame = () => {
        setGameStatus('finished');
        const finalTime = Math.floor((Date.now() - startTime) / 1000);
        setGameTime(finalTime);

        // Update stats
        setStats(prev => {
            const newStats = {
                gamesPlayed: prev.gamesPlayed + 1,
                gamesWon: prev.gamesWon + 1,
                bestMoves: Math.min(prev.bestMoves === Infinity ? moves : prev.bestMoves, moves),
                bestTime: Math.min(prev.bestTime === Infinity ? finalTime : prev.bestTime, finalTime)
            };
            return newStats;
        });

        setMessage(`🎉 Congratulations! Game completed in ${moves} moves and ${finalTime} seconds!`);
    };

    // Animation functions
    const animateCardsIn = () => {
        if (gridRef.current) {
            const cardElements = gridRef.current.children;
            gsap.fromTo(cardElements,
                { opacity: 0, scale: 0, rotation: 180 },
                {
                    opacity: 1,
                    scale: 1,
                    rotation: 0,
                    duration: 0.6,
                    stagger: 0.05,
                    ease: "back.out(1.7)"
                }
            );
        }
    };

    const animateCardFlip = (cardId: number) => {
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
            gsap.to(cardElement, {
                rotationY: 180,
                duration: 0.3,
                ease: "power2.out"
            });

            setTimeout(() => {
                gsap.to(cardElement, {
                    rotationY: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }, 300);
        }
    };

    const animateCardFlipBack = (cardIds: number[]) => {
        cardIds.forEach(cardId => {
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
                gsap.to(cardElement, {
                    rotationY: -180,
                    duration: 0.3,
                    ease: "power2.out"
                });

                setTimeout(() => {
                    gsap.to(cardElement, {
                        rotationY: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }, 300);
            }
        });
    };

    const animateMatch = (cardIds: number[]) => {
        cardIds.forEach(cardId => {
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
                gsap.to(cardElement, {
                    scale: 1.1,
                    boxShadow: "0 0 20px #10b981",
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut"
                });
            }
        });
    };

    // Timer effect
    useEffect(() => {
        if (gameStatus === 'playing' && startTime > 0) {
            const timer = setInterval(() => {
                setGameTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [gameStatus, startTime]);

    // Animate message changes
    useEffect(() => {
        if (messageRef.current) {
            gsap.fromTo(messageRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5 }
            );
        }
    }, [message]);

    // Format time display
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/games"
                        className="inline-flex items-center gap-2 text-white hover:text-purple-400 mb-4 transition-colors"
                    >
                        ← Back to Games Hub
                    </Link>
                    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                        🧠 Memory Match
                    </h1>
                    <p className="text-xl text-gray-300">
                        Find all the matching pairs! Test your memory skills!
                    </p>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{moves}</div>
                        <div className="text-sm text-gray-300">Moves</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{matchedPairs}/{difficultySettings[difficulty].pairs}</div>
                        <div className="text-sm text-gray-300">Pairs Found</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div ref={timerRef} className="text-2xl font-bold text-green-400">{formatTime(gameTime)}</div>
                        <div className="text-sm text-gray-300">Time</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{stats.gamesWon}</div>
                        <div className="text-sm text-gray-300">Games Won</div>
                    </div>
                </div>

                {/* Personal Best */}
                {stats.bestMoves !== Infinity && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-purple-800 to-purple-700 rounded-lg p-4 text-center">
                            <div className="text-lg font-bold text-white">{stats.bestMoves} moves</div>
                            <div className="text-sm text-purple-200">Personal Best (Moves)</div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-800 to-blue-700 rounded-lg p-4 text-center">
                            <div className="text-lg font-bold text-white">{formatTime(stats.bestTime)}</div>
                            <div className="text-sm text-blue-200">Personal Best (Time)</div>
                        </div>
                    </div>
                )}

                {/* Difficulty Selection */}
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Difficulty Level</h3>
                    <div className="flex justify-center gap-2">
                        {Object.keys(difficultySettings).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level as typeof difficulty)}
                                disabled={gameStatus === 'playing'}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${difficulty === level
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)} ({difficultySettings[level as keyof typeof difficultySettings].pairs} pairs)
                            </button>
                        ))}
                    </div>
                </div>

                {/* Game Message */}
                <div className="text-center mb-8">
                    <div
                        ref={messageRef}
                        className="text-xl font-semibold text-white bg-gray-800 rounded-lg p-4 inline-block max-w-2xl"
                    >
                        {message}
                    </div>
                </div>

                {/* Game Grid */}
                <div className="mb-8">
                    <div
                        ref={gridRef}
                        className={`grid ${difficultySettings[difficulty].gridCols} gap-3 justify-center max-w-4xl mx-auto`}
                    >
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                data-card-id={card.id}
                                onClick={() => handleCardClick(card.id)}
                                className={`${difficultySettings[difficulty].cardSize} cursor-pointer transition-all duration-300 hover:scale-105 relative`}
                            >
                                {card.isFlipped || card.isMatched ? (
                                    <img
                                        src={card.image}
                                        alt={`${card.value} of ${card.suit}`}
                                        className={`w-full h-full rounded-lg shadow-lg ${card.isMatched ? 'ring-2 ring-green-400' : ''
                                            }`}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-lg flex items-center justify-center border-2 border-indigo-500">
                                        <div className="text-white text-2xl">🎴</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div className="text-center mb-8">
                    {gameStatus === 'waiting' && (
                        <button
                            onClick={startNewGame}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors disabled:opacity-50 shadow-lg"
                        >
                            {loading ? 'Preparing...' : '🎮 Start Game'}
                        </button>
                    )}

                    {gameStatus === 'finished' && (
                        <button
                            onClick={startNewGame}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors disabled:opacity-50 shadow-lg"
                        >
                            {loading ? 'Preparing...' : '🔄 Play Again'}
                        </button>
                    )}
                </div>

                {/* Rules */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🧠 How to Play Memory Match</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                        <div>
                            <h4 className="font-semibold text-white mb-2">Objective</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Find all matching pairs of cards</li>
                                <li>• Complete the game in fewer moves</li>
                                <li>• Beat your personal best time</li>
                                <li>• Challenge yourself with harder difficulties</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-2">How to Play</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Cards are shown briefly at start</li>
                                <li>• Click two cards to flip them</li>
                                <li>• If they match, they stay flipped</li>
                                <li>• If not, they flip back down</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
