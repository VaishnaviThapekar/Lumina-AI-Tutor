'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Network, Sparkles, BookOpen, Layers, CheckCircle2, ChevronRight, Zap, RefreshCw, Youtube } from 'lucide-react';
import { getConceptMap, ConceptNode, ConceptMapData } from '@/lib/api';

interface ConceptMapProps {
  documentId?: number;
  documentTitle?: string;
  onNavigateToQuiz?: () => void;
  onNavigateToFlashcards?: () => void;
  onNavigateToVideos?: () => void;
}

export default function ConceptMap({
  documentId,
  documentTitle,
  onNavigateToQuiz,
  onNavigateToFlashcards,
  onNavigateToVideos
}: ConceptMapProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConceptMapData | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredNodes = data?.nodes
    ? data.nodes.filter(n => {
        const matchesCat = filterCategory === 'All' || n.category === filterCategory;
        const matchesSearch = !searchTerm.trim() || n.label.toLowerCase().includes(searchTerm.toLowerCase()) || n.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
      })
    : [];

  useEffect(() => {
    if (documentId) {
      loadConceptMap(documentId);
    } else {
      // Default sample fallback data
      const defaultData: ConceptMapData = {
        document_id: 0,
        title: documentTitle || 'Sample Topic: Artificial Intelligence & Machine Learning',
        nodes: [
          {
            id: 'node-1',
            label: 'Foundations & Architecture',
            category: 'Core',
            mastery: 0.90,
            description: 'Core concepts including neural networks, activation functions, and layer arrangements.',
            connections: ['node-2', 'node-3']
          },
          {
            id: 'node-2',
            label: 'Supervised vs Unsupervised',
            category: 'Learning Types',
            mastery: 0.75,
            description: 'Labeled data classification and regression vs unlabeled clustering & dimensionality reduction.',
            connections: ['node-4']
          },
          {
            id: 'node-3',
            label: 'Deep Learning & Transformers',
            category: 'Advanced Models',
            mastery: 0.50,
            description: 'Self-attention mechanisms, multi-head attention, and transformer encoders/decoders.',
            connections: ['node-4', 'node-5']
          },
          {
            id: 'node-4',
            label: 'Gradient Descent & Optimization',
            category: 'Math Fundamentals',
            mastery: 0.40,
            description: 'Backpropagation, learning rates, loss functions (MSE, Cross-Entropy), and Adam optimizer.',
            connections: ['node-5']
          },
          {
            id: 'node-5',
            label: 'Model Deployment & Ethics',
            category: 'Applications',
            mastery: 0.82,
            description: 'Fairness, bias mitigation, inference optimization, and production pipeline deployment.',
            connections: []
          }
        ]
      };
      setData(defaultData);
      setSelectedNode(defaultData.nodes[0]);
    }
  }, [documentId, documentTitle]);

  const loadConceptMap = async (id: number) => {
    setLoading(true);
    try {
      const res = await getConceptMap(id);
      setData(res);
      if (res.nodes.length > 0) {
        setSelectedNode(res.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load concept map:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = data
    ? ['All', ...Array.from(new Set(data.nodes.map(n => n.category)))]
    : ['All'];

  const getMasteryBadge = (score: number) => {
    if (score >= 0.8) return { label: 'Mastered', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    if (score >= 0.5) return { label: 'Developing', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    return { label: 'Needs Focus', color: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30' };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
              <Network className="w-4 h-4 animate-pulse" />
              <span>Interactive Knowledge Graph</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {data?.title || 'Concept Mind Map'}
            </h2>
            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
              Visualize subject relationships, track granular topic mastery, and drill into specific concepts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {documentId && (
              <button
                onClick={() => loadConceptMap(documentId)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Map</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative blur orbs */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph & Category List (Col 2) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Category Filters */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="🔍 Search concept nodes by title or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Filter:
              </span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                    filterCategory === cat
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Node Grid Visualization */}
          <div className="relative min-h-[420px] bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Extracting concepts & building graph...</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {filteredNodes.length} Concepts Identified
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Click any node to explore
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredNodes.map((node, index) => {
                    const isSelected = selectedNode?.id === node.id;
                    const badge = getMasteryBadge(node.mastery);

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10 border-purple-500 dark:border-purple-400 shadow-lg ring-2 ring-purple-500/20'
                            : 'bg-white/80 dark:bg-gray-900/80 border-gray-200/80 dark:border-gray-700/80 hover:border-purple-300 dark:hover:border-purple-600 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                              {index + 1}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {node.label}
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {node.description}
                        </p>

                        {/* Mastery Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-gray-500">
                            <span>Mastery</span>
                            <span>{Math.round(node.mastery * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                              style={{ width: `${node.mastery * 100}%` }}
                            />
                          </div>
                        </div>

                        {node.connections.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Layers className="w-3 h-3" />
                            <span>Connects to {node.connections.length} sub-topic(s)</span>
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

        {/* Selected Node Details Panel (Col 1) */}
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm sticky top-6">
            {selectedNode ? (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Concept Deep Dive</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedNode.label}
                  </h3>
                  <span className="inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                    Category: {selectedNode.category}
                  </span>
                </div>

                <div className="p-4 bg-purple-50/50 dark:bg-gray-900/50 rounded-xl border border-purple-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedNode.description}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Take Action
                  </span>

                  <button
                    onClick={onNavigateToQuiz}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Practice Quiz for this Concept</span>
                  </button>

                  <button
                    onClick={onNavigateToFlashcards}
                    className="w-full py-2.5 px-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Review Flashcards</span>
                  </button>

                  <button
                    onClick={onNavigateToVideos}
                    className="w-full py-2.5 px-4 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span>Watch Related YouTube Tutorials</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-2 text-gray-400">
                <Brain className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 animate-bounce" />
                <p className="text-sm font-medium">Select any node on the left to view details and action shortcuts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
