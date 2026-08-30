import { useEffect } from 'react';
import { getCurrentUser } from './auth';
import { getStats } from './studyTracker';
import { getUserProgress, saveUserProgress } from './gamification';

export const LUMINA_DATA_UPDATED_EVENT = 'lumina_data_updated';

/**
 * Notifies all dashboard components that user data/stats/XP have updated.
 * Also synchronizes studyTracker.ts stats with gamification.ts stats.
 */
export const notifyLuminaDataUpdated = () => {
    if (typeof window === 'undefined') return;

    // Cross-sync studyTracker stats with gamification stats
    const user = getCurrentUser();
    if (user) {
        try {
            const stats = getStats();
            const progress = getUserProgress(user.id);

            let changed = false;

            if (stats.documentsRead > progress.stats.documentsRead) {
                progress.stats.documentsRead = stats.documentsRead;
                changed = true;
            } else if (progress.stats.documentsRead > stats.documentsRead) {
                stats.documentsRead = progress.stats.documentsRead;
            }

            if (stats.quizzesCompleted > progress.stats.quizzesCompleted) {
                progress.stats.quizzesCompleted = stats.quizzesCompleted;
                changed = true;
            } else if (progress.stats.quizzesCompleted > stats.quizzesCompleted) {
                stats.quizzesCompleted = progress.stats.quizzesCompleted;
            }

            if (stats.totalStudyTime > progress.stats.totalStudyTime) {
                progress.stats.totalStudyTime = stats.totalStudyTime;
                changed = true;
            }

            if (stats.currentStreak > progress.dailyStreak) {
                progress.dailyStreak = stats.currentStreak;
                changed = true;
            }

            if (changed) {
                saveUserProgress(progress);
            }
        } catch (e) {
            console.error('Error syncing stores:', e);
        }
    }

    // Broadcast custom event to all listening components
    window.dispatchEvent(new CustomEvent(LUMINA_DATA_UPDATED_EVENT));
};

/**
 * React Hook to subscribe to live data updates across all interlinked tabs.
 */
export const useLuminaDataSync = (onUpdate: () => void) => {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleUpdate = () => {
            onUpdate();
        };

        window.addEventListener(LUMINA_DATA_UPDATED_EVENT, handleUpdate);
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener(LUMINA_DATA_UPDATED_EVENT, handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, [onUpdate]);
};
