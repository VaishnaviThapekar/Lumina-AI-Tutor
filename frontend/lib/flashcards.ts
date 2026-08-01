// lib/flashcards.ts
// Flashcard generation and spaced repetition system

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  documentId?: number;
  topic?: string;
  createdAt: string;
  lastReviewed?: string;
  nextReview: string;
  reviewCount: number;
  successCount: number;
  intervalDays: number;
  easeFactor: number; // SM-2 algorithm
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  cards: string[]; // Array of card IDs
  createdAt: string;
  lastStudied?: string;
}

export interface ReviewSession {
  id: string;
  deckId: string;
  startTime: string;
  endTime?: string;
  cardsReviewed: number;
  correctAnswers: number;
  averageTime: number;
}

const FLASHCARDS_KEY = 'lumina_flashcards';
const DECKS_KEY = 'lumina_flashcard_decks';
const SESSIONS_KEY = 'lumina_review_sessions';

// ==================== FLASHCARD CRUD ====================

export const getAllFlashcards = (): Flashcard[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(FLASHCARDS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveFlashcards = (cards: Flashcard[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
};

export const createFlashcard = (
  front: string,
  back: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  documentId?: number,
  topic?: string
): Flashcard => {
  const cards = getAllFlashcards();
  
  const newCard: Flashcard = {
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    front,
    back,
    difficulty,
    documentId,
    topic,
    createdAt: new Date().toISOString(),
    nextReview: new Date().toISOString(),
    reviewCount: 0,
    successCount: 0,
    intervalDays: 1,
    easeFactor: 2.5, // Default ease factor
  };
  
  cards.push(newCard);
  saveFlashcards(cards);
  
  return newCard;
};

export const createMultipleFlashcards = (
  cardsData: Array<{ front: string; back: string; difficulty?: 'easy' | 'medium' | 'hard'; topic?: string }>,
  documentId?: number
): Flashcard[] => {
  const newCards: Flashcard[] = [];
  
  cardsData.forEach(data => {
    const card = createFlashcard(
      data.front,
      data.back,
      data.difficulty || 'medium',
      documentId,
      data.topic
    );
    newCards.push(card);
  });
  
  return newCards;
};

export const updateFlashcard = (id: string, updates: Partial<Flashcard>): void => {
  const cards = getAllFlashcards();
  const index = cards.findIndex(c => c.id === id);
  
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updates };
    saveFlashcards(cards);
  }
};

export const deleteFlashcard = (id: string): void => {
  const cards = getAllFlashcards();
  const filtered = cards.filter(c => c.id !== id);
  saveFlashcards(filtered);
};

// ==================== SPACED REPETITION (SM-2 Algorithm) ====================

export const reviewFlashcard = (
  cardId: string,
  quality: number // 0-5 rating (0=complete blackout, 5=perfect response)
): void => {
  const cards = getAllFlashcards();
  const card = cards.find(c => c.id === cardId);
  
  if (!card) return;
  
  // SM-2 Algorithm
  let { easeFactor, intervalDays } = card;
  
  if (quality >= 3) {
    // Correct answer
    if (card.reviewCount === 0) {
      intervalDays = 1;
    } else if (card.reviewCount === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    
    card.successCount++;
  } else {
    // Incorrect answer - reset
    intervalDays = 1;
  }
  
  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ensure ease factor is at least 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }
  
  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);
  
  // Update card
  updateFlashcard(cardId, {
    lastReviewed: new Date().toISOString(),
    nextReview: nextReview.toISOString(),
    reviewCount: card.reviewCount + 1,
    successCount: card.successCount,
    intervalDays,
    easeFactor,
  });
};

export const getDueFlashcards = (): Flashcard[] => {
  const cards = getAllFlashcards();
  const now = new Date();
  
  return cards.filter(card => new Date(card.nextReview) <= now)
    .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
};

export const getUpcomingReviews = (days: number = 7): Flashcard[] => {
  const cards = getAllFlashcards();
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);
  
  return cards.filter(card => {
    const reviewDate = new Date(card.nextReview);
    return reviewDate > now && reviewDate <= future;
  }).sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
};

