// lib/xpTriggers.ts
// Automatic XP triggers for existing features

import { trackAction } from './gamification';
import { getCurrentUser } from './auth';

// Toast notification system
export const showXPToast = (xp: number, reason: string, levelUp?: boolean) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 z-50 animate-slide-in`;

    toast.innerHTML = `
    <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]">
      ${levelUp ?
            `<div class="text-3xl">🎉</div>` :
            `<div class="text-2xl">✨</div>`
        }
      <div>
        <div class="font-bold text-lg">
          ${levelUp ? 'LEVEL UP!' : `+${xp} XP`}
        </div>
        <div class="text-sm opacity-90">${reason}</div>
      </div>
    </div>
  `;

    document.body.appendChild(toast);

    // Trigger confetti if level up
    if (levelUp) {
        triggerConfetti();
    }

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slide-out 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Confetti animation
export const triggerConfetti = () => {
    const count = 50;
    const colors = ['#9333ea', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'];

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';

            const rotation = Math.random() * 360;
            const xMovement = (Math.random() - 0.5) * 200;

            confetti.animate([
                {
                    transform: 'translateY(0) translateX(0) rotate(0deg)',
                    opacity: 1
                },
                {
                    transform: `translateY(${window.innerHeight}px) translateX(${xMovement}px) rotate(${rotation}deg)`,
                    opacity: 0
                }
            ], {
                duration: 2000 + Math.random() * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => confetti.remove();

            document.body.appendChild(confetti);
        }, i * 30);
    }
};

// XP Trigger Functions

export const awardXPForUpload = () => {
    const user = getCurrentUser();
    if (!user) return;

    const result = trackAction(user.id, 'DOCUMENT_UPLOADED');
    showXPToast(result.xpAwarded, 'Document uploaded!', false);

    // Check for achievements
    if (result.achievements.length > 0) {
        result.achievements.forEach(achievement => {
            setTimeout(() => {
                showXPToast(achievement.xpReward, `🏆 Achievement: ${achievement.title}`, false);
            }, 500);
        });
    }
};

export const awardXPForQuiz = (score: number) => {
    const user = getCurrentUser();
    if (!user) return;

    const isPerfect = score >= 100;
    const action = isPerfect ? 'QUIZ_PERFECT' : 'QUIZ_COMPLETE';

    const result = trackAction(user.id, action);
    const message = isPerfect ? 'Perfect score! 🌟' : 'Quiz completed!';

    showXPToast(result.xpAwarded, message, false);

    if (result.achievements.length > 0) {
        result.achievements.forEach(achievement => {
            setTimeout(() => {
                showXPToast(achievement.xpReward, `🏆 ${achievement.title}`, false);
            }, 500);
        });
    }
};

export const awardXPForFlashcard = () => {
    const user = getCurrentUser();
    if (!user) return;

    const result = trackAction(user.id, 'FLASHCARD_REVIEW');

    // Only show toast every 5 flashcards to avoid spam
    const progress = JSON.parse(localStorage.getItem(`lumina_gamification_${user.id}`) || '{}');
    if (progress.stats?.flashcardsReviewed % 5 === 0) {
        showXPToast(result.xpAwarded * 5, '5 flashcards reviewed!', false);
    }
};

export const awardXPForNote = () => {
    const user = getCurrentUser();
    if (!user) return;

    const result = trackAction(user.id, 'NOTE_CREATED');
    showXPToast(result.xpAwarded, 'Note created!', false);
};

export const awardXPForStudySession = (minutes: number) => {
    const user = getCurrentUser();
    if (!user) return;

    const result = trackAction(user.id, 'STUDY_SESSION', { minutes });
    showXPToast(result.xpAwarded, `${minutes} min study session!`, false);
};

// Check for level up
export const checkLevelUp = () => {
    const user = getCurrentUser();
    if (!user) return;

    const storageKey = `lumina_gamification_${user.id}`;
    const oldData = localStorage.getItem(storageKey);

    // Watch for level changes
    const observer = setInterval(() => {
        const newData = localStorage.getItem(storageKey);
        if (oldData !== newData && newData) {
            const oldProgress = oldData ? JSON.parse(oldData) : { level: 1 };
            const newProgress = JSON.parse(newData);

            if (newProgress.level > oldProgress.level) {
                showXPToast(0, `Level ${newProgress.level}!`, true);
            }
        }
    }, 1000);

    // Clean up after 1 hour
    setTimeout(() => clearInterval(observer), 3600000);
};

// Initialize XP system
export const initializeXPSystem = () => {
    const user = getCurrentUser();
    if (!user) return;

    // Check for daily login
    const lastLogin = localStorage.getItem(`last_login_${user.id}`);
    const today = new Date().toDateString();

    if (lastLogin !== today) {
        localStorage.setItem(`last_login_${user.id}`, today);
        const result = trackAction(user.id, 'DAILY_LOGIN');

        setTimeout(() => {
            showXPToast(result.xpAwarded, 'Daily login bonus!', false);
        }, 1000);
    }

    // Start level up checker
    checkLevelUp();
};