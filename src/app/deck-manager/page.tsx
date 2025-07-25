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

interface PileResponse {
    success: boolean;
    deck_id: string;
    remaining: number;
    piles: {
        [pileName: string]: {
            remaining: number;
        };
    };
}

interface Deck {
    id: string;
    name: string;
    remaining: number;
    shuffled: boolean;
    created: Date;
}

interface Pile {
    name: string;
    cards: Card[];
    remaining: number;
}

export default function DeckManagerPage() {
    // State management
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<string>('');
    const [piles, setPiles] = useState<Pile[]>([]);
    const [drawnCards, setDrawnCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Welcome to the Deck Manager!');
    const [newDeckName, setNewDeckName] = useState('');
    const [newPileName, setNewPileName] = useState('');
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [deckCount, setDeckCount] = useState(1);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Refs for animations
    const messageRef = useRef<HTMLDivElement>(null);
    const deckGridRef = useRef<HTMLDivElement>(null);
    const pileGridRef = useRef<HTMLDivElement>(null);
    const cardsGridRef = useRef<HTMLDivElement>(null);

    // API base URL
    const API_BASE = 'https://deckofcardsapi.com/api/deck';

    // Create a new deck
    const createDeck = async (name: string, deckCount: number = 1) => {
        try {
            setLoading(true);
            setMessage(`Creating deck "${name}"...`);

            const response = await fetch(`${API_BASE}/new/shuffle/?deck_count=${deckCount}`);
            const data: DeckResponse = await response.json();

            if (data.success) {
                const newDeck: Deck = {
                    id: data.deck_id,
                    name: name || `Deck ${decks.length + 1}`,
                    remaining: data.remaining,
                    shuffled: true,
                    created: new Date()
                };

                setDecks(prev => [...prev, newDeck]);
                setSelectedDeck(newDeck.id);
                setMessage(`Deck "${newDeck.name}" created successfully!`);
                setNewDeckName('');

                // Animate new deck
                setTimeout(() => {
                    if (deckGridRef.current) {
                        const lastDeck = deckGridRef.current.lastElementChild;
                        if (lastDeck) {
                            gsap.fromTo(lastDeck,
                                { opacity: 0, scale: 0, rotation: 180 },
                                { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" }
                            );
                        }
                    }
                }, 100);
            }
        } catch (error) {
            setMessage('Error creating deck. Please try again.');
            console.error('Error creating deck:', error);
        } finally {
            setLoading(false);
        }
    };

    // Draw cards from selected deck
    const drawCards = async (count: number = 1) => {
        if (!selectedDeck) {
            setMessage('Please select a deck first.');
            return;
        }

        try {
            setLoading(true);
            setMessage(`Drawing ${count} card(s)...`);

            const response = await fetch(`${API_BASE}/${selectedDeck}/draw/?count=${count}`);
            const data: DeckResponse = await response.json();

            if (data.success && data.cards) {
                setDrawnCards(prev => [...data.cards!, ...prev]);

                // Update deck remaining count
                setDecks(prev => prev.map(deck =>
                    deck.id === selectedDeck
                        ? { ...deck, remaining: data.remaining }
                        : deck
                ));

                setMessage(`Drew ${data.cards.length} card(s). ${data.remaining} cards remaining.`);

                // Animate drawn cards
                setTimeout(() => {
                    if (cardsGridRef.current) {
                        const newCards = cardsGridRef.current.children;
                        for (let i = 0; i < data.cards!.length; i++) {
                            gsap.fromTo(newCards[i],
                                { opacity: 0, scale: 0, y: -100, rotation: 180 },
                                {
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    rotation: 0,
                                    duration: 0.8,
                                    ease: "back.out(1.7)",
                                    delay: i * 0.1
                                }
                            );
                        }
                    }
                }, 100);
            }
        } catch (error) {
            setMessage('Error drawing cards. Please try again.');
            console.error('Error drawing cards:', error);
        } finally {
            setLoading(false);
        }
    };

    // Shuffle deck
    const shuffleDeck = async (deckId: string) => {
        try {
            setLoading(true);
            setMessage('Shuffling deck...');

            const response = await fetch(`${API_BASE}/${deckId}/shuffle/`);
            const data: DeckResponse = await response.json();

            if (data.success) {
                setDecks(prev => prev.map(deck =>
                    deck.id === deckId
                        ? { ...deck, shuffled: true, remaining: data.remaining }
                        : deck
                ));
                setMessage('Deck shuffled successfully!');
            }
        } catch (error) {
            setMessage('Error shuffling deck.');
            console.error('Error shuffling deck:', error);
        } finally {
            setLoading(false);
        }
    };

    // Create a pile
    const createPile = async (pileName: string, cardCodes: string[]) => {
        if (!selectedDeck || cardCodes.length === 0) {
            setMessage('Please select a deck and some cards first.');
            return;
        }

        try {
            setLoading(true);
            setMessage(`Creating pile "${pileName}"...`);

            const cardsParam = cardCodes.join(',');
            const response = await fetch(`${API_BASE}/${selectedDeck}/pile/${pileName}/add/?cards=${cardsParam}`);
            const data: PileResponse = await response.json();

            if (data.success) {
                // Get the cards that were moved to the pile
                const pileCards = drawnCards.filter(card => cardCodes.includes(card.code));

                const newPile: Pile = {
                    name: pileName,
                    cards: pileCards,
                    remaining: data.piles[pileName].remaining
                };

                setPiles(prev => [...prev, newPile]);

                // Remove cards from drawn cards
                setDrawnCards(prev => prev.filter(card => !cardCodes.includes(card.code)));
                setSelectedCards([]);
                setNewPileName('');

                setMessage(`Pile "${pileName}" created with ${cardCodes.length} card(s)!`);

                // Animate new pile
                setTimeout(() => {
                    if (pileGridRef.current) {
                        const lastPile = pileGridRef.current.lastElementChild;
                        if (lastPile) {
                            gsap.fromTo(lastPile,
                                { opacity: 0, scale: 0, x: 100 },
                                { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: "back.out(1.7)" }
                            );
                        }
                    }
                }, 100);
            }
        } catch (error) {
            setMessage('Error creating pile.');
            console.error('Error creating pile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Draw from pile
    const drawFromPile = async (pileName: string, count: number = 1) => {
        if (!selectedDeck) return;

        try {
            setLoading(true);
            setMessage(`Drawing from pile "${pileName}"...`);

            const response = await fetch(`${API_BASE}/${selectedDeck}/pile/${pileName}/draw/?count=${count}`);
            const data = await response.json();

            if (data.success && data.cards) {
                setDrawnCards(prev => [...data.cards, ...prev]);

                // Update pile
                setPiles(prev => prev.map(pile =>
                    pile.name === pileName
                        ? {
                            ...pile,
                            cards: pile.cards.filter(card => !data.cards.some((c: Card) => c.code === card.code)),
                            remaining: data.piles[pileName].remaining
                        }
                        : pile
                ));

                setMessage(`Drew ${data.cards.length} card(s) from pile "${pileName}".`);
            }
        } catch (error) {
            setMessage('Error drawing from pile.');
            console.error('Error drawing from pile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle card selection
    const toggleCardSelection = (cardCode: string) => {
        setSelectedCards(prev =>
            prev.includes(cardCode)
                ? prev.filter(code => code !== cardCode)
                : [...prev, cardCode]
        );
    };

    // Clear all drawn cards
    const clearDrawnCards = () => {
        setDrawnCards([]);
        setSelectedCards([]);
        setMessage('Cleared all drawn cards.');
    };

    // Delete pile
    const deletePile = (pileName: string) => {
        setPiles(prev => prev.filter(pile => pile.name !== pileName));
        setMessage(`Pile "${pileName}" deleted.`);
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white hover:text-blue-400 mb-4 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                        🃏 Deck Manager
                    </h1>
                    <p className="text-xl text-gray-300 mb-6">
                        Advanced deck and pile management with full API capabilities
                    </p>
                </div>

                {/* Message */}
                <div className="text-center mb-8">
                    <div
                        ref={messageRef}
                        className="text-lg text-white bg-gray-800 rounded-lg p-4 inline-block max-w-2xl"
                    >
                        {message}
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Deck Creation */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Create New Deck</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Deck name (optional)"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                            />

                            <div className="flex items-center gap-4">
                                <label className="text-white">Deck Count:</label>
                                <select
                                    value={deckCount}
                                    onChange={(e) => setDeckCount(Number(e.target.value))}
                                    className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(num => (
                                        <option key={num} value={num}>{num} deck{num > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => createDeck(newDeckName, deckCount)}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Deck'}
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => drawCards(1)}
                                    disabled={loading || !selectedDeck}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                >
                                    Draw 1 Card
                                </button>
                                <button
                                    onClick={() => drawCards(5)}
                                    disabled={loading || !selectedDeck}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                >
                                    Draw 5 Cards
                                </button>
                            </div>

                            <button
                                onClick={() => selectedDeck && shuffleDeck(selectedDeck)}
                                disabled={loading || !selectedDeck}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                Shuffle Current Deck
                            </button>

                            <button
                                onClick={clearDrawnCards}
                                disabled={drawnCards.length === 0}
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                Clear Drawn Cards
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decks Grid */}
                <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-white mb-4">Your Decks ({decks.length})</h3>
                    <div ref={deckGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {decks.map((deck) => (
                            <div
                                key={deck.id}
                                className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${selectedDeck === deck.id ? 'ring-2 ring-blue-500 bg-gray-750' : ''
                                    }`}
                                onClick={() => setSelectedDeck(deck.id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-semibold text-white">{deck.name}</h4>
                                    <span className={`px-2 py-1 rounded text-xs ${deck.shuffled ? 'bg-green-600' : 'bg-yellow-600'}`}>
                                        {deck.shuffled ? 'Shuffled' : 'Not Shuffled'}
                                    </span>
                                </div>
                                <p className="text-gray-400">Cards: {deck.remaining}</p>
                                <p className="text-gray-400">Created: {deck.created.toLocaleDateString()}</p>
                                <div className="mt-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            shuffleDeck(deck.id);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        Shuffle
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {decks.length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                            No decks created yet. Create your first deck above!
                        </div>
                    )}
                </div>

                {/* Pile Creation */}
                {selectedCards.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-8">
                        <h3 className="text-xl font-semibold text-white mb-4">
                            Create Pile ({selectedCards.length} cards selected)
                        </h3>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Pile name"
                                value={newPileName}
                                onChange={(e) => setNewPileName(e.target.value)}
                                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                            />
                            <button
                                onClick={() => createPile(newPileName, selectedCards)}
                                disabled={loading || !newPileName.trim()}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                Create Pile
                            </button>
                        </div>
                    </div>
                )}

                {/* Piles Grid */}
                {piles.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-2xl font-semibold text-white mb-4">Piles ({piles.length})</h3>
                        <div ref={pileGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {piles.map((pile) => (
                                <div key={pile.name} className="bg-gray-800 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="text-lg font-semibold text-white">{pile.name}</h4>
                                        <button
                                            onClick={() => deletePile(pile.name)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <p className="text-gray-400 mb-3">Cards: {pile.remaining}</p>

                                    {/* Show top 3 cards in pile */}
                                    <div className="grid grid-cols-3 gap-1 mb-3">
                                        {pile.cards.slice(0, 3).map((card, index) => (
                                            <img
                                                key={card.code}
                                                src={card.image}
                                                alt={`${card.value} of ${card.suit}`}
                                                className="w-full h-auto rounded shadow-sm"
                                            />
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => drawFromPile(pile.name, 1)}
                                            disabled={loading || pile.remaining === 0}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            Draw 1
                                        </button>
                                        <button
                                            onClick={() => drawFromPile(pile.name, Math.min(3, pile.remaining))}
                                            disabled={loading || pile.remaining === 0}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            Draw 3
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Drawn Cards */}
                {drawnCards.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-2xl font-semibold text-white mb-4">
                            Drawn Cards ({drawnCards.length})
                            {selectedCards.length > 0 && (
                                <span className="text-blue-400 ml-2">
                                    - {selectedCards.length} selected
                                </span>
                            )}
                        </h3>
                        <div ref={cardsGridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {drawnCards.map((card) => (
                                <div
                                    key={card.code}
                                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${selectedCards.includes(card.code)
                                            ? 'ring-2 ring-blue-500 scale-105'
                                            : ''
                                        }`}
                                    onClick={() => toggleCardSelection(card.code)}
                                >
                                    <img
                                        src={card.image}
                                        alt={`${card.value} of ${card.suit}`}
                                        className="w-full h-auto rounded-lg shadow-lg"
                                    />
                                    <p className="text-center text-white text-sm mt-2">
                                        {card.value} of {card.suit}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* API Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">API Capabilities Demonstrated</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-blue-400 mb-2">Deck Operations</h4>
                            <ul className="text-gray-300 space-y-1 text-sm">
                                <li>• Create new shuffled decks (1-6 deck count)</li>
                                <li>• Draw single or multiple cards</li>
                                <li>• Shuffle existing decks</li>
                                <li>• Track remaining cards</li>
                                <li>• Multiple deck management</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-green-400 mb-2">Pile Operations</h4>
                            <ul className="text-gray-300 space-y-1 text-sm">
                                <li>• Create named piles from drawn cards</li>
                                <li>• Add specific cards to piles</li>
                                <li>• Draw cards from piles</li>
                                <li>• View pile contents</li>
                                <li>• Delete piles</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
