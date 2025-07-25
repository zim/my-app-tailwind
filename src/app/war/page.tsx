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
    wars: number;
    totalCards: number;
}

export default function WarPage() {
    const [deckId, setDeckId] = useState<string>('');
    const [playerCard, setPlayerCard] = useState<Card | null>(null);
    const [computerCard, setComputerCard] = useState<Card | null>(null);
    const [playerScore, setPlayerScore] = useState<number>(0);
    const [computerScore, setComputerScore] = useState<number>(0);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'war' | 'finished'>('waiting');
    const [message, setMessage] = useState<string>('Click "Battle!" to start the war!');
    const [loading, setLoading] = useState<boolean>(false);
    const [stats, setStats] = useState<GameStats>({ wins: 0, losses: 0, wars: 0, totalCards: 0 });
    const [cardsRemaining, setCardsRemaining] = useState<number>(52);
    const [warCards, setWarCards] = useState<{ player: Card[], computer: Card[] }>({ player: [], computer: [] });
    const [gameHistory, setGameHistory] = useState<Array<{ round: number, result: string, playerCard: string, computerCard: string }>>([]);

    const messageRef = useRef<HTMLDivElement>(null);
    const playerCardRef = useRef<HTMLDivElement>(null);
    const computerCardRef = useRef<HTMLDivElement>(null);
    const battleRef = useRef<HTMLDivElement>(null);

    const API_BASE = 'https://deckofcardsapi.com/api/deck';

    // Card value hierarchy for War
    const getCardValue = (card: Card): number => {
        switch (card.value) {
            case 'ACE': return 14;
            case 'KING': return 13;
            case 'QUEEN': return 12;
            case 'JACK': return 11;
            default: return parseInt(card.value);
        }
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
        setGameStatus('waiting');
        setMessage('Game ready! Click "Battle!" to draw cards.');
        setPlayerCard(null);
        setComputerCard(null);
        setPlayerScore(0);
        setComputerScore(0);
        setWarCards({ player: [], computer: [] });
        setGameHistory([]);

        try {
            // Create new deck
            const newDeckId = await createNewDeck();
            if (newDeckId) {
                setMessage('New deck created! Ready to battle!');
            }
        } catch (error) {
            console.error('Error starting game:', error);
            setMessage('Error starting game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Battle - draw cards and compare
    const battle = async () => {
        if (!deckId || cardsRemaining < 2) {
            setMessage('Not enough cards! Starting new game...');
            await startNewGame();
            return;
        }

        setLoading(true);
        setGameStatus('playing');
        setMessage('Drawing cards...');

        try {
            const cards = await drawCards(2);
            if (cards.length === 2) {
                const newPlayerCard = cards[0];
                const newComputerCard = cards[1];

                setPlayerCard(newPlayerCard);
                setComputerCard(newComputerCard);

                // Animate card appearance
                setTimeout(() => {
                    animateCardBattle(newPlayerCard, newComputerCard);
                }, 100);

                // Determine winner after animation
                setTimeout(() => {
                    resolveRound(newPlayerCard, newComputerCard);
                }, 1000);
            }
        } catch (error) {
            console.error('Error drawing cards:', error);
            setMessage('Error drawing cards. Please try again.');
            setLoading(false);
        }
    };

    // Resolve round result
    const resolveRound = (pCard: Card, cCard: Card) => {
        const playerValue = getCardValue(pCard);
        const computerValue = getCardValue(cCard);
        const round = gameHistory.length + 1;

        let result = '';
        let newPlayerScore = playerScore;
        let newComputerScore = computerScore;

        if (playerValue > computerValue) {
            result = 'You win this round!';
            newPlayerScore += 1;
            setPlayerScore(newPlayerScore);
            setStats(prev => ({ ...prev, wins: prev.wins + 1, totalCards: prev.totalCards + 2 }));
        } else if (computerValue > playerValue) {
            result = 'Computer wins this round!';
            newComputerScore += 1;
            setComputerScore(newComputerScore);
            setStats(prev => ({ ...prev, losses: prev.losses + 1, totalCards: prev.totalCards + 2 }));
        } else {
            result = 'WAR!';
            setGameStatus('war');
            setStats(prev => ({ ...prev, wars: prev.wars + 1 }));
            handleWar();
            return;
        }

        // Add to history
        setGameHistory(prev => [...prev, {
            round,
            result,
            playerCard: `${pCard.value} of ${pCard.suit}`,
            computerCard: `${cCard.value} of ${cCard.suit}`
        }]);

        setMessage(result);
        setGameStatus('waiting');
        setLoading(false);

        // Check for game end
        if (cardsRemaining <= 6) {
            setTimeout(() => {
                endGame(newPlayerScore, newComputerScore);
            }, 2000);
        }
    };

    // Handle war scenario
    const handleWar = async () => {
        setMessage('WAR! Drawing 4 cards each...');

        try {
            const warCardsDrawn = await drawCards(8); // 4 for player, 4 for computer
            if (warCardsDrawn.length === 8) {
                const playerWarCards = warCardsDrawn.slice(0, 4);
                const computerWarCards = warCardsDrawn.slice(4, 8);

                setWarCards({ player: playerWarCards, computer: computerWarCards });

                // The last card of each war pile determines the winner
                const playerWarCard = playerWarCards[3];
                const computerWarCard = computerWarCards[3];

                setTimeout(() => {
                    animateWarCards(playerWarCards, computerWarCards);
                }, 500);

                setTimeout(() => {
                    const playerValue = getCardValue(playerWarCard);
                    const computerValue = getCardValue(computerWarCard);

                    let warResult = '';
                    if (playerValue > computerValue) {
                        warResult = 'You win the WAR! +5 points!';
                        setPlayerScore(prev => prev + 5);
                        setStats(prev => ({ ...prev, wins: prev.wins + 1, totalCards: prev.totalCards + 10 }));
                    } else if (computerValue > playerValue) {
                        warResult = 'Computer wins the WAR! +5 points to computer!';
                        setComputerScore(prev => prev + 5);
                        setStats(prev => ({ ...prev, losses: prev.losses + 1, totalCards: prev.totalCards + 10 }));
                    } else {
                        warResult = 'Another WAR! (Rare!)';
                        // In a real game, this would continue, but for simplicity, we'll call it a tie
                        setStats(prev => ({ ...prev, totalCards: prev.totalCards + 10 }));
                    }

                    setMessage(warResult);
                    setGameStatus('waiting');
                    setLoading(false);

                    // Clear war cards after showing result
                    setTimeout(() => {
                        setWarCards({ player: [], computer: [] });
                    }, 3000);

                }, 2000);
            }
        } catch (error) {
            console.error('Error handling war:', error);
            setMessage('Error handling war. Continuing game...');
            setGameStatus('waiting');
            setLoading(false);
        }
    };

    // End game
    const endGame = (finalPlayerScore: number, finalComputerScore: number) => {
        setGameStatus('finished');
        if (finalPlayerScore > finalComputerScore) {
            setMessage(`🎉 You win the game! Final score: ${finalPlayerScore} - ${finalComputerScore}`);
        } else if (finalComputerScore > finalPlayerScore) {
            setMessage(`💻 Computer wins the game! Final score: ${finalPlayerScore} - ${finalComputerScore}`);
        } else {
            setMessage(`🤝 It's a tie game! Final score: ${finalPlayerScore} - ${finalComputerScore}`);
        }
    };

    // Animate card battle
    const animateCardBattle = (pCard: Card, cCard: Card) => {
        if (playerCardRef.current && computerCardRef.current) {
            // Player card animation
            gsap.fromTo(playerCardRef.current,
                { opacity: 0, scale: 0, rotation: 180, y: 100 },
                { opacity: 1, scale: 1, rotation: 0, y: 0, duration: 0.8, ease: "back.out(1.7)" }
            );

            // Computer card animation
            gsap.fromTo(computerCardRef.current,
                { opacity: 0, scale: 0, rotation: -180, y: -100 },
                { opacity: 1, scale: 1, rotation: 0, y: 0, duration: 0.8, ease: "back.out(1.7)", delay: 0.2 }
            );

            // Battle effect
            if (battleRef.current) {
                gsap.fromTo(battleRef.current,
                    { scale: 0, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, delay: 0.8, ease: "back.out(2)" }
                );
                gsap.to(battleRef.current,
                    { scale: 0, opacity: 0, duration: 0.3, delay: 1.2 }
                );
            }
        }
    };

    // Animate war cards
    const animateWarCards = (playerWarCards: Card[], computerWarCards: Card[]) => {
        const playerWarElements = document.querySelectorAll('.player-war-card');
        const computerWarElements = document.querySelectorAll('.computer-war-card');

        playerWarElements.forEach((element, index) => {
            gsap.fromTo(element,
                { opacity: 0, scale: 0, x: -50 },
                { opacity: 1, scale: 1, x: 0, duration: 0.4, delay: index * 0.1, ease: "back.out(1.7)" }
            );
        });

        computerWarElements.forEach((element, index) => {
            gsap.fromTo(element,
                { opacity: 0, scale: 0, x: 50 },
                { opacity: 1, scale: 1, x: 0, duration: 0.4, delay: index * 0.1, ease: "back.out(1.7)" }
            );
        });
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

    // Initialize game
    useEffect(() => {
        startNewGame();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/games"
                        className="inline-flex items-center gap-2 text-white hover:text-red-400 mb-4 transition-colors"
                    >
                        ← Back to Games Hub
                    </Link>
                    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                        ⚔️ War
                    </h1>
                    <p className="text-xl text-gray-300">
                        Classic card battle! Higher card wins the round!
                    </p>
                </div>

                {/* Score Display */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-blue-800 rounded-lg p-6 text-center">
                        <div className="text-4xl font-bold text-white">{playerScore}</div>
                        <div className="text-blue-200">Your Wins</div>
                    </div>
                    <div className="bg-red-800 rounded-lg p-6 text-center">
                        <div className="text-4xl font-bold text-white">{computerScore}</div>
                        <div className="text-red-200">Computer Wins</div>
                    </div>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-green-400">{stats.wins}</div>
                        <div className="text-sm text-gray-300">Total Wins</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-red-400">{stats.losses}</div>
                        <div className="text-sm text-gray-300">Total Losses</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-yellow-400">{stats.wars}</div>
                        <div className="text-sm text-gray-300">Wars</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-purple-400">{stats.totalCards}</div>
                        <div className="text-sm text-gray-300">Cards Played</div>
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

                {/* Battle Area */}
                <div className="relative mb-8">
                    {/* Computer Card */}
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-semibold text-white mb-4">Computer</h3>
                        <div className="flex justify-center">
                            {computerCard ? (
                                <div ref={computerCardRef}>
                                    <img
                                        src={computerCard.image}
                                        alt={`${computerCard.value} of ${computerCard.suit}`}
                                        className="w-32 h-48 rounded-lg shadow-2xl"
                                    />
                                    <p className="text-white mt-2 font-semibold">
                                        {computerCard.value} of {computerCard.suit}
                                    </p>
                                </div>
                            ) : (
                                <div className="w-32 h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-500 text-4xl">🂠</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Battle Effect */}
                    <div ref={battleRef} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="text-6xl">⚔️</div>
                    </div>

                    {/* Player Card */}
                    <div className="text-center">
                        <h3 className="text-2xl font-semibold text-white mb-4">You</h3>
                        <div className="flex justify-center">
                            {playerCard ? (
                                <div ref={playerCardRef}>
                                    <img
                                        src={playerCard.image}
                                        alt={`${playerCard.value} of ${playerCard.suit}`}
                                        className="w-32 h-48 rounded-lg shadow-2xl"
                                    />
                                    <p className="text-white mt-2 font-semibold">
                                        {playerCard.value} of {playerCard.suit}
                                    </p>
                                </div>
                            ) : (
                                <div className="w-32 h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-500 text-4xl">🂠</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* War Cards Display */}
                {warCards.player.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-white text-center mb-4">🔥 WAR CARDS 🔥</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-center text-white mb-2">Computer War Cards</h4>
                                <div className="flex justify-center gap-1">
                                    {warCards.computer.map((card, index) => (
                                        <img
                                            key={card.code}
                                            src={card.image}
                                            alt={`${card.value} of ${card.suit}`}
                                            className={`computer-war-card w-16 h-24 rounded shadow-lg ${index === 3 ? 'ring-2 ring-yellow-400' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-center text-white mb-2">Your War Cards</h4>
                                <div className="flex justify-center gap-1">
                                    {warCards.player.map((card, index) => (
                                        <img
                                            key={card.code}
                                            src={card.image}
                                            alt={`${card.value} of ${card.suit}`}
                                            className={`player-war-card w-16 h-24 rounded shadow-lg ${index === 3 ? 'ring-2 ring-yellow-400' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="text-center mb-8">
                    <div className="space-y-4">
                        {gameStatus === 'waiting' && (
                            <button
                                onClick={battle}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors disabled:opacity-50 shadow-lg"
                            >
                                {loading ? 'Drawing...' : '⚔️ BATTLE!'}
                            </button>
                        )}

                        {gameStatus === 'finished' && (
                            <button
                                onClick={startNewGame}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-xl transition-colors disabled:opacity-50 shadow-lg"
                            >
                                {loading ? 'Starting...' : '🔄 New Game'}
                            </button>
                        )}

                        <div className="text-gray-400 text-sm">
                            Cards remaining: {cardsRemaining}
                        </div>
                    </div>
                </div>

                {/* Game History */}
                {gameHistory.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">📜 Battle History</h3>
                        <div className="max-h-64 overflow-y-auto">
                            {gameHistory.slice(-10).map((entry, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                                    <div className="text-sm text-gray-300">
                                        Round {entry.round}: {entry.playerCard} vs {entry.computerCard}
                                    </div>
                                    <div className={`text-sm font-semibold ${entry.result.includes('You win') ? 'text-green-400' :
                                            entry.result.includes('Computer wins') ? 'text-red-400' : 'text-yellow-400'
                                        }`}>
                                        {entry.result}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rules */}
                <div className="mt-8 bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">⚔️ How to Play War</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                        <div>
                            <h4 className="font-semibold text-white mb-2">Basic Rules</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Both players draw one card</li>
                                <li>• Higher card wins the round</li>
                                <li>• Winner gets a point</li>
                                <li>• Ace is highest (14)</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-2">WAR!</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• When cards tie, it's WAR!</li>
                                <li>• Each player puts down 4 cards</li>
                                <li>• 4th card determines winner</li>
                                <li>• Winner gets 5 points!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
