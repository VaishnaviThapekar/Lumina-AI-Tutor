'use client';

import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, TrendingUp, Award, Calendar, Target, BarChart3, Zap } from 'lucide-react';

import { useLuminaDataSync } from '@/lib/eventBus';

interface StudyStats {
  totalStudyTime: number; // in minutes
  documentsRead: number;
  sessionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionLength: number;
  thisWeekMinutes: number;
  lastWeekMinutes: number;
  quizzesCompleted: number;
  averageScore: number;
}

export default function StudyStatistics() {
  const [stats, setStats] = useState<StudyStats>({
    totalStudyTime: 0,
    documentsRead: 0,
    sessionsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageSessionLength: 0,
    thisWeekMinutes: 0,
    lastWeekMinutes: 0,
    quizzesCompleted: 0,
    averageScore: 0,
  });

  const loadStats = () => {
    // Load from localStorage
    const savedStats = localStorage.getItem('studyStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useLuminaDataSync(loadStats);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const weeklyProgress = stats.lastWeekMinutes > 0 
    ? ((stats.thisWeekMinutes - stats.lastWeekMinutes) / stats.lastWeekMinutes * 100)
    : 0;

  // Calculate progress for weekly goal (target: 300 minutes/week)
  const weeklyGoal = 300;
  const weeklyProgressPercent = Math.min((stats.thisWeekMinutes / weeklyGoal) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Top Header Banner matching ConceptMap */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
              <BarChart3 className="w-4 h-4 animate-bounce" />
              <span>Real-Time Learning Metrics</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Study Analytics & Progress</h2>
            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
              Track focus time, study streaks, document comprehension, and weekly mastery goals.
            </p>
          </div>

          <button
            onClick={loadStats}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2"
          >
            <span>🔄 Refresh Data</span>
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Study Time */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
              Overall Time
            </span>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Study Time</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {formatTime(stats.totalStudyTime)}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
            Avg {formatTime(stats.averageSessionLength)} per session
          </p>
        </div>

        {/* Documents Read */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
              Reading
            </span>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Documents Analyzed</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.documentsRead} Docs</div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Active documents in tutor</p>
        </div>

        {/* Current Streak */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full">
              Streak
            </span>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Study Streak</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.currentStreak} Days 🔥</div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Consecutive active study days</p>
        </div>

        {/* Average Score */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
              Quizzes
            </span>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Quiz Score Average</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stats.averageScore}%</div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">This Week's Progress</h3>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-gray-800">{formatTime(stats.thisWeekMinutes)}</span>
            <span className="text-gray-500"> / {formatTime(weeklyGoal)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div 
            className="absolute h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
            style={{ width: `${weeklyProgressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {weeklyProgress > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  +{weeklyProgress.toFixed(0)}% from last week
                </span>
              </>
            ) : weeklyProgress < 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                <span className="text-red-600 font-medium">
                  {weeklyProgress.toFixed(0)}% from last week
                </span>
              </>
            ) : (
              <span className="text-gray-500">Same as last week</span>
            )}
          </div>
          <span className="text-gray-500">
            {Math.round(weeklyProgressPercent)}% of goal
          </span>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sessions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.sessionsCompleted}
              </div>
              <div className="text-sm text-gray-600">Study Sessions</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Avg. {stats.averageSessionLength} min per session
          </div>
        </div>

        {/* Quizzes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.quizzesCompleted}
              </div>
              <div className="text-sm text-gray-600">Quizzes Taken</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats.averageScore}% average score
          </div>
        </div>

        {/* Best Streak */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.longestStreak}
              </div>
              <div className="text-sm text-gray-600">Longest Streak</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Current: {stats.currentStreak} days 🔥
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Recent Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Achievement Badges */}
          <div className={`p-4 rounded-lg text-center ${stats.documentsRead >= 1 ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-100 border-2 border-gray-300 opacity-50'}`}>
            <div className="text-3xl mb-2">📚</div>
            <div className="text-xs font-medium text-gray-700">First Document</div>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${stats.totalStudyTime >= 60 ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-100 border-2 border-gray-300 opacity-50'}`}>
            <div className="text-3xl mb-2">⏰</div>
            <div className="text-xs font-medium text-gray-700">1 Hour Scholar</div>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${stats.currentStreak >= 3 ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-100 border-2 border-gray-300 opacity-50'}`}>
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-xs font-medium text-gray-700">3 Day Streak</div>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${stats.quizzesCompleted >= 5 ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-100 border-2 border-gray-300 opacity-50'}`}>
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-xs font-medium text-gray-700">Quiz Master</div>
          </div>
        </div>
      </div>
    </div>
  );
}
