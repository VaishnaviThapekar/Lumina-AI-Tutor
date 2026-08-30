'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { uploadDocument } from '@/lib/api';
import type { UploadResponse } from '@/lib/types';
import { awardXPForUpload } from '@/lib/xpTriggers';
import { markDocumentRead } from '@/lib/studyTracker';
import { notifyLuminaDataUpdated } from '@/lib/eventBus';

interface UploadAreaProps {
  onUploadSuccess: (document: UploadResponse) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setUploadStatus('idle');
    } else {
      alert('Please upload a PDF file');
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus('idle');
    
    try {
      const result = await uploadDocument(file);
      setUploadStatus('success');
      onUploadSuccess(result);
      
      // Award XP, track document read, and trigger live tab sync
      markDocumentRead();
      awardXPForUpload();
      notifyLuminaDataUpdated();
      
      // Reset after 2 seconds
      setTimeout(() => {
        setFile(null);
        setUploadStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Top Header Banner matching ConceptMap */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
              <Upload className="w-4 h-4 animate-bounce" />
              <span>Document Intelligence Hub</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Upload Learning Material
            </h2>
            <p className="text-purple-100/80 text-sm mt-1 max-w-xl">
              Import PDFs, lecture notes, or textbook chapters to generate RAG embeddings, AI quizzes, flashcards, and concept graphs.
            </p>
          </div>
        </div>

        {/* Decorative blur orb */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Main Glassmorphism Upload Container */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 ${
              isDragging
                ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
                : 'border-purple-300/60 dark:border-purple-700/60 hover:border-purple-500 bg-white/40 dark:bg-gray-900/40 hover:bg-purple-50/40 dark:hover:bg-gray-800/40 shadow-sm'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-200 dark:border-purple-800 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>

            <p className="text-base text-gray-800 dark:text-gray-200 mb-1 font-semibold">
              <span className="text-purple-600 dark:text-purple-400 underline decoration-purple-400 underline-offset-4">
                Click to browse
              </span>{' '}
              or drag & drop your PDF file here
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">PDF documents up to 10MB supported</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File preview */}
            <div className="flex items-center justify-between p-4 bg-purple-50/50 dark:bg-gray-900/50 rounded-xl border border-purple-200/60 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {uploadStatus === 'success' ? (
                <CheckCircle className="w-6 h-6 text-emerald-500 animate-bounce" />
              ) : (
                <button
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Upload button */}
            {uploadStatus !== 'success' && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing & Processing Document Chunks...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process & Index Document
                  </>
                )}
              </button>
            )}

            {/* Status messages */}
            {uploadStatus === 'success' && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                  ✅ Document processed and vector indexed successfully! Redirecting to tutor...
                </p>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                <p className="text-rose-700 dark:text-rose-300 font-semibold text-sm">
                  ❌ Upload failed. Operating in local demo mode.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Start Sample Documents */}
        <div className="mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            ⚡ Quick-Start Sample Learning Sets
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: 'Quantum Computing 101', icon: '⚡', desc: 'Qubits, superposition & entanglement' },
              { title: 'Machine Learning Basics', icon: '🤖', desc: 'Neural nets, gradient descent & loss' },
              { title: 'Cellular Biology', icon: '🧬', desc: 'DNA replication, ATP & mitochondria' },
            ].map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onUploadSuccess({
                    id: 100 + idx,
                    filename: `${sample.title}.pdf`,
                    pinecone_namespace: `sample_${idx}`,
                    uploaded_at: new Date().toISOString(),
                    message: 'Sample study set loaded successfully'
                  });
                }}
                className="p-4 bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-left hover:border-purple-400 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="text-2xl mb-1.5">{sample.icon}</div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {sample.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                  {sample.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadArea;
