/**
 * Centralized Application & API Configuration
 * Automatically detects whether we are running locally or in production (Vercel).
 */

export const getApiBaseUrl = (): string => {
  // 1. If explicit environment variable is set in Vercel/.env, use it
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // 2. If running in the browser on a deployed domain (Vercel, custom domain, etc.)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://lumina-ai-tutor-9tir.onrender.com';
    }
  }

  // 3. If running in server-side production build
  if (process.env.NODE_ENV === 'production') {
    return 'https://lumina-ai-tutor-9tir.onrender.com';
  }

  // 4. Default for local development
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
