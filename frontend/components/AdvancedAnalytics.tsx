'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Clock, Target, Award, Zap, BarChart3, PieChart, Activity } from 'lucide-react';
import { getStats } from '@/lib/studyTracker';

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

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setStats(getStats());
    loadWeeklyData();
  };

  const loadWeeklyData = () => {
    // Generate sample weekly data (in real app, this would come from detailed tracking)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data: WeeklyData[] = days.map(day => ({
      day,
      minutes: Math.floor(Math.random() * 120) + 30 // Sample data
    }));
    setWeeklyData(data);
  };

  // Calculate insights
  const totalHours = Math.floor(stats.totalStudyTime / 60);
  const totalMinutes = stats.totalStudyTime % 60;
  const averageDaily = stats.totalStudyTime / Math.max(stats.currentStreak, 1);
  const productivity = stats.sessionsCompleted > 0 
    ? (stats.totalStudyTime / stats.sessionsCompleted).toFixed(1)
    : 0;
  const weeklyGoal = 300; // 5 hours
  const weeklyProgress = Math.min((stats.thisWeekMinutes / weeklyGoal) * 100, 100);
  
  // Performance metrics
  const performanceScore = Math.round(
    (stats.averageScore * 0.4) + 
    (Math.min(stats.currentStreak / 30, 1) * 100 * 0.3) +
    (Math.min(stats.thisWeekMinutes / weeklyGoal, 1) * 100 * 0.3)
  );

  // Study distribution
  const studyDistribution: ChartData[] = [
    { label: 'Focus Sessions', value: stats.sessionsCompleted, color: '#3b82f6' },
    { label: 'Documents Read', value: stats.documentsRead * 3, color: '#8b5cf6' },
    { label: 'Quizzes Taken', value: stats.quizzesCompleted * 2, color: '#10b981' },
  ];

  const maxValue = Math.max(...weeklyData.map(d => d.minutes));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Advanced Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Deep insights into your learning patterns</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Performance Score */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Performance</span>
          </div>
          <div className="text-3xl font-bold mb-1">{performanceScore}%</div>
          <div className="text-sm opacity-80">Overall Score</div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${performanceScore}%` }}
            />
          </div>
        </div>

        {/* Average Daily */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Daily Avg</span>
          </div>
          <div className="text-3xl font-bold mb-1">{Math.round(averageDaily)}</div>
          <div className="text-sm opacity-80">minutes per day</div>
        </div>

        {/* Session Efficiency */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Efficiency</span>
          </div>
          <div className="text-3xl font-bold mb-1">{productivity}</div>
          <div className="text-sm opacity-80">min/session</div>
        </div>

        {/* Weekly Goal */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Weekly Goal</span>
          </div>
          <div className="text-3xl font-bold mb-1">{Math.round(weeklyProgress)}%</div>
          <div className="text-sm opacity-80">{stats.thisWeekMinutes}/{weeklyGoal} min</div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Weekly Activity
            </h3>
            <span className="text-sm text-gray-500">Last 7 Days</span>
          </div>
          
          <div className="space-y-3">
            {weeklyData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-sm font-medium text-gray-600">{data.day}</div>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${(data.minutes / maxValue) * 100}%` }}
                  >
                    {data.minutes > 20 && (
                      <span className="text-xs text-white font-medium">{data.minutes}m</span>
                    )}
                  </div>
                </div>
                {data.minutes <= 20 && (
                  <span className="text-xs text-gray-500 w-12">{data.minutes}m</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Study Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Activity Distribution
            </h3>
          </div>
          
          <div className="space-y-4">
            {studyDistribution.map((item, index) => {
              const total = studyDistribution.reduce((sum, i) => sum + i.value, 0);
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color 
                      }}
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
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{totalHours}h {totalMinutes}m</div>
              <div className="text-sm text-gray-600">Total Study Time</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            That's equivalent to {Math.round(stats.totalStudyTime / 60 / 8)} full work days!
          </div>
        </div>

        {/* Consistency Score */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.currentStreak}</div>
              <div className="text-sm text-gray-600">Day Streak 🔥</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats.currentStreak >= 7 
              ? 'Amazing consistency! Keep it up!' 
              : 'Study daily to build your streak!'}
          </div>
        </div>

        {/* Knowledge Retention */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.averageScore}%</div>
              <div className="text-sm text-gray-600">Quiz Average</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats.averageScore >= 80 
              ? 'Excellent retention!' 
              : 'Keep practicing to improve!'}
          </div>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6 border border-primary-200">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-600" />
          AI-Powered Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">📈 Prediction</div>
            <div className="text-xs text-gray-600">
              At your current pace, you'll complete approximately{' '}
              <strong>{Math.round(stats.thisWeekMinutes * 4 / 60)} hours</strong> this month.
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">💡 Recommendation</div>
            <div className="text-xs text-gray-600">
              {stats.currentStreak < 3 
                ? 'Study 25 minutes daily to build a strong habit.'
                : stats.averageScore < 70
                ? 'Review material more frequently to improve retention.'
                : 'Great work! Consider increasing difficulty level.'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">🎯 Next Milestone</div>
            <div className="text-xs text-gray-600">
              {stats.totalStudyTime < 600 
                ? `${600 - stats.totalStudyTime} minutes until 10-hour badge`
                : stats.currentStreak < 7
                ? `${7 - stats.currentStreak} days until week streak`
                : `${stats.documentsRead < 10 ? 10 - stats.documentsRead : 0} documents until master reader`}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">⚡ Peak Time</div>
            <div className="text-xs text-gray-600">
              Your most productive sessions average <strong>{Math.round(stats.averageSessionLength)}</strong> minutes.
              {stats.averageSessionLength < 25 && ' Try Pomodoro timer for longer focus!'}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Weekly Comparison</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">This Week</div>
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {Math.floor(stats.thisWeekMinutes / 60)}h {stats.thisWeekMinutes % 60}m
            </div>
            <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600"
                style={{ width: `${(stats.thisWeekMinutes / weeklyGoal) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Last Week</div>
            <div className="text-3xl font-bold text-gray-400 mb-1">
              {Math.floor(stats.lastWeekMinutes / 60)}h {stats.lastWeekMinutes % 60}m
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gray-400"
                style={{ width: `${(stats.lastWeekMinutes / weeklyGoal) * 100}%` }}
              />
            </div>
          </div>
        </div>
        {stats.thisWeekMinutes > stats.lastWeekMinutes ? (
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Great progress! You're {Math.round(((stats.thisWeekMinutes - stats.lastWeekMinutes) / stats.lastWeekMinutes) * 100)}% more active than last week.
          </div>
        ) : stats.thisWeekMinutes < stats.lastWeekMinutes ? (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
            You can do better! Try to match last week's effort.
          </div>
        ) : (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            Consistent! Keep maintaining this pace.
          </div>
        )}
      </div>
    </div>
  );
}
