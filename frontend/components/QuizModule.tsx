'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Trophy, Loader2 } from 'lucide-react';
import type { Quiz, QuizQuestion, QuizResult } from '@/lib/types';
import { generateQuiz, submitQuiz } from '@/lib/api';
import { addQuizResult } from '@/lib/studyTracker';
import { awardXPForQuiz } from '@/lib/xpTriggers';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface QuizModuleProps {
  sessionId: number;
  documentId: number;
  competencyScore: number;
  onCompetencyUpdate: (newScore: number) => void;
  onClose: () => void;
}

const QuizModule: React.FC<QuizModuleProps> = ({
  sessionId,
  documentId,
  competencyScore,
  onCompetencyUpdate,
  onClose,
}) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore active quiz state from localStorage on mount/document switch
  React.useEffect(() => {
    if (typeof window === 'undefined' || !documentId) return;
    const cacheKey = `lumina_quiz_state_${documentId}`;
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.quiz) setQuiz(parsed.quiz);
        if (parsed.currentQuestion !== undefined) setCurrentQuestion(parsed.currentQuestion);
        if (parsed.selectedAnswers) setSelectedAnswers(parsed.selectedAnswers);
        if (parsed.result) setResult(parsed.result);
      } catch (e) {}
    }
  }, [documentId]);

  // Persist active quiz state to localStorage whenever state changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && documentId && quiz) {
      const cacheKey = `lumina_quiz_state_${documentId}`;
      localStorage.setItem(cacheKey, JSON.stringify({ quiz, currentQuestion, selectedAnswers, result }));
    }
  }, [quiz, currentQuestion, selectedAnswers, result, documentId]);
  
  const handleGenerateQuiz = async (numQuestions: number) => {
    setIsLoading(true);
    try {
      const difficulty = competencyScore < 0.5 ? 'easy' : competencyScore < 0.8 ? 'medium' : 'hard';
      const quizData = await generateQuiz(documentId, numQuestions, difficulty);
      setQuiz(quizData);
      setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };
  
  const handleSubmit = async () => {
    if (!quiz || selectedAnswers.some(a => a === -1)) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    setIsLoading(true);
    try {
      const quizResult = await submitQuiz(quiz.quiz_id, sessionId, selectedAnswers);
      setResult(quizResult);
      onCompetencyUpdate(quizResult.updated_competency_score);

      // Track quiz result, award XP, and trigger live tab sync
      const scorePct = Math.round((quizResult.score / quizResult.total_questions) * 100);
      addQuizResult(scorePct);
      awardXPForQuiz(scorePct);
      notifyLuminaDataUpdated();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Quiz selection screen
  if (!quiz) {
    return (
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
              <Trophy className="w-4 h-4" />
              <span>Adaptive Assessment Engine</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Knowledge Mastery Quiz</h2>
            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
              Choose your target question count to generate personalized multiple-choice questions dynamically tailored to your current competency level.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Selection Glass Card */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Select Number of Questions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[5, 10, 15].map((num) => (
              <button
                key={num}
                onClick={() => handleGenerateQuiz(num)}
                disabled={isLoading}
                className="p-6 bg-white/80 dark:bg-gray-900/80 border-2 border-purple-200/60 dark:border-purple-800/60 rounded-2xl hover:border-purple-500 hover:scale-[1.03] transition-all disabled:opacity-50 text-center group shadow-sm"
              >
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-1 group-hover:scale-110 transition-transform">
                  {num}
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Questions Set
                </div>
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center mt-8 py-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
              <span className="ml-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                Generating Questions from Vector Embeddings...
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Close Quiz Module
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (result) {
    const percentage = Math.round(result.score * 100);

    return (
      <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
        {/* Result Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-8 text-white text-center shadow-xl">
          <Trophy className="w-16 h-16 mx-auto mb-3 text-yellow-300 animate-bounce" />
          <h2 className="text-3xl font-bold mb-1">Quiz Completed!</h2>
          <div className="text-5xl font-black text-white drop-shadow-md my-2">{percentage}%</div>
          <p className="text-purple-100 font-medium text-sm">
            {result.correct_answers} out of {result.total_questions} questions answered correctly
          </p>
          <div className="inline-block mt-3 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
            Updated Mastery Score: {Math.round(result.updated_competency_score * 100)}%
          </div>
        </div>

        {/* Detailed Feedback List */}
        <div className="space-y-4">
          {result.feedback.map((item, index) => (
            <div
              key={index}
              className={`p-5 rounded-2xl border-2 backdrop-blur-xl transition-all ${
                item.is_correct
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20'
                  : 'border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-900/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {item.is_correct ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">
                    Q{item.question_number}: {item.question}
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Your Answer:</span>{' '}
                      <span className={item.is_correct ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {item.user_answer}
                      </span>
                    </p>
                    {!item.is_correct && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Correct Answer:</span>{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.correct_answer}</span>
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 mt-2 bg-white/50 dark:bg-gray-900/40 p-2.5 rounded-xl text-[11px] leading-relaxed">
                      💡 {item.feedback}
                    </p>

                    {!item.is_correct && (
                      <button
                        onClick={() => {
                          if (typeof window === 'undefined') return;
                          try {
                            const raw = localStorage.getItem('lumina_flashcards');
                            const cards = raw ? JSON.parse(raw) : [];
                            const newCard = {
                              id: Date.now(),
                              front: `Q: ${item.question}`,
                              back: `Answer: ${item.correct_answer}\n\nRationale: ${item.feedback}`,
                              interval: 1,
                              easeFactor: 2.5,
                              repetitions: 0
                            };
                            cards.unshift(newCard);
                            localStorage.setItem('lumina_flashcards', JSON.stringify(cards));
                            alert('🧠 Flashcard saved to Smart Flashcards tab!');
                            notifyLuminaDataUpdated();
                          } catch (e) {
                            console.error('Error saving flashcard from quiz:', e);
                          }
                        }}
                        className="mt-2.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <span>🧠 Turn Mistake into Flashcard</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setQuiz(null)}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs transition-all"
          >
            Take Another Quiz
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-xs shadow-lg transition-all"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Quiz Progress Header */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span className="text-purple-600 dark:text-purple-400">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion] === index;
            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-purple-500 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-900 dark:text-purple-200 font-semibold shadow-md ring-2 ring-purple-500/20'
                    : 'border-gray-200/80 dark:border-gray-700/80 hover:border-purple-300 bg-white/80 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-xs sm:text-sm mt-0.5 leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between gap-4 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>

          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={selectedAnswers[currentQuestion] === -1}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all shadow-md"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || selectedAnswers.some(a => a === -1)}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all shadow-md flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                'Submit Assessment'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModule;
