'use client';

import React, { useState } from 'react';
import { Download, FileText, Database, Printer, Upload, Check, X, FileJson, FileSpreadsheet, Table, Archive, RefreshCw } from 'lucide-react';
import {
  exportStatsToCSV,
  exportStatsToJSON,
  exportStatsToText,
  exportNotesToCSV,
  exportNotesToJSON,
  exportNotesToText,
  exportNotesToMarkdown,
  createFullBackup,
  restoreFromBackup,
  printStats,
  printNotes
} from '@/lib/exportUtils';
import { getStats } from '@/lib/studyTracker';
import { getCurrentUser } from '@/lib/auth';

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportMenu({ isOpen, onClose }: ExportMenuProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'backup'>('export');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportSuccess, setExportSuccess] = useState(false);
  const user = getCurrentUser();

  if (!isOpen) return null;

  const showSuccess = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const handleExportStats = (format: 'csv' | 'json' | 'txt' | 'print') => {
    const stats = getStats();

    switch (format) {
      case 'csv':
        exportStatsToCSV(stats);
        break;
      case 'json':
        exportStatsToJSON(stats);
        break;
      case 'txt':
        exportStatsToText(stats);
        break;
      case 'print':
        printStats(stats);
        break;
    }

    showSuccess();
  };

  const handleExportNotes = (format: 'csv' | 'json' | 'txt' | 'md' | 'print') => {
    // Get notes from localStorage
    const notesData = localStorage.getItem('studyNotes');
    const notes = notesData ? JSON.parse(notesData) : [];

    switch (format) {
      case 'csv':
        exportNotesToCSV(notes);
        break;
      case 'json':
        exportNotesToJSON(notes);
        break;
      case 'txt':
        exportNotesToText(notes);
        break;
      case 'md':
        exportNotesToMarkdown(notes);
        break;
      case 'print':
        printNotes(notes);
        break;
    }

    showSuccess();
  };

  const handleBackup = () => {
    createFullBackup();
    showSuccess();
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        restoreFromBackup(backupData);
        setRestoreStatus('success');
        setTimeout(() => setRestoreStatus('idle'), 3000);
      } catch (error) {
        setRestoreStatus('error');
        setTimeout(() => setRestoreStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-purple-200/50 dark:border-purple-700/30">

          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Download className="w-8 h-8" />
                  Export & Backup
                </h2>
                {user && (
                  <p className="text-white/80 mt-1">Download your data • {user.email}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Success Message */}
          {exportSuccess && (
            <div className="mx-6 mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-300 font-medium">
                Export successful! Check your downloads folder.
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${activeTab === 'export'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              <Download className="w-5 h-5 inline mr-2" />
              Export Data
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${activeTab === 'backup'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              <Database className="w-5 h-5 inline mr-2" />
              Backup & Restore
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'export' ? (
              <div className="space-y-6">
                {/* Statistics Export */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Table className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Study Statistics</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Export your learning progress</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleExportStats('csv')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-center group"
                    >
                      <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">CSV</span>
                    </button>

                    <button
                      onClick={() => handleExportStats('json')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-center group"
                    >
                      <FileJson className="w-8 h-8 mx-auto mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">JSON</span>
                    </button>

                    <button
                      onClick={() => handleExportStats('txt')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-center group"
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">TXT</span>
                    </button>

                    <button
                      onClick={() => handleExportStats('print')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-center group"
                    >
                      <Printer className="w-8 h-8 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Print</span>
                    </button>
                  </div>
                </div>

                {/* Notes Export */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Study Notes</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Export all your notes</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button
                      onClick={() => handleExportNotes('csv')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-center group"
                    >
                      <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">CSV</span>
                    </button>

                    <button
                      onClick={() => handleExportNotes('json')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-center group"
                    >
                      <FileJson className="w-8 h-8 mx-auto mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">JSON</span>
                    </button>

                    <button
                      onClick={() => handleExportNotes('txt')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-center group"
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">TXT</span>
                    </button>

                    <button
                      onClick={() => handleExportNotes('md')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-center group"
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2 text-orange-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">MD</span>
                    </button>

                    <button
                      onClick={() => handleExportNotes('print')}
                      className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-center group"
                    >
                      <Printer className="w-8 h-8 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Print</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Restore Status */}
                {restoreStatus !== 'idle' && (
                  <div
                    className={`p-4 rounded-xl flex items-center gap-3 ${restoreStatus === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
                      }`}
                  >
                    {restoreStatus === 'success' ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Backup restored successfully!</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" />
                        <span className="font-medium">Failed to restore backup. Invalid file.</span>
                      </>
                    )}
                  </div>
                )}

                {/* Create Backup */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Archive className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Backup</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Download complete backup of all data</p>
                    </div>
                  </div>

                  <button
                    onClick={handleBackup}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-green-500/50 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Complete Backup
                  </button>
                </div>

                {/* Restore Backup */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Restore Backup</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Upload and restore from backup file</p>
                    </div>
                  </div>

                  <label className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold shadow-lg shadow-orange-500/50 flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-5 h-5" />
                    Upload Backup File
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestore}
                      className="hidden"
                    />
                  </label>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center">
                    ⚠️ This will overwrite all current data
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}