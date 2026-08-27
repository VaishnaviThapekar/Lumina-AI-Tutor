
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { BookOpen, MessageSquare, ClipboardCheck, Settings, Menu, X, Trash2, BarChart3, Clock, FileText, Download, Users, User, TrendingUp, Brain, Trophy, Calendar, Home, Network } from 'lucide-react';
import ChatWindow from '@/components/ChatWindow';
import ChatInterface from '@/components/ChatInterface';
import MasteryProgress from '@/components/MasteryProgress';
import QuizModule from '@/components/QuizModule';
import UploadArea from '@/components/UploadArea';
import SettingsModal from '@/components/SettingsModal';
import StudyStatistics from '@/components/StudyStatistics';
import PomodoroTimer from '@/components/PomodoroTimer';
import NoteTakingSystem from '@/components/NoteTakingSystem';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import ExportMenu from '@/components/ExportMenu';
import SocialHub from '@/components/SocialHub';
import UserProfile from '@/components/UserProfile';
import FlashcardSystem from '@/components/FlashcardSystem';
import ThemeToggle from '@/components/ThemeToggle';
import GamificationDashboard from '@/components/GamificationDashboard';
import VoiceControls from '@/components/VoiceControls';
import AIStudyPlanner from '@/components/AIStudyPlanner';
import ConceptMap from '@/components/ConceptMap';
import { createSession, listDocuments, deleteDocument } from '@/lib/api';
import type { Session, Document, UploadResponse } from '@/lib/types';
import { getCurrentUser, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'upload' | 'stats' | 'timer' | 'notes' | 'analytics' | 'social' | 'flashcards' | 'gamification' | 'planner' | 'concept-map'>('upload');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [previousScore, setPreviousScore] = useState<number | undefined>();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);

    // Auth-sync waiting state — shown while we're waiting for a slow/cold
    // backend to confirm an OAuth sign-in (see the polling effect below).
    const [authSyncing, setAuthSyncing] = useState(false);
    const [authSyncFailed, setAuthSyncFailed] = useState(false);

    // XP System state
    const [showXPToast, setShowXPToast] = useState(false);
    const [xpMessage, setXPMessage] = useState('');
    const [xpAmount, setXPAmount] = useState(0);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Just now';
        try {
            let date: Date;
            if (/^\d+$/.test(dateString)) {
                date = new Date(parseInt(dateString));
            } else {
                date = new Date(dateString);
            }
            if (isNaN(date.getTime())) {
                console.log('Invalid date:', dateString);
                return 'Just now';
            }
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} min ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        } catch (error) {
            console.log('Date parsing error:', error, dateString);
            return 'Just now';
        }
    };

    const { data: session, status: sessionStatus } = useSession();

    const initUserSession = useCallback((user: any) => {
        let displayUser = { ...user };
        if (session?.user?.name) {
            displayUser.username = session.user.name;
        }
        if (session?.user?.email) {
            displayUser.email = session.user.email;
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem('lumina_user', JSON.stringify(displayUser));
        }
        setCurrentUser(displayUser);
        setAuthSyncing(false);
        setAuthSyncFailed(false);
        try {
            const lastLogin = localStorage.getItem(`last_login_${user.id}`);
            const today = new Date().toDateString();
            if (lastLogin !== today) {
                localStorage.setItem(`last_login_${user.id}`, today);
                showXPNotification(20, 'Daily login bonus!');
            }
        } catch (error) {
            console.log('XP system initialization:', error);
        }
    }, [session]);

    useEffect(() => {
        setIsClient(true);

        const user = getCurrentUser();
        if (user) {
            initUserSession(user);
            if (sessionStatus !== 'authenticated') {
                return;
            }
        }

        if (sessionStatus === 'loading') {
            return;
        }

        if (sessionStatus === 'authenticated') {
            setAuthSyncing(true);
            setAuthSyncFailed(false);

            const pollIntervalMs = 1000;
            const maxWaitMs = 75000;
            let elapsed = 0;

            const interval = setInterval(() => {
                const syncedUser = getCurrentUser();
                if (syncedUser) {
                    clearInterval(interval);
                    initUserSession(syncedUser);
                    return;
                }
                elapsed += pollIntervalMs;
                if (elapsed >= maxWaitMs) {
                    clearInterval(interval);
                    setAuthSyncing(false);
                    setAuthSyncFailed(true);
                }
            }, pollIntervalMs);

            return () => clearInterval(interval);
        }

        if (!user) {
            router.push('/login');
        }
    }, [router, sessionStatus, session, initUserSession]);

    const [documentsLoading, setDocumentsLoading] = useState(true);
    const [documentsError, setDocumentsError] = useState(false);

    const loadDocuments = useCallback(async () => {
        setDocumentsLoading(true);
        setDocumentsError(false);
        try {
            const response = await listDocuments();
            setDocuments(response.documents);
        } catch (error) {
            console.error('Error loading documents:', error);
            setDocumentsError(true);
        } finally {
            setDocumentsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const showXPNotification = (xp: number, message: string) => {
        setXPAmount(xp);
        setXPMessage(message);
        setShowXPToast(true);
        setTimeout(() => {
            setShowXPToast(false);
        }, 3000);
    };

    const handleUploadSuccess = async (uploadResponse: UploadResponse) => {
        await loadDocuments();
        showXPNotification(75, 'Document uploaded!');
        try {
            const session = await createSession(uploadResponse.id);
            setCurrentSession(session);
            setActiveTab('chat');
        } catch (error) {
            console.error('Error creating session:', error);
        }
    };

    const handleDocumentSelect = async (document: Document) => {
        try {
            const session = await createSession(document.id);
            setCurrentSession(session);
            setActiveTab('chat');
        } catch (error) {
            console.error('Error creating session:', error);
        }
    };

    const handleCompetencyUpdate = (newScore: number) => {
        if (currentSession) {
            setPreviousScore(currentSession.competency_score);
            setCurrentSession({
                ...currentSession,
                competency_score: newScore
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        setDeletingId(id);
        try {
            await deleteDocument(id);
            await loadDocuments();
            if (currentSession?.document_id === id) {
                setCurrentSession(null);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document');
        } finally {
            setDeletingId(null);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleRetrySync = () => {
        setAuthSyncFailed(false);
        window.location.reload();
    };

    if (!isClient) {
        return null;
    }

    if (authSyncing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Signing you in...</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                        The server may take up to a minute to wake up if it's been idle. Hang tight.
                    </p>
                </div>
            </div>
        );
    }

    if (authSyncFailed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center max-w-sm mx-auto">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Sign-in is taking longer than expected</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This can happen if the server was asleep. Try again — it should be awake now.
                    </p>
                    <button
                        onClick={handleRetrySync}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
                <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl top-1/3 -right-32 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -bottom-48 left-1/3 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {showXPToast && (
                <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px]">
                        <div className="text-2xl">✨</div>
                        <div className="flex-1">
                            <div className="font-bold text-lg">+{xpAmount} XP</div>
                            <div className="text-sm opacity-90">{xpMessage}</div>
                        </div>
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>
            )}

            <div className="relative">
                <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-b border-white/40 dark:border-gray-700/40 shadow-lg">
                    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
                                >
                                    <Menu className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                    title="Go to Home"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Lumina AI Tutor
                                    </h1>
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push('/')}
                                    className="hidden sm:flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Go to Home"
                                >
                                    <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Home</span>
                                </button>
                                <ThemeToggle />
                                <button
                                    onClick={() => setExportMenuOpen(true)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Export Data"
                                >
                                    <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </button>
                                <button
                                    onClick={() => setSettingsOpen(true)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </button>
                                {(currentUser || session?.user) && (
                                    <button
                                        onClick={() => setProfileOpen(true)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                                    >
                                        <User className="w-5 h-5" />
                                        <span className="font-medium hidden sm:inline">
                                            {session?.user?.name || currentUser?.username || session?.user?.email || currentUser?.email || 'User'}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex max-w-[1800px] mx-auto">
                    <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } fixed lg:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-white/40 dark:border-gray-700/40 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto rounded-3xl m-4 shadow-2xl`}>
                        <div className="p-4">
                            <div className="mb-6">
                                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                                    Your Documents
                                </h2>
                                <div className="space-y-2">
                                    {documentsLoading ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                                            Loading your documents... (the server may take up to a minute to wake up if it's been idle)
                                        </p>
                                    ) : documentsError ? (
                                        <div className="px-3 py-2">
                                            <p className="text-sm text-red-500 mb-2">Couldn't load documents.</p>
                                            <button
                                                onClick={() => loadDocuments()}
                                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    ) : documents.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No documents yet</p>
                                    ) : (
                                        documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${currentSession?.document_id === doc.id
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                onClick={() => handleDocumentSelect(doc)}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                                                    <p className={`text-xs truncate ${currentSession?.document_id === doc.id
                                                        ? 'text-blue-100'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                        {formatDate(doc.uploaded_at)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(doc.id);
                                                    }}
                                                    disabled={deletingId === doc.id}
                                                    className={`ml-2 p-1 rounded-lg transition-colors ${currentSession?.document_id === doc.id
                                                        ? 'hover:bg-white/20 text-white'
                                                        : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                                        } ${deletingId === doc.id ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {currentSession && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <MasteryProgress
                                        currentScore={currentSession.competency_score}
                                        previousScore={previousScore}
                                    />
                                </div>
                            )}
                        </div>
                    </aside>

                    <main className="flex-1 p-4 lg:p-6">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 overflow-hidden">
                            <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                                <div className="flex min-w-max px-6">
                                    <button
                                        onClick={() => setActiveTab('upload')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'upload'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                            <FileText className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Upload</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('chat')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'chat'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                            <MessageSquare className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Learn</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('quiz')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'quiz'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <ClipboardCheck className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Quiz</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('stats')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'stats'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                            <BarChart3 className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Stats</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('analytics')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'analytics'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Analytics</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('timer')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'timer'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                                            <Clock className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Timer</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('notes')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'notes'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                            <FileText className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Notes</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('social')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'social'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                            <Users className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Social</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('flashcards')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'flashcards'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                                            <Brain className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Flashcards</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('gamification')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'gamification'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                                            <Trophy className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Rewards</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('planner')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'planner'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Planner</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('concept-map')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'concept-map'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                            <Network className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Concept Map</span>
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-[600px] p-6">
                                {activeTab === 'upload' && (
                                    <UploadArea onUploadSuccess={handleUploadSuccess} />
                                )}

                                {activeTab === 'chat' && (
                                    <div className="space-y-6">
                                        {currentSession ? (
                                            <ChatInterface sessionId={currentSession.id} />
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <BookOpen className="w-10 h-10 text-white" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                                                    No Document Selected
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                                    Please upload and select a document to start learning
                                                </p>
                                                <button
                                                    onClick={() => setActiveTab('upload')}
                                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                                                >
                                                    Upload Document
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'quiz' && currentSession && (
                                    <QuizModule
                                        sessionId={currentSession.id}
                                        documentId={currentSession.document_id}
                                        competencyScore={currentSession.competency_score}
                                        onCompetencyUpdate={(newScore: number) => {
                                            setCurrentSession({ ...currentSession, competency_score: newScore });
                                        }}
                                        onClose={() => setActiveTab('chat')}
                                    />
                                )}

                                {activeTab === 'stats' && (
                                    <StudyStatistics />
                                )}

                                {activeTab === 'analytics' && (
                                    <AdvancedAnalytics />
                                )}

                                {activeTab === 'timer' && (
                                    <PomodoroTimer />
                                )}

                                {activeTab === 'notes' && (
                                    <NoteTakingSystem />
                                )}

                                {activeTab === 'social' && (
                                    <SocialHub />
                                )}

                                {activeTab === 'flashcards' && (
                                    <FlashcardSystem />
                                )}

                                {activeTab === 'gamification' && (
                                    <GamificationDashboard />
                                )}

                                {activeTab === 'planner' && (
                                    <AIStudyPlanner />
                                )}

                                {activeTab === 'concept-map' && (
                                    <ConceptMap
                                        documentId={currentSession?.document_id}
                                        documentTitle={currentSession ? `Document #${currentSession.document_id}` : undefined}
                                        onNavigateToQuiz={() => setActiveTab('quiz')}
                                        onNavigateToFlashcards={() => setActiveTab('flashcards')}
                                    />
                                )}
                            </div>
                        </div>
                    </main>
                </div>

            </div>

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />

            <ExportMenu
                isOpen={exportMenuOpen}
                onClose={() => setExportMenuOpen(false)}
            />

            {profileOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">User Profile</h2>
                            <button
                                onClick={() => setProfileOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <UserProfile />
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
