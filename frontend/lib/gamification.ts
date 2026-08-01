// lib/gamification.ts
// Gamification system with XP, levels, achievements, and rewards

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    unlockedAt?: string;
    progress?: number;
    maxProgress?: number;
}

export interface UserProgress {
    userId: number;
    xp: number;
    level: number;
    achievements: Achievement[];
    dailyStreak: number;
    lastActiveDate: string;
    stats: {
        totalStudyTime: number;
        quizzesCompleted: number;
        flashcardsReviewed: number;
        notesCreated: number;
        documentsRead: number;
    };
}

const XP_PER_LEVEL = 1000;
const STORAGE_KEY = 'lumina_gamification';

// XP Rewards
export const XP_REWARDS = {
    STUDY_SESSION: 50,
    QUIZ_COMPLETE: 100,
    QUIZ_PERFECT: 200,
    FLASHCARD_REVIEW: 10,
    NOTE_CREATED: 25,
    DOCUMENT_UPLOADED: 75,
    DAILY_LOGIN: 20,
    STREAK_BONUS: 50,
};

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_steps',
        title: 'First Steps',
        description: 'Complete your first study session',
        icon: '🎯',
        xpReward: 100,
        maxProgress: 1,
    },
    {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: '📝',
        xpReward: 250,
        maxProgress: 10,
    },
    {
        id: 'flashcard_guru',
        title: 'Flashcard Guru',
        description: 'Review 100 flashcards',
        icon: '🧠',
        xpReward: 300,
        maxProgress: 100,
    },
    {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        xpReward: 500,
        maxProgress: 7,
    },
    {
        id: 'speed_reader',
        title: 'Speed Reader',
        description: 'Read 5 documents',
        icon: '📚',
        xpReward: 200,
        maxProgress: 5,
    },
    {
        id: 'note_taker',
        title: 'Note Taker',
        description: 'Create 20 notes',
        icon: '📓',
        xpReward: 150,
        maxProgress: 20,
    },
    {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Get 100% on a quiz',
        icon: '⭐',
        xpReward: 300,
        maxProgress: 1,
    },
    {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Study before 8 AM',
        icon: '🌅',
        xpReward: 100,
        maxProgress: 1,
    },
    {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Study after 10 PM',
        icon: '🦉',
        xpReward: 100,
        maxProgress: 1,
    },
    {
        id: 'century_club',
        title: 'Century Club',
        description: 'Earn 10,000 XP',
        icon: '💯',
        xpReward: 1000,
        maxProgress: 1,
    },
];

// Get user progress
export const getUserProgress = (userId: number): UserProgress => {
    const data = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (data) {
        return JSON.parse(data);
    }

    // Initialize new user
    return {
        userId,
        xp: 0,
        level: 1,
        achievements: ACHIEVEMENTS.map(a => ({ ...a, progress: 0 })),
        dailyStreak: 0,
        lastActiveDate: new Date().toISOString(),
        stats: {
            totalStudyTime: 0,
            quizzesCompleted: 0,
            flashcardsReviewed: 0,
            notesCreated: 0,
            documentsRead: 0,
        },
    };
};

// Save user progress
export const saveUserProgress = (progress: UserProgress): void => {
    localStorage.setItem(`${STORAGE_KEY}_${progress.userId}`, JSON.stringify(progress));
};

// Calculate level from XP
export const calculateLevel = (xp: number): number => {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
};

// Calculate XP needed for next level
export const xpForNextLevel = (currentXP: number): number => {
    const currentLevel = calculateLevel(currentXP);
    return currentLevel * XP_PER_LEVEL - currentXP;
};

// Award XP
export const awardXP = (userId: number, amount: number, reason: string): {
    newXP: number;
    newLevel: number;
    leveledUp: boolean;
    achievements: Achievement[];
} => {
    const progress = getUserProgress(userId);
    const oldLevel = progress.level;
    const newXP = progress.xp + amount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > oldLevel;

    progress.xp = newXP;
    progress.level = newLevel;

    // Check for achievements
    const unlockedAchievements = checkAchievements(progress);

    saveUserProgress(progress);

    return {
        newXP,
        newLevel,
        leveledUp,
        achievements: unlockedAchievements,
    };
};

