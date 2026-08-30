'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Plus, Play, Search, Filter, Trash2, Edit, RotateCw, Check, X, Clock, TrendingUp, Award, BookOpen, Zap } from 'lucide-react';
import {
  getAllFlashcards,
  createFlashcard,
  deleteFlashcard,
  getDueFlashcards,
  reviewFlashcard,
  getFlashcardStats,
  getAllDecks,
  createDeck,
  getDeckCards,
  generateFlashcardsFromDocument,
  Flashcard,
  FlashcardDeck,
} from '@/lib/flashcards';
import { listDocuments } from '@/lib/api';
import { awardXPForFlashcard } from '@/lib/xpTriggers';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

export default function FlashcardSystem() {
  const [activeTab, setActiveTab] = useState<'study' | 'create' | 'browse' | 'stats'>('study');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState(getFlashcardStats());
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [showingAnswer, setShowingAnswer] = useState(false);
  
  // Create form
  const [newCard, setNewCard] = useState({ front: '', back: '', difficulty: 'medium' as const });
  const [searchQuery, setSearchQuery] = useState('');

  // AI generation form
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    loadData();
    listDocuments()
      .then((res) => {
        setDocuments(res.documents || []);
        if (res.documents?.length > 0) setSelectedDocId(res.documents[0].id);
      })
      .catch(() => {
        // non-fatal — just means the "generate from document" option won't have choices
      });
  }, []);

  const handleGenerateFromDocument = async () => {
    if (!selectedDocId) {
      setGenError('Upload a document first.');
      return;
    }
    setGenerating(true);
    setGenError('');
    try {
      await generateFlashcardsFromDocument(selectedDocId, genCount);
      loadData();
      alert(`Generated ${genCount} flashcards from your document!`);
    } catch (err: any) {
      setGenError(err?.message || 'Could not generate flashcards. Is the backend running?');
    }
    setGenerating(false);
  };

  const loadData = () => {
    setFlashcards(getAllFlashcards());
    setDueCards(getDueFlashcards());
    setStats(getFlashcardStats());
    setDecks(getAllDecks());
  };

  const handleCreateCard = () => {
    if (!newCard.front || !newCard.back) {
      alert('Please fill in both front and back of the card');
      return;
    }

    createFlashcard(newCard.front, newCard.back, newCard.difficulty);
    setNewCard({ front: '', back: '', difficulty: 'medium' });
    loadData();
    alert('Flashcard created!');
  };

  const handleReview = (quality: number) => {
    if (dueCards[currentCardIndex]) {
      reviewFlashcard(dueCards[currentCardIndex].id, quality);
      awardXPForFlashcard();
      notifyLuminaDataUpdated();
      
      // Move to next card
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
        setShowingAnswer(false);
      } else {
        // Session complete
        alert('Study session complete! 🎉');
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShowingAnswer(false);
      }
      
      loadData();
    }
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
    if (!showingAnswer) {
      setShowingAnswer(true);
    }
  };

  const handleDeleteCard = (id: string) => {
    if (confirm('Delete this flashcard?')) {
      deleteFlashcard(id);
      loadData();
    }
  };

  const handleExportAnkiCSV = () => {
    if (flashcards.length === 0) {
      alert('No flashcards available to export.');
      return;
    }
    const csvContent = flashcards.map(c => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lumina_flashcards_anki.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCards = searchQuery
    ? flashcards.filter(c => 
        c.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.back.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flashcards;

  const currentCard = dueCards[currentCardIndex];

  return (
    <div className="space-y-6">
      {/* Top Header Banner matching ConceptMap */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
              <Brain className="w-4 h-4 animate-bounce" />
              <span>Spaced Repetition & Memory System</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Smart Flashcards Engine</h2>
            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
              Master complex topics through SuperMemo-2 spaced repetition algorithms, AI document auto-generation, and Anki CSV export.
            </p>
          </div>

          <button
            onClick={handleExportAnkiCSV}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2"
          >
            <span>📥 Export Anki CSV</span>
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Header Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Brain className="w-4 h-4" />
            <span className="text-xs font-bold text-gray-500 uppercase">Total Cards</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.totalCards}</div>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold text-gray-500 uppercase">Due Today</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.cardsDue}</div>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold text-gray-500 uppercase">Retention Rate</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.successRate}%</div>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold text-gray-500 uppercase">Reviewed</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.cardsReviewed}</div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200/60 dark:border-gray-700/60 overflow-x-auto">
          {[
            { key: 'study', label: 'Study Deck', icon: Play },
            { key: 'create', label: 'Create / AI Gen', icon: Plus },
            { key: 'browse', label: 'Browse Cards', icon: BookOpen },
            { key: 'stats', label: 'Analytics', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 py-3.5 px-5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Study Tab */}
          {activeTab === 'study' && (
            <div className="space-y-6">
              {dueCards.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">All caught up!</h3>
                  <p className="text-gray-600 mb-4">No cards due for review right now.</p>
                  <p className="text-sm text-gray-500">{stats.cardsUpcoming} cards coming up in the next 7 days</p>
                </div>
              ) : (
                <>
                  {/* Progress */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      Card {currentCardIndex + 1} of {dueCards.length}
                    </span>
                    <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 transition-all"
                        style={{ width: `${((currentCardIndex + 1) / dueCards.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Flashcard */}
                  {currentCard && (
                    <div className="max-w-2xl mx-auto">
                      <div
                        onClick={handleFlipCard}
                        className={`relative h-64 cursor-pointer transition-all duration-500 transform-gpu ${
                          isFlipped ? 'rotate-y-180' : ''
                        }`}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* Front */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl p-8 flex items-center justify-center text-white text-center ${
                            isFlipped ? 'invisible' : 'visible'
                          }`}
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <div>
                            <p className="text-sm opacity-75 mb-4">Question</p>
                            <p className="text-2xl font-semibold">{currentCard.front}</p>
                            <p className="text-sm opacity-75 mt-6">Click to flip</p>
                          </div>
                        </div>

                        {/* Back */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-8 flex items-center justify-center text-white text-center transform rotate-y-180 ${
                            isFlipped ? 'visible' : 'invisible'
                          }`}
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <div>
                            <p className="text-sm opacity-75 mb-4">Answer</p>
                            <p className="text-2xl font-semibold">{currentCard.back}</p>
                          </div>
                        </div>
                      </div>

                      {/* Review Buttons */}
                      {showingAnswer && (
                        <div className="grid grid-cols-4 gap-3 mt-6">
                          <button
                            onClick={() => handleReview(0)}
                            className="py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >
                            Forgot
                          </button>
                          <button
                            onClick={() => handleReview(3)}
                            className="py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                          >
                            Hard
                          </button>
                          <button
                            onClick={() => handleReview(4)}
                            className="py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
                          >
                            Good
                          </button>
                          <button
                            onClick={() => handleReview(5)}
                            className="py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                          >
                            Easy
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Create Tab */}
          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* AI Generation from Document */}
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Generate with AI</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Automatically create flashcards from one of your uploaded documents.
                </p>

                {genError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    {genError}
                  </div>
                )}

                {documents.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Upload a document first to generate flashcards from it.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedDocId ?? ''}
                      onChange={(e) => setSelectedDocId(Number(e.target.value))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.filename}
                        </option>
                      ))}
                    </select>
                    <select
                      value={genCount}
                      onChange={(e) => setGenCount(Number(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value={5}>5 cards</option>
                      <option value={10}>10 cards</option>
                      <option value={20}>20 cards</option>
                    </select>
                    <button
                      onClick={handleGenerateFromDocument}
                      disabled={generating}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 whitespace-nowrap"
                    >
                      {generating ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Or create manually</span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800">Create New Flashcard</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Front (Question)
                </label>
                <textarea
                  value={newCard.front}
                  onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                  placeholder="Enter your question..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Back (Answer)
                </label>
                <textarea
                  value={newCard.back}
                  onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                  placeholder="Enter the answer..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={newCard.difficulty}
                  onChange={(e) => setNewCard({ ...newCard, difficulty: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <button
                onClick={handleCreateCard}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Flashcard
              </button>
            </div>
          )}

          {/* Browse Tab */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search flashcards..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Cards List */}
              <div className="space-y-3">
                {filteredCards.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No flashcards yet. Create some!</p>
                ) : (
                  filteredCards.map((card) => (
                    <div key={card.id} className="bg-gray-50 rounded-lg p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 mb-1">{card.front}</div>
                        <div className="text-sm text-gray-600 mb-2">{card.back}</div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            card.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {card.difficulty}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                            Reviewed {card.reviewCount} times
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">Performance Statistics</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Learning Progress</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Cards Mastered</span>
                        <span className="font-medium">{stats.cardsReviewed}/{stats.totalCards}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${(stats.cardsReviewed / stats.totalCards) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-medium">{stats.successRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${stats.successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Review Schedule</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Due Today</span>
                      <span className="text-2xl font-bold text-orange-600">{stats.cardsDue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Coming This Week</span>
                      <span className="text-2xl font-bold text-blue-600">{stats.cardsUpcoming}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
