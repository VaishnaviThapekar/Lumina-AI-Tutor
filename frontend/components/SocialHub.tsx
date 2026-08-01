'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trophy, Share2, MessageSquare, TrendingUp, Clock, Award, Plus, Check, X } from 'lucide-react';
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

    // Friend request form
    const [friendEmail, setFriendEmail] = useState('');
    const [friendMessage, setFriendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Group creation form
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
            case 'study': return <Clock className="w-4 h-4 text-blue-600" />;
            case 'quiz': return <Award className="w-4 h-4 text-purple-600" />;
            case 'document': return <Share2 className="w-4 h-4 text-green-600" />;
            case 'achievement': return <Trophy className="w-4 h-4 text-yellow-600" />;
            case 'streak': return <TrendingUp className="w-4 h-4 text-orange-600" />;
            default: return <MessageSquare className="w-4 h-4 text-gray-600" />;
        }
    };

    if (!currentUser) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Please log in to access social features</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with My Rank */}
            <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Social Hub</h2>
                        <p className="opacity-90">Connect with fellow learners</p>
                    </div>
                    {myRank > 0 && (
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-1">#{myRank}</div>
                            <div className="text-sm opacity-90">Your Rank</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-lg">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors min-w-[120px] ${activeTab === 'friends'
                            ? 'text-primary-600 border-b-2 border-primary-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="hidden sm:inline">Friends</span>
                        {friends.filter(f => f.status === 'pending').length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {friends.filter(f => f.status === 'pending').length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors min-w-[120px] ${activeTab === 'groups'
                            ? 'text-primary-600 border-b-2 border-primary-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden sm:inline">Groups</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors min-w-[120px] ${activeTab === 'leaderboard'
                            ? 'text-primary-600 border-b-2 border-primary-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Trophy className="w-5 h-5" />
                        <span className="hidden sm:inline">Leaderboard</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors min-w-[120px] ${activeTab === 'activity'
                            ? 'text-primary-600 border-b-2 border-primary-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span className="hidden sm:inline">Activity</span>
                    </button>
                </div>

                <div className="p-6">
                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
                        <div className="space-y-6">
                            {/* Add Friend */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-primary-600" />
                                    Add Friend
                                </h3>
                                {friendMessage && (
                                    <div className={`mb-3 p-2 rounded text-sm ${friendMessage.type === 'success'
                                        ? 'bg-green-50 text-green-800'
                                        : 'bg-red-50 text-red-800'
                                        }`}>
                                        {friendMessage.text}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={friendEmail}
                                        onChange={(e) => setFriendEmail(e.target.value)}
                                        placeholder="Enter friend's email"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={handleSendFriendRequest}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </div>

                            {/* Pending Requests */}
                            {friends.filter(f => f.status === 'pending').length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3">Pending Requests</h3>
                                    <div className="space-y-2">
                                        {friends.filter(f => f.status === 'pending').map((friend) => (
                                            <div key={friend.userId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-800">{friend.username}</div>
                                                    <div className="text-sm text-gray-600">{friend.email}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAcceptFriend(friend.userId)}
                                                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFriend(friend.userId)}
                                                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
                                <h3 className="font-semibold text-gray-800 mb-3">
                                    My Friends ({friends.filter(f => f.status === 'accepted').length})
                                </h3>
                                {friends.filter(f => f.status === 'accepted').length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No friends yet. Add some above!</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {friends.filter(f => f.status === 'accepted').map((friend) => (
                                            <div key={friend.userId} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {friend.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800">{friend.username}</div>
                                                        <div className="text-xs text-gray-500">Friends since {new Date(friend.addedAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFriend(friend.userId)}
                                                    className="text-red-600 hover:text-red-700"
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
                            {/* Create Group */}
                            <div>
                                {!showGroupForm ? (
                                    <button
                                        onClick={() => setShowGroupForm(true)}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-primary-600"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create New Study Group
                                    </button>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">Create Study Group</h3>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={groupForm.name}
                                                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                                placeholder="Group Name"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                            <textarea
                                                value={groupForm.description}
                                                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                                                placeholder="Description (optional)"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg h-20"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleCreateGroup}
                                                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                                >
                                                    Create
                                                </button>
                                                <button
                                                    onClick={() => setShowGroupForm(false)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* My Groups */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3">My Groups ({groups.length})</h3>
                                {groups.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">You're not in any groups yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {groups.map((group) => (
                                            <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800">{group.name}</h4>
                                                        <p className="text-sm text-gray-600">{group.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleLeaveGroup(group.id)}
                                                        className="text-red-600 hover:text-red-700 text-sm"
                                                    >
                                                        Leave
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {group.members.length} members
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Share2 className="w-4 h-4" />
                                                        {group.documents.length} documents
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Discover Groups */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3">Discover Groups</h3>
                                {getAllGroups().filter(g => !g.members.includes(currentUser.id)).length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No groups available to join</p>
                                ) : (
                                    <div className="space-y-3">
                                        {getAllGroups().filter(g => !g.members.includes(currentUser.id)).map((group) => (
                                            <div key={group.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{group.name}</h4>
                                                    <p className="text-sm text-gray-600">{group.description}</p>
                                                    <div className="text-xs text-gray-500 mt-1">{group.members.length} members</div>
                                                </div>
                                                <button
                                                    onClick={() => handleJoinGroup(group.id)}
                                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                                >
                                                    Join
                                                </button>
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
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Top Learners
                            </h3>
                            {leaderboard.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No data yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map((entry, index) => (
                                        <div
                                            key={entry.userId}
                                            className={`flex items-center gap-4 p-4 rounded-lg ${entry.userId === currentUser.id
                                                ? 'bg-primary-50 border-2 border-primary-500'
                                                : 'bg-white border border-gray-200'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-400 text-white' :
                                                index === 1 ? 'bg-gray-300 text-white' :
                                                    index === 2 ? 'bg-orange-400 text-white' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                #{entry.rank}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800">
                                                    {entry.username}
                                                    {entry.userId === currentUser.id && (
                                                        <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-1 rounded">You</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {formatTime(entry.totalStudyTime)} studied • {entry.currentStreak} day streak
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-primary-600">{entry.averageScore}%</div>
                                                <div className="text-xs text-gray-500">Avg Score</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
                            {activities.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No activity yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {activities.slice().reverse().map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="mt-1">{getActivityIcon(activity.type)}</div>
                                            <div className="flex-1">
                                                <div className="text-sm">
                                                    <span className="font-semibold text-gray-800">{activity.username}</span>
                                                    <span className="text-gray-600"> {activity.description}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
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