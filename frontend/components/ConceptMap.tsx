'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Network, Sparkles, BookOpen, Layers, CheckCircle2, ChevronRight, Zap, RefreshCw, Youtube, Plus, Download, Grid, FileText, Share2, Check, Award } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'canvas' | 'grid' | 'outline'>('canvas');
  const [showAddModal, setShowAddModal] = useState(false);
  const [exportToast, setExportToast] = useState(false);

  // New Node Form state
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeCategory, setNewNodeCategory] = useState('Core');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeMastery, setNewNodeMastery] = useState(0.5);

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

  const updateMastery = (nodeId: string, newScore: number) => {
    if (!data) return;
    const updatedNodes = data.nodes.map(n => n.id === nodeId ? { ...n, mastery: newScore } : n);
    const updatedData = { ...data, nodes: updatedNodes };
    setData(updatedData);
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, mastery: newScore });
    }
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim() || !data) return;
    const id = `node-custom-${Date.now()}`;
    const newNode: ConceptNode = {
      id,
      label: newNodeLabel.trim(),
      category: newNodeCategory.trim() || 'Custom',
      mastery: newNodeMastery,
      description: newNodeDesc.trim() || 'Custom user added concept node.',
      connections: []
    };
    const updatedData = { ...data, nodes: [...data.nodes, newNode] };
    setData(updatedData);
    setSelectedNode(newNode);
    setNewNodeLabel('');
    setNewNodeDesc('');
    setShowAddModal(false);
  };

  const handleExportStudyGuide = () => {
    if (!data) return;
    let md = `# Concept Study Guide: ${data.title}\n\n`;
    md += `*Generated by Lumina AI Tutor on ${new Date().toLocaleDateString()}*\n\n`;
    md += `## Mastery Summary\n`;
    const avgMastery = Math.round((data.nodes.reduce((acc, n) => acc + n.mastery, 0) / data.nodes.length) * 100);
    md += `- **Total Concepts**: ${data.nodes.length}\n`;
    md += `- **Overall Mastery**: ${avgMastery}%\n\n`;
    md += `---\n\n## Concept Breakdown\n\n`;

    data.nodes.forEach((n, idx) => {
      md += `### ${idx + 1}. ${n.label} (${n.category})\n`;
      md += `- **Mastery Level**: ${Math.round(n.mastery * 100)}%\n`;
      md += `- **Description**: ${n.description}\n`;
      if (n.connections.length > 0) {
        const connLabels = n.connections
          .map(cid => data.nodes.find(x => x.id === cid)?.label || cid)
          .join(', ');
        md += `- **Connects To**: ${connLabels}\n`;
      }
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_guide.md`;
    a.click();
    URL.revokeObjectURL(url);

    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  const categories = data
    ? ['All', ...Array.from(new Set(data.nodes.map(n => n.category)))]
    : ['All'];

  const overallMastery = data && data.nodes.length > 0
    ? Math.round((data.nodes.reduce((sum, n) => sum + n.mastery, 0) / data.nodes.length) * 100)
    : 0;

  const getMasteryBadge = (score: number) => {
    if (score >= 0.8) return { label: 'Mastered', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', stroke: '#10b981' };
    if (score >= 0.5) return { label: 'Developing', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30', stroke: '#f59e0b' };
    return { label: 'Needs Focus', color: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30', stroke: '#f43f5e' };
  };

  // Pre-calculate positions for SVG knowledge canvas view
  const getNodePositions = () => {
    const nodes = filteredNodes;
    const count = nodes.length;
    if (count === 0) return [];
    
    // Position nodes in a clean multi-row circular or staggered graph
    const width = 640;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    if (count === 1) {
      return [{ node: nodes[0], x: centerX, y: centerY }];
    }

    // First node at center if Core, rest in surrounding orbit
    return nodes.map((node, idx) => {
      if (idx === 0) {
        return { node, x: centerX - 120, y: centerY - 60 };
      }
      const radiusX = 200;
      const radiusY = 130;
      const angle = ((idx - 1) / (count - 1)) * Math.PI * 1.8 - 0.3;
      const x = centerX + Math.cos(angle) * radiusX;
      const y = centerY + Math.sin(angle) * radiusY;
      return { node, x, y };
    });
  };

  const nodePositions = getNodePositions();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4" />
          <span>Markdown Study Guide downloaded successfully!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
              <Network className="w-4 h-4 animate-pulse text-amber-300" />
              <span>Interactive Knowledge Graph • Overall Mastery: {overallMastery}%</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {data?.title || 'Concept Mind Map'}
            </h2>
            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
              Visualize subject relationships, track granular topic mastery, and drill into specific concepts.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/30 shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>Add Node</span>
            </button>

            <button
              onClick={handleExportStudyGuide}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/30 shadow-sm"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Export Guide</span>
            </button>

            {documentId && (
              <button
                onClick={() => loadConceptMap(documentId)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/20">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'canvas' ? 'bg-white text-purple-700 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>SVG Knowledge Canvas</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-purple-700 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid Cards</span>
            </button>

            <button
              onClick={() => setViewMode('outline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'outline' ? 'bg-white text-purple-700 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Outline Guide</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-purple-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-300" />
            <span>Mastery Progress: {data?.nodes.filter(n => n.mastery >= 0.8).length || 0} / {data?.nodes.length || 0} Mastered</span>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Mind Map Canvas/Grid (Col 2) */}
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

          {/* Canvas or Grid or Outline Container */}
          <div className="relative min-h-[460px] bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Extracting concepts & building graph...</p>
              </div>
            ) : viewMode === 'canvas' ? (
              /* VIEW MODE 1: DYNAMIC SVG KNOWLEDGE CANVAS */
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    Interactive Connected Knowledge Graph Canvas
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                    Click node to select
                  </span>
                </div>

                <div className="w-full overflow-x-auto bg-purple-950/5 dark:bg-black/30 rounded-2xl p-2 border border-purple-100 dark:border-gray-800">
                  <svg viewBox="0 0 640 400" className="w-full h-auto min-w-[550px] select-none">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Render Connection Bezier Curves */}
                    {nodePositions.map(({ node, x: x1, y: y1 }) => {
                      return node.connections.map(targetId => {
                        const targetPos = nodePositions.find(p => p.node.id === targetId);
                        if (!targetPos) return null;
                        const { x: x2, y: y2 } = targetPos;
                        const controlX = (x1 + x2) / 2;
                        const controlY = (y1 + y2) / 2 - 30;

                        return (
                          <g key={`${node.id}-${targetId}`}>
                            <path
                              d={`M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`}
                              fill="none"
                              stroke="url(#lineGradient)"
                              strokeWidth="2.5"
                              strokeDasharray="6 3"
                              className="animate-pulse opacity-70"
                            />
                          </g>
                        );
                      });
                    })}

                    {/* Render Interactive Nodes */}
                    {nodePositions.map(({ node, x, y }, index) => {
                      const isSelected = selectedNode?.id === node.id;
                      const badge = getMasteryBadge(node.mastery);

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${x}, ${y})`}
                          onClick={() => setSelectedNode(node)}
                          className="cursor-pointer group transition-all"
                        >
                          {/* Outer pulse aura for selected node */}
                          {isSelected && (
                            <circle
                              r="38"
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth="2"
                              className="animate-ping opacity-75"
                            />
                          )}

                          {/* Node outer circle background */}
                          <circle
                            r="32"
                            fill={isSelected ? '#7e22ce' : '#ffffff'}
                            stroke={badge.stroke}
                            strokeWidth={isSelected ? '4' : '3'}
                            filter="url(#glow)"
                            className="transition-all duration-300 transform group-hover:scale-110"
                          />

                          {/* Node Icon Number */}
                          <text
                            textAnchor="middle"
                            dy="-2"
                            fontSize="13"
                            fontWeight="bold"
                            fill={isSelected ? '#ffffff' : '#374151'}
                          >
                            #{index + 1}
                          </text>

                          {/* Node Mastery Score text */}
                          <text
                            textAnchor="middle"
                            dy="12"
                            fontSize="9"
                            fontWeight="bold"
                            fill={isSelected ? '#f3e8ff' : badge.stroke}
                          >
                            {Math.round(node.mastery * 100)}%
                          </text>

                          {/* Floating Title Tag */}
                          <rect
                            x="-65"
                            y="42"
                            width="130"
                            height="24"
                            rx="12"
                            fill={isSelected ? '#581c87' : '#1f2937'}
                            opacity="0.9"
                          />
                          <text
                            textAnchor="middle"
                            y="58"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#ffffff"
                          >
                            {node.label.length > 18 ? node.label.substring(0, 18) + '...' : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* VIEW MODE 2: GRID CARDS VIEW */
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
            ) : (
              /* VIEW MODE 3: HIERARCHICAL OUTLINE VIEW */
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Structured Active Recall Study Outline
                  </span>
                  <button
                    onClick={handleExportStudyGuide}
                    className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    Download as .md
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredNodes.map((node, index) => {
                    const badge = getMasteryBadge(node.mastery);
                    const isSelected = selectedNode?.id === node.id;

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 shadow-md'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-purple-600 dark:text-purple-400">
                              {index + 1}.
                            </span>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {node.label}
                            </h4>
                            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                              {node.category}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${badge.color}`}>
                            {badge.label} ({Math.round(node.mastery * 100)}%)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {node.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Node Details Panel & Mastery Adjuster (Col 1) */}
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm sticky top-6">
            {selectedNode ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Concept Deep Dive</span>
                  </div>
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md">
                    ID: {selectedNode.id}
                  </span>
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

                {/* Dynamic Node Mastery Score Adjuster */}
                <div className="space-y-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                    <span>Update Concept Mastery:</span>
                    <span className="text-purple-600 font-extrabold">{Math.round(selectedNode.mastery * 100)}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => updateMastery(selectedNode.id, 1.0)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                        selectedNode.mastery >= 0.8
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200'
                      }`}
                    >
                      Mastered (100%)
                    </button>
                    <button
                      onClick={() => updateMastery(selectedNode.id, 0.5)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                        selectedNode.mastery >= 0.4 && selectedNode.mastery < 0.8
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200'
                      }`}
                    >
                      Developing (50%)
                    </button>
                    <button
                      onClick={() => updateMastery(selectedNode.id, 0.25)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                        selectedNode.mastery < 0.4
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-rose-200'
                      }`}
                    >
                      Focus (25%)
                    </button>
                  </div>
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

      {/* Add Custom Concept Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Add Custom Concept Node
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Concept Title / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Convolutional Neural Networks (CNNs)"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Vision"
                  value={newNodeCategory}
                  onChange={(e) => setNewNodeCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Describe the key principles or formula..."
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Initial Mastery Level ({Math.round(newNodeMastery * 100)}%)</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={newNodeMastery}
                  onChange={(e) => setNewNodeMastery(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md"
                >
                  Save Concept Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

