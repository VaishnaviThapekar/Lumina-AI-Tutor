'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trophy, Share2, MessageSquare, TrendingUp, Clock, Award, Plus, Check, X, Sparkles } from 'lucide-react';
import {
    getFriends,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    getMyGroups,
    getAllGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    getLeaderboard,
    getMyRank,
    getFriendsActivity,
    Friend,
    StudyGroup,
    LeaderboardEntry,
    Activity,
} from '@/lib/social';
import { getCurrentUser } from '@/lib/auth';

export default function SocialHub() {
    const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'leaderboard' | 'activity'>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [myRank, setMyRank] = useState(0);

    const [friendEmail, setFriendEmail] = useState('');
    const [friendMessage, setFriendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [groupForm, setGroupForm] = useState({ name: '', description: '' });

    const currentUser = getCurrentUser();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setFriends(getFriends());
        setGroups(getMyGroups());
        setLeaderboard(getLeaderboard());
        setActivities(getFriendsActivity());
        setMyRank(getMyRank());
    };

    const handleSendFriendRequest = () => {
        const result = sendFriendRequest(friendEmail);
        if (result.success) {
            setFriendMessage({ type: 'success', text: 'Friend request sent!' });
            setFriendEmail('');
            loadData();
        } else {
            setFriendMessage({ type: 'error', text: result.error || 'Failed to send request' });
        }
        setTimeout(() => setFriendMessage(null), 3000);
    };

    const handleAcceptFriend = (userId: number) => {
        acceptFriendRequest(userId);
        loadData();
    };

    const handleRemoveFriend = (userId: number) => {
        if (confirm('Remove this friend?')) {
            removeFriend(userId);
            loadData();
        }
    };

    const handleCreateGroup = () => {
        if (!groupForm.name) {
            alert('Group name is required');
            return;
        }

        const result = createGroup(groupForm.name, groupForm.description);
        if (result.success) {
            setGroupForm({ name: '', description: '' });
            setShowGroupForm(false);
            loadData();
        }
    };

    const handleJoinGroup = (groupId: string) => {
        joinGroup(groupId);
        loadData();
    };

    const handleLeaveGroup = (groupId: string) => {
        if (confirm('Leave this group?')) {
            leaveGroup(groupId);
            loadData();
        }
    };

    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
    };

    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'study': return <Clock className="w-4 h-4 text-blue-500" />;
            case 'quiz': return <Award className="w-4 h-4 text-purple-500" />;
            case 'document': return <Share2 className="w-4 h-4 text-emerald-500" />;
            case 'achievement': return <Trophy className="w-4 h-4 text-amber-500" />;
            case 'streak': return <TrendingUp className="w-4 h-4 text-orange-500" />;
            default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
        }
    };

    if (!currentUser) {
        return (
            <div className="text-center py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Please log in to access social study features</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Header Banner matching ConceptMap */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
                            <Users className="w-4 h-4 animate-bounce" />
                            <span>Collaborative Learning Network</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold">Social Study Hub</h2>
                        <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
                            Connect with classmates, join study groups, share document insights, and compete on the global leaderboard.
                        </p>
                    </div>

                    {myRank > 0 && (
                        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-5 py-3 rounded-xl border border-white/30 text-white">
                            <Trophy className="w-6 h-6 text-yellow-300" />
                            <div>
                                <div className="text-2xl font-extrabold leading-none">#{myRank}</div>
                                <div className="text-[11px] font-semibold text-purple-200 mt-0.5">Your Global Rank</div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Main Content Glass Card */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-sm overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-200/60 dark:border-gray-700/60 overflow-x-auto">
                    {[
                        { key: 'friends', label: 'Friends List', icon: Users, badge: friends.filter(f => f.status === 'pending').length },
                        { key: 'groups', label: 'Study Groups', icon: MessageSquare },
                        { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                        { key: 'activity', label: 'Activity Feed', icon: TrendingUp },
                    ].map(({ key, label, icon: Icon, badge }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as any)}
                            className={`flex-1 py-3.5 px-5 text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                                activeTab === key
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                            {!!badge && (
                                <span className="bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-extrabold">
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
                        <div className="space-y-6">
                            {/* Add Friend Form */}
                            <div className="p-4 bg-purple-50/50 dark:bg-gray-900/40 rounded-xl border border-purple-100 dark:border-gray-800">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    Add Study Buddy
                                </h3>
                                {friendMessage && (
                                    <div className={`mb-3 p-2.5 rounded-lg text-xs font-semibold ${
                                        friendMessage.type === 'success'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                                            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200'
                                    }`}>
                                        {friendMessage.text}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={friendEmail}
                                        onChange={(e) => setFriendEmail(e.target.value)}
                                        placeholder="Enter friend's email address"
                                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        onClick={handleSendFriendRequest}
                                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </div>

                            {/* Pending Requests */}
                            {friends.filter(f => f.status === 'pending').length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pending Requests</h3>
                                    <div className="space-y-2">
                                        {friends.filter(f => f.status === 'pending').map((friend) => (
                                            <div key={friend.userId} className="p-3.5 bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-xs">{friend.username}</div>
                                                    <div className="text-[11px] text-gray-500">{friend.email}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAcceptFriend(friend.userId)}
                                                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFriend(friend.userId)}
                                                        className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Friends List */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                    My Friends ({friends.filter(f => f.status === 'accepted').length})
                                </h3>
                                {friends.filter(f => f.status === 'accepted').length === 0 ? (
                                    <div className="text-center py-10 bg-white/40 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">No friends added yet. Enter an email above to send a request!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {friends.filter(f => f.status === 'accepted').map((friend) => (
                                            <div key={friend.userId} className="p-3.5 bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-700/80 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                        {friend.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-xs">{friend.username}</div>
                                                        <div className="text-[10px] text-gray-400">Friends since {new Date(friend.addedAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFriend(friend.userId)}
                                                    className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Groups Tab */}
                    {activeTab === 'groups' && (
                        <div className="space-y-6">
                            <div>
                                {!showGroupForm ? (
                                    <button
                                        onClick={() => setShowGroupForm(true)}
                                        className="w-full py-3.5 border-2 border-dashed border-purple-300 dark:border-purple-800/60 rounded-xl hover:border-purple-500 bg-purple-50/30 dark:bg-gray-900/40 transition-all flex items-center justify-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create New Study Group</span>
                                    </button>
                                ) : (
                                    <div className="p-4 bg-purple-50/50 dark:bg-gray-900/40 rounded-xl border border-purple-100 dark:border-gray-800 space-y-3">
                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Create Study Group</h3>
                                        <input
                                            type="text"
                                            value={groupForm.name}
                                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                            placeholder="Group Name"
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                                        />
                                        <textarea
                                            value={groupForm.description}
                                            onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                                            placeholder="Description (optional)"
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white h-20"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleCreateGroup}
                                                className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm"
                                            >
                                                Create
                                            </button>
                                            <button
                                                onClick={() => setShowGroupForm(false)}
                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* My Groups */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">My Groups ({groups.length})</h3>
                                {groups.length === 0 ? (
                                    <div className="text-center py-8 bg-white/40 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">You're not enrolled in any study groups yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {groups.map((group) => (
                                            <div key={group.id} className="p-4 bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-700/80 rounded-xl">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs">{group.name}</h4>
                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{group.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleLeaveGroup(group.id)}
                                                        className="text-rose-600 hover:text-rose-700 text-xs font-semibold"
                                                    >
                                                        Leave
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4 text-[11px] text-gray-400 mt-2">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {group.members.length} members
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Share2 className="w-3.5 h-3.5" />
                                                        {group.documents.length} documents
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Leaderboard Tab */}
                    {activeTab === 'leaderboard' && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                Top Scholar Rankings
                            </h3>
                            {leaderboard.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-8">No leaderboard rankings available yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map((entry, index) => (
                                        <div
                                            key={entry.userId}
                                            className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                                                entry.userId === currentUser.id
                                                    ? 'bg-purple-50/80 dark:bg-purple-900/30 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                                                    : 'bg-white/80 dark:bg-gray-900/80 border-gray-200/80 dark:border-gray-700/80'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                index === 0 ? 'bg-amber-400 text-white' :
                                                index === 1 ? 'bg-gray-300 text-gray-800' :
                                                index === 2 ? 'bg-amber-600 text-white' :
                                                'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                            }`}>
                                                #{entry.rank}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-900 dark:text-white text-xs flex items-center gap-2">
                                                    <span>{entry.username}</span>
                                                    {entry.userId === currentUser.id && (
                                                        <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-extrabold">You</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {formatTime(entry.totalStudyTime)} studied • {entry.currentStreak} day streak
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400">{entry.averageScore}%</div>
                                                <div className="text-[10px] text-gray-400">Avg Score</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Activity Feed Tab */}
                    {activeTab === 'activity' && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Peer Activity</h3>
                            {activities.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-8">No recent activity recorded.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {activities.slice().reverse().map((activity) => (
                                        <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-700/80 rounded-xl">
                                            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs">
                                                    <span className="font-bold text-gray-900 dark:text-white">{activity.username}</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> {activity.description}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}