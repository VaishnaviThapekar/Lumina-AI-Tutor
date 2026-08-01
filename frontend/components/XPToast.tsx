'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Star, TrendingUp } from 'lucide-react';

export interface Toast {
  id: string;
  xp: number;
  message: string;
  type: 'xp' | 'achievement' | 'levelup';
}

interface XPToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function XPToast({ toasts, onRemove }: XPToastProps) {
  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, 3000);

      return () => clearTimeout(timer);
    });
  }, [toasts, onRemove]);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in-right"
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          {toast.type === 'levelup' ? (
            <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]">
              <div className="text-3xl animate-bounce">🎉</div>
              <div>
                <div className="font-bold text-xl">LEVEL UP!</div>
                <div className="text-sm opacity-90">{toast.message}</div>
              </div>
              <Star className="w-8 h-8 animate-spin" />
            </div>
          ) : toast.type === 'achievement' ? (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]">
              <Trophy className="w-8 h-8 text-yellow-300" />
              <div>
                <div className="font-bold text-lg">Achievement!</div>
                <div className="text-sm opacity-90">{toast.message}</div>
              </div>
              <div className="text-xl font-bold">+{toast.xp} XP</div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px]">
              <Zap className="w-6 h-6 text-yellow-300" />
              <div className="flex-1">
                <div className="font-bold text-lg">+{toast.xp} XP</div>
                <div className="text-sm opacity-90">{toast.message}</div>
              </div>
              <TrendingUp className="w-5 h-5" />
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Hook for managing toasts
export const useXPToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (xp: number, message: string, type: 'xp' | 'achievement' | 'levelup' = 'xp') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, xp, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};