'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { uploadDocument } from '@/lib/api';
import type { UploadResponse } from '@/lib/types';

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
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Upload Learning Material
      </h3>
      
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-700 mb-2">
            <span className="font-semibold text-primary-600">Click to upload</span>
            {' '}or drag and drop
          </p>
          <p className="text-sm text-gray-500">PDF files only (Max 10MB)</p>
          
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
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-500" />
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {uploadStatus === 'success' ? (
              <CheckCircle className="w-6 h-6 text-success-500" />
            ) : (
              <button
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          
          {/* Upload button */}
          {uploadStatus !== 'success' && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing document...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload and Process
                </>
              )}
            </button>
          )}
          
          {/* Status messages */}
          {uploadStatus === 'success' && (
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-success-700 font-medium">
                ✅ Document uploaded and processed successfully!
              </p>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-danger-700 font-medium">
                ❌ Upload failed. Please try again.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Start Sample Documents */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          ⚡ Or Quick-Start with Sample Study Material
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
              className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/40 rounded-xl text-left hover:scale-[1.02] hover:shadow-md transition-all group"
            >
              <div className="text-xl mb-1">{sample.icon}</div>
              <h4 className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                {sample.title}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {sample.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadArea;
