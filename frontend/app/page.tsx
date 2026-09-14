'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Sparkles,
  Brain,
  Zap,
  Target,
  TrendingUp,
  Users,
  Award,
  ChevronRight,
  Play,
  Moon,
  Sun,
  X,
  CheckCircle,
  HelpCircle,
  Star,
  Layers,
  ArrowRight,
  MessageSquare,
  Volume2,
  Download,
  ShieldCheck,
  Cpu,
  ChevronDown
} from 'lucide-react';
import PlatformDemoModal from '@/components/PlatformDemoModal';

const SAMPLE_PROMPTS = [
  {
    q: 'Explain BGP Routing in ELI5 mode 🌐',
    a: 'Think of BGP like mail handling between different countries! Instead of sending letters directly, each country’s postal hub agrees on the fastest route across different autonomous networks to ensure data arrives safely.'
  },
  {
    q: 'What is Quantum Entanglement? ⚛️',
    a: 'Imagine two magic dice separated by light years! When you roll one die and get a 6, the other instantly shows a 6, no matter how far apart they are. Einstein called this "spooky action at a distance".'
  },
  {
    q: 'Summarize Newton\'s Three Laws 🍎',
    a: '1. Objects stay put unless pushed (Inertia). 2. Harder pushes make things move faster (F = ma). 3. Every action has an equal and opposite reaction (Recoil).'
  }
];

