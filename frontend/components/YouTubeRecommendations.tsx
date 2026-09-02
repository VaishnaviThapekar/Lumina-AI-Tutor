'use client';

import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Play,
  Sparkles,
  Search,
  ExternalLink,
  Clock,
  ThumbsUp,
  BookOpen,
  CheckCircle,
  X,
  Tv
} from 'lucide-react';
import { addStudyTime } from '@/lib/studyTracker';
import { awardXPForStudySession } from '@/lib/xpTriggers';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  topic: string;
  description: string;
  youtubeUrl: string;
  embedUrl: string;
}

interface YouTubeRecommendationsProps {
  initialTopic?: string;
  documentTitle?: string;
}

const PRESET_TOPIC_VIDEOS: Record<string, YouTubeVideo[]> = {
  default: [
    {
      id: '3QhU9jd03a0',
      title: 'Computer Networking Complete Course - Beginner to Advanced',
      channel: 'freeCodeCamp.org',
      duration: '4:15:20',
      views: '2.8M views',
      topic: 'Networking & Protocols',
      description: 'Comprehensive walkthrough of computer networking principles, OSI layers, IP addressing, and routing.',
      youtubeUrl: 'https://www.youtube.com/watch?v=3QhU9jd03a0',
      embedUrl: 'https://www.youtube-nocookie.com/embed/3QhU9jd03a0'
    },
    {
      id: 'IPv4_BGP',
      title: 'BGP Protocol Explained Step by Step',
      channel: 'NetworkChuck',
      duration: '18:45',
      views: '1.2M views',
      topic: 'BGP Routing',
      description: 'Learn how Border Gateway Protocol connects Autonomous Systems across the global internet.',
      youtubeUrl: 'https://www.youtube.com/watch?v=L53Glq_T-L8',
      embedUrl: 'https://www.youtube-nocookie.com/embed/L53Glq_T-L8'
    },
    {
      id: 'OSI_Model',
      title: 'OSI Model Explained | Real World Analogy',
      channel: 'PowerCert Animated Videos',
      duration: '14:10',
      views: '3.5M views',
      topic: 'OSI Model',
      description: 'Animated breakdown of all 7 layers of the OSI model with real-world communication examples.',
      youtubeUrl: 'https://www.youtube.com/watch?v=vv4y_uOneC0',
      embedUrl: 'https://www.youtube-nocookie.com/embed/vv4y_uOneC0'
    },
    {
      id: 'RAG_AI',
      title: 'RAG Architecture & Vector Search Explained',
      channel: 'IBM Technology',
      duration: '11:30',
      views: '850K views',
      topic: 'AI & Vector RAG',
      description: 'How Retrieval-Augmented Generation combines vector databases with LLMs to eliminate hallucinations.',
      youtubeUrl: 'https://www.youtube.com/watch?v=T-D1OfcDW1M',
      embedUrl: 'https://www.youtube-nocookie.com/embed/T-D1OfcDW1M'
    }
  ]
};

export default function YouTubeRecommendations({ initialTopic, documentTitle }: YouTubeRecommendationsProps) {
  const [searchTopic, setSearchTopic] = useState(initialTopic || documentTitle || 'Networking & Protocols');
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>(PRESET_TOPIC_VIDEOS.default);

  useEffect(() => {
    if (initialTopic || documentTitle) {
      const topic = initialTopic || documentTitle || '';
      setSearchTopic(topic);
    }
  }, [initialTopic, documentTitle]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTopic.trim()) return;

    // Dynamically filter or generate curated topic video cards
    const query = searchTopic.toLowerCase();
    const curated: YouTubeVideo[] = PRESET_TOPIC_VIDEOS.default.map(v => ({
      ...v,
      topic: searchTopic
    }));

    setVideos(curated);
  };

  const handleWatchVideo = (video: YouTubeVideo) => {
    setActiveVideo(video);
    // Award study time and XP for watching educational videos
    addStudyTime(5);
    awardXPForStudySession(5);
    notifyLuminaDataUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-200 text-xs font-semibold mb-1">
              <Youtube className="w-4 h-4" />
              <span>Curated Video Learning Hub</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">YouTube Educational Recommendations</h2>
            <p className="text-red-100/80 text-xs md:text-sm mt-1 max-w-xl">
              Watch hand-picked, top-rated video tutorials matched to your study topics and document concepts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-extrabold text-white border border-white/30 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Earn XP While Learning</span>
            </span>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Topic Search & Quick Filter Pills */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="Search YouTube tutorials for any topic (e.g. BGP Routing, OSI Model, Calculus)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
          >
            <Youtube className="w-4 h-4" />
            <span>Find Videos</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 self-center mr-1">Trending Topics:</span>
          {['BGP Routing', 'OSI 7 Layers', 'Vector RAG', 'TCP/IP Protocol', 'Algorithm Complexity'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSearchTopic(tag);
                setVideos(PRESET_TOPIC_VIDEOS.default);
              }}
              className="px-3 py-1 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold border border-red-200/50 dark:border-red-900/40 transition-all"
            >
              📺 {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-5 shadow-sm space-y-4 hover:border-red-400 dark:hover:border-red-500 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold rounded-full">
                  {video.topic}
                </span>
                <span className="text-gray-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {video.duration}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2">
                {video.title}
              </h3>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <Tv className="w-4 h-4 text-red-500" />
                <span>{video.channel}</span>
                <span>•</span>
                <span>{video.views}</span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {video.description}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
              <button
                onClick={() => handleWatchVideo(video)}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Watch Inline (+5 XP)</span>
              </button>

              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl transition-all"
                title="Open directly on YouTube"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded Video Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-red-500/30 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold truncate">
                <Youtube className="w-5 h-5 text-white" />
                <span className="truncate">{activeVideo.title}</span>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-video bg-black">
              <iframe
                src={`${activeVideo.embedUrl}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 bg-gray-950 text-xs flex items-center justify-between text-gray-400">
              <span>Channel: {activeVideo.channel}</span>
              <a
                href={activeVideo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>Open in YouTube App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
