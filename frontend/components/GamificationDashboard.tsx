// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Trophy, Star, Zap, Target, Award, TrendingUp, Flame, Crown, Gift } from 'lucide-react';
// import {
//     getUserProgress,
//     updateDailyStreak,
//     xpForNextLevel,
//     getLeaderboard,
//     ACHIEVEMENTS,
//     type UserProgress
// } from '@/lib/gamification';
// import { getCurrentUser } from '@/lib/auth';

// export default function GamificationDashboard() {
//     const [progress, setProgress] = useState<UserProgress | null>(null);
//     const [leaderboard, setLeaderboard] = useState<any[]>([]);
//     const user = getCurrentUser();

//     useEffect(() => {
//         if (user) {
//             updateDailyStreak(user.id);
//             const userProgress = getUserProgress(user.id);
//             setProgress(userProgress);
//             setLeaderboard(getLeaderboard());
//         }
//     }, [user]);

//     if (!progress) {
//         return (
//             <div className="flex items-center justify-center p-8">
//                 <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
//             </div>
//         );
//     }

//     const xpNeeded = xpForNextLevel(progress.xp);
//     const xpProgress = ((progress.xp % 1000) / 1000) * 100;
//     const unlockedAchievements = progress.achievements.filter(a => a.unlockedAt);

//     return (
//         <div className="space-y-6">
//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 {/* Level Card */}
//                 <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
//                     <div className="flex items-center justify-between mb-2">
//                         <Crown className="w-8 h-8" />
//                         <span className="text-sm opacity-80">Level</span>
//                     </div>
//                     <div className="text-4xl font-bold">{progress.level}</div>
//                     <div className="text-sm opacity-80 mt-1">{xpNeeded} XP to next</div>
//                 </div>

//                 {/* Total XP Card */}
//                 <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
//                     <div className="flex items-center justify-between mb-2">
//                         <Zap className="w-8 h-8" />
//                         <span className="text-sm opacity-80">Total XP</span>
//                     </div>
//                     <div className="text-4xl font-bold">{progress.xp.toLocaleString()}</div>
//                     <div className="text-sm opacity-80 mt-1">Experience Points</div>
//                 </div>

//                 {/* Streak Card */}
//                 <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
//                     <div className="flex items-center justify-between mb-2">
//                         <Flame className="w-8 h-8" />
//                         <span className="text-sm opacity-80">Streak</span>
//                     </div>
//                     <div className="text-4xl font-bold">{progress.dailyStreak}</div>
//                     <div className="text-sm opacity-80 mt-1">Days in a row</div>
//                 </div>

//                 {/* Achievements Card */}
//                 <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
//                     <div className="flex items-center justify-between mb-2">
//                         <Trophy className="w-8 h-8" />
//                         <span className="text-sm opacity-80">Achievements</span>
//                     </div>
//                     <div className="text-4xl font-bold">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</div>
//                     <div className="text-sm opacity-80 mt-1">Unlocked</div>
//                 </div>
//             </div>

//             {/* XP Progress Bar */}
//             <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
//                 <div className="flex items-center justify-between mb-3">
//                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">Level {progress.level} Progress</h3>
//                     <span className="text-sm text-gray-600 dark:text-gray-400">{progress.xp % 1000} / 1000 XP</span>
//                 </div>
//                 <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
//                     <div
//                         className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
//                         style={{ width: `${xpProgress}%` }}
//                     />
//                 </div>
//             </div>

//             <div className="grid md:grid-cols-2 gap-6">
//                 {/* Achievements */}
//                 <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
//                     <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//                         <Trophy className="w-6 h-6 text-yellow-500" />
//                         Achievements
//                     </h3>
//                     <div className="space-y-3 max-h-[400px] overflow-y-auto">
//                         {progress.achievements.map((achievement) => (
//                             <div
//                                 key={achievement.id}
//                                 className={`p-4 rounded-xl border-2 transition-all ${achievement.unlockedAt
//                                     ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600'
//                                     : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-60'
//                                     }`}
//                             >
//                                 <div className="flex items-start gap-3">
//                                     <div className="text-3xl">{achievement.icon}</div>
//                                     <div className="flex-1">
//                                         <div className="flex items-center justify-between mb-1">
//                                             <h4 className="font-bold text-gray-900 dark:text-white">{achievement.title}</h4>
//                                             {achievement.unlockedAt && (
//                                                 <Award className="w-5 h-5 text-yellow-500" />
//                                             )}
//                                         </div>
//                                         <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{achievement.description}</p>

//                                         {!achievement.unlockedAt && achievement.maxProgress && achievement.maxProgress > 1 && (
//                                             <div className="mt-2">
//                                                 <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
//                                                     <span>Progress</span>
//                                                     <span>{achievement.progress || 0} / {achievement.maxProgress}</span>
//                                                 </div>
//                                                 <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
//                                                     <div
//                                                         className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
//                                                         style={{ width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%` }}
//                                                     />
//                                                 </div>
//                                             </div>
//                                         )}

