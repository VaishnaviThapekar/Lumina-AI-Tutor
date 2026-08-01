'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Brain, Clock } from 'lucide-react';

type TimerMode = 'focus' | 'break' | 'longBreak';

const DEFAULT_TIMES = {
  focus: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMES.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    if (mode === 'focus') {
      setPomodorosCompleted((prev) => prev + 1);
      // Play browser notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Pomodoro Complete!', {
            body: 'Time for a break!',
            icon: '/icon.png'
          });
        }
      }
    }

    // Auto-switch to break
    if (mode === 'focus') {
      const nextMode = pomodorosCompleted % 4 === 3 ? 'longBreak' : 'break';
      setMode(nextMode);
      setTimeLeft(DEFAULT_TIMES[nextMode]);
    } else {
      setMode('focus');
      setTimeLeft(DEFAULT_TIMES.focus);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_TIMES[mode]);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(DEFAULT_TIMES[newMode]);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((DEFAULT_TIMES[mode] - timeLeft) / DEFAULT_TIMES[mode]) * 100;

  const getModeColor = () => {
    switch (mode) {
      case 'focus':
        return {
          bg: 'from-blue-500 to-purple-600',
          text: 'text-blue-600',
          ring: 'ring-blue-500',
          border: 'border-blue-500',
        };
      case 'break':
        return {
          bg: 'from-green-500 to-emerald-600',
          text: 'text-green-600',
          ring: 'ring-green-500',
          border: 'border-green-500',
        };
      case 'longBreak':
        return {
          bg: 'from-orange-500 to-red-600',
          text: 'text-orange-600',
          ring: 'ring-orange-500',
          border: 'border-orange-500',
        };
    }
  };

  const colors = getModeColor();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pomodoro Timer</h2>
        <p className="text-gray-600 dark:text-gray-400">Stay focused and take regular breaks</p>
      </div>

      {/* Mode Selection */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => switchMode('focus')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'focus'
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
            }`}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <span>Focus</span>
          </div>
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'break'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
            }`}
        >
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5" />
            <span>Break</span>
          </div>
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'longBreak'
            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-105'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
            }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>Long Break</span>
          </div>
        </button>
      </div>

      {/* Timer Circle */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          {/* Progress Ring */}
          <svg className="transform -rotate-90 w-80 h-80">
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={2 * Math.PI * 140}
              strokeDashoffset={2 * Math.PI * 140 * (1 - progress / 100)}
              className={`${colors.text} transition-all duration-1000 ease-linear`}
              strokeLinecap="round"
            />
          </svg>

          {/* Timer Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-7xl font-bold text-gray-900 dark:text-white mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400 capitalize">
                {mode === 'longBreak' ? 'Long Break' : mode}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={toggleTimer}
          className={`px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:scale-105 transition-all bg-gradient-to-r ${colors.bg}`}
        >
          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <Pause className="w-6 h-6" />
                <span className="text-lg">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                <span className="text-lg">Start</span>
              </>
            )}
          </div>
        </button>
        <button
          onClick={resetTimer}
          className="px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all hover:scale-105"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {pomodorosCompleted}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pomodoros Completed</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              {Math.floor((pomodorosCompleted * 25) / 60)}h {(pomodorosCompleted * 25) % 60}m
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Focus Time Today</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {pomodorosCompleted > 0 ? Math.floor(100 - (timeLeft / DEFAULT_TIMES[mode]) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Session</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Pomodoro Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>Work for 25 minutes with complete focus on a single task</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>Take a 5-minute break to rest and recharge</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>After 4 pomodoros, take a longer 15-minute break</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            <span>Eliminate all distractions during focus time</span>
          </li>
        </ul>
      </div>
    </div>
  );
}