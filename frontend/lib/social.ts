// lib/social.ts
// Social features: friends, groups, leaderboards, sharing

import { getCurrentUser, getAllUsers, User } from './auth';
import { getStats } from './studyTracker';

// ==================== TYPES ====================

export interface Friend {
    userId: number;
    username: string;
    email: string;
    status: 'pending' | 'accepted';
    addedAt: string;
}

export interface StudyGroup {
    id: string;
    name: string;
    description: string;
    createdBy: number;
    members: number[];
    documents: SharedDocument[];
    createdAt: string;
}

export interface SharedDocument {
    id: string;
    title: string;
    sharedBy: number;
    sharedAt: string;
    documentId?: number;
}

export interface LeaderboardEntry {
    userId: number;
    username: string;
    totalStudyTime: number;
    currentStreak: number;
    averageScore: number;
    rank: number;
}

export interface Activity {
    id: string;
    userId: number;
    username: string;
    type: 'study' | 'quiz' | 'document' | 'achievement' | 'streak';
    description: string;
    timestamp: string;
}

// ==================== STORAGE KEYS ====================

const FRIENDS_KEY = 'lumina_friends';
const GROUPS_KEY = 'lumina_groups';
const ACTIVITIES_KEY = 'lumina_activities';
const SHARED_DOCS_KEY = 'lumina_shared_docs';

// ==================== FRIENDS MANAGEMENT ====================

export const getFriends = (): Friend[] => {
    if (typeof window === 'undefined') return [];
    const user = getCurrentUser();
    if (!user) return [];

    const friendsData = localStorage.getItem(`${FRIENDS_KEY}_${user.id}`);
    return friendsData ? JSON.parse(friendsData) : [];
};

const saveFriends = (friends: Friend[]): void => {
    if (typeof window === 'undefined') return;
    const user = getCurrentUser();
    if (!user) return;

    localStorage.setItem(`${FRIENDS_KEY}_${user.id}`, JSON.stringify(friends));
};

export const sendFriendRequest = (targetEmail: string): { success: boolean; error?: string } => {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    const allUsers = getAllUsers();
    const targetUser = allUsers.find(u => u.email === targetEmail);

    if (!targetUser) {
        return { success: false, error: 'User not found' };
    }

    if (targetUser.id === currentUser.id) {
        return { success: false, error: 'Cannot add yourself as friend' };
    }

    const friends = getFriends();
    if (friends.some(f => f.userId === targetUser.id)) {
        return { success: false, error: 'Already friends or request pending' };
    }

    const newFriend: Friend = {
        userId: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        status: 'pending',
        addedAt: new Date().toISOString(),
    };

    friends.push(newFriend);
    saveFriends(friends);

    // Add to target user's friend requests (simulate backend)
    const targetFriends = JSON.parse(localStorage.getItem(`${FRIENDS_KEY}_${targetUser.id}`) || '[]');
    targetFriends.push({
        userId: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        status: 'pending',
        addedAt: new Date().toISOString(),
    });
    localStorage.setItem(`${FRIENDS_KEY}_${targetUser.id}`, JSON.stringify(targetFriends));

    return { success: true };
};

export const acceptFriendRequest = (userId: number): { success: boolean } => {
    const friends = getFriends();
    const friendIndex = friends.findIndex(f => f.userId === userId && f.status === 'pending');

    if (friendIndex === -1) {
        return { success: false };
    }

    friends[friendIndex].status = 'accepted';
    saveFriends(friends);

    return { success: true };
};

export const removeFriend = (userId: number): { success: boolean } => {
    const friends = getFriends();
    const filteredFriends = friends.filter(f => f.userId !== userId);
    saveFriends(filteredFriends);

    return { success: true };
};

// ==================== STUDY GROUPS ====================

export const getAllGroups = (): StudyGroup[] => {
    if (typeof window === 'undefined') return [];
    const groupsData = localStorage.getItem(GROUPS_KEY);
    return groupsData ? JSON.parse(groupsData) : [];
};

const saveGroups = (groups: StudyGroup[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
};

export const getMyGroups = (): StudyGroup[] => {
    const user = getCurrentUser();
    if (!user) return [];

    const allGroups = getAllGroups();
    return allGroups.filter(g => g.members.includes(user.id));
};

export const createGroup = (
    name: string,
    description: string
): { success: boolean; error?: string; group?: StudyGroup } => {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const groups = getAllGroups();

    const newGroup: StudyGroup = {
        id: `group_${Date.now()}`,
        name,
        description,
        createdBy: user.id,
        members: [user.id],
        documents: [],
        createdAt: new Date().toISOString(),
    };

    groups.push(newGroup);
    saveGroups(groups);

    return { success: true, group: newGroup };
};

export const joinGroup = (groupId: string): { success: boolean; error?: string } => {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const groups = getAllGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);

    if (groupIndex === -1) {
        return { success: false, error: 'Group not found' };
    }

    if (groups[groupIndex].members.includes(user.id)) {
        return { success: false, error: 'Already a member' };
    }

    groups[groupIndex].members.push(user.id);
    saveGroups(groups);

    return { success: true };
};

