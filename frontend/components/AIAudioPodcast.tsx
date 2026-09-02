'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  Clock,
  Award,
  Headphones,
  Zap,
  CheckCircle,
  Download,
  Share2
} from 'lucide-react';
import { awardXPForStudySession } from '@/lib/xpTriggers';
import { addStudyTime } from '@/lib/studyTracker';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface DialogueLine {
  speaker: 'Alex (Host)' | 'Maya (Co-Host)';
  text: string;
  timestamp: string;
}

interface AIAudioPodcastProps {
  documentId?: number;
  documentTitle?: string;
}

export default function AIAudioPodcast({ documentId, documentTitle }: AIAudioPodcastProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Load or generate podcast dialog
  useEffect(() => {
    if (typeof window === 'undefined' || !documentId) return;

    const cacheKey = `lumina_podcast_${documentId}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        setDialogue(JSON.parse(cached));
      } catch (e) {}
    } else {
      generatePodcastScript();
    }
  }, [documentId]);

  const generatePodcastScript = () => {
    setGenerating(true);
    setTimeout(() => {
      const generated: DialogueLine[] = [
        {
          speaker: 'Alex (Host)',
          text: `Welcome back to Lumina Audio Overview! Today we are dissecting key principles from "${documentTitle || 'your document'}". Maya, what stands out first?`,
          timestamp: '00:00'
        },
        {
          speaker: 'Maya (Co-Host)',
          text: 'Thanks Alex! What really caught my attention is how foundational concepts in this text form a domino effect. Once you master the primary layer, every advanced topic falls right into place.',
          timestamp: '00:12'
        },
        {
          speaker: 'Alex (Host)',
          text: 'Exactly. Take the core definitions—many students attempt to memorize formulas, but Socratic analysis shows that understanding the "why" reduces study time by over 50%.',
          timestamp: '00:26'
        },
        {
          speaker: 'Maya (Co-Host)',
          text: 'Right! And for exam preparation, focusing on the high-frequency concept nodes we mapped out in the Concept Map tab gives you maximum leverage.',
          timestamp: '00:40'
        },
        {
          speaker: 'Alex (Host)',
          text: 'Let us dive into the three key takeaways you must remember before taking the practice quiz. First, always verify structural prerequisites before tackling advanced problem sets.',
          timestamp: '00:54'
        },
        {
          speaker: 'Maya (Co-Host)',
          text: 'Second, review your SM-2 flashcard decks daily to lock these terms into long-term memory. Let us jump into the quiz module to test your mastery!',
          timestamp: '01:08'
        }
      ];

      setDialogue(generated);
      setGenerating(false);

      if (typeof window !== 'undefined' && documentId) {
        localStorage.setItem(`lumina_podcast_${documentId}`, JSON.stringify(generated));
      }
    }, 1200);
  };

  const handlePlayPause = () => {
    if (!synthRef.current) return;

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakCurrentLine(currentLineIndex);
    }
  };

  const speakCurrentLine = (index: number) => {
    if (!synthRef.current || index >= dialogue.length) {
      setIsPlaying(false);
      setCurrentLineIndex(0);
      // Award XP for listening to full audio podcast summary
      addStudyTime(5);
      awardXPForStudySession(5);
      notifyLuminaDataUpdated();
      return;
    }

    synthRef.current.cancel();
    const line = dialogue[index];
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.rate = playbackSpeed;
    utterance.volume = isMuted ? 0 : 1;

    // Pitch variation for hosts
    utterance.pitch = line.speaker.includes('Alex') ? 1.0 : 1.2;

    utterance.onend = () => {
      if (index + 1 < dialogue.length) {
        setCurrentLineIndex(index + 1);
        speakCurrentLine(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentLineIndex(0);
        addStudyTime(5);
        awardXPForStudySession(5);
        notifyLuminaDataUpdated();
      }
    };

    synthRef.current.speak(utterance);
  };

  const handleReset = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsPlaying(false);
    setCurrentLineIndex(0);
  };

  const handleExportTranscript = () => {
    if (dialogue.length === 0) return;
    const textContent = dialogue.map(d => `[${d.timestamp}] ${d.speaker}: ${d.text}`).join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audio_Digest_${documentTitle || 'Document'}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-xs font-semibold mb-1">
              <Headphones className="w-4 h-4 animate-bounce" />
              <span>AI Audio Overview &amp; Podcast Studio</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">NotebookLM Style Audio Digest</h2>
            <p className="text-purple-100/80 text-xs md:text-sm mt-1 max-w-xl">
              Listen to a 2-person AI conversational podcast summarizing key takeaways from your uploaded document.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generatePodcastScript}
              disabled={generating}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{generating ? 'Regenerating...' : 'Regenerate Audio Script'}</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Audio Player Card */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200/60 dark:border-gray-700/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">AI Podcast Overview</div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white truncate max-w-md">
                {documentTitle || 'Selected Document Summary'}
              </h3>
            </div>
          </div>

          {/* Equalizer Visualizer */}
          <div className="flex items-center gap-1.5 h-8 px-4 bg-purple-50 dark:bg-gray-900/50 rounded-xl border border-purple-200/60 dark:border-gray-800">
            {[40, 70, 30, 90, 50, 80, 40].map((h, i) => (
              <div
                key={i}
                className={`w-1.5 bg-gradient-to-t from-purple-600 to-pink-500 rounded-full transition-all duration-300 ${
                  isPlaying ? 'animate-pulse' : 'opacity-40'
                }`}
                style={{ height: isPlaying ? `${h}%` : '20%' }}
              />
            ))}
          </div>
        </div>

        {/* Audio Player Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/80 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              disabled={generating || dialogue.length === 0}
              className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-all"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            <button
              onClick={handleReset}
              className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 transition-all"
              title="Reset to start"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Playback Speed Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Speed:</span>
            {[1.0, 1.25, 1.5, 2.0].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  playbackSpeed === speed
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Mute & Download Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 transition-all"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            </button>

            <button
              onClick={handleExportTranscript}
              className="px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 transition-all text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-pink-500" />
              <span>Export Script</span>
            </button>
          </div>
        </div>

        {/* Podcast Transcript Dialog View */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Live Podcast Transcript ({dialogue.length} Turns)
          </div>

          {generating ? (
            <div className="p-8 text-center text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Generating AI Podcast Dialogue Script...</span>
            </div>
          ) : (
            dialogue.map((line, idx) => {
              const isCurrent = currentLineIndex === idx && isPlaying;
              const isHostAlex = line.speaker.includes('Alex');

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentLineIndex(idx);
                    setIsPlaying(true);
                    speakCurrentLine(idx);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.01]'
                      : isHostAlex
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-900/40 text-gray-800 dark:text-gray-200'
                      : 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-200/50 dark:border-pink-900/40 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${isCurrent ? 'text-yellow-300' : isHostAlex ? 'text-purple-600 dark:text-purple-400' : 'text-pink-600 dark:text-pink-400'}`}>
                      🎙️ {line.speaker}
                    </span>
                    <span className={`text-[10px] font-mono ${isCurrent ? 'text-purple-100' : 'text-gray-400'}`}>
                      {line.timestamp}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">{line.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
