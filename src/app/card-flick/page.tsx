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

interface FlickedCard extends Card {
    id: number;
    x: number;
    y: number;
    rotation: number;
    distanceFromWall: number;
    flickTime: number;
}

interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    perfectShots: number; // Cards that hit very close to wall
    bestDistance: number;
}

export default function CardFlickPage() {
    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [flickedCards, setFlickedCards] = useState<FlickedCard[]>([]);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'aiming' | 'flicking' | 'round-end' | 'game-end'>('waiting');
    const [message, setMessage] = useState<string>('Click "Start Game" to begin flicking cards!');
    const [loading, setLoading] = useState<boolean>(false);
    const [stats, setStats] = useState<GameStats>({ gamesPlayed: 0, gamesWon: 0, perfectShots: 0, bestDistance: Infinity });
    const [round, setRound] = useState<number>(1);
    const [playerScore, setPlayerScore] = useState<number>(0);
    const [computerScore, setComputerScore] = useState<number>(0);
    const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [cardsRemaining, setCardsRemaining] = useState<number>(52);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const wallRef = useRef<HTMLDivElement>(null);

    const API_BASE = 'https://deckofcardsapi.com/api/deck';
    const WALL_POSITION = 90; // Percentage from left where wall is located
    const MAX_ROUNDS = 5;

    // Create new deck and draw card
    const drawNewCard = async (): Promise<Card | null> => {
        try {
            // Create new deck if needed
            if (cardsRemaining < 2) {
                const response = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
                const data = await response.json();
                if (data.success) {
                    setCardsRemaining(data.remaining);
                }
            }

            // Draw a card
            const response = await fetch(`${API_BASE}/new/draw/?count=1`);
            const data = await response.json();
            if (data.success && data.cards && data.cards.length > 0) {
                setCardsRemaining(data.remaining);
                return data.cards[0];
            }
        } catch (error) {
            console.error('Error drawing card:', error);
        }
        return null;
    };

    // Start new game
    const startNewGame = async () => {
        setLoading(true);
        setGameStatus('waiting');
        setMessage('Starting new game...');
        setFlickedCards([]);
        setRound(1);
        setPlayerScore(0);
        setComputerScore(0);
        setIsPlayerTurn(true);

        try {
            const card = await drawNewCard();
            if (card) {
                setCurrentCard(card);
                setGameStatus('aiming');
                setMessage('Your turn! Click and drag to flick your card toward the wall!');

                // Animate card into position
                setTimeout(() => {
                    animateCardEntry();
                }, 100);
            }
        } catch (error) {
            console.error('Error starting game:', error);
            setMessage('Error starting game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle mouse down on card
    const handleMouseDown = (e: React.MouseEvent) => {
        if (gameStatus !== 'aiming' || !isPlayerTurn) return;

        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setMessage('Drag to aim, release to flick!');
    };

    // Handle mouse move
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart) return;

        e.preventDefault();
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        const power = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 2, 50);

        // Visual feedback for power
        if (cardRef.current) {
            const scale = 1 + (power / 100);
            gsap.set(cardRef.current, {
                scale: scale,
                rotation: deltaX / 5
            });
        }
    };

    // Handle mouse up (flick the card)
    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart || !currentCard) return;

        e.preventDefault();
        setIsDragging(false);
        setGameStatus('flicking');
        setMessage('Card flying...');

        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        const power = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        flickCard(deltaX, deltaY, power);
        setDragStart(null);
    };

    // Add global mouse event handlers
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging || !dragStart) return;

            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            const power = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 2, 50);

            // Visual feedback for power
            if (cardRef.current) {
                const scale = 1 + (power / 100);
                gsap.set(cardRef.current, {
                    scale: scale,
                    rotation: deltaX / 5
                });
            }
        };

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (!isDragging || !dragStart || !currentCard) return;

            setIsDragging(false);
            setGameStatus('flicking');
            setMessage('Card flying...');

            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            const power = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            flickCard(deltaX, deltaY, power);
            setDragStart(null);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragStart, currentCard]);

    // Flick the card with physics
    const flickCard = (deltaX: number, deltaY: number, power: number) => {
        if (!currentCard || !cardRef.current || !gameAreaRef.current) return;

        const gameArea = gameAreaRef.current.getBoundingClientRect();
        const velocityX = deltaX / 3;
        const velocityY = deltaY / 3;

        // Calculate final position with some randomness for realism
        const randomFactorX = (Math.random() - 0.5) * 20;
        const randomFactorY = (Math.random() - 0.5) * 20;

        const finalX = Math.min(Math.max(50 + velocityX + randomFactorX, 10), 85);
        const finalY = Math.min(Math.max(50 + velocityY + randomFactorY, 10), 80);

        const finalRotation = (Math.random() - 0.5) * 360 + (deltaX / 2);

        // Calculate distance from wall (wall is at 90%)
        const distanceFromWall = Math.abs(WALL_POSITION - finalX);

        // Animate card flick
        gsap.to(cardRef.current, {
            x: `${finalX}vw`,
            y: `${finalY}vh`,
            rotation: finalRotation,
            scale: 0.7,
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
                // Add card to flicked cards
                const flickedCard: FlickedCard = {
                    ...currentCard,
                    id: Date.now(),
                    x: finalX,
                    y: finalY,
                    rotation: finalRotation,
                    distanceFromWall,
                    flickTime: Date.now()
                };

                setFlickedCards(prev => [...prev, flickedCard]);
                setCurrentCard(null);

                // Check for perfect shot
                if (distanceFromWall < 3) {
                    setStats(prev => ({ ...prev, perfectShots: prev.perfectShots + 1 }));
                    setMessage(`🎯 PERFECT SHOT! Distance: ${distanceFromWall.toFixed(1)}%`);
                } else {
                    setMessage(`Good throw! Distance from wall: ${distanceFromWall.toFixed(1)}%`);
                }

                // Update best distance
                setStats(prev => ({
                    ...prev,
                    bestDistance: Math.min(prev.bestDistance === Infinity ? distanceFromWall : prev.bestDistance, distanceFromWall)
                }));

                setTimeout(() => {
                    if (isPlayerTurn) {
                        computerTurn();
                    } else {
                        nextRound();
                    }
                }, 2000);
            }
        });

        // Add trail effect
        createTrailEffect(finalX, finalY);
    };

    // Computer's turn
    const computerTurn = async () => {
        setIsPlayerTurn(false);
        setMessage('Computer\'s turn...');

        try {
            const card = await drawNewCard();
            if (card) {
                setCurrentCard(card);

                // Computer flick with AI (tries to get close to wall but not perfect)
                setTimeout(() => {
                    const computerAccuracy = 0.7 + Math.random() * 0.25; // 70-95% accuracy
                    const targetDistance = 2 + Math.random() * 8; // Aims for 2-10% from wall
                    const finalX = WALL_POSITION - targetDistance * computerAccuracy;
                    const finalY = 30 + Math.random() * 40;
                    const finalRotation = (Math.random() - 0.5) * 360;
                    const distanceFromWall = Math.abs(WALL_POSITION - finalX);

                    // Animate computer card
                    if (cardRef.current) {
                        gsap.fromTo(cardRef.current,
                            { x: '10vw', y: '20vh', rotation: 0, scale: 1 },
                            {
                                x: `${finalX}vw`,
                                y: `${finalY}vh`,
                                rotation: finalRotation,
                                scale: 0.7,
                                duration: 1.5,
                                ease: "power2.out",
                                onComplete: () => {
                                    const flickedCard: FlickedCard = {
                                        ...card,
                                        id: Date.now(),
                                        x: finalX,
                                        y: finalY,
                                        rotation: finalRotation,
                                        distanceFromWall,
                                        flickTime: Date.now()
                                    };

                                    setFlickedCards(prev => [...prev, flickedCard]);
                                    setCurrentCard(null);
                                    setMessage(`Computer threw! Distance: ${distanceFromWall.toFixed(1)}%`);

                                    setTimeout(() => {
                                        nextRound();
                                    }, 2000);
                                }
                            }
                        );
                    }

                    createTrailEffect(finalX, finalY);
                }, 1000);
            }
        } catch (error) {
            console.error('Error with computer turn:', error);
        }
    };

    // Next round
    const nextRound = async () => {
        // Determine round winner (closest to wall)
        if (flickedCards.length >= 2) {
            const playerCard = flickedCards[flickedCards.length - 2];
            const computerCard = flickedCards[flickedCards.length - 1];

            if (playerCard.distanceFromWall < computerCard.distanceFromWall) {
                setPlayerScore(prev => prev + 1);
                setMessage(`🎉 You win this round! ${playerCard.distanceFromWall.toFixed(1)} vs ${computerCard.distanceFromWall.toFixed(1)}`);
            } else {
                setComputerScore(prev => prev + 1);
                setMessage(`💻 Computer wins this round! ${computerCard.distanceFromWall.toFixed(1)} vs ${playerCard.distanceFromWall.toFixed(1)}`);
            }
        }

        if (round >= MAX_ROUNDS) {
            setTimeout(() => endGame(), 2000);
        } else {
            setTimeout(async () => {
                setRound(prev => prev + 1);
                setIsPlayerTurn(true);
                const card = await drawNewCard();
                if (card) {
                    setCurrentCard(card);
                    setGameStatus('aiming');
                    setMessage(`Round ${round + 1}! Your turn - flick your card!`);
                    animateCardEntry();
                }
            }, 3000);
        }
    };

    // End game
    const endGame = () => {
        setGameStatus('game-end');
        const won = playerScore > computerScore;

        setStats(prev => ({
            ...prev,
            gamesPlayed: prev.gamesPlayed + 1,
            gamesWon: won ? prev.gamesWon + 1 : prev.gamesWon
        }));

        if (won) {
            setMessage(`🏆 YOU WIN! Final score: ${playerScore} - ${computerScore}`);
        } else if (playerScore === computerScore) {
            setMessage(`🤝 IT'S A TIE! Final score: ${playerScore} - ${computerScore}`);
        } else {
            setMessage(`💻 Computer wins! Final score: ${playerScore} - ${computerScore}`);
        }
    };

    // Create trail effect
    const createTrailEffect = (endX: number, endY: number) => {
        const trail = document.createElement('div');
        trail.className = 'absolute pointer-events-none';
        trail.style.left = '20vw';
        trail.style.top = '20vh';
        trail.style.width = '2px';
        trail.style.height = '2px';
        trail.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4)';
        trail.style.borderRadius = '50%';
        trail.style.zIndex = '5';

        if (gameAreaRef.current) {
            gameAreaRef.current.appendChild(trail);

            gsap.to(trail, {
                x: `${endX - 20}vw`,
                y: `${endY - 20}vh`,
                scale: 0,
                duration: 1.5,
                ease: "power2.out",
                onComplete: () => trail.remove()
            });
        }
    };

    // Animate card entry
    const animateCardEntry = () => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current,
                { x: '-50vw', y: '20vh', rotation: 360, scale: 0.5, opacity: 0 },
                { x: '20vw', y: '20vh', rotation: 0, scale: 1, opacity: 1, duration: 1, ease: "back.out(1.7)" }
            );
        }
    };

    // Animate message changes
    useEffect(() => {
        if (messageRef.current) {
            gsap.fromTo(messageRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5 }
            );
        }
    }, [message]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 overflow-hidden">
            <div className="max-w-full h-screen relative">
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-20">
                    <div className="flex justify-between items-center">
                        <Link
                            href="/games"
                            className="inline-flex items-center gap-2 text-white hover:text-orange-400 transition-colors bg-black bg-opacity-30 px-3 py-1 rounded-lg"
                        >
                            ← Back to Games Hub
                        </Link>
                        <h1 className="text-2xl lg:text-4xl font-bold text-white text-center">
                            🎯 Card Flick
                        </h1>
                        <div className="text-white text-right bg-black bg-opacity-30 px-3 py-1 rounded-lg">
                            Round {round}/{MAX_ROUNDS}
                        </div>
                    </div>
                </div>

                {/* Score Board */}
                <div className="absolute top-20 left-4 right-4 z-20">
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        <div className="bg-blue-800 bg-opacity-80 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-white">{playerScore}</div>
                            <div className="text-blue-200">You</div>
                        </div>
                        <div className="bg-red-800 bg-opacity-80 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-white">{computerScore}</div>
                            <div className="text-red-200">Computer</div>
                        </div>
                    </div>
                </div>

                {/* Game Stats */}
                <div className="absolute top-4 right-4 z-20">
                    <div className="bg-black bg-opacity-50 rounded-lg p-3 text-white text-sm">
                        <div>Perfect Shots: {stats.perfectShots}</div>
                        <div>Best: {stats.bestDistance === Infinity ? 'None' : `${stats.bestDistance.toFixed(1)}%`}</div>
                        <div>Win Rate: {stats.gamesPlayed > 0 ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` : '0%'}</div>
                    </div>
                </div>

                {/* Game Message */}
                <div className="absolute top-40 left-4 right-4 z-20">
                    <div className="text-center">
                        <div
                            ref={messageRef}
                            className="text-lg lg:text-xl font-semibold text-white bg-black bg-opacity-50 rounded-lg p-4 inline-block max-w-2xl"
                        >
                            {message}
                        </div>
                    </div>
                </div>

                {/* Game Area */}
                <div
                    ref={gameAreaRef}
                    className="absolute inset-0 overflow-hidden"
                >
                    {/* Wall */}
                    <div
                        ref={wallRef}
                        className="absolute bg-gradient-to-b from-gray-800 to-gray-600 shadow-2xl"
                        style={{
                            left: `${WALL_POSITION}%`,
                            top: '0%',
                            width: '8px',
                            height: '100%',
                            boxShadow: '-5px 0 15px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-bold bg-gray-800 px-2 py-1 rounded">
                            WALL
                        </div>
                    </div>

                    {/* Current Card */}
                    {currentCard && (
                        <div
                            ref={cardRef}
                            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-105 select-none"
                            style={{ left: '20vw', top: '20vh', zIndex: 10 }}
                            onMouseDown={handleMouseDown}
                        >
                            <img
                                src={currentCard.image}
                                alt={`${currentCard.value} of ${currentCard.suit}`}
                                className="w-20 h-32 lg:w-24 lg:h-36 rounded-lg shadow-2xl border-2 border-white pointer-events-none"
                                draggable={false}
                            />
                            {isDragging && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-70 px-2 py-1 rounded">
                                    Release to flick!
                                </div>
                            )}
                        </div>
                    )}

                    {/* Flicked Cards */}
                    {flickedCards.map((card, index) => (
                        <div
                            key={card.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: `${card.x}vw`,
                                top: `${card.y}vh`,
                                transform: `translate(-50%, -50%) rotate(${card.rotation}deg) scale(0.7)`,
                                zIndex: 1
                            }}
                        >
                            <img
                                src={card.image}
                                alt={`${card.value} of ${card.suit}`}
                                className="w-16 h-24 lg:w-20 lg:h-32 rounded-lg shadow-lg opacity-80"
                            />
                            {/* Distance indicator */}
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-70 px-2 py-1 rounded whitespace-nowrap">
                                {card.distanceFromWall.toFixed(1)}%
                            </div>
                        </div>
                    ))}

                    {/* Distance markers */}
                    <div className="absolute bottom-4 left-4 right-4 z-10">
                        <div className="flex justify-between text-white text-xs">
                            <span>Starting Area</span>
                            <span>Perfect Zone (&lt;3%)</span>
                            <span>WALL</span>
                        </div>
                        <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded mt-1 relative">
                            <div
                                className="absolute top-0 bottom-0 bg-white opacity-30"
                                style={{ right: '10%', width: '6%' }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-20 left-4 right-4 z-20">
                    <div className="text-center">
                        {gameStatus === 'waiting' && (
                            <button
                                onClick={startNewGame}
                                disabled={loading}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors disabled:opacity-50 shadow-lg"
                            >
                                {loading ? 'Starting...' : '🎯 Start Flicking!'}
                            </button>
                        )}

                        {gameStatus === 'game-end' && (
                            <button
                                onClick={startNewGame}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors disabled:opacity-50 shadow-lg"
                            >
                                {loading ? 'Starting...' : '🔄 Play Again'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Rules */}
                <div className="absolute bottom-4 left-4 z-20">
                    <details className="bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm max-w-xs">
                        <summary className="cursor-pointer font-semibold">📖 How to Play</summary>
                        <div className="mt-2 space-y-1">
                            <p>• Click and drag cards to aim</p>
                            <p>• Release to flick toward the wall</p>
                            <p>• Closest card to wall wins round</p>
                            <p>• First to win 3/5 rounds wins!</p>
                            <p>• Perfect shots: &lt;3% from wall</p>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}