//                                         <div className="flex items-center gap-2 mt-2">
//                                             <Zap className="w-4 h-4 text-purple-500" />
//                                             <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
//                                                 +{achievement.xpReward} XP
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Leaderboard & Stats */}
//                 <div className="space-y-6">
//                     {/* Stats */}
//                     <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
//                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//                             <TrendingUp className="w-6 h-6 text-blue-500" />
//                             Your Stats
//                         </h3>
//                         <div className="grid grid-cols-2 gap-4">
//                             <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
//                                 <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progress.stats.quizzesCompleted}</div>
//                                 <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Quizzes</div>
//                             </div>
//                             <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
//                                 <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{progress.stats.flashcardsReviewed}</div>
//                                 <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Flashcards</div>
//                             </div>
//                             <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
//                                 <div className="text-2xl font-bold text-green-600 dark:text-green-400">{progress.stats.notesCreated}</div>
//                                 <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Notes</div>
//                             </div>
//                             <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
//                                 <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{progress.stats.documentsRead}</div>
//                                 <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Documents</div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Leaderboard */}
//                     <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
//                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//                             <Crown className="w-6 h-6 text-yellow-500" />
//                             Leaderboard
//                         </h3>
//                         <div className="space-y-2">
//                             {leaderboard.slice(0, 5).map((entry, index) => (
//                                 <div
//                                     key={index}
//                                     className={`flex items-center gap-3 p-3 rounded-xl ${index === 0
//                                         ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30'
//                                         : 'bg-gray-50 dark:bg-gray-700/50'
//                                         }`}
//                                 >
//                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
//                                         index === 1 ? 'bg-gray-400 text-white' :
//                                             index === 2 ? 'bg-orange-600 text-white' :
//                                                 'bg-gray-300 text-gray-700'
//                                         }`}>
//                                         {index + 1}
//                                     </div>
//                                     <div className="flex-1">
//                                         <div className="font-semibold text-gray-900 dark:text-white">{entry.username}</div>
//                                         <div className="text-xs text-gray-600 dark:text-gray-400">Level {entry.level}</div>
//                                     </div>
//                                     <div className="text-right">
//                                         <div className="font-bold text-purple-600 dark:text-purple-400">{entry.xp.toLocaleString()}</div>
//                                         <div className="text-xs text-gray-600 dark:text-gray-400">XP</div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }



'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Target, Award, TrendingUp, Flame, Crown, Gift } from 'lucide-react';
import {
    getUserProgress,
    updateDailyStreak,
    xpForNextLevel,
    getLeaderboard,
    ACHIEVEMENTS,
    type UserProgress
} from '@/lib/gamification';
import { getCurrentUser } from '@/lib/auth';
import { useLuminaDataSync } from '@/lib/eventBus';

export default function GamificationDashboard() {
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    const loadData = () => {
        const user = getCurrentUser();
        if (user) {
            updateDailyStreak(user.id);
            const userProgress = getUserProgress(user.id);
            setProgress(userProgress);
            setLeaderboard(getLeaderboard());
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useLuminaDataSync(loadData);

    if (!progress) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const xpNeeded = xpForNextLevel(progress.xp);
    const xpProgress = ((progress.xp % 1000) / 1000) * 100;
    const unlockedAchievements = progress.achievements.filter(a => a.unlockedAt);

    return (
        <div className="space-y-6">
            {/* Top Header Banner matching ConceptMap */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
                            <Trophy className="w-4 h-4 text-yellow-300 animate-bounce" />
                            <span>Level {progress.level} Scholar Achievements</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold">Rewards & Gamification</h2>
                        <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
                            Earn XP bonuses, maintain daily study streaks, unlock badges, and compete on the global leaderboard.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/30 text-xs font-bold">
                        <Flame className="w-5 h-5 text-orange-300 animate-pulse" />
                        <span>{progress.dailyStreak} Day Study Streak 🔥</span>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Level Card */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Crown className="w-6 h-6 text-amber-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Scholar Rank</span>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">Level {progress.level}</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">{xpNeeded} XP to next level</div>
                </div>

                {/* Total XP Card */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Zap className="w-6 h-6 text-indigo-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Total XP</span>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{progress.xp.toLocaleString()}</div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">Experience Points</div>
                </div>

                {/* Streak Card */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Flame className="w-6 h-6 text-orange-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Study Streak</span>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{progress.dailyStreak} Days</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">Consecutive Days</div>
                </div>

                {/* Achievements Card */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Trophy className="w-6 h-6 text-emerald-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Badges Unlocked</span>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Badges Earned</div>
                </div>
            </div>

            {/* XP Progress Bar */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Level {progress.level} Progress</h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{progress.xp % 1000} / 1000 XP</span>
                </div>
                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${xpProgress}%` }}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Achievements */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Achievements
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {progress.achievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`p-4 rounded-xl border-2 transition-all ${achievement.unlockedAt
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600'
                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-60'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">{achievement.icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">{achievement.title}</h4>
                                            {achievement.unlockedAt && (
                                                <Award className="w-5 h-5 text-yellow-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{achievement.description}</p>

                                        {!achievement.unlockedAt && achievement.maxProgress && achievement.maxProgress > 1 && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                    <span>Progress</span>
                                                    <span>{achievement.progress || 0} / {achievement.maxProgress}</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                                                        style={{ width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mt-2">
                                            <Zap className="w-4 h-4 text-purple-500" />
                                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                                +{achievement.xpReward} XP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard & Stats */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-500" />
                            Your Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progress.stats.quizzesCompleted}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Quizzes</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{progress.stats.flashcardsReviewed}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Flashcards</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{progress.stats.notesCreated}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Notes</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{progress.stats.documentsRead}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Documents</div>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Crown className="w-6 h-6 text-yellow-500" />
                            Leaderboard
                        </h3>
                        <div className="space-y-2">
                            {leaderboard.slice(0, 5).map((entry, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 p-3 rounded-xl ${index === 0
                                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30'
                                        : 'bg-gray-50 dark:bg-gray-700/50'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                                        index === 1 ? 'bg-gray-400 text-white' :
                                            index === 2 ? 'bg-orange-600 text-white' :
                                                'bg-gray-300 text-gray-700'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 dark:text-white">{entry.username}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Level {entry.level}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-purple-600 dark:text-purple-400">{entry.xp.toLocaleString()}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">XP</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}