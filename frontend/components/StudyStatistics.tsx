'use client';

import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, TrendingUp, Award, Calendar, Target, BarChart3, Zap } from 'lucide-react';

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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    // Load from localStorage
    const savedStats = localStorage.getItem('studyStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Study Statistics</h2>
        <button 
          onClick={loadStats}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Study Time */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Total Time</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatTime(stats.totalStudyTime)}
          </div>
          <div className="text-sm opacity-80">
            All time study duration
          </div>
        </div>

        {/* Documents Read */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Documents</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats.documentsRead}
          </div>
          <div className="text-sm opacity-80">
            Documents completed
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Streak</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats.currentStreak} 🔥
          </div>
          <div className="text-sm opacity-80">
            Days in a row
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Performance</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats.averageScore}%
          </div>
          <div className="text-sm opacity-80">
            Average quiz score
          </div>
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