// Update daily streak
export const updateDailyStreak = (userId: number): void => {
    const progress = getUserProgress(userId);
    const today = new Date().toDateString();
    const lastActive = new Date(progress.lastActiveDate).toDateString();

    if (today !== lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastActive === yesterdayStr) {
            // Continue streak
            progress.dailyStreak += 1;
            awardXP(userId, XP_REWARDS.DAILY_LOGIN + XP_REWARDS.STREAK_BONUS, 'Daily streak bonus');
        } else {
            // Reset streak
            progress.dailyStreak = 1;
            awardXP(userId, XP_REWARDS.DAILY_LOGIN, 'Daily login');
        }

        progress.lastActiveDate = new Date().toISOString();
        saveUserProgress(progress);
    }
};

// Check and unlock achievements
export const checkAchievements = (progress: UserProgress): Achievement[] => {
    const unlocked: Achievement[] = [];

    progress.achievements.forEach((achievement, index) => {
        if (achievement.unlockedAt) return; // Already unlocked

        let currentProgress = 0;

        // Check progress based on achievement type
        switch (achievement.id) {
            case 'first_steps':
                currentProgress = progress.stats.totalStudyTime > 0 ? 1 : 0;
                break;
            case 'quiz_master':
                currentProgress = progress.stats.quizzesCompleted;
                break;
            case 'flashcard_guru':
                currentProgress = progress.stats.flashcardsReviewed;
                break;
            case 'week_warrior':
                currentProgress = progress.dailyStreak;
                break;
            case 'speed_reader':
                currentProgress = progress.stats.documentsRead;
                break;
            case 'note_taker':
                currentProgress = progress.stats.notesCreated;
                break;
            case 'century_club':
                currentProgress = progress.xp >= 10000 ? 1 : 0;
                break;
        }

        achievement.progress = currentProgress;

        if (currentProgress >= (achievement.maxProgress || 1)) {
            achievement.unlockedAt = new Date().toISOString();
            progress.xp += achievement.xpReward;
            unlocked.push(achievement);
        }

        progress.achievements[index] = achievement;
    });

    if (unlocked.length > 0) {
        saveUserProgress(progress);
    }

    return unlocked;
};

// Track action and award XP
export const trackAction = (
    userId: number,
    action: keyof typeof XP_REWARDS,
    additionalData?: any
): { xpAwarded: number; achievements: Achievement[] } => {
    const progress = getUserProgress(userId);

    // Update stats
    switch (action) {
        case 'STUDY_SESSION':
            progress.stats.totalStudyTime += additionalData?.minutes || 30;
            break;
        case 'QUIZ_COMPLETE':
            progress.stats.quizzesCompleted += 1;
            break;
        case 'FLASHCARD_REVIEW':
            progress.stats.flashcardsReviewed += 1;
            break;
        case 'NOTE_CREATED':
            progress.stats.notesCreated += 1;
            break;
        case 'DOCUMENT_UPLOADED':
            progress.stats.documentsRead += 1;
            break;
    }

    saveUserProgress(progress);

    const xpAwarded = XP_REWARDS[action];
    const result = awardXP(userId, xpAwarded, action);

    return {
        xpAwarded,
        achievements: result.achievements,
    };
};

// Get leaderboard
export const getLeaderboard = (): Array<{ username: string; xp: number; level: number }> => {
    const leaderboard: Array<{ username: string; xp: number; level: number }> = [];

    // Get all users from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEY)) {
            const data = localStorage.getItem(key);
            if (data) {
                const progress: UserProgress = JSON.parse(data);
                leaderboard.push({
                    username: `User ${progress.userId}`,
                    xp: progress.xp,
                    level: progress.level,
                });
            }
        }
    }

    return leaderboard.sort((a, b) => b.xp - a.xp).slice(0, 10);
};