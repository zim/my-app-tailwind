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

interface DeckResponse {
    success: boolean;
    deck_id: string;
    cards?: Card[];
    remaining: number;
}

interface GameStats {
    wins: number;
    losses: number;
    pushes: number;
    blackjacks: number;
}

export default function BlackjackPage() {
    const [deckId, setDeckId] = useState<string>('');
    const [playerCards, setPlayerCards] = useState<Card[]>([]);
    const [dealerCards, setDealerCards] = useState<Card[]>([]);
    const [playerScore, setPlayerScore] = useState<number>(0);
    const [dealerScore, setDealerScore] = useState<number>(0);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
    const [gameResult, setGameResult] = useState<string>('');
    const [canHit, setCanHit] = useState<boolean>(false);
    const [canStand, setCanStand] = useState<boolean>(false);
    const [showDealerCard, setShowDealerCard] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [stats, setStats] = useState<GameStats>({ wins: 0, losses: 0, pushes: 0, blackjacks: 0 });
    const [cardsRemaining, setCardsRemaining] = useState<number>(52);

    const messageRef = useRef<HTMLDivElement>(null);
    const playerCardsRef = useRef<HTMLDivElement>(null);
    const dealerCardsRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);

    const API_BASE = 'https://deckofcardsapi.com/api/deck';

    // Calculate card value for Blackjack
    const getCardValue = (card: Card): number => {
        if (['JACK', 'QUEEN', 'KING'].includes(card.value)) {
            return 10;
        } else if (card.value === 'ACE') {
            return 11; // Will be adjusted for soft/hard calculation
        } else {
            return parseInt(card.value);
        }
    };

    // Calculate hand value with proper Ace handling
    const calculateHandValue = (cards: Card[]): number => {
        let value = 0;
        let aces = 0;

        for (const card of cards) {
            if (card.value === 'ACE') {
                aces++;
                value += 11;
            } else if (['JACK', 'QUEEN', 'KING'].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        }

        // Convert Aces from 11 to 1 if needed
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    };

    // Create new deck
    const createNewDeck = async (): Promise<string> => {
        try {
            const response = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
            const data: DeckResponse = await response.json();
            if (data.success) {
                setDeckId(data.deck_id);
                setCardsRemaining(data.remaining);
                return data.deck_id;
            }
        } catch (error) {
            console.error('Error creating deck:', error);
        }
        return '';
    };

    // Draw cards from deck
    const drawCards = async (count: number, currentDeckId?: string): Promise<Card[]> => {
        const id = currentDeckId || deckId;
        if (!id) return [];

        try {
            const response = await fetch(`${API_BASE}/${id}/draw/?count=${count}`);
            const data: DeckResponse = await response.json();
            if (data.success && data.cards) {
                setCardsRemaining(data.remaining);
                return data.cards;
            }
        } catch (error) {
            console.error('Error drawing cards:', error);
        }
        return [];
    };

    // Start new game
    const startNewGame = async () => {
        setLoading(true);
        setGameStatus('playing');
        setGameResult('');
        setPlayerCards([]);
        setDealerCards([]);
        setPlayerScore(0);
        setDealerScore(0);
        setShowDealerCard(false);
        setCanHit(false);
        setCanStand(false);

        try {
            // Create new deck if needed or if low on cards
            let currentDeckId = deckId;
            if (!deckId || cardsRemaining < 10) {
                currentDeckId = await createNewDeck();
            }

            if (currentDeckId) {
                // Deal initial cards
                const initialCards = await drawCards(4, currentDeckId);
                if (initialCards.length === 4) {
                    const newPlayerCards = [initialCards[0], initialCards[2]];
                    const newDealerCards = [initialCards[1], initialCards[3]];

                    setPlayerCards(newPlayerCards);
                    setDealerCards(newDealerCards);

                    const playerValue = calculateHandValue(newPlayerCards);
                    const dealerValue = calculateHandValue([newDealerCards[0]]); // Only show first card

                    setPlayerScore(playerValue);
                    setDealerScore(dealerValue);

                    // Check for blackjack
                    if (playerValue === 21) {
                        setShowDealerCard(true);
                        const dealerFullValue = calculateHandValue(newDealerCards);
                        if (dealerFullValue === 21) {
                            setGameResult('Push! Both have Blackjack!');
                            setStats(prev => ({ ...prev, pushes: prev.pushes + 1 }));
                        } else {
                            setGameResult('Blackjack! You win!');
                            setStats(prev => ({
                                ...prev,
                                wins: prev.wins + 1,
                                blackjacks: prev.blackjacks + 1
                            }));
                        }
                        setGameStatus('finished');
                    } else {
                        setCanHit(true);
                        setCanStand(true);
                    }

                    // Animate card dealing
                    setTimeout(() => {
                        animateCardDeal();
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error starting game:', error);
            setGameResult('Error starting game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Hit - draw another card
    const hit = async () => {
        if (!canHit) return;

        setLoading(true);
        const newCards = await drawCards(1);
        if (newCards.length > 0) {
            const updatedPlayerCards = [...playerCards, newCards[0]];
            setPlayerCards(updatedPlayerCards);

            const newPlayerScore = calculateHandValue(updatedPlayerCards);
            setPlayerScore(newPlayerScore);

            if (newPlayerScore > 21) {
                setGameResult('Bust! You lose!');
                setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
                setGameStatus('finished');
                setCanHit(false);
                setCanStand(false);
                setShowDealerCard(true);
            } else if (newPlayerScore === 21) {
                // Auto-stand on 21
                stand();
                return;
            }

            // Animate new card
            setTimeout(() => {
                if (playerCardsRef.current) {
                    const lastCard = playerCardsRef.current.lastElementChild;
                    if (lastCard) {
                        gsap.fromTo(lastCard,
                            { opacity: 0, scale: 0, rotation: 180 },
                            { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)" }
                        );
                    }
                }
            }, 100);
        }
        setLoading(false);
    };

    // Stand - dealer plays
    const stand = async () => {
        if (!canStand) return;

        setCanHit(false);
        setCanStand(false);
        setShowDealerCard(true);
        setLoading(true);

        let currentDealerCards = [...dealerCards];
        let dealerValue = calculateHandValue(currentDealerCards);
        setDealerScore(dealerValue);

        // Dealer draws until 17 or higher
        while (dealerValue < 17) {
            const newCards = await drawCards(1);
            if (newCards.length > 0) {
                currentDealerCards = [...currentDealerCards, newCards[0]];
                setDealerCards(currentDealerCards);
                dealerValue = calculateHandValue(currentDealerCards);
                setDealerScore(dealerValue);

                // Animate dealer card
                await new Promise(resolve => {
                    setTimeout(() => {
                        if (dealerCardsRef.current) {
                            const lastCard = dealerCardsRef.current.lastElementChild;
                            if (lastCard) {
                                gsap.fromTo(lastCard,
                                    { opacity: 0, scale: 0, rotation: -180 },
                                    { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)" }
                                );
                            }
                        }
                        resolve(void 0);
                    }, 800);
                });
            }
        }

        // Determine winner
        if (dealerValue > 21) {
            setGameResult('Dealer busts! You win!');
            setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
        } else if (dealerValue > playerScore) {
            setGameResult('Dealer wins!');
            setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
        } else if (playerScore > dealerValue) {
            setGameResult('You win!');
            setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
        } else {
            setGameResult('Push! It\'s a tie!');
            setStats(prev => ({ ...prev, pushes: prev.pushes + 1 }));
        }

        setGameStatus('finished');
        setLoading(false);
    };

    // Animate card dealing
    const animateCardDeal = () => {
        if (playerCardsRef.current && dealerCardsRef.current) {
            // Animate player cards
            const playerCardElements = playerCardsRef.current.children;
            for (let i = 0; i < playerCardElements.length; i++) {
                gsap.fromTo(playerCardElements[i],
                    { opacity: 0, scale: 0, y: -100, rotation: 180 },
                    {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        rotation: 0,
                        duration: 0.8,
                        ease: "back.out(1.7)",
                        delay: i * 0.3
                    }
                );
            }

            // Animate dealer cards
            const dealerCardElements = dealerCardsRef.current.children;
            for (let i = 0; i < dealerCardElements.length; i++) {
                gsap.fromTo(dealerCardElements[i],
                    { opacity: 0, scale: 0, y: 100, rotation: -180 },
                    {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        rotation: 0,
                        duration: 0.8,
                        ease: "back.out(1.7)",
                        delay: (i * 0.3) + 0.15
                    }
                );
            }
        }
    };

    // Animate message changes
    useEffect(() => {
        if (messageRef.current && gameResult) {
            gsap.fromTo(messageRef.current,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
            );
        }
    }, [gameResult]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/games"
                        className="inline-flex items-center gap-2 text-white hover:text-green-400 mb-4 transition-colors"
                    >
                        ← Back to Games Hub
                    </Link>
                    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                        🃏 Blackjack
                    </h1>
                    <p className="text-xl text-gray-300">
                        Get as close to 21 as possible without going over!
                    </p>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
                        <div className="text-sm text-gray-300">Wins</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
                        <div className="text-sm text-gray-300">Losses</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{stats.pushes}</div>
                        <div className="text-sm text-gray-300">Pushes</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{stats.blackjacks}</div>
                        <div className="text-sm text-gray-300">Blackjacks</div>
                    </div>
                </div>

                {/* Game Message */}
                {gameResult && (
                    <div className="text-center mb-8">
                        <div
                            ref={messageRef}
                            className="text-2xl font-bold text-white bg-gray-800 rounded-lg p-4 inline-block"
                        >
                            {gameResult}
                        </div>
                    </div>
                )}

                {/* Dealer Section */}
                <div className="mb-8">
                    <div className="text-center mb-4">
                        <h3 className="text-2xl font-semibold text-white mb-2">
                            Dealer {showDealerCard ? `(${dealerScore})` : ''}
                        </h3>
                    </div>
                    <div ref={dealerCardsRef} className="flex justify-center gap-2 flex-wrap min-h-[140px]">
                        {dealerCards.map((card, index) => (
                            <div key={card.code} className="relative">
                                {index === 1 && !showDealerCard ? (
                                    <div className="w-24 h-36 bg-blue-900 border-2 border-blue-700 rounded-lg flex items-center justify-center">
                                        <div className="text-white text-lg">🂠</div>
                                    </div>
                                ) : (
                                    <img
                                        src={card.image}
                                        alt={`${card.value} of ${card.suit}`}
                                        className="w-24 h-36 rounded-lg shadow-lg"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Player Section */}
                <div className="mb-8">
                    <div className="text-center mb-4">
                        <h3 className="text-2xl font-semibold text-white mb-2">
                            You ({playerScore})
                        </h3>
                    </div>
                    <div ref={playerCardsRef} className="flex justify-center gap-2 flex-wrap min-h-[140px]">
                        {playerCards.map((card) => (
                            <img
                                key={card.code}
                                src={card.image}
                                alt={`${card.value} of ${card.suit}`}
                                className="w-24 h-36 rounded-lg shadow-lg"
                            />
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div ref={controlsRef} className="text-center space-y-4">
                    {gameStatus === 'waiting' && (
                        <button
                            onClick={startNewGame}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Dealing...' : 'Deal Cards'}
                        </button>
                    )}

                    {gameStatus === 'playing' && (
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={hit}
                                disabled={!canHit || loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Drawing...' : 'Hit'}
                            </button>
                            <button
                                onClick={stand}
                                disabled={!canStand || loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                Stand
                            </button>
                        </div>
                    )}

                    {gameStatus === 'finished' && (
                        <button
                            onClick={startNewGame}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Dealing...' : 'New Game'}
                        </button>
                    )}

                    <div className="text-gray-400 text-sm">
                        Cards remaining in deck: {cardsRemaining}
                    </div>
                </div>

                {/* Rules */}
                <div className="mt-12 bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🎯 How to Play</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                        <div>
                            <h4 className="font-semibold text-white mb-2">Objective</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Get as close to 21 as possible</li>
                                <li>• Don't go over 21 (bust)</li>
                                <li>• Beat the dealer's hand</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-2">Card Values</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Number cards: Face value</li>
                                <li>• Face cards (J, Q, K): 10 points</li>
                                <li>• Aces: 1 or 11 (whichever is better)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
