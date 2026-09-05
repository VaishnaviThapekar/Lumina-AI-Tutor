'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Sparkles, Play, Pause, RefreshCw, MessageSquare, ShieldAlert, Cpu, GraduationCap, CheckCircle2, ChevronRight, Award, Volume2, VolumeX } from 'lucide-react';
import { awardXPForStudySession } from '@/lib/xpTriggers';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface DebateAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  gradient: string;
  icon: any;
}

interface DebateMessage {
  agentId: string;
  agentName: string;
  role: string;
  avatar: string;
  color: string;
  content: string;
  timestamp: string;
}

interface MultiAgentDebateProps {
  documentTitle?: string;
}

export default function MultiAgentDebate({ documentTitle }: MultiAgentDebateProps) {
  const [topic, setTopic] = useState<string>('');
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<'idle' | 'opening' | 'rebuttal' | 'consensus'>('idle');
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [audioTTS, setAudioTTS] = useState<boolean>(false);
  const [consensusSummary, setConsensusSummary] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const agents: DebateAgent[] = [
    {
      id: 'scholar',
      name: 'Dr. Sophia',
      role: 'The Socratic Scholar',
      avatar: '🎓',
      color: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-600 to-indigo-600',
      icon: GraduationCap
    },
    {
      id: 'engineer',
      name: 'Alex Vance',
      role: 'Practical Industry Engineer',
      avatar: '🛠️',
      color: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-600 to-cyan-600',
      icon: Cpu
    },
    {
      id: 'skeptic',
      name: 'Prof. Marcus',
      role: 'Critical Academic Skeptic',
      avatar: '🧐',
      color: 'text-rose-600 dark:text-rose-400',
      gradient: 'from-rose-600 to-amber-600',
      icon: ShieldAlert
    }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    if (documentTitle) {
      setTopic(documentTitle.replace('.pdf', ''));
    } else {
      setTopic('Vector RAG Architectures vs LLM Fine-Tuning');
    }
  }, [documentTitle]);

  const speak = (text: string) => {
    if (!audioTTS || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  };

  const handleStartDebate = () => {
    const activeTopic = customTopicInput.trim() || topic;
    if (!activeTopic) return;

    setIsDebating(true);
    setCurrentStage('opening');
    setMessages([]);
    setConsensusSummary(null);

    // Stage 1: Opening Statements
    const msg1: DebateMessage = {
      agentId: 'scholar',
      agentName: 'Dr. Sophia',
      role: 'The Socratic Scholar',
      avatar: '🎓',
      color: 'text-purple-600 dark:text-purple-400',
      content: `Let us analyze "${activeTopic}" from first principles. Theoretically, this concept establishes fundamental rules for structuring knowledge. Without understanding these foundational definitions, practical applications often collapse under unforeseen edge cases.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveSpeakerId('scholar');
    setMessages([msg1]);
    speak(msg1.content);

    // Stage 2: Engineer Response
    setTimeout(() => {
      const msg2: DebateMessage = {
        agentId: 'engineer',
        agentName: 'Alex Vance',
        role: 'Practical Industry Engineer',
        avatar: '🛠️',
        color: 'text-blue-600 dark:text-blue-400',
        content: `I agree with Dr. Sophia's theory, but in real-world production systems at scale, theory must adapt to latency and cost constraints! When implementing "${activeTopic}" in cloud architectures, developers prioritize throughput, fault tolerance, and API reliability over pure academic elegance.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setActiveSpeakerId('engineer');
      setMessages(prev => [...prev, msg2]);
      speak(msg2.content);
    }, 4500);

    // Stage 3: Skeptic Counter
    setTimeout(() => {
      setCurrentStage('rebuttal');
      const msg3: DebateMessage = {
        agentId: 'skeptic',
        agentName: 'Prof. Marcus',
        role: 'Critical Academic Skeptic',
        avatar: '🧐',
        color: 'text-rose-600 dark:text-rose-400',
        content: `Hold on! Both of you are overlooking key vulnerabilities in "${activeTopic}". If we stress-test this model under high concurrency or adversarial inputs, security flaws and data degradation emerge. We cannot declare success without rigorous empirical benchmark validation!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setActiveSpeakerId('skeptic');
      setMessages(prev => [...prev, msg3]);
      speak(msg3.content);
    }, 9000);

    // Stage 4: Synthesis & Consensus
    setTimeout(() => {
      setCurrentStage('consensus');
      const msg4: DebateMessage = {
        agentId: 'scholar',
        agentName: 'Dr. Sophia',
        role: 'The Socratic Scholar',
        avatar: '🎓',
        color: 'text-purple-600 dark:text-purple-400',
        content: `Excellent counterpoint, Prof. Marcus. By combining fundamental theory, Alex's engineering optimization, and Marcus's security benchmarks, we achieve a complete 360° understanding of "${activeTopic}".`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setActiveSpeakerId(null);
      setMessages(prev => [...prev, msg4]);

      setConsensusSummary(
        `📌 Multi-Agent Consensus Summary for "${activeTopic}":\n\n` +
        `1. Theoretical Foundation: Anchor your design in first-principles definitions.\n` +
        `2. Engineering Implementation: Optimize for low latency, cost efficiency, and horizontal scalability.\n` +
        `3. Risk Mitigation: Benchmark against edge cases, data degradation, and security vulnerabilities.`
      );

      setIsDebating(false);
      awardXPForStudySession(15);
      notifyLuminaDataUpdated();
    }, 14000);
  };

  return (
    <div className="space-y-6 animate-fade-in-slide-up">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Multi-Agent Orchestration & Consensus AI</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">
              Autonomous Multi-Agent AI Debate Panel
            </h2>
            <p className="text-purple-100/80 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Watch 3 specialized AI subagents (**Socratic Scholar**, **Industry Engineer**, and **Academic Skeptic**) hold an automated 3-way debate to analyze your topic from all angles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAudioTTS(!audioTTS)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                audioTTS
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
              }`}
            >
              {audioTTS ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{audioTTS ? 'Audio TTS Active' : 'Enable Speech'}</span>
            </button>
          </div>
        </div>

        {/* Decorative ambient blur orb */}
        <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 3 AI Subagents Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((ag) => {
          const Icon = ag.icon;
          const isSpeaking = activeSpeakerId === ag.id;

          return (
            <div
              key={ag.id}
              className={`p-4 rounded-2xl border transition-all glass-card-hover ${
                isSpeaking
                  ? 'bg-white dark:bg-gray-800 border-purple-500 shadow-xl scale-[1.03] ring-2 ring-purple-500/50'
                  : 'bg-white/60 dark:bg-gray-800/60 border-gray-200/60 dark:border-gray-700/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ag.gradient} flex items-center justify-center text-2xl shadow-md`}>
                  {ag.avatar}
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                    {ag.name}
                    {isSpeaking && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    )}
                  </h4>
                  <p className={`text-xs font-semibold ${ag.color}`}>{ag.role}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Topic Input Bar */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Type any subject to debate (e.g. BGP Routing, Microservices vs Monolith, Vector RAG)..."
            value={customTopicInput}
            onChange={(e) => setCustomTopicInput(e.target.value)}
            disabled={isDebating}
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />

          <button
            onClick={handleStartDebate}
            disabled={isDebating}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDebating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Agents Debating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Launch Multi-Agent Debate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Debate Arena Transcript */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm min-h-[350px] space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span>Live Multi-Agent Debate Arena ({messages.length} Statements)</span>
          </div>

          {currentStage !== 'idle' && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Stage: {currentStage.toUpperCase()}
            </span>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="w-12 h-12 text-purple-400 mx-auto animate-bounce" />
            <h4 className="text-gray-800 dark:text-white font-bold text-base">
              Ready to Launch Multi-Agent Debate
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-xs max-w-md mx-auto">
              Click **Launch Multi-Agent Debate** above to watch 3 specialized AI subagents debate and build consensus on your study topic!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-gray-900/80 shadow-sm animate-pop-in space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{msg.avatar}</span>
                    <div>
                      <span className="font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm">{msg.agentName}</span>
                      <span className={`text-[10px] font-bold ml-2 ${msg.color}`}>({msg.role})</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {msg.content}
                </p>
              </div>
            ))}

            {consensusSummary && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-100 shadow-md animate-pop-in space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>360° Multi-Agent Consensus Matrix Achieved (+15 XP)</span>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed font-semibold">
                  {consensusSummary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
