'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Bell, Palette, Database, Key, Save, Check, AlertCircle } from 'lucide-react';
import { getCurrentUser, User as UserType } from '@/lib/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'appearance' | 'data'>('profile');

  useEffect(() => {
    if (isOpen) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Settings</h2>
                {user && (
                  <p className="text-white/80 mt-1">Manage your account preferences</p>
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

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
            {user ? (
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      {user.firstName?.[0] || user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName || user.username}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { id: 'profile', icon: User, label: 'Profile' },
                    { id: 'notifications', icon: Bell, label: 'Notifications' },
                    { id: 'appearance', icon: Palette, label: 'Appearance' },
                    { id: 'data', icon: Database, label: 'Data' },
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${activeSection === section.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      <section.icon className="w-4 h-4" />
                      {section.label}
                    </button>
                  ))}
                </div>

                {/* Profile Section */}
                {activeSection === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={user.firstName || ''}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={user.lastName || ''}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={user.username}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mt-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        To edit your profile, click your avatar in the header and go to Profile settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Notifications Section */}
                {activeSection === 'notifications' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Email Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-purple-600" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Study Reminders</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Daily study reminders</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-purple-600" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Quiz Results</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Get notified of quiz completions</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-purple-600" />
                    </div>
                  </div>
                )}

                {/* Appearance Section */}
                {activeSection === 'appearance' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Theme</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <button className="p-4 bg-white dark:bg-gray-800 border-2 border-purple-600 rounded-xl">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg mx-auto mb-2"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                        </button>
                        <button className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-purple-400">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg mx-auto mb-2"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                        </button>
                        <button className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-purple-400">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-600 to-gray-900 rounded-lg mx-auto mb-2"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Auto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Section */}
                {activeSection === 'data' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Account Created</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">User ID</h4>
                      <p className="text-gray-600 dark:text-gray-400 font-mono">{user.id}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}