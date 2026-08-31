'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Sparkles, Brain, Zap, Target, TrendingUp, Users, Award, ChevronRight, Play, Moon, Sun, X } from 'lucide-react';
import PlatformDemoModal from '@/components/PlatformDemoModal';

export default function HomePage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-500 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 dark:from-purple-600/20 dark:to-pink-600/20 rounded-full blur-3xl animate-float -top-48 -left-48"></div>
        <div className="absolute w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 dark:from-blue-600/20 dark:to-cyan-600/20 rounded-full blur-3xl animate-float-delayed top-1/4 -right-48"></div>
        <div className="absolute w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 dark:from-indigo-600/20 dark:to-purple-600/20 rounded-full blur-3xl animate-float-slow -bottom-48 left-1/3"></div>

        {/* Animated Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-500/20 dark:bg-purple-400/30 rounded-full animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="relative z-10 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Lumina AI Tutor
                </span>
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-all hover:scale-110"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>

              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100/80 dark:bg-purple-900/30 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-full text-purple-700 dark:text-purple-300 font-medium animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Adaptive Learning</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in-up">
            <span className="text-gray-900 dark:text-white">Your adaptive </span>
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent animate-gradient">
              AI-powered
            </span>
            <br />
            <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent animate-gradient-delayed">
              learning companion
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up-delayed">
            Personalized education that adapts to your understanding. Master any subject with AI-powered tutoring, smart flashcards, and real-time analytics.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 animate-fade-in-up-more-delayed">
            <button
              onClick={() => router.push('/signup')}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>Start Learning Now</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-8 py-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 text-gray-900 dark:text-white rounded-2xl font-bold border border-gray-200/50 dark:border-gray-700/50 transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Platform Demo Modal */}
          <PlatformDemoModal
            isOpen={showDemoModal}
            onClose={() => setShowDemoModal(false)}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12">
            <div className="text-center animate-scale-in">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">10K+</div>
              <div className="text-gray-600 dark:text-gray-400 mt-1">Active Students</div>
            </div>
            <div className="text-center animate-scale-in-delayed">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">50K+</div>
              <div className="text-gray-600 dark:text-gray-400 mt-1">Study Sessions</div>
            </div>
            <div className="text-center animate-scale-in-more-delayed">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">95%</div>
              <div className="text-gray-600 dark:text-gray-400 mt-1">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Flip Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need to <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">excel</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">Powerful features designed for effective learning</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Flip Card 1 */}
          <div className="flip-card group">
            <div className="flip-card-inner">
              {/* Front */}
              <div className="flip-card-front bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-8 text-white shadow-2xl">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Adaptive Learning</h3>
                <p className="text-blue-100">AI adjusts difficulty based on your performance</p>
                <div className="absolute bottom-4 right-4 text-sm text-blue-200">Hover to learn more →</div>
              </div>
              {/* Back */}
              <div className="flip-card-back bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How it works</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Analyzes your responses in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Adjusts question difficulty automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Focuses on areas needing improvement</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flip Card 2 */}
          <div className="flip-card group">
            <div className="flip-card-inner">
              {/* Front */}
              <div className="flip-card-front bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">RAG Technology</h3>
                <p className="text-purple-100">Advanced retrieval for precise answers</p>
                <div className="absolute bottom-4 right-4 text-sm text-purple-200">Hover to learn more →</div>
              </div>
              {/* Back */}
              <div className="flip-card-back bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">RAG Features</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>Retrieves relevant information instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>Context-aware responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>Accurate, source-backed answers</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flip Card 3 */}
          <div className="flip-card group">
            <div className="flip-card-inner">
              {/* Front */}
              <div className="flip-card-front bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl p-8 text-white shadow-2xl">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Interactive Quizzes</h3>
                <p className="text-orange-100">Test your knowledge effectively</p>
                <div className="absolute bottom-4 right-4 text-sm text-orange-200">Hover to learn more →</div>
              </div>
              {/* Back */}
              <div className="flip-card-back bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quiz Features</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span>AI-generated questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span>Instant feedback and explanations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span>Progress tracking and analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flip Card 4 */}
          <div className="flip-card group">
            <div className="flip-card-inner">
              {/* Front */}
              <div className="flip-card-front bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-8 text-white shadow-2xl">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Real-time Analytics</h3>
                <p className="text-green-100">Track your progress visually</p>
                <div className="absolute bottom-4 right-4 text-sm text-green-200">Hover to learn more →</div>
              </div>
              {/* Back */}
              <div className="flip-card-back bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Detailed performance metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Beautiful charts and graphs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Identify strengths and weaknesses</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flip Card 5 */}
          <div className="flip-card group">
            <div className="flip-card-inner">
              {/* Front */}
              <div className="flip-card-front bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-8 text-white shadow-2xl">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Study Together</h3>
                <p className="text-pink-100">Collaborate with peers</p>
                <div className="absolute bottom-4 right-4 text-sm text-pink-200">Hover to learn more →</div>
              </div>
              {/* Back */}
              <div className="flip-card-back bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Social Features</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span>Create study groups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span>Share notes and resources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span>Compete on leaderboards</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flip Card 6 */}
          <div className="flip-card group">
            <div className="flip-card-inner">
              {/* Front */}
              <div className="flip-card-front bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-8 text-white shadow-2xl">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Gamification</h3>
                <p className="text-indigo-100">Earn rewards while learning</p>
                <div className="absolute bottom-4 right-4 text-sm text-indigo-200">Hover to learn more →</div>
              </div>
              {/* Back */}
              <div className="flip-card-back bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rewards System</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span>Earn XP and level up</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span>Unlock achievements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span>Maintain daily streaks</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl p-12 text-center text-white shadow-2xl transform hover:scale-105 transition-transform">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to transform your learning?</h2>
          <p className="text-xl mb-8 text-white/90">Join thousands of students already excelling with Lumina</p>
          <button
            onClick={() => router.push('/signup')}
            className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
          >
            Start Learning Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2026 Lumina AI Tutor. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
        
        @keyframes particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-particle { animation: particle linear infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-gradient-delayed { 
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
          animation-delay: 0.5s;
        }
        
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 1s ease-out; }
        .animate-fade-in-up-delayed { animation: fadeInUp 1.2s ease-out; }
        .animate-fade-in-up-more-delayed { animation: fadeInUp 1.4s ease-out; }
        .animate-scale-in { animation: scaleIn 0.8s ease-out; }
        .animate-scale-in-delayed { animation: scaleIn 1s ease-out; }
        .animate-scale-in-more-delayed { animation: scaleIn 1.2s ease-out; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        /* Flip Card Styles */
        .flip-card {
          perspective: 1000px;
          height: 320px;
        }
        
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
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
