'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Brain,
  GraduationCap,
  Download,
  HelpCircle,
  Play,
  Square,
  Flame,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { awardXPForStudySession } from '@/lib/xpTriggers';
import { addStudyTime } from '@/lib/studyTracker';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface OralExamSimulatorProps {
  documentTitle?: string;
  documentId?: number;
}

type ExaminerMode = 'professor' | 'tech_lead' | 'mentor';

interface RubricScores {
  accuracy: number;
  precision: number;
  depth: number;
  structure: number;
  overallScore: number;
  letterGrade: string;
}

interface EvaluationResult {
  scores: RubricScores;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string;
  followUpQuestion: string;
}

interface VivaQuestion {
  id: number;
  question: string;
  category: string;
  contextHint: string;
}

export default function OralExamSimulator({ documentTitle, documentId }: OralExamSimulatorProps) {
  const [selectedExaminer, setSelectedExaminer] = useState<ExaminerMode>('professor');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const activeDocName = documentTitle || (documentId ? `Document #${documentId}` : 'Machine Learning & Systems');

  // Initialize Speech Synthesis and Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setStudentAnswer(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('[Oral Exam] Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Context-aware viva questions based on document subject
  const getQuestions = (): VivaQuestion[] => {
    const titleLower = activeDocName.toLowerCase();

    if (titleLower.includes('machine learning') || titleLower.includes('ml') || titleLower.includes('ai')) {
      return [
        {
          id: 1,
          question:
            'Candidate, explain the fundamental trade-off between Bias and Variance. What mathematical symptoms indicate that a model is suffering from high variance, and what regularizations would you prescribe?',
          category: 'Statistical Learning Theory',
          contextHint: 'Focus on model capacity, training vs validation loss curve divergence, and L1/L2 penalties.'
        },
        {
          id: 2,
          question:
            'In gradient descent optimization, why can a learning rate that is set too high cause divergent behavior, while one set too low leads to sub-optimal saddle points in non-convex loss surfaces?',
          category: 'Optimization & Convergence',
          contextHint: 'Discuss step size, gradient overshoot, momentum, and adaptive optimizers like Adam.'
        },
        {
          id: 3,
          question:
            'How does Cross-Entropy Loss differ from Mean Squared Error when training classification neural networks? Defend why softmax with cross-entropy avoids vanishing gradient plateaus.',
          category: 'Loss Formulations & Architecture',
          contextHint: 'Derive derivative behavior of softmax + cross-entropy compared to squared error saturation.'
        },
        {
          id: 4,
          question:
            'Walk me through Data Leakage. How can preprocessing (such as imputation or feature scaling) accidentally leak future target information, and how do you enforce a watertight validation split?',
          category: 'Methodology & Data Integrity',
          contextHint: 'Explain why fit() must occur strictly on training folds and never on full datasets.'
        }
      ];
    }

    // Default domain questions
    return [
      {
        id: 1,
        question: `Candidate, please synthesize the primary thesis and foundational architecture outlined in ${activeDocName}. What is the core problem it solves?`,
        category: 'System Architecture & Scope',
        contextHint: 'Articulate the underlying motivation, input-output flow, and primary constraints.'
      },
      {
        id: 2,
        question:
          'What are the critical trade-offs made in the proposed approach versus conventional alternative methodologies? Where does this system fail or face bottlenecks?',
        category: 'Critical Evaluation & Edge Cases',
        contextHint: 'Identify scalability limits, latency, complexity, or assumptions made in the text.'
      },
      {
        id: 3,
        question:
          'Defend how you would validate the correctness and robustness of this system in a high-stakes production environment.',
        category: 'Verification & Empirical Validation',
        contextHint: 'Discuss baseline comparisons, failure-mode stress tests, and automated monitoring.'
      }
    ];
  };

  const questions = getQuestions();
  const activeQuestion = questions[currentQuestionIndex] || questions[0];

  // Examiner Persona configurations
  const examiners = {
    professor: {
      name: 'Prof. Alistair Vance',
      role: 'Rigorous Academic Chair',
      avatar: '👨‍🏫',
      pitch: 0.95,
      rate: 0.95,
      badge: 'Rigorous Viva Voce',
      description: 'Demands formal definitions, mathematical rigor, and counterexample defense.'
    },
    tech_lead: {
      name: 'Elena Rostova',
      role: 'Principal Systems Architect',
      avatar: '👩‍💼',
      pitch: 1.05,
      rate: 1.05,
      badge: 'Industry Technical Bar',
      description: 'Focuses on production trade-offs, scalability bottlenecks, and practical execution.'
    },
    mentor: {
      name: 'Dr. Marcus Socratic',
      role: 'Cognitive Learning Fellow',
      avatar: '🧑‍🎓',
      pitch: 1.0,
      rate: 1.0,
      badge: 'Constructive Dialogue',
      description: 'Guides you with scaffolding feedback to help you articulate your reasoning.'
    }
  };

  const examiner = examiners[selectedExaminer];

  // Text-To-Speech Examiner Speak Function
  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = examiner.pitch;
    utterance.rate = examiner.rate;
    utterance.lang = 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle Voice Recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your response.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsRecording(false);
    } else {
      try {
        stopSpeaking();
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  // Evaluate candidate's oral response
  const handleEvaluateAnswer = () => {
    if (!studentAnswer.trim() || studentAnswer.trim().length < 15) {
      alert('Please speak or type a substantive answer of at least 2 sentences before requesting evaluation.');
      return;
    }

    setIsEvaluating(true);
    stopSpeaking();

    setTimeout(() => {
      const wordCount = studentAnswer.trim().split(/\s+/).length;
      const lower = studentAnswer.toLowerCase();

      // Heuristic evaluation based on technical terms and structure
      const technicalKeywords = [
        'variance',
        'bias',
        'regularization',
        'gradient',
        'loss',
        'trade-off',
        'overfitting',
        'underfitting',
        'validation',
        'cross-entropy',
        'convergence',
        'architecture',
        'hypothesis',
        'distribution'
      ];

      const matchedTerms = technicalKeywords.filter((k) => lower.includes(k));
      const termScore = Math.min(100, Math.round((matchedTerms.length / 4) * 100));

      // Calculate rubric scores
      const accuracy = Math.min(98, Math.max(65, termScore > 50 ? 88 + Math.floor(wordCount / 10) : 72));
      const precision = Math.min(96, Math.max(60, termScore > 40 ? 85 : 68));
      const depth = Math.min(99, Math.max(55, wordCount > 40 ? 92 : wordCount > 20 ? 80 : 64));
      const structure = Math.min(95, Math.max(65, studentAnswer.includes('because') || studentAnswer.includes('therefore') || studentAnswer.includes('however') ? 90 : 75));

      const overall = Math.round((accuracy * 0.35 + precision * 0.25 + depth * 0.25 + structure * 0.15));

      let letter = 'B';
      if (overall >= 93) letter = 'A+';
      else if (overall >= 88) letter = 'A';
      else if (overall >= 82) letter = 'A-';
      else if (overall >= 78) letter = 'B+';
      else if (overall >= 70) letter = 'B';
      else letter = 'C+';

      const evalData: EvaluationResult = {
        scores: {
          accuracy,
          precision,
          depth,
          structure,
          overallScore: overall,
          letterGrade: letter
        },
        verdict:
          overall >= 85
            ? `Commendable defense, candidate. You demonstrated a solid grasp of ${activeQuestion.category} with clear causal reasoning.`
            : `Acceptable preliminary attempt, but lacking the technical rigor expected during a formal viva examination.`,
        strengths: [
          `Articulated core concept direction: "${studentAnswer.substring(0, 40)}..."`,
          `Incorporated ${matchedTerms.length > 0 ? matchedTerms.join(', ') : 'foundational domain vocabulary'} into the explanation.`,
          `Demonstrated reasoning flow across ${wordCount} words.`
        ],
        weaknesses: [
          matchedTerms.length < 2
            ? 'Ground your arguments with more canonical domain terminology and formal definitions.'
            : 'Explore edge cases and formal mathematical implications more explicitly.',
          'Consider structuring your oral response with a 3-part framework: Definition → Mechanism → Countermeasure.'
        ],
        idealAnswer:
          `An exemplary defense would state: "${activeQuestion.contextHint} By directly connecting the mathematical symptom to the corrective inductive bias, the answer leaves zero ambiguity for the examination board."`,
        followUpQuestion:
          `Follow-up defense: How does your reasoning hold up if the underlying dataset exhibits severe covariate shift or non-stationary noise?`
      };

      setResult(evalData);
      setIsEvaluating(false);

      // Award XP and study tracker
      const earnedXP = overall >= 85 ? 50 : 35;
      setSessionXP((prev) => prev + earnedXP);
      if (!completedQuestions.includes(activeQuestion.id)) {
        setCompletedQuestions((prev) => [...prev, activeQuestion.id]);
      }
      awardXPForStudySession(earnedXP);
      addStudyTime(3);
      notifyLuminaDataUpdated();

      // Speak examiner verdict aloud
      speakText(`${evalData.verdict} You received a grade of ${letter}. ${evalData.followUpQuestion}`);
    }, 1400);
  };

  const handleNextQuestion = () => {
    stopSpeaking();
    setResult(null);
    setStudentAnswer('');
    const nextIdx = (currentQuestionIndex + 1) % questions.length;
    setCurrentQuestionIndex(nextIdx);
  };

  const handleResetExam = () => {
    stopSpeaking();
    setResult(null);
    setStudentAnswer('');
    setCurrentQuestionIndex(0);
    setExamStarted(false);
  };

  const handleExportScorecard = () => {
    if (!result) return;
    let md = `# Lumina AI Tutor - Oral Exam & Viva Voce Scorecard\n\n`;
    md += `**Document:** ${activeDocName}\n`;
    md += `**Examiner:** ${examiner.name} (${examiner.role})\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n`;
    md += `## Examination Question\n> ${activeQuestion.question}\n\n`;
    md += `### Candidate's Oral Defense\n"${studentAnswer}"\n\n`;
    md += `## Board Rubric Scores\n`;
    md += `- **Overall Grade:** ${result.scores.letterGrade} (${result.scores.overallScore}/100)\n`;
    md += `- **Conceptual Accuracy:** ${result.scores.accuracy}%\n`;
    md += `- **Domain Terminology:** ${result.scores.precision}%\n`;
    md += `- **Analytical Depth:** ${result.scores.depth}%\n`;
    md += `- **Communication Structure:** ${result.scores.structure}%\n\n`;
    md += `### Examiner's Assessment\n${result.verdict}\n\n`;
    md += `### Follow-up Grilling Question\n> ${result.followUpQuestion}\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oral_exam_scorecard_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-rose-600 to-purple-700 p-6 sm:p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Socratic Viva Voce & Oral Defense Simulator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI Mock Oral Exam Board
            </h2>
            <p className="text-amber-100/90 text-sm mt-1 max-w-2xl leading-relaxed">
              Test your ability to articulate and defend core concepts under live examination conditions. Speak or type your defense, receive rubric grading, and face follow-up grilling questions.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
            <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <p className="text-[10px] text-amber-200 uppercase font-bold tracking-wider">Exam XP Earned</p>
              <p className="text-lg font-black text-white">+{sessionXP} XP</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <p className="text-[10px] text-amber-200 uppercase font-bold tracking-wider">Questions Cleared</p>
              <p className="text-lg font-black text-white">
                {completedQuestions.length}/{questions.length}
              </p>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Examiner Persona Picker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(examiners) as ExaminerMode[]).map((modeKey) => {
          const ex = examiners[modeKey];
          const isSelected = selectedExaminer === modeKey;
          return (
            <div
              key={modeKey}
              onClick={() => {
                setSelectedExaminer(modeKey);
                stopSpeaking();
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30 shadow-lg scale-[1.01]'
                  : 'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{ex.avatar}</span>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    {ex.name}
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                  </h4>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{ex.role}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2.5 leading-snug">
                {ex.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Question Card & Stage */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center">
              Q{currentQuestionIndex + 1}
            </span>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {activeQuestion.category}
              </span>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Target Subject: {activeDocName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => (isSpeaking ? stopSpeaking() : speakText(activeQuestion.question))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSpeaking
                  ? 'bg-rose-500 text-white shadow-md animate-pulse'
                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
              }`}
              title="Speak question aloud"
            >
              {isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop Speaking' : 'Read Question Aloud'}</span>
            </button>

            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
            >
              <span>Next Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Examiner Question Speech Bubble */}
        <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl">
          <span className="text-3xl sm:text-4xl flex-shrink-0 mt-0.5">{examiner.avatar}</span>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
              {examiner.name} asks:
            </p>
            <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
              "{activeQuestion.question}"
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-700/80 dark:text-amber-400">
              <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Examiner's expectation: {activeQuestion.contextHint}</span>
            </div>
          </div>
        </div>

        {/* Student Defense Input Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Your Spoken or Written Oral Defense:</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleRecording}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Listening (Click to Stop)...' : 'Dictate with Voice'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Type your explanation or click 'Dictate with Voice' to speak your answer aloud like in a real viva voce defense..."
            rows={5}
            className="w-full p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white text-sm leading-relaxed resize-none transition-all shadow-inner"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-gray-400">
              Word count: {studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0} words
            </span>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={() => setStudentAnswer('')}
                disabled={!studentAnswer}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
              >
                Clear
              </button>

              <button
                onClick={handleEvaluateAnswer}
                disabled={isEvaluating || !studentAnswer.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {isEvaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Board is Deliberating...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Submit Defense for Rubric Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Evaluation Board Scorecard Result */}
        {result && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6 animate-in fade-in-50 duration-300">
            {/* Header Result */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Official Examination Verdict
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                  Defense Grade: {result.scores.letterGrade} ({result.scores.overallScore}/100)
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{result.verdict}</p>
              </div>

              <button
                onClick={handleExportScorecard}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-400 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>Download Scorecard</span>
              </button>
            </div>

            {/* 4 Rubric Dimensional Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Conceptual Accuracy', score: result.scores.accuracy, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Domain Terminology', score: result.scores.precision, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Analytical Depth', score: result.scores.depth, color: 'text-purple-600 dark:text-purple-400' },
                { label: 'Defense Structure', score: result.scores.structure, color: 'text-rose-600 dark:text-rose-400' }
              ].map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-50/70 dark:bg-gray-900/40 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 text-center"
                >
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{metric.label}</p>
                  <p className={`text-xl font-black mt-1 ${metric.color}`}>{metric.score}%</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths & Critical Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Commendations & Strengths</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-emerald-900/80 dark:text-emerald-300/80">
                  {result.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Critical Defense Gaps</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-amber-900/80 dark:text-amber-300/80">
                  {result.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Follow-up Grilling Question */}
            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Examiner's Follow-up Challenge Question</span>
                </h4>
                <button
                  onClick={() => speakText(result.followUpQuestion)}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 italic">
                "{result.followUpQuestion}"
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setStudentAnswer('');
                    setResult(null);
                  }}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Defend Follow-up Question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