const FAQS = [
  {
    q: 'How does Lumina AI Tutor analyze my uploaded documents?',
    a: 'Lumina uses Retrieval-Augmented Generation (RAG) powered by Pinecone vector embeddings. Your document text is split into semantic chunks, vectorized, and queried in real-time so AI answers are 100% accurate and grounded in your source material.'
  },
  {
    q: 'Can I listen to AI responses via Voice AI?',
    a: 'Yes! Lumina features built-in Web Speech voice AI synthesis and voice recognition. You can ask questions out loud using your microphone and hear Socratic explanations synthesized in natural voice.'
  },
  {
    q: 'How does the Concept Map generator work?',
    a: 'Lumina analyzes document structure to automatically generate Mermaid topic dependency graphs. It maps out how foundational principles lead to advanced topics with color-coded difficulty nodes.'
  },
  {
    q: 'Can I export flashcards to Anki?',
    a: 'Absolutely! Lumina includes a 1-click Anki CSV Export tool so you can import your SM-2 spaced repetition flashcards straight into your Anki desktop or mobile app.'
  },
  {
    q: 'Does Lumina work locally without cloud dependency?',
    a: 'Yes! Lumina is equipped with an automated local vector fallback system. If cloud vector endpoints are offline, Lumina seamlessly executes local CPU vector search and fallback Socratic reasoning.'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'chat' | 'map' | 'quiz' | 'cards' | 'stats'>('chat');
  const [sandboxPromptIndex, setSandboxPromptIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950 transition-colors duration-500 overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 dark:from-purple-600/20 dark:to-pink-600/20 rounded-full blur-3xl animate-float -top-48 -left-48" />
        <div className="absolute w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 dark:from-blue-600/20 dark:to-cyan-600/20 rounded-full blur-3xl animate-float-delayed top-1/4 -right-48" />
        <div className="absolute w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 dark:from-indigo-600/20 dark:to-purple-600/20 rounded-full blur-3xl animate-float-slow -bottom-48 left-1/3" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Lumina AI Tutor
                </span>
                <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-600 dark:text-gray-300">
              <a href="#demo-preview" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Interactive Preview</a>
              <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</a>
              <a href="#faq" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">FAQ</a>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-all hover:scale-110 border border-gray-200/50 dark:border-gray-700/50"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
              </button>

              <button
                onClick={() => router.push('/login')}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-extrabold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center animate-fade-in-slide-up">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100/90 dark:bg-purple-900/40 backdrop-blur-md border border-purple-300/50 dark:border-purple-700/50 rounded-full text-purple-800 dark:text-purple-200 text-xs font-extrabold shadow-sm animate-pop-in hover-glow">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin-slow" />
            <span>Next-Gen Adaptive Learning Platform</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="text-gray-900 dark:text-white">Master Any Subject with </span>
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent animate-shimmer-text">
              Adaptive AI Tutoring
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed transition-all duration-300">
            Upload your PDFs, textbooks, or lecture notes. Lumina builds Socratic AI voice tutors, interactive concept dependency graphs, spaced-repetition flashcards, and real-time competency analytics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => router.push('/signup')}
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-extrabold text-sm shadow-2xl hover:shadow-purple-500/50 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />
              <span>Start Learning Free</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>

            <button
              onClick={() => setShowDemoModal(true)}
              className="group px-8 py-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-extrabold text-sm border border-gray-300/60 dark:border-gray-700/60 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-lg hover:border-purple-500/50"
            >
              <Play className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              <span>Watch Interactive Tour</span>
            </button>
          </div>

          {/* Demo Modal Component */}
          <PlatformDemoModal
            isOpen={showDemoModal}
            onClose={() => setShowDemoModal(false)}
          />

          {/* Quick Sandbox Try Widget */}
          <div id="demo-preview" className="max-w-4xl mx-auto pt-8">
            <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-left hover-glow transition-all duration-300">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center animate-bounce-slow">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Instant Socratic AI Sandbox</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click a sample question to see Socratic AI reasoning in action</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold animate-pulse">
                  ● Live Model Ready
                </span>
              </div>

              {/* Sample Question Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SAMPLE_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSandboxPromptIndex(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 transform hover:scale-105 ${
                      sandboxPromptIndex === idx
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md scale-105 ring-2 ring-purple-400/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.q}
                  </button>
                ))}
              </div>

              {/* Sandbox Answer Display Box */}
              <div className="p-4 bg-purple-50/50 dark:bg-gray-950/60 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 text-xs space-y-2 transition-all duration-500 animate-fade-in">
                <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center justify-between">
                  <span>Question: {SAMPLE_PROMPTS[sandboxPromptIndex].q}</span>
                  <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" /> Socratic ELI5 Response
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium transition-opacity duration-300">
                  {SAMPLE_PROMPTS[sandboxPromptIndex].a}
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof Stats with Floating Animations */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover-lift transition-all duration-300 animate-float">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">10K+</div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">Active Students</div>
            </div>
            <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover-lift transition-all duration-300 animate-float-delayed">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">50K+</div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">Study Sessions</div>
            </div>
            <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover-lift transition-all duration-300 animate-float-slow">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">95%</div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">Score Retention</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Platform Feature Showcase Tabs */}
      <section id="features" className="relative z-10 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
        <div className="text-center mb-12 animate-fade-in-slide-up max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold mb-3 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Continuous Auto-Moving Feature Track</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
            Built for <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mastery Learning</span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            Hover over any moving card to pause scrolling and flip to reveal deep technical capabilities
          </p>
        </div>

        {/* Moving Feature Cards Track Container */}
        <div className="relative w-full overflow-hidden py-6">
          {/* Gradient Side Fade Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-transparent dark:from-gray-950/90 dark:via-gray-950/50 z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-pink-50/90 via-pink-50/50 to-transparent dark:from-gray-950/90 dark:via-gray-950/50 z-20 pointer-events-none" />

          {/* Marquee Moving Track */}
          <div className="flex gap-6 animate-marquee-track hover:[animation-play-state:paused] w-max py-2">
            {/* Duplicated array for seamless infinite looping animation */}
            {[1, 2].map((loopIdx) => (
              <React.Fragment key={loopIdx}>
                {/* Card 1 */}
                <div className="flip-card group hover-lift w-[320px] sm:w-[350px] flex-shrink-0">
                  <div className="flip-card-inner">
                    <div className="flip-card-front bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between transition-all duration-300">
                      <div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                          <Brain className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-extrabold mb-2">Adaptive Socratic AI</h3>
                        <p className="text-blue-100 text-xs leading-relaxed">
                          AI adjusts question difficulty dynamically based on your understanding.
                        </p>
                      </div>
                      <div className="text-xs font-bold text-blue-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Hover to flip card</span> →
                      </div>
                    </div>
                    <div className="flip-card-back bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Socratic Capabilities</h3>
                        <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>Step-by-step problem scaffolding</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>ELI5 &amp; real-world analogies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>Voice response speech synthesis</span>
                          </li>
                        </ul>
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Integrated RAG Engine</span>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="flip-card group hover-lift w-[320px] sm:w-[350px] flex-shrink-0">
                  <div className="flip-card-inner">
                    <div className="flip-card-front bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between transition-all duration-300">
                      <div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                          <Zap className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-extrabold mb-2">Pinecone RAG Vectors</h3>
                        <p className="text-purple-100 text-xs leading-relaxed">
                          Advanced semantic retrieval ensures answers are 100% grounded in your document.
                        </p>
                      </div>
                      <div className="text-xs font-bold text-purple-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Hover to flip card</span> →
                      </div>
                    </div>
                    <div className="flip-card-back bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">RAG Highlights</h3>
                        <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            <span>Pinecone vector search index</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            <span>Local CPU fallback system</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            <span>Zero hallucination guarantees</span>
                          </li>
                        </ul>
                      </div>
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">100% Source Backed</span>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="flip-card group hover-lift w-[320px] sm:w-[350px] flex-shrink-0">
                  <div className="flip-card-inner">
                    <div className="flip-card-front bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between transition-all duration-300">
                      <div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                          <Layers className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-extrabold mb-2">Concept Mapping</h3>
                        <p className="text-amber-100 text-xs leading-relaxed">
                          Transform text into interactive Mermaid dependency graphs.
                        </p>
                      </div>
                      <div className="text-xs font-bold text-amber-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Hover to flip card</span> →
                      </div>
                    </div>
                    <div className="flip-card-back bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Graph Visualizer</h3>
                        <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span>Mermaid topic hierarchy nodes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span>Color-coded difficulty clusters</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span>Direct practice node launching</span>
                          </li>
                        </ul>
                      </div>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Visual Learning Path</span>
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="flip-card group hover-lift w-[320px] sm:w-[350px] flex-shrink-0">
                  <div className="flip-card-inner">
                    <div className="flip-card-front bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between transition-all duration-300">
                      <div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                          <Target className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-extrabold mb-2">Adaptive Quizzes</h3>
                        <p className="text-emerald-100 text-xs leading-relaxed">
                          Test comprehension with Bloom's taxonomy multiple choice tests.
                        </p>
                      </div>
                      <div className="text-xs font-bold text-emerald-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Hover to flip card</span> →
                      </div>
                    </div>
                    <div className="flip-card-back bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quiz Engine</h3>
                        <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>Bloom's Taxonomy questioning</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>Instant answer explanations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>Competency score scaling</span>
                          </li>
                        </ul>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Competency Tracking</span>
                    </div>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="flip-card group hover-lift w-[320px] sm:w-[350px] flex-shrink-0">
                  <div className="flip-card-inner">
                    <div className="flip-card-front bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between transition-all duration-300">
                      <div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                          <Brain className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-extrabold mb-2">Smart Flashcards</h3>
                        <p className="text-indigo-100 text-xs leading-relaxed">
                          SM-2 spaced repetition decks with 1-click Anki CSV export.
                        </p>
                      </div>
                      <div className="text-xs font-bold text-indigo-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Hover to flip card</span> →
                      </div>
                    </div>
                    <div className="flip-card-back bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Spaced Repetition</h3>
                        <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <span>SM-2 rating interval algorithm</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <span>1-Click Anki CSV export</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <span>Custom deck categorization</span>
                          </li>
                        </ul>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Anki Sync Ready</span>
                    </div>
                  </div>
                </div>

                {/* Card 6 */}
                <div className="flip-card group hover-lift w-[320px] sm:w-[350px] flex-shrink-0">
                  <div className="flip-card-inner">
                    <div className="flip-card-front bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between transition-all duration-300">
                      <div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                          <Award className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-extrabold mb-2">Gamification &amp; XP</h3>
                        <p className="text-pink-100 text-xs leading-relaxed">
                          Earn XP, maintain daily streaks, and unlock achievement badges.
                        </p>
                      </div>
                      <div className="text-xs font-bold text-pink-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Hover to flip card</span> →
                      </div>
                    </div>
                    <div className="flip-card-back bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rewards System</h3>
                        <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                            <span>Real-time interlinked XP events</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                            <span>Daily streaks &amp; milestone badges</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                            <span>Social Hub global leaderboards</span>
                          </li>
                        </ul>
                      </div>
                      <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">Continuous Rewards</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold mb-2 animate-bounce-slow">
            <HelpCircle className="w-4 h-4" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between gap-4 transition-colors hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform duration-300 ${isOpen ? 'rotate-180 scale-110' : ''}`} />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800/60 pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Student Testimonials Auto-Moving Marquee */}
      <section className="relative z-10 max-w-full mx-auto py-12 overflow-hidden bg-purple-900/5 dark:bg-gray-950/60 border-y border-purple-200/40 dark:border-gray-800/60 backdrop-blur-md">
        <div className="text-center mb-8 max-w-7xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Loved by 10,000+ Students &amp; Researchers</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            What Learners Say About <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Lumina AI</span>
          </h3>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-purple-50 dark:from-gray-950 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-purple-50 dark:from-gray-950 to-transparent z-20 pointer-events-none" />

          <div className="flex gap-6 animate-marquee-reverse hover:[animation-play-state:paused] w-max py-2">
            {[1, 2].map((loopIdx) => (
              <React.Fragment key={loopIdx}>
                <div className="w-[380px] p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-2xl shadow-md flex-shrink-0 space-y-3 hover-lift">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">Verified Student</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    "Saved me 20+ hours studying for CS Finals! The Socratic AI explanations made BGP routing &amp; OS kernels super intuitive."
                  </p>
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                    <span>Alex Chen</span>
                    <span className="text-gray-400 font-normal">CS Senior @ Stanford</span>
                  </div>
                </div>

                <div className="w-[380px] p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-2xl shadow-md flex-shrink-0 space-y-3 hover-lift">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">Researcher</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    "The 3D Vector Embedding Space Visualizer and Multi-Agent AI Debates are absolute game changers for visualizing high-dimensional RAG."
                  </p>
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                    <span>Dr. Sarah Jenkins</span>
                    <span className="text-gray-400 font-normal">EdTech AI Researcher</span>
                  </div>
                </div>

                <div className="w-[380px] p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-2xl shadow-md flex-shrink-0 space-y-3 hover-lift">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">Top 1% Anki User</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    "Instant SM-2 flashcard generation with 1-click Anki CSV export doubled my quiz retention scores in 2 weeks!"
                  </p>
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                    <span>Marcus Vance</span>
                    <span className="text-gray-400 font-normal">Pre-Med Student</span>
                  </div>
                </div>

                <div className="w-[380px] p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-2xl shadow-md flex-shrink-0 space-y-3 hover-lift">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 rounded-full">Active User</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    "Voice AI synthesis feels like having a personal tutor next to me explaining hard concepts out loud 24/7."
                  </p>
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                    <span>Priya Sharma</span>
                    <span className="text-gray-400 font-normal">Electrical Engineering</span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Production Tech Stack Architecture Ticker Bar */}
      <div className="bg-gray-900 text-gray-300 py-3 px-4 border-y border-gray-800 text-[11px] font-mono flex items-center justify-center gap-6 overflow-x-auto whitespace-nowrap shadow-inner">
        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <Zap className="w-3.5 h-3.5 animate-pulse" /> Sub-100ms TTFT SSE Streaming
        </span>
        <span className="text-gray-600">•</span>
        <span className="flex items-center gap-1.5 text-purple-400 font-bold">
          <Cpu className="w-3.5 h-3.5" /> Pinecone Vector RAG (Cos 0.94)
        </span>
        <span className="text-gray-600">•</span>
        <span className="flex items-center gap-1.5 text-blue-400 font-bold">
          <Users className="w-3.5 h-3.5" /> 3-Agent Socratic AI Debate
        </span>
        <span className="text-gray-600">•</span>
        <span className="flex items-center gap-1.5 text-amber-400 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Grounded Zero-Hallucination
        </span>
      </div>

      {/* Main Bottom CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl p-10 md:p-14 text-center text-white shadow-2xl transform hover:scale-[1.01] transition-transform duration-500 relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Ready to Accelerate Your Learning?
            </h2>
            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto">
              Join thousands of students using Lumina AI Tutor to master complex courses, ace exams, and retain knowledge effortlessly.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => router.push('/signup')}
                className="group/btn px-8 py-4 bg-white text-purple-700 hover:bg-purple-50 rounded-2xl font-extrabold text-sm shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 bg-black/30 hover:bg-black/40 backdrop-blur-md text-white border border-white/30 rounded-2xl font-extrabold text-sm shadow-xl transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300"
              >
                Launch Guest Live Demo
              </button>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800/60 mt-12 bg-white/40 dark:bg-gray-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-200">Lumina AI Tutor</span>
            <span>© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</a>
            <a href="#faq" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">FAQ</a>
            <button onClick={() => router.push('/login')} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Sign In</button>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(-15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(20px); }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes marqueeTrack {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeReverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-marquee-track { animation: marqueeTrack 30s linear infinite; }
        .animate-marquee-reverse { animation: marqueeReverse 35s linear infinite; }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        .flip-card {
          perspective: 1000px;
          height: 320px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transform-style: preserve-3d;
        }
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