// ==================== DECK MANAGEMENT ====================

export const getAllDecks = (): FlashcardDeck[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(DECKS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveDecks = (decks: FlashcardDeck[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
};

export const createDeck = (name: string, description: string): FlashcardDeck => {
  const decks = getAllDecks();
  
  const newDeck: FlashcardDeck = {
    id: `deck_${Date.now()}`,
    name,
    description,
    cards: [],
    createdAt: new Date().toISOString(),
  };
  
  decks.push(newDeck);
  saveDecks(decks);
  
  return newDeck;
};

export const addCardToDeck = (deckId: string, cardId: string): void => {
  const decks = getAllDecks();
  const deck = decks.find(d => d.id === deckId);
  
  if (deck && !deck.cards.includes(cardId)) {
    deck.cards.push(cardId);
    saveDecks(decks);
  }
};

export const removeCardFromDeck = (deckId: string, cardId: string): void => {
  const decks = getAllDecks();
  const deck = decks.find(d => d.id === deckId);
  
  if (deck) {
    deck.cards = deck.cards.filter(id => id !== cardId);
    saveDecks(decks);
  }
};

export const getDeckCards = (deckId: string): Flashcard[] => {
  const deck = getAllDecks().find(d => d.id === deckId);
  if (!deck) return [];
  
  const allCards = getAllFlashcards();
  return deck.cards.map(id => allCards.find(c => c.id === id)).filter(Boolean) as Flashcard[];
};

export const deleteDeck = (deckId: string): void => {
  const decks = getAllDecks();
  const filtered = decks.filter(d => d.id !== deckId);
  saveDecks(filtered);
};

// ==================== STATISTICS ====================

export const getFlashcardStats = () => {
  const cards = getAllFlashcards();
  const dueCards = getDueFlashcards();
  
  const totalCards = cards.length;
  const cardsReviewed = cards.filter(c => c.reviewCount > 0).length;
  const cardsDue = dueCards.length;
  const averageEaseFactor = cards.length > 0
    ? cards.reduce((sum, c) => sum + c.easeFactor, 0) / cards.length
    : 0;
  const successRate = cards.length > 0
    ? (cards.reduce((sum, c) => sum + (c.reviewCount > 0 ? c.successCount / c.reviewCount : 0), 0) / cards.length) * 100
    : 0;
  
  return {
    totalCards,
    cardsReviewed,
    cardsDue,
    cardsUpcoming: getUpcomingReviews(7).length,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
    successRate: Math.round(successRate),
  };
};

// ==================== AI GENERATION (Placeholder) ====================

export const generateFlashcardsFromText = async (
  text: string,
  count: number = 10
): Promise<Array<{ front: string; back: string; difficulty: 'easy' | 'medium' | 'hard' }>> => {
  // This will be implemented with OpenAI API
  // For now, return placeholder
  
  // In production, this would call:
  // const response = await fetch('/api/generate-flashcards', {
  //   method: 'POST',
  //   body: JSON.stringify({ text, count })
  // });
  
  // Placeholder implementation
  return [
    {
      front: "What is the main topic of this document?",
      back: "The document discusses various learning strategies and techniques.",
      difficulty: 'easy'
    },
    {
      front: "Define spaced repetition",
      back: "A learning technique that involves reviewing information at increasing intervals over time.",
      difficulty: 'medium'
    }
  ];
};

// ==================== SEARCH & FILTER ====================

export const searchFlashcards = (query: string): Flashcard[] => {
  const cards = getAllFlashcards();
  const lowerQuery = query.toLowerCase();
  
  return cards.filter(card => 
    card.front.toLowerCase().includes(lowerQuery) ||
    card.back.toLowerCase().includes(lowerQuery) ||
    card.topic?.toLowerCase().includes(lowerQuery)
  );
};

export const filterByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Flashcard[] => {
  return getAllFlashcards().filter(c => c.difficulty === difficulty);
};

export const filterByDocument = (documentId: number): Flashcard[] => {
  return getAllFlashcards().filter(c => c.documentId === documentId);
};