export const leaveGroup = (groupId: string): { success: boolean } => {
    const user = getCurrentUser();
    if (!user) return { success: false };

    const groups = getAllGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);

    if (groupIndex === -1) return { success: false };

    groups[groupIndex].members = groups[groupIndex].members.filter(m => m !== user.id);

    // Delete group if no members
    if (groups[groupIndex].members.length === 0) {
        groups.splice(groupIndex, 1);
    }

    saveGroups(groups);
    return { success: true };
};

export const shareDocumentToGroup = (
    groupId: string,
    title: string,
    documentId?: number
): { success: boolean; error?: string } => {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const groups = getAllGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);

    if (groupIndex === -1) {
        return { success: false, error: 'Group not found' };
    }

    if (!groups[groupIndex].members.includes(user.id)) {
        return { success: false, error: 'Not a member of this group' };
    }

    const sharedDoc: SharedDocument = {
        id: `doc_${Date.now()}`,
        title,
        sharedBy: user.id,
        sharedAt: new Date().toISOString(),
        documentId,
    };

    groups[groupIndex].documents.push(sharedDoc);
    saveGroups(groups);

    return { success: true };
};

// ==================== LEADERBOARD ====================

export const getLeaderboard = (): LeaderboardEntry[] => {
    const allUsers = getAllUsers();
    const entries: LeaderboardEntry[] = [];

    allUsers.forEach(user => {
        // Get stats for each user (in real app, this would be from backend)
        const statsKey = `studyStats_${user.id}`;
        const userStats = localStorage.getItem(statsKey);

        if (userStats) {
            const stats = JSON.parse(userStats);
            entries.push({
                userId: user.id,
                username: user.username,
                totalStudyTime: stats.totalStudyTime || 0,
                currentStreak: stats.currentStreak || 0,
                averageScore: stats.averageScore || 0,
                rank: 0, // Will be set after sorting
            });
        }
    });

    // Sort by total study time
    entries.sort((a, b) => b.totalStudyTime - a.totalStudyTime);

    // Assign ranks
    entries.forEach((entry, index) => {
        entry.rank = index + 1;
    });

    return entries;
};

export const getMyRank = (): number => {
    const user = getCurrentUser();
    if (!user) return 0;

    const leaderboard = getLeaderboard();
    const myEntry = leaderboard.find(e => e.userId === user.id);

    return myEntry?.rank || 0;
};

// ==================== ACTIVITY FEED ====================

export const getActivityFeed = (): Activity[] => {
    if (typeof window === 'undefined') return [];
    const activitiesData = localStorage.getItem(ACTIVITIES_KEY);
    return activitiesData ? JSON.parse(activitiesData) : [];
};

const saveActivities = (activities: Activity[]): void => {
    if (typeof window === 'undefined') return;
    // Keep only last 100 activities
    const limited = activities.slice(-100);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(limited));
};

export const addActivity = (
    type: Activity['type'],
    description: string
): void => {
    const user = getCurrentUser();
    if (!user) return;

    const activities = getActivityFeed();

    const newActivity: Activity = {
        id: `activity_${Date.now()}`,
        userId: user.id,
        username: user.username,
        type,
        description,
        timestamp: new Date().toISOString(),
    };

    activities.push(newActivity);
    saveActivities(activities);
};

export const getFriendsActivity = (): Activity[] => {
    const friends = getFriends().filter(f => f.status === 'accepted');
    const allActivities = getActivityFeed();

    const friendIds = friends.map(f => f.userId);
    const currentUser = getCurrentUser();
    if (currentUser) friendIds.push(currentUser.id);

    return allActivities.filter(a => friendIds.includes(a.userId));
};

// ==================== SHARING ====================

export const shareDocument = (
    documentTitle: string,
    recipientEmail: string
): { success: boolean; error?: string } => {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const allUsers = getAllUsers();
    const recipient = allUsers.find(u => u.email === recipientEmail);

    if (!recipient) {
        return { success: false, error: 'User not found' };
    }

    // Store shared document
    const sharedDocs = JSON.parse(localStorage.getItem(SHARED_DOCS_KEY) || '{}');
    if (!sharedDocs[recipient.id]) {
        sharedDocs[recipient.id] = [];
    }

    sharedDocs[recipient.id].push({
        title: documentTitle,
        from: user.username,
        sharedAt: new Date().toISOString(),
    });

    localStorage.setItem(SHARED_DOCS_KEY, JSON.stringify(sharedDocs));

    // Add activity
    addActivity('document', `Shared "${documentTitle}" with ${recipient.username}`);

    return { success: true };
};

export const getSharedDocuments = (): any[] => {
    const user = getCurrentUser();
    if (!user) return [];

    const sharedDocs = JSON.parse(localStorage.getItem(SHARED_DOCS_KEY) || '{}');
    return sharedDocs[user.id] || [];
};

// ==================== STATS COMPARISON ====================

export const compareWithFriend = (friendId: number): {
    me: any;
    friend: any;
} | null => {
    const user = getCurrentUser();
    if (!user) return null;

    const myStats = getStats();
    const friendStatsKey = `studyStats_${friendId}`;
    const friendStatsData = localStorage.getItem(friendStatsKey);

    if (!friendStatsData) return null;

    const friendStats = JSON.parse(friendStatsData);

    return {
        me: myStats,
        friend: friendStats,
    };
};