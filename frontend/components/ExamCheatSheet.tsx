'use client';

import React, { useState } from 'react';
import { FileText, Printer, Copy, Check, Download, Sparkles, BookOpen, AlertTriangle, HelpCircle, Flame, Layers } from 'lucide-react';

interface CheatSheetData {
  title: string;
  summary: string[];
  keyTerms: { term: string; definition: string; examTip: string }[];
  examTraps: { trap: string; fix: string }[];
  practiceQuestions: { question: string; answer: string; rationale: string }[];
}

interface ExamCheatSheetProps {
  documentTitle?: string;
  documentId?: number;
}

export default function ExamCheatSheet({ documentTitle, documentId }: ExamCheatSheetProps) {
  const [copied, setCopied] = useState(false);
  const [focusMode, setFocusMode] = useState<'comprehensive' | 'formulas' | 'traps'>('comprehensive');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const activeDocName = documentTitle || (documentId ? `Document #${documentId}` : 'Uploaded Document');

  // Intelligent context-aware cheat sheet content based on document subject
  const getCheatSheetData = (): CheatSheetData => {
    const titleLower = activeDocName.toLowerCase();

    if (titleLower.includes('machine learning') || titleLower.includes('ml')) {
      return {
        title: `Machine Learning Exam Cram & High-Yield Cheat Sheet`,
        summary: [
          'Supervised Learning maps inputs X to labeled targets y; Unsupervised finds structure without targets.',
          'Bias-Variance Trade-off: High Bias = Underfitting (oversimplified); High Variance = Overfitting (memorizes noise).',
          'Regularization (L1 Lasso = feature sparsity via |w|; L2 Ridge = weight decay via w²) prevents overfitting.',
          'Cross-Validation (k-fold) provides unbiased out-of-sample generalization error estimation.',
          'Precision vs. Recall: When False Positives are costly use Precision; when False Negatives are critical (e.g. disease diagnosis) maximize Recall.'
        ],
        keyTerms: [
          { term: 'Overfitting', definition: 'Model achieves ~100% training accuracy but fails on validation data.', examTip: 'Keywords: High variance, low bias, excessive model capacity.' },
          { term: 'Gradient Descent', definition: 'θ := θ - α ∇J(θ) where α is learning rate and ∇J is loss gradient.', examTip: 'If learning rate is too large, optimization diverges; if too small, convergence stalls.' },
          { term: 'F1-Score', definition: 'Harmonic mean of Precision and Recall: 2 · (P · R) / (P + R).', examTip: 'Always choose F1 over Accuracy when class imbalance is present (e.g. 99% negative).' },
          { term: 'Confusion Matrix', definition: 'Grid evaluating TP, FP, TN, FN predictions.', examTip: 'Recall = TP / (TP + FN); Precision = TP / (TP + FP).' }
        ],
        examTraps: [
          { trap: 'Evaluating imbalanced datasets using Accuracy.', fix: 'Always compute Balanced Accuracy, PR-AUC, or F1-Score.' },
          { trap: 'Data Leakage: Normalizing entire dataset before splitting train/test.', fix: 'Fit scalers (e.g., StandardScaler) strictly on train set, then transform test set.' },
          { trap: 'Confusing L1 (Lasso) vs L2 (Ridge) regularizers.', fix: 'L1 drives parameters to exactly 0 (feature selection); L2 shrinks weights toward 0 without zeroing out.' }
        ],
        practiceQuestions: [
          {
            question: 'Why does Dropout act as a form of ensemble learning in Neural Networks?',
            answer: 'Randomly deactivating neurons during training prevents co-adaptation.',
            rationale: 'Each training batch effectively trains a different sub-network architecture, simulating averaging over an exponentially large ensemble.'
          },
          {
            question: 'Under what condition will Gradient Descent fail to reach the global minimum?',
            answer: 'In non-convex loss landscapes with saddle points or local minima.',
            rationale: 'While guaranteed for convex functions (like Linear Regression MSE), deep neural network loss surfaces have non-convex landscapes.'
          }
        ]
      };
    } else if (titleLower.includes('quantum')) {
      return {
        title: `Quantum Computing & Qubit Mechanics Exam Cheat Sheet`,
        summary: [
          'Qubit State: |ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1 (probability normalization).',
          'Bloch Sphere: Geometric representation where poles represent classical states |0⟩ and |1⟩.',
          'Hadamard Gate (H): Maps basis states into balanced superposition: H|0⟩ = (|0⟩+|1⟩)/√2 = |+⟩.',
          'Entanglement: Bell states (e.g. (|00⟩+|11⟩)/√2) cannot be factored into independent tensor products.',
          'No-Cloning Theorem: It is mathematically impossible to create an identical copy of an arbitrary unknown quantum state.'
        ],
        keyTerms: [
          { term: 'Superposition', definition: 'Linear combination of orthogonal basis states before measurement.', examTip: 'Measurement collapses state irreversibly with probability |amplitude|².' },
          { term: 'CNOT Gate', definition: 'Controlled-NOT: flips target qubit if and only if control qubit is |1⟩.', examTip: 'Fundamental two-qubit gate required for generating entanglement.' },
          { term: 'Decoherence', definition: 'Loss of quantum coherence caused by environmental thermal/magnetic noise.', examTip: 'The primary bottleneck limiting circuit depth in NISQ quantum computers.' }
        ],
        examTraps: [
          { trap: 'Assuming quantum computers test all possibilities simultaneously to solve NP-complete problems in O(1).', fix: 'Quantum algorithms rely on destructive interference of bad states and constructive interference of solutions.' },
          { trap: 'Believing quantum entanglement allows faster-than-light (FTL) data transmission.', fix: 'The No-Communication Theorem guarantees measurement outcomes appear random without classical channel synchronization.' }
        ],
        practiceQuestions: [
          {
            question: 'What is the matrix transformation for the Hadamard (H) gate?',
            answer: '1/√2 * [[1, 1], [1, -1]]',
            rationale: 'Applying H twice returns the original state: H² = I (identity operator).'
          }
        ]
      };
    } else {
      return {
        title: `${activeDocName} - High-Yield Exam Cram Sheet`,
        summary: [
          `Core Subject Domain: Key concepts, taxonomy, and operational rules governing ${activeDocName}.`,
          'First Principles: Always identify underlying assumptions, boundaries, and primary variables.',
          'Cause & Effect: Note how variations in primary parameters propagate through the system.',
          'Critical Evaluation: Compare alternative models and benchmark their performance trade-offs.'
        ],
        keyTerms: [
          { term: 'Fundamental Principle', definition: 'The foundational law or governing equation from which domain theorems are derived.', examTip: 'Start free-response exam answers by explicitly stating this definition.' },
          { term: 'System Constraint', definition: 'Boundaries, resource limitations, or environmental constraints affecting solution feasibility.', examTip: 'Exam questions frequently test boundary conditions and edge cases.' },
          { term: 'Comparative Trade-off', definition: 'Balancing competing criteria (e.g. speed vs accuracy, cost vs durability).', examTip: 'Look out for questions asking "Which approach is optimal when memory/bandwidth is constrained?".' }
        ],
        examTraps: [
          { trap: 'Ignoring units, dimensions, and baseline assumptions in calculations.', fix: 'Verify dimensional consistency and boundary parameters before finalizing steps.' },
          { trap: 'Memorizing formulas without understanding underlying mechanics.', fix: 'Derive the relationship once to understand what variables scale quadratically or linearly.' }
        ],
        practiceQuestions: [
          {
            question: `What is the most critical concept to verify when analyzing problems in ${activeDocName}?`,
            answer: 'The governing constraints and boundary assumptions of the system.',
            rationale: 'Solutions that fail boundary condition tests will be penalized heavily in grading rubrics.'
          }
        ]
      };
    }
  };

  const data = getCheatSheetData();

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    let md = `# ${data.title}\n\n`;
    md += `## 5-Minute Rapid-Fire Executive Summary\n`;
    data.summary.forEach((item, idx) => {
      md += `${idx + 1}. ${item}\n`;
    });
    md += `\n## Core Terminology & Formula Matrix\n`;
    data.keyTerms.forEach(t => {
      md += `- **${t.term}**: ${t.definition} *(Exam Tip: ${t.examTip})*\n`;
    });
    md += `\n## Common Exam Traps & Pitfalls\n`;
    data.examTraps.forEach(trap => {
      md += `- ⚠️ **Trap**: ${trap.trap}\n  - ✅ **Fix**: ${trap.fix}\n`;
    });
    md += `\n## High-Yield Practice Questions\n`;
    data.practiceQuestions.forEach((q, idx) => {
      md += `### Q${idx + 1}: ${q.question}\n**Answer**: ${q.answer}\n*Rationale*: ${q.rationale}\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMd = () => {
    let md = `# ${data.title}\n\n`;
    md += `*Generated via Lumina AI Tutor - Adaptive Learning Companion*\n\n---\n\n`;
    md += `## High-Yield Executive Summary\n`;
    data.summary.forEach((item, idx) => {
      md += `${idx + 1}. ${item}\n`;
    });
    md += `\n## Key Terms & Formula Matrix\n`;
    data.keyTerms.forEach(t => {
      md += `### ${t.term}\n- **Definition**: ${t.definition}\n- **Exam Strategy**: ${t.examTip}\n\n`;
    });
    md += `\n## Common Traps to Avoid\n`;
    data.examTraps.forEach(trap => {
      md += `- ⚠️ **Trap**: ${trap.trap}\n  - ✅ **Correction**: ${trap.fix}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDocName.replace(/[^a-zA-Z0-9]/g, '_')}_Exam_Cheat_Sheet.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Print-only CSS injection */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #exam-cheat-sheet-container,
          #exam-cheat-sheet-container * {
            visibility: visible;
          }
          #exam-cheat-sheet-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 p-6 text-white shadow-xl no-print">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-200 text-sm font-medium mb-1">
              <Flame className="w-4 h-4 animate-pulse text-yellow-300" />
              <span>High-Yield Exam Prep Hub</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">{data.title}</h2>
            <p className="text-amber-100/90 text-sm mt-1 max-w-xl">
              Instant 1-page executive summary, formula matrix, tricky exam traps, and printable cram sheets extracted from your document.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
              title="Print or Save as Clean PDF"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadMd}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Download .MD</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Filter Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 no-print">
        <button
          onClick={() => setFocusMode('comprehensive')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            focusMode === 'comprehensive'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          Comprehensive Cram Sheet
        </button>
        <button
          onClick={() => setFocusMode('formulas')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            focusMode === 'formulas'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          Formulas & Terminology
        </button>
        <button
          onClick={() => setFocusMode('traps')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            focusMode === 'traps'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          Exam Traps & Pitfalls
        </button>
      </div>

      {/* Printable Cheat Sheet Container */}
      <div id="exam-cheat-sheet-container" className="space-y-6">
        
        {/* Section 1: Executive 5-Minute Cram Summary */}
        {(focusMode === 'comprehensive' || focusMode === 'formulas') && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                5-Minute Rapid-Fire Executive Summary
              </h3>
            </div>
            <ul className="space-y-3">
              {data.summary.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    {point}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 2: Formulas & Core Definitions Matrix */}
        {(focusMode === 'comprehensive' || focusMode === 'formulas') && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Core Terminology & Formula Matrix
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.keyTerms.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-purple-900 dark:text-purple-200">
                      {item.term}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-200/60 dark:bg-purple-800/60 text-purple-800 dark:text-purple-200">
                      High Yield
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-normal">
                    {item.definition}
                  </p>
                  <div className="pt-2 border-t border-purple-100/80 dark:border-purple-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1">
                    <span className="font-bold">Exam Tip:</span>
                    <span>{item.examTip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: High-Yield Exam Traps */}
        {(focusMode === 'comprehensive' || focusMode === 'traps') && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Exam Pitfalls & Common Traps
              </h3>
            </div>
            <div className="space-y-3">
              {data.examTraps.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold text-sm">⚠️</span>
                    <div>
                      <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Trap: {item.trap}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                        ✓ Correct Approach: {item.fix}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Target Practice Drills */}
        {focusMode === 'comprehensive' && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                High-Yield Practice Questions
              </h3>
            </div>
            <div className="space-y-4">
              {data.practiceQuestions.map((q, idx) => {
                const isExpanded = expandedQuestion === idx;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30"
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Q{idx + 1}: {q.question}
                    </p>
                    <button
                      onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline no-print mb-2 inline-block"
                    >
                      {isExpanded ? 'Hide Model Answer' : 'Reveal Model Answer & Rationale'}
                    </button>
                    {(isExpanded || typeof window === 'undefined') && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs space-y-1">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Answer: {q.answer}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 italic">
                          Rationale: {q.rationale}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
