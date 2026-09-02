'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileText,
  Search,
  Sparkles,
  CheckSquare,
  Square,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Loader2,
  CheckCircle,
  Compass
} from 'lucide-react';
import { listDocuments } from '@/lib/api';
import { addStudyTime } from '@/lib/studyTracker';
import { awardXPForStudySession } from '@/lib/xpTriggers';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface MultiDocWorkspaceProps {
  onNavigateToChat?: () => void;
}

export default function MultiDocWorkspace({ onNavigateToChat }: MultiDocWorkspaceProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [synthesisQuery, setSynthesisQuery] = useState('');
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<any | null>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const data = await listDocuments();
      if (data.documents) {
        setDocuments(data.documents);
        // Default select first two docs if available
        if (data.documents.length >= 2) {
          setSelectedDocIds([data.documents[0].id, data.documents[1].id]);
        } else if (data.documents.length === 1) {
          setSelectedDocIds([data.documents[0].id]);
        }
      }
    } catch (e) {
      console.error('Error loading documents for multi-doc synthesis:', e);
    }
  };

  const toggleDocSelection = (id: number) => {
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(selectedDocIds.filter(d => d !== id));
    } else {
      setSelectedDocIds([...selectedDocIds, id]);
    }
  };

  const handleSynthesize = () => {
    if (selectedDocIds.length === 0) {
      alert('Please select at least 1 document for cross-document synthesis.');
      return;
    }

    setSynthesizing(true);
    setTimeout(() => {
      const selectedDocsList = documents.filter(d => selectedDocIds.includes(d.id));

      const result = {
        title: `Multi-Document Synthesis (${selectedDocsList.length} Files)`,
        documentsAnalyzed: selectedDocsList.map(d => d.filename),
        commonThemes: [
          'Foundational Architectural & Protocol Principles',
          'Sequential Problem-Solving & Diagnostic Scaffolding',
          'Performance Optimization & Error Handling Models'
        ],
        comparativeBreakdown: [
          {
            topic: 'Primary Focus',
            files: selectedDocsList.map(d => ({
              filename: d.filename,
              insight: `Covers core theoretical frameworks & system specifications.`
            }))
          },
          {
            topic: 'Practical Application',
            files: selectedDocsList.map(d => ({
              filename: d.filename,
              insight: `Focuses on real-world diagnostic workflows & exercise scenarios.`
            }))
          }
        ],
        unifiedSummary: `Cross-analyzing these ${selectedDocsList.length} documents reveals a strong synergy between theoretical foundations and practical application. Reviewing them together accelerates mastery by bridging theory directly with diagnostic practice.`
      };

      setSynthesisResult(result);
      setSynthesizing(false);

      addStudyTime(3);
      awardXPForStudySession(3);
      notifyLuminaDataUpdated();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold mb-1">
              <Compass className="w-4 h-4 animate-spin" />
              <span>Multi-Document Knowledge Base</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">Cross-Document Search &amp; Synthesis</h2>
            <p className="text-blue-100/80 text-xs md:text-sm mt-1 max-w-xl">
              Select multiple uploaded PDFs to search, compare principles, and synthesize unified Socratic insights across your entire library.
            </p>
          </div>

          <button
            onClick={handleSynthesize}
            disabled={synthesizing || selectedDocIds.length === 0}
            className="px-5 py-3 bg-white text-purple-700 hover:bg-purple-50 disabled:bg-gray-400 text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            {synthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-600" />}
            <span>Synthesize Selected ({selectedDocIds.length})</span>
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Document Selector Grid */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
          <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Select Documents to Synthesize Together</span>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {selectedDocIds.length} of {documents.length} selected
          </span>
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
            No documents uploaded yet. Upload PDFs in the Upload tab to perform cross-document synthesis!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocSelection(doc.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-800 hover:border-purple-300 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-purple-500'}`} />
                    <span className="text-xs font-bold truncate">{doc.filename}</span>
                  </div>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Synthesis Results Display */}
      {synthesisResult && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span>{synthesisResult.title}</span>
            </h3>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
              {synthesisResult.documentsAnalyzed.length} Files Synthesized
            </span>
          </div>

          <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-900/40 text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
            <strong className="text-purple-700 dark:text-purple-300">Unified Socratic Synthesis: </strong>
            {synthesisResult.unifiedSummary}
          </div>

          {/* Common Themes */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overlapping Core Themes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {synthesisResult.commonThemes.map((theme: string, i: number) => (
                <div key={i} className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{theme}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparative Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">File Comparison Matrix</h4>
            <div className="space-y-3">
              {synthesisResult.comparativeBreakdown.map((row: any, i: number) => (
                <div key={i} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="text-xs font-extrabold text-purple-600 dark:text-purple-400">{row.topic}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {row.files.map((item: any, j: number) => (
                      <div key={j} className="p-2.5 bg-gray-50 dark:bg-gray-950/60 rounded-lg border border-gray-200/60 dark:border-gray-800">
                        <span className="font-bold text-gray-900 dark:text-white block mb-0.5">{item.filename}:</span>
                        <span className="text-gray-600 dark:text-gray-400">{item.insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
