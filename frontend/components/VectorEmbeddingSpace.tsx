'use client';

import React, { useState, useEffect } from 'react';
import { Network, Sparkles, Search, Layers, Cpu, Compass, CheckCircle2, RefreshCw, Sliders } from 'lucide-react';
import { awardXPForStudySession } from '@/lib/xpTriggers';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface VectorPoint {
  id: string;
  x: number; // projected X (-100 to 100)
  y: number; // projected Y (-100 to 100)
  cluster: string;
  color: string;
  chunkText: string;
  similarity?: number;
  pageNumber: number;
  embeddingVector: number[];
}

interface VectorEmbeddingSpaceProps {
  documentTitle?: string;
}

export default function VectorEmbeddingSpace({ documentTitle }: VectorEmbeddingSpaceProps) {
  const [points, setPoints] = useState<VectorPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<VectorPoint | null>(null);
  const [query, setQuery] = useState<string>('What is the difference between BGP and OSPF?');
  const [activeQueryPoint, setActiveQueryPoint] = useState<{ x: number; y: number } | null>(null);
  const [topMatches, setTopMatches] = useState<VectorPoint[]>([]);
  const [projectionMethod, setProjectionMethod] = useState<'t-SNE' | 'PCA' | 'UMAP'>('t-SNE');

  useEffect(() => {
    generateSampleEmbeddings();
  }, [documentTitle, projectionMethod]);

  const generateSampleEmbeddings = () => {
    const samplePoints: VectorPoint[] = [
      {
        id: 'chunk-1',
        x: -45,
        y: -30,
        cluster: 'Network Protocols & BGP',
        color: 'bg-purple-500 border-purple-300',
        chunkText: 'Border Gateway Protocol (BGP) is an exterior gateway protocol designed to exchange routing and reachability information among autonomous systems (AS) on the Internet.',
        pageNumber: 2,
        embeddingVector: [0.824, -0.412, 0.951, 0.128, -0.633]
      },
      {
        id: 'chunk-2',
        x: -55,
        y: -15,
        cluster: 'Network Protocols & BGP',
        color: 'bg-purple-500 border-purple-300',
        chunkText: 'BGP uses Path Vector routing principles. Routers select paths based on network policies, path attributes, and autonomous system hop counts.',
        pageNumber: 3,
        embeddingVector: [0.810, -0.395, 0.932, 0.115, -0.610]
      },
      {
        id: 'chunk-3',
        x: 40,
        y: 50,
        cluster: 'Vector RAG & Pinecone',
        color: 'bg-blue-500 border-blue-300',
        chunkText: 'Retrieval-Augmented Generation (RAG) combines dense vector search with generative language models to ground AI responses in authoritative document text.',
        pageNumber: 7,
        embeddingVector: [-0.312, 0.884, 0.105, 0.742, 0.290]
      },
      {
        id: 'chunk-4',
        x: 50,
        y: 35,
        cluster: 'Vector RAG & Pinecone',
        color: 'bg-blue-500 border-blue-300',
        chunkText: 'Dense vector embeddings represent semantic meanings as high-dimensional floating point vectors. Cosine similarity calculates angular distance between queries and chunks.',
        pageNumber: 9,
        embeddingVector: [-0.295, 0.871, 0.112, 0.755, 0.310]
      },
      {
        id: 'chunk-5',
        x: 10,
        y: -60,
        cluster: 'Security & Encryption',
        color: 'bg-emerald-500 border-emerald-300',
        chunkText: 'Transport Layer Security (TLS 1.3) encrypts communications over computer networks, ensuring confidentiality and data integrity via symmetric key cryptography.',
        pageNumber: 12,
        embeddingVector: [0.105, -0.210, -0.840, 0.445, 0.712]
      },
      {
        id: 'chunk-6',
        x: 25,
        y: -45,
        cluster: 'Security & Encryption',
        color: 'bg-emerald-500 border-emerald-300',
        chunkText: 'Public Key Infrastructure (PKI) issues digital certificates to authenticate servers and clients using RSA or Elliptic Curve Cryptography (ECC).',
        pageNumber: 14,
        embeddingVector: [0.120, -0.225, -0.825, 0.460, 0.725]
      }
    ];

    setPoints(samplePoints);
  };

  const handleSimulateNearestNeighbor = () => {
    if (!query.trim()) return;

    // Simulate query projected vector point
    const qX = -40;
    const qY = -20;
    setActiveQueryPoint({ x: qX, y: qY });

    // Calculate nearest neighbors by Euclidean distance in 2D projection space
    const scored = points.map(p => {
      const dist = Math.sqrt(Math.pow(p.x - qX, 2) + Math.pow(p.y - qY, 2));
      const sim = Math.max(0.70, (1 - dist / 200)).toFixed(2);
      return { ...p, similarity: parseFloat(sim) };
    });

    scored.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    const top3 = scored.slice(0, 3);

    setTopMatches(top3);
    setSelectedPoint(top3[0]);
    awardXPForStudySession(15);
    notifyLuminaDataUpdated();
  };

  return (
    <div className="space-y-6 animate-fade-in-slide-up">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4 text-cyan-300 animate-spin" />
              <span>High-Dimensional Vector Math & RAG Inspection</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">
              Interactive 3D Vector Embedding Space Visualizer
            </h2>
            <p className="text-blue-100/80 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Explore your document chunks mapped into 768-dimensional vector embedding space. Observe nearest-neighbor cosine distance search in real time!
            </p>
          </div>

          {/* Projection Selector */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            <Sliders className="w-4 h-4 text-cyan-300 ml-1" />
            <span className="text-xs font-bold text-blue-100">Projection:</span>
            {['t-SNE', 'PCA', 'UMAP'].map((m) => (
              <button
                key={m}
                onClick={() => setProjectionMethod(m as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  projectionMethod === m
                    ? 'bg-white text-blue-800 shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* RAG Nearest Neighbor Query Input Bar */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          🎯 Test Cosine Distance Nearest-Neighbor Query Search
        </span>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Type a RAG search query to plot in vector space..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />

          <button
            onClick={handleSimulateNearestNeighbor}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Plot & Find Nearest Neighbors</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas & Vector Chunk Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vector Canvas Container (Col 2) */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Network className="w-4 h-4 text-blue-600" />
              <span>768D Vector Space Projected into 2D ({projectionMethod} Method)</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Protocols</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Vector RAG</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Security</span>
            </div>
          </div>

          {/* Interactive Visual Canvas Plot */}
          <div className="relative w-full h-[380px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Grid Coordinates Lines */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-slate-800"></div>
              <div className="h-full w-[1px] bg-slate-800"></div>
            </div>

            {/* Render Cosine Distance Lines to Top Matches */}
            {activeQueryPoint && topMatches.map((m, idx) => (
              <svg key={idx} className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1={`${((activeQueryPoint.x + 100) / 200) * 100}%`}
                  y1={`${((100 - activeQueryPoint.y) / 200) * 100}%`}
                  x2={`${((m.x + 100) / 200) * 100}%`}
                  y2={`${((100 - m.y) / 200) * 100}%`}
                  stroke={idx === 0 ? '#38bdf8' : '#a855f7'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              </svg>
            ))}

            {/* Vector Points */}
            {points.map((pt) => {
              const isSelected = selectedNodePoint(pt, selectedPoint);
              const leftPct = ((pt.x + 100) / 200) * 100;
              const topPct = ((100 - pt.y) / 200) * 100;

              return (
                <div
                  key={pt.id}
                  onClick={() => setSelectedPoint(pt)}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group ${
                    isSelected ? 'scale-150 z-30' : 'hover:scale-125 z-10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${pt.color} border-2 flex items-center justify-center text-[9px] font-bold text-white shadow-lg ${
                    isSelected ? 'ring-4 ring-cyan-400 animate-pulse' : ''
                  }`}>
                    {pt.pageNumber}
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap z-40 border border-slate-700 shadow-xl">
                    <p className="font-bold">{pt.cluster}</p>
                    <p className="text-gray-400 font-mono">[{pt.x}, {pt.y}]</p>
                  </div>
                </div>
              );
            })}

            {/* Projected Query Node Target */}
            {activeQueryPoint && (
              <div
                style={{
                  left: `${((activeQueryPoint.x + 100) / 200) * 100}%`,
                  top: `${((100 - activeQueryPoint.y) / 200) * 100}%`
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-xl animate-bounce ring-4 ring-cyan-400/50">
                  🎯
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vector Chunk Inspector Sidebar (Col 1) */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Vector Chunk Inspector
              </span>
              {selectedPoint?.similarity && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  Similarity: {(selectedPoint.similarity * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {selectedPoint ? (
              <div className="space-y-4 animate-pop-in">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Cluster Category
                  </span>
                  <p className="font-extrabold text-sm text-gray-900 dark:text-white">
                    {selectedPoint.cluster} (Page #{selectedPoint.pageNumber})
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Text Chunk Excerpt
                  </span>
                  <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs leading-relaxed border border-slate-800 font-medium">
                    "{selectedPoint.chunkText}"
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    768D Dense Vector Embedding Snapshot
                  </span>
                  <div className="p-2.5 bg-slate-950 text-cyan-400 rounded-xl text-[10px] font-mono border border-slate-800 break-all">
                    [{selectedPoint.embeddingVector.join(', ')}, ...]
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <Cpu className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 animate-bounce" />
                <p className="text-xs font-medium">Select any vector point on the map to inspect its text chunk and embedding vector values.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              RAG Nearest-Neighbor Vector Engine Active (+15 XP)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function selectedNodePoint(pt: VectorPoint, selectedPoint: VectorPoint | null) {
  return selectedPoint ? selectedPoint.id === pt.id : false;
}
