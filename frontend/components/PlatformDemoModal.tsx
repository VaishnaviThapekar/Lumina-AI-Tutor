'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Brain,
  Award,
  Zap,
  Target,
  FileText,
  MessageSquare,
  BarChart3,
  CheckCircle,
  Volume2,
  Share2,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

interface PlatformDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_STAGES = [
  {
    id: 'document-rag',
    title: 'Stage 1: Document RAG Processing',
    subtitle: 'Upload any PDF, textbook chapter, or lecture notes',
    icon: FileText,
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    description: 'Lumina parses your documents using Pinecone vector embeddings, chunking text into semantic vectors for 100% accurate, hallucination-free AI tutoring.',
    highlights: [
      'PDF & Markdown text parsing',
      'Pinecone vector store retrieval',
      'Local CPU fallback vector search',
      'Instant document context index'
    ],
    previewBg: 'bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-indigo-900/40',
    mockContent: (
      <div className="space-y-3 p-4 bg-gray-950/80 rounded-2xl border border-blue-500/30 text-left">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-400 font-mono ml-2">vector_store.py</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">PDF Processed</span>
        </div>
        <div className="space-y-2 font-mono text-xs">
          <div className="text-blue-400">📄 Internetworking_Indonesia.pdf (14 Pages)</div>
          <div className="text-gray-400">└─ Extracting 42 semantic chunks...</div>
          <div className="text-purple-300">└─ Embedding size: 1536 dims -&gt; Pinecone Namespace: doc_104</div>
          <div className="text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Ready for Socratic Voice &amp; Text Chat!</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'socratic-chat',
    title: 'Stage 2: Adaptive Socratic AI Voice & Text Tutor',
    subtitle: 'Ask questions, clarify principles, or listen to voice AI responses',
    icon: MessageSquare,
    gradient: 'from-purple-600 via-pink-600 to-rose-600',
    description: 'Rather than giving away direct answers, Lumina acts as a Socratic mentor—guiding you step-by-step, offering ELI5 explanations, and speaking responses out loud.',
    highlights: [
      'Step-by-step Socratic problem scaffolding',
      'Text-to-speech voice AI synthesis with visualizer',
      'ELI5 & real-world example quick prompts',
      'Multi-session chat history auto-saved'
    ],
    previewBg: 'bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-rose-900/40',
    mockContent: (
      <div className="space-y-3 p-4 bg-gray-950/80 rounded-2xl border border-purple-500/30 text-left">
        <div className="flex items-center justify-between text-xs text-purple-300 font-semibold border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-pink-400 animate-pulse" />
            <span>Voice AI Active</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-purple-400 animate-bounce" />
            <div className="w-1 h-4 bg-pink-400 animate-bounce delay-100" />
            <div className="w-1 h-2 bg-indigo-400 animate-bounce delay-200" />
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-purple-600/30 text-purple-100 p-2.5 rounded-xl border border-purple-500/30">
            <strong className="text-purple-300">You:</strong> "Can you explain BGP routing in simple terms?"
          </div>
          <div className="bg-gray-900 text-gray-200 p-2.5 rounded-xl border border-gray-800">
            <strong className="text-pink-400">Lumina AI:</strong> "Think of BGP like postal services between different countries. Instead of sending mail directly, your router passes data to neighboring Autonomous Systems..."
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'concept-map',
    title: 'Stage 3: Interactive Concept Map Visualizer',
    subtitle: 'Transform documents into dynamic topic dependency graphs',
    icon: Layers,
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    description: 'Visualize complex topic relationships with automatically generated Mermaid graphs. Instantly see how foundational principles lead to advanced topics.',
    highlights: [
      'Auto-generated topic dependency nodes',
      'Color-coded difficulty clusters',
      'Interactive zoom, filter & search',
      'Direct navigation to Quizzes & Flashcards'
    ],
    previewBg: 'bg-gradient-to-br from-amber-900/40 via-orange-900/40 to-rose-900/40',
    mockContent: (
      <div className="p-4 bg-gray-950/80 rounded-2xl border border-amber-500/30 text-center space-y-3">
        <div className="text-xs font-bold text-amber-300">Mermaid Dependency Graph</div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/40">OSI Layer Model</span>
          <span className="text-gray-500">➔</span>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/40">TCP/IP Protocol</span>
          <span className="text-gray-500">➔</span>
          <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-lg border border-pink-500/40">BGP Routing</span>
        </div>
        <p className="text-[11px] text-gray-400">Click any topic node to generate targeted practice questions!</p>
      </div>
    )
  },
  {
    id: 'quiz-mastery',
    title: 'Stage 4: Adaptive Quizzes & Competency Scoring',
    subtitle: 'Test your understanding with Bloom\'s taxonomy questions',
    icon: Target,
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    description: 'Dynamic multiple-choice quizzes adjust difficulty based on your competency score. Receive detailed answer rationale and real-time score updates.',
    highlights: [
      'Easy, Medium & Hard question generation',
      'Bloom\'s Taxonomy cognitive testing',
      'Instant rationale & explanations',
      'Competency score tracking in sidebar'
    ],
    previewBg: 'bg-gradient-to-br from-emerald-900/40 via-teal-900/40 to-cyan-900/40',
    mockContent: (
      <div className="space-y-3 p-4 bg-gray-950/80 rounded-2xl border border-emerald-500/30 text-left">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-400">Question 3 of 5</span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold">Medium Difficulty</span>
        </div>
        <p className="text-xs text-gray-200 font-medium">Which protocol operates at the Transport Layer of the OSI Model?</p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 bg-emerald-500/20 border border-emerald-500 text-emerald-200 rounded-lg font-bold flex items-center justify-between">
            <span>✓ TCP / UDP</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="p-2 bg-gray-900 border border-gray-800 text-gray-400 rounded-lg">HTTP / HTTPS</div>
        </div>
      </div>
    )
  },
  {
    id: 'flashcards-anki',
    title: 'Stage 5: Smart Flashcards & Anki Export',
    subtitle: 'SM-2 spaced repetition with 1-click Anki CSV export',
    icon: Brain,
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    description: 'Master terminology using AI-generated flashcard decks. Study with spaced repetition intervals and export decks straight to Anki with one click.',
    highlights: [
      'Auto-generated key term flashcard decks',
      'SM-2 spaced repetition rating (Again/Hard/Good/Easy)',
      '1-Click Anki CSV export utility',
      'Custom deck creation & filtering'
    ],
    previewBg: 'bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40',
    mockContent: (
      <div className="p-4 bg-gray-950/80 rounded-2xl border border-indigo-500/30 space-y-3 text-center">
        <div className="text-xs font-bold text-indigo-300">3D Flip Flashcard</div>
        <div className="p-4 bg-gradient-to-br from-purple-900/60 to-indigo-900/60 rounded-xl border border-purple-500/30 text-xs font-bold text-white shadow-inner">
          "What is the function of the Subnet Mask?"
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px]">
          <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg font-bold border border-purple-500/30">📥 Export to Anki (.CSV)</span>
        </div>
      </div>
    )
  },
  {
    id: 'analytics-rewards',
    title: 'Stage 6: Real-Time Analytics & Gamification Rewards',
    subtitle: 'Earn XP, unlock achievements, and track focus velocity',
    icon: Award,
    gradient: 'from-yellow-500 via-amber-600 to-orange-600',
    description: 'Stay motivated with continuous XP rewards, daily streaks, level progression, and comprehensive study statistics that update live as you learn.',
    highlights: [
      'Real-time interlinked XP & streak awards',
      'Weekly study time breakdown & goal pace',
      'Social Study Hub & global user leaderboards',
      'Achievements: First Steps, Quiz Master, Scholar'
    ],
    previewBg: 'bg-gradient-to-br from-yellow-900/40 via-amber-900/40 to-orange-900/40',
    mockContent: (
      <div className="space-y-3 p-4 bg-gray-950/80 rounded-2xl border border-amber-500/30 text-left">
        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
          <span>Level 3 Scholar</span>
          <span>1,450 XP 🔥 7-Day Streak</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 w-[65%]" />
        </div>
        <div className="flex items-center justify-around text-center text-[10px] pt-1">
          <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30">🏆 Quiz Master</div>
          <div className="p-1.5 bg-purple-500/10 rounded-lg border border-purple-500/30">📚 Speed Reader</div>
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30">⚡ 100% Retained</div>
        </div>
      </div>
    )
  }
];

export default function PlatformDemoModal({ isOpen, onClose }: PlatformDemoModalProps) {
  const router = useRouter();
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance showcase slides every 5 seconds if playing
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const timer = setInterval(() => {
      setActiveStageIndex(prev => (prev + 1) % DEMO_STAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const currentStage = DEMO_STAGES[activeStageIndex];
  const IconComponent = currentStage.icon;

  const handleLaunchLiveDemo = () => {
    onClose();
    router.push('/dashboard');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-gray-900 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Bar */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-5 flex items-center justify-between flex-shrink-0">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">Lumina AI Tutor — Interactive Platform Overview</h2>
              <p className="text-purple-100/80 text-xs">Explore all 6 core stages of your adaptive learning companion</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            aria-label="Close demo overview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Stage Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto p-3 bg-gray-950/80 border-b border-gray-800 flex-shrink-0 scrollbar-none">
          {DEMO_STAGES.map((stage, idx) => {
            const StageIcon = stage.icon;
            const isActive = activeStageIndex === idx;
            return (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStageIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md scale-105'
                    : 'bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50'
                }`}
              >
                <StageIcon className="w-3.5 h-3.5" />
                <span>{stage.title.split(':')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Stage Banner Card */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${currentStage.gradient} p-6 shadow-xl`}>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold text-white mb-2">
                  {currentStage.title}
                </span>
                <h3 className="text-xl md:text-2xl font-extrabold">{currentStage.subtitle}</h3>
                <p className="text-white/90 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
                  {currentStage.description}
                </p>
              </div>

              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <IconComponent className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Interactive Mock Preview & Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Mock Content Preview */}
            <div className={`p-4 rounded-2xl ${currentStage.previewBg} border border-white/10 shadow-inner`}>
              <div className="text-xs font-bold text-purple-200 mb-2 flex items-center justify-between">
                <span>LIVE UI FEATURE SIMULATION</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              {currentStage.mockContent}
            </div>

            {/* Right: Key Feature Highlights */}
            <div className="space-y-3 text-left">
              <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Key Capability Highlights:</h4>
              <div className="space-y-2">
                {currentStage.highlights.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-gray-200 bg-gray-800/60 p-2.5 rounded-xl border border-gray-700/50">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Control & Live Action Bar */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
          {/* Slideshow Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-purple-300 rounded-xl transition-all border border-gray-700"
              title={isPlaying ? 'Pause auto-tour' : 'Play auto-tour'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setActiveStageIndex(prev => (prev - 1 + DEMO_STAGES.length) % DEMO_STAGES.length);
                  setIsPlaying(false);
                }}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all border border-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-gray-400 px-2">
                {activeStageIndex + 1} / {DEMO_STAGES.length}
              </span>

              <button
                onClick={() => {
                  setActiveStageIndex(prev => (prev + 1) % DEMO_STAGES.length);
                  setIsPlaying(false);
                }}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all border border-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              Close Preview
            </button>

            <button
              onClick={handleLaunchLiveDemo}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white rounded-xl font-extrabold text-xs shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>🚀 Launch Live Demo Mode</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
