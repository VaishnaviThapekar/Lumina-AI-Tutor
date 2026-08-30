'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Clock, Target, Award, Zap, BarChart3, PieChart, Activity, RefreshCw } from 'lucide-react';
import { getStats } from '@/lib/studyTracker';
import { useLuminaDataSync } from '@/lib/eventBus';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface WeeklyData {
  day: string;
  minutes: number;
}

export default function AdvancedAnalytics() {
  const [stats, setStats] = useState(getStats());
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

  const loadAnalytics = () => {
    setStats(getStats());
    loadWeeklyData();
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useLuminaDataSync(loadAnalytics);

  const loadWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const breakdown = stats.weeklyBreakdown || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const data: WeeklyData[] = days.map(day => ({
      day,
      minutes: breakdown[day] || 0
    }));
    setWeeklyData(data);
  };

  const totalHours = Math.floor(stats.totalStudyTime / 60);
  const totalMinutes = stats.totalStudyTime % 60;
  const averageDaily = stats.totalStudyTime / Math.max(stats.currentStreak, 1);
  const productivity = stats.sessionsCompleted > 0 
    ? (stats.totalStudyTime / stats.sessionsCompleted).toFixed(1)
    : 0;
  const weeklyGoal = 300; // 5 hours
  const weeklyProgress = Math.min((stats.thisWeekMinutes / weeklyGoal) * 100, 100);
  
  const performanceScore = Math.round(
    (stats.averageScore * 0.4) + 
    (Math.min(stats.currentStreak / 30, 1) * 100 * 0.3) +
    (Math.min(stats.thisWeekMinutes / weeklyGoal, 1) * 100 * 0.3)
  );

  const studyDistribution: ChartData[] = [
    { label: 'Focus Sessions', value: stats.sessionsCompleted, color: '#a855f7' },
    { label: 'Documents Read', value: stats.documentsRead, color: '#6366f1' },
    { label: 'Quizzes Taken', value: stats.quizzesCompleted, color: '#ec4899' },
  ];

  const maxValue = Math.max(...weeklyData.map(d => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* Top Header Banner matching ConceptMap */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
              <BarChart3 className="w-4 h-4 animate-pulse" />
              <span>Comprehensive Learning Intelligence</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Advanced Analytics</h2>
            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
              Deep insights into focus distribution, study velocity, retention scores, and weekly progress goals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20">
              {(['week', 'month', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    selectedPeriod === period
                      ? 'bg-white text-purple-700 shadow-md font-bold'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {period === 'all' ? 'All Time' : period}
                </button>
              ))}
            </div>

            <button
              onClick={loadAnalytics}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white border border-white/20 transition-all"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Performance Score */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
              Overall Score
            </span>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Performance Index</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{performanceScore}%</div>
          <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${performanceScore}%` }}
            />
          </div>
        </div>

        {/* Average Daily */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
              Daily Pace
            </span>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Average</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{Math.round(averageDaily)} <span className="text-xs font-semibold text-gray-400">min/day</span></div>
        </div>

        {/* Session Efficiency */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
              Efficiency
            </span>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Session Length</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{productivity} <span className="text-xs font-semibold text-gray-400">min/session</span></div>
        </div>

        {/* Weekly Goal */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-pink-600 bg-pink-100 dark:bg-pink-900/40 px-2 py-0.5 rounded-full">
              Weekly Goal
            </span>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{stats.thisWeekMinutes}/{weeklyGoal} min</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{Math.round(weeklyProgress)}%</div>
          <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Weekly Activity Breakdown
            </h3>
            <span className="text-xs font-semibold text-gray-400">Last 7 Days</span>
          </div>
          
          <div className="space-y-3.5">
            {weeklyData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 text-xs font-semibold text-gray-500 dark:text-gray-400">{data.day}</div>
                <div className="flex-1 h-7 bg-gray-100 dark:bg-gray-900/60 rounded-xl overflow-hidden relative border border-gray-200/50 dark:border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500 flex items-center justify-end pr-2.5 shadow-sm"
                    style={{ width: `${(data.minutes / maxValue) * 100}%` }}
                  >
                    {data.minutes > 20 && (
                      <span className="text-[11px] text-white font-bold">{data.minutes}m</span>
                    )}
                  </div>
                </div>
                {data.minutes <= 20 && (
                  <span className="text-xs text-gray-400 w-10 text-right">{data.minutes}m</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Study Distribution */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
              <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Activity Distribution
            </h3>
          </div>
          
          <div className="space-y-5">
            {studyDistribution.map((item, index) => {
              const total = studyDistribution.reduce((sum, i) => sum + i.value, 0);
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-900/60 rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Learning Velocity */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-gray-900 dark:text-white">{totalHours}h {totalMinutes}m</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Study Time</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-purple-50/50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-purple-100 dark:border-gray-800">
            Equivalent to {Math.round(stats.totalStudyTime / 60 / 8)} full study days.
          </div>
        </div>

        {/* Consistency Score */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-gray-900 dark:text-white">{stats.currentStreak} Days 🔥</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Streak</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-purple-50/50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-purple-100 dark:border-gray-800">
            {stats.currentStreak >= 7 ? 'Amazing consistency!' : 'Study daily to build your streak.'}
          </div>
        </div>

        {/* Knowledge Retention */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-gray-900 dark:text-white">{stats.averageScore}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quiz Average</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-purple-50/50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-purple-100 dark:border-gray-800">
            {stats.averageScore >= 80 ? 'Excellent concept retention!' : 'Keep practicing to master topics.'}
          </div>
        </div>
      </div>
    </div>
  );
}
