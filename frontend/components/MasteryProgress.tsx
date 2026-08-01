'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MasteryProgressProps {
  currentScore: number;
  previousScore?: number;
}

const MASTERY_LEVELS = [
  { threshold: 0, label: 'Beginner', color: 'blue', description: 'Just starting out' },
  { threshold: 25, label: 'Learning', color: 'cyan', description: 'Building foundation' },
  { threshold: 50, label: 'Growing Understanding', color: 'green', description: 'Mix of direct teaching and guided discovery' },
  { threshold: 70, label: 'Proficient', color: 'yellow', description: 'Solid understanding' },
  { threshold: 85, label: 'Mastery', color: 'orange', description: 'Near expert level' },
  { threshold: 95, label: 'Expert', color: 'red', description: 'Full mastery achieved' }
];

export default function MasteryProgress({ currentScore, previousScore }: MasteryProgressProps) {
  // Ensure score is within valid range
  const score = Math.max(0, Math.min(100, currentScore || 0));
  const prevScore = previousScore !== undefined ? Math.max(0, Math.min(100, previousScore)) : undefined;

  // Find current mastery level
  const getCurrentLevel = (scoreValue: number) => {
    for (let i = MASTERY_LEVELS.length - 1; i >= 0; i--) {
      if (scoreValue >= MASTERY_LEVELS[i].threshold) {
        return MASTERY_LEVELS[i];
      }
    }
    return MASTERY_LEVELS[0];
  };

  const currentLevel = getCurrentLevel(score);
  const scoreChange = prevScore !== undefined ? score - prevScore : 0;

  // Get color classes
  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500' },
      cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-500' },
      green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' },
      yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500' },
      red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' }
    };
    return colorMap[colorName] || colorMap.blue;
  };

  const colors = getColorClasses(currentLevel.color);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mastery Progress</h3>
        {scoreChange !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium ${scoreChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
            {scoreChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {scoreChange > 0 ? '+' : ''}{scoreChange.toFixed(0)}%
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Level</span>
          <span className={`text-lg font-bold ${colors.text}`}>{score.toFixed(0)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} transition-all duration-500 ease-out`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Level Labels */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Beginner</span>
          <span>Intermediate</span>
          <span>Advanced</span>
        </div>
      </div>

      {/* Current Level Card */}
      <div className={`p-3 rounded-lg border-2 ${colors.border} bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900`}>
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 text-xl">
            {currentLevel.threshold >= 85 ? '🏆' : currentLevel.threshold >= 50 ? '⚡' : '📚'}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold ${colors.text} mb-1`}>{currentLevel.label}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">{currentLevel.description}</p>
          </div>
        </div>
      </div>

      {/* Progress to Next Level */}
      {currentLevel.threshold < 95 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between mb-1">
            <span>Progress to next level</span>
            <span className="font-medium">
              {(() => {
                const nextLevel = MASTERY_LEVELS.find(l => l.threshold > score);
                if (nextLevel) {
                  const remaining = nextLevel.threshold - score;
                  return `${remaining.toFixed(0)}% to go`;
                }
                return 'Max level!';
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}