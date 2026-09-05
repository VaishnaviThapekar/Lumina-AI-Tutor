
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
import AIAudioPodcast from '@/components/AIAudioPodcast';
import MultiDocWorkspace from '@/components/MultiDocWorkspace';
import EssayEvaluator from '@/components/EssayEvaluator';
import SpeedStudySprint from '@/components/SpeedStudySprint';
import YouTubeRecommendations from '@/components/YouTubeRecommendations';
import { Headphones, PenTool, Layers, Zap, Youtube } from 'lucide-react';
import { createSession, listDocuments, deleteDocument } from '@/lib/api';
import type { Session, Document, UploadResponse } from '@/lib/types';
import { getCurrentUser, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'upload' | 'stats' | 'timer' | 'notes' | 'analytics' | 'social' | 'flashcards' | 'gamification' | 'planner' | 'concept-map' | 'podcast' | 'multidoc' | 'evaluator' | 'sprint' | 'videos'>('upload');
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
            let str = String(dateString).trim();
            if (str.includes('T') && !str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
                str += 'Z';
            }
            let date: Date;
            if (/^\d+$/.test(str)) {
                date = new Date(parseInt(str));
            } else {
                date = new Date(str);
            }
            if (isNaN(date.getTime())) {
                return 'Just now';
            }
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            if (diffMs < 60000) return 'Just now';
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 60) return `${diffMins} min ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        } catch (error) {
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

                <div className="flex max-w-[1800px] mx-auto relative">
                    {/* Mobile Backdrop Overlay */}
                    {sidebarOpen && (
                        <div
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
                        />
                    )}

                    <aside
                        className={`${
                            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                        } fixed lg:sticky top-16 lg:top-16 left-0 z-30 w-72 sm:w-80 min-w-[280px] flex-shrink-0 h-[calc(100vh-4.5rem)] bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 transition-all duration-300 ease-in-out overflow-y-auto rounded-3xl m-2 sm:m-4 shadow-2xl`}
                    >
                        <div className="p-4 space-y-4">
                            <div>
                                <div className="flex items-center justify-between px-3 mb-3">
                                    <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        Your Documents
                                    </h2>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                                        {documents.length}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {documentsLoading ? (
                                        <div className="px-3 py-4 space-y-2 bg-purple-50/50 dark:bg-gray-900/40 rounded-xl border border-purple-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2 text-xs font-medium text-purple-700 dark:text-purple-300">
                                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                                <span>Loading your documents...</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                                                The server may take a moment to wake up if idle.
                                            </p>
                                        </div>
                                    ) : documentsError ? (
                                        <div className="px-3 py-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                                            <p className="text-xs text-rose-600 dark:text-rose-400 mb-2 font-medium">Couldn't load documents.</p>
                                            <button
                                                onClick={() => loadDocuments()}
                                                className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-rose-700 transition-colors shadow-sm"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    ) : documents.length === 0 ? (
                                        <div className="px-3 py-4 text-center bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No documents uploaded yet</p>
                                            <p className="text-[11px] text-gray-400 mt-1">Upload a PDF or select a Quick-Start sample to begin.</p>
                                        </div>
                                    ) : (
                                        documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer hover-lift animate-pop-in transition-all duration-300 ${
                                                    currentSession?.document_id === doc.id
                                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-[1.02]'
                                                        : 'bg-white/60 dark:bg-gray-900/40 hover:bg-purple-50 dark:hover:bg-gray-700/60 border border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-300'
                                                }`}
                                                onClick={() => handleDocumentSelect(doc)}
                                            >
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <p className="text-xs font-semibold truncate leading-snug">{doc.filename}</p>
                                                    <p
                                                        className={`text-[10px] mt-0.5 ${
                                                            currentSession?.document_id === doc.id
                                                                ? 'text-purple-200'
                                                                : 'text-gray-400 dark:text-gray-500'
                                                        }`}
                                                    >
                                                        {formatDate(doc.uploaded_at)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(doc.id);
                                                    }}
                                                    disabled={deletingId === doc.id}
                                                    className={`p-1.5 rounded-lg transition-all ${
                                                        currentSession?.document_id === doc.id
                                                            ? 'hover:bg-white/20 text-white'
                                                            : 'hover:bg-rose-100 dark:hover:bg-rose-900/40 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400'
                                                    } ${deletingId === doc.id ? 'opacity-50' : 'opacity-80 group-hover:opacity-100'}`}
                                                    title="Delete document"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {currentSession && (
                                <div className="border-t border-gray-200/80 dark:border-gray-700/80 pt-4">
                                    <MasteryProgress
                                        currentScore={currentSession.competency_score}
                                        previousScore={previousScore}
                                    />
                                </div>
                            )}
                        </div>
                    </aside>

                    <main className="flex-1 min-w-0 p-2 sm:p-4 lg:p-6">
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

                                    <button
                                        onClick={() => setActiveTab('podcast')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'podcast'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                                            <Headphones className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Podcast</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('multidoc')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'multidoc'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                            <Layers className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Multi-Doc</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('evaluator')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'evaluator'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                                            <PenTool className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Essay Evaluator</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('sprint')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'sprint'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                                            <Zap className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Speed Sprint</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('videos')}
                                        className={`flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'videos'
                                            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                                            <Youtube className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">Videos</span>
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-[600px] p-6">
                                <div className={activeTab === 'upload' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <UploadArea onUploadSuccess={handleUploadSuccess} />
                                </div>

                                <div className={activeTab === 'chat' ? 'block animate-fade-in-slide-up' : 'hidden'}>
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
                                </div>

                                <div className={activeTab === 'quiz' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    {currentSession ? (
                                        <QuizModule
                                            sessionId={currentSession.id}
                                            documentId={currentSession.document_id}
                                            competencyScore={currentSession.competency_score}
                                            onCompetencyUpdate={(newScore: number) => {
                                                setCurrentSession({ ...currentSession, competency_score: newScore });
                                            }}
                                            onClose={() => setActiveTab('chat')}
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-gray-600 dark:text-gray-400">Please select a document from the left sidebar to generate a quiz.</p>
                                        </div>
                                    )}
                                </div>

                                <div className={activeTab === 'stats' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <StudyStatistics />
                                </div>

                                <div className={activeTab === 'analytics' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <AdvancedAnalytics />
                                </div>

                                <div className={activeTab === 'timer' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <PomodoroTimer />
                                </div>

                                <div className={activeTab === 'notes' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <NoteTakingSystem />
                                </div>

                                <div className={activeTab === 'social' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <SocialHub />
                                </div>

                                <div className={activeTab === 'flashcards' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <FlashcardSystem />
                                </div>

                                <div className={activeTab === 'gamification' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <GamificationDashboard />
                                </div>

                                <div className={activeTab === 'planner' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <AIStudyPlanner />
                                </div>

                                <div className={activeTab === 'concept-map' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <ConceptMap
                                        documentId={currentSession?.document_id}
                                        documentTitle={currentSession ? `Document #${currentSession.document_id}` : undefined}
                                        onNavigateToQuiz={() => setActiveTab('quiz')}
                                        onNavigateToFlashcards={() => setActiveTab('flashcards')}
                                        onNavigateToVideos={() => setActiveTab('videos')}
                                    />
                                </div>

                                <div className={activeTab === 'podcast' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <AIAudioPodcast
                                        documentId={currentSession?.document_id}
                                        documentTitle={documents.find(d => d.id === currentSession?.document_id)?.filename}
                                    />
                                </div>

                                <div className={activeTab === 'multidoc' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <MultiDocWorkspace onNavigateToChat={() => setActiveTab('chat')} />
                                </div>

                                <div className={activeTab === 'evaluator' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <EssayEvaluator
                                        documentTitle={documents.find(d => d.id === currentSession?.document_id)?.filename}
                                    />
                                </div>

                                <div className={activeTab === 'sprint' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <SpeedStudySprint />
                                </div>

                                <div className={activeTab === 'videos' ? 'block animate-fade-in-slide-up' : 'hidden'}>
                                    <YouTubeRecommendations
                                        documentTitle={documents.find(d => d.id === currentSession?.document_id)?.filename}
                                    />
                                </div>
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
