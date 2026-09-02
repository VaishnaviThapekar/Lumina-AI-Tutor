'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Timer,
  Flame,
  Award,
  RotateCcw,
  CheckCircle,
  XCircle,
  Sparkles,
  Trophy,
  Play
} from 'lucide-react';
import { awardXPForStudySession } from '@/lib/xpTriggers';
import { addStudyTime } from '@/lib/studyTracker';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface SprintQuestion {
  id: number;
  question: string;
  isTrue: boolean;
  explanation: string;
}

const SAMPLE_SPRINT_QUESTIONS: SprintQuestion[] = [
  {
    id: 1,
    question: 'BGP operates at the Network Layer of the OSI Model.',
    isTrue: false,
    explanation: 'BGP operates over TCP (Port 179) at the Application Layer.'
  },
  {
    id: 2,
    question: 'RAG technology reduces AI hallucinations by retrieving real document context.',
    isTrue: true,
    explanation: 'RAG grounds AI responses directly in uploaded text source chunks.'
  },
  {
    id: 3,
    question: 'The SM-2 spaced repetition algorithm decreases review intervals for hard cards.',
    isTrue: false,
    explanation: 'SM-2 shortens intervals for hard cards so you review them more frequently.'
  },
  {
    id: 4,
    question: 'Pinecone vector embeddings represent semantic meaning in multi-dimensional space.',
    isTrue: true,
    explanation: 'Vectors group similar topics together using cosine similarity.'
  },
  {
    id: 5,
    question: 'Socratic tutoring gives direct answers immediately without asking guiding questions.',
    isTrue: false,
    explanation: 'Socratic AI guides students step-by-step with probing questions.'
  }
];

export default function SpeedStudySprint() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(60);
    setQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setMultiplier(1);
    setCorrectCount(0);
    setWrongCount(0);
  };

  const handleAnswer = (userChoice: boolean) => {
    if (gameState !== 'playing') return;

    const currentQ = SAMPLE_SPRINT_QUESTIONS[questionIndex % SAMPLE_SPRINT_QUESTIONS.length];
    const isCorrect = userChoice === currentQ.isTrue;

    if (isCorrect) {
      const newStreak = streak + 1;
      const newMult = newStreak >= 5 ? 5 : newStreak >= 3 ? 3 : newStreak >= 2 ? 2 : 1;
      const points = 100 * newMult;

      setScore(prev => prev + points);
      setStreak(newStreak);
      setMultiplier(newMult);
      setCorrectCount(prev => prev + 1);
    } else {
      setStreak(0);
      setMultiplier(1);
      setWrongCount(prev => prev + 1);
    }

    setQuestionIndex(prev => prev + 1);
  };

  const endGame = () => {
    setGameState('gameover');
    const totalXP = Math.round(score / 10);
    if (totalXP > 0) {
      addStudyTime(2);
      awardXPForStudySession(totalXP);
      notifyLuminaDataUpdated();
    }
  };

  const currentQ = SAMPLE_SPRINT_QUESTIONS[questionIndex % SAMPLE_SPRINT_QUESTIONS.length];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-600 to-rose-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-200 text-xs font-semibold mb-1">
              <Zap className="w-4 h-4 animate-bounce" />
              <span>Speed Study Sprint Game</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">60-Second Challenge Mode</h2>
            <p className="text-orange-100/80 text-xs md:text-sm mt-1 max-w-xl">
              Answer rapid-fire concept questions, build streak multipliers, and earn bonus XP!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-extrabold text-white border border-white/30 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-yellow-300" />
              <span>Streak Multiplier up to 5x</span>
            </span>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Game Card */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm space-y-6">
        {gameState === 'idle' && (
          <div className="text-center py-10 space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl">
              <Timer className="w-10 h-10 animate-pulse" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Ready for the Sprint?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                You have 60 seconds to answer as many True/False concept questions as possible. Build your streak to unleash the 5x XP Multiplier!
              </p>
            </div>

            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              <span>Start 60s Speed Sprint</span>
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            {/* HUD Status Bar */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-200/50 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-orange-500 animate-pulse" />
                <span className={`text-xl font-extrabold ${timeLeft <= 10 ? 'text-rose-500 animate-ping' : 'text-gray-900 dark:text-white'}`}>
                  {timeLeft}s
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                  <Flame className="w-4 h-4" />
                  <span>Streak: {streak} ({multiplier}x Multiplier)</span>
                </div>

                <div className="text-purple-600 dark:text-purple-400 font-extrabold text-lg">
                  {score} PTS
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-md text-center space-y-6">
              <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                Rapid Concept #{questionIndex + 1}
              </span>

              <h3 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white max-w-xl mx-auto leading-relaxed">
                "{currentQ.question}"
              </h3>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                <button
                  onClick={() => handleAnswer(true)}
                  className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>TRUE</span>
                </button>

                <button
                  onClick={() => handleAnswer(false)}
                  className="py-4 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>FALSE</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="text-center py-8 space-y-6 animate-in fade-in duration-200">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                Sprint Complete!
              </span>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
                Final Score: {score} PTS
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You earned +{Math.round(score / 10)} XP for your speed retention challenge!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs font-bold">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900">
                Correct Answers: {correctCount}
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900">
                Incorrect Answers: {wrongCount}
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Speed Sprint Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
