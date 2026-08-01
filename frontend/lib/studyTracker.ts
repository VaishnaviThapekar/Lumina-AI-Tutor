// lib/studyTracker.ts
// Utility functions for tracking study statistics

export interface StudyStats {
  totalStudyTime: number;
  documentsRead: number;
  sessionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionLength: number;
  thisWeekMinutes: number;
  lastWeekMinutes: number;
  quizzesCompleted: number;
  averageScore: number;
  lastStudyDate: string;
}

const STORAGE_KEY = 'studyStats';

// Initialize default stats
const defaultStats: StudyStats = {
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
  lastStudyDate: '',
};

// Get current stats from localStorage
export const getStats = (): StudyStats => {
  if (typeof window === 'undefined') return defaultStats;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return defaultStats;
};

// Save stats to localStorage
export const saveStats = (stats: StudyStats): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

// Add study time
export const addStudyTime = (minutes: number): void => {
  const stats = getStats();
  const today = new Date().toDateString();
  
  // Update total time
  stats.totalStudyTime += minutes;
  stats.thisWeekMinutes += minutes;
  stats.sessionsCompleted += 1;
  
  // Recalculate average session length
  stats.averageSessionLength = Math.round(stats.totalStudyTime / stats.sessionsCompleted);
  
  // Update streak
  if (stats.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (stats.lastStudyDate === yesterday.toDateString()) {
      // Continue streak
      stats.currentStreak += 1;
    } else if (stats.lastStudyDate === '') {
      // First study
      stats.currentStreak = 1;
    } else {
      // Streak broken
      stats.currentStreak = 1;
    }
    
    stats.lastStudyDate = today;
    
    // Update longest streak
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
  }
  
  saveStats(stats);
};

// Mark document as read
export const markDocumentRead = (): void => {
  const stats = getStats();
  stats.documentsRead += 1;
  saveStats(stats);
};

// Add quiz result
export const addQuizResult = (score: number): void => {
  const stats = getStats();
  
  // Update quiz count
  stats.quizzesCompleted += 1;
  
  // Update average score
  const totalScore = stats.averageScore * (stats.quizzesCompleted - 1) + score;
  stats.averageScore = Math.round(totalScore / stats.quizzesCompleted);
  
  saveStats(stats);
};

// Reset weekly stats (call this on Monday)
export const resetWeeklyStats = (): void => {
  const stats = getStats();
  stats.lastWeekMinutes = stats.thisWeekMinutes;
  stats.thisWeekMinutes = 0;
  saveStats(stats);
};

// Check if it's a new week and reset if needed
export const checkAndResetWeek = (): void => {
  const lastReset = localStorage.getItem('lastWeekReset');
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Reset on Monday
  if (dayOfWeek === 1) {
    const todayString = today.toDateString();
    if (lastReset !== todayString) {
      resetWeeklyStats();
      localStorage.setItem('lastWeekReset', todayString);
    }
  }
};

// Get formatted stats for display
export const getFormattedStats = (): StudyStats => {
  checkAndResetWeek();
  return getStats();
};

// Reset all stats (for testing)
export const resetAllStats = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('lastWeekReset');
};
