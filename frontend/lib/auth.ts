// lib/auth.ts - Real authentication against the FastAPI backend

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'lumina_token';
const USER_KEY = 'lumina_user';

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  // Legacy fields some older components still reference; not stored by the
  // real backend today. Kept optional so those components still compile.
  firstName?: string;
  lastName?: string;
  createdAt: string; // alias of created_at, always populated by storeSession
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

// ---- Token / cached-user storage ----

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

const storeSession = (token: string, user: User): User => {
  const enriched: User = { ...user, createdAt: user.created_at };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(enriched));
  return enriched;
};

export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ---- Real signup / login against the backend ----

export const signUp = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
      username,
      email,
      password,
    });
    const { access_token, user } = response.data;
    const enriched = storeSession(access_token, user);
    return { success: true, user: enriched };
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return { success: false, error: detail || 'Signup failed. Please try again.' };
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });
    const { access_token, user } = response.data;
    const enriched = storeSession(access_token, user);
    return { success: true, user: enriched };
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return { success: false, error: detail || 'Incorrect email or password' };
  }
};

// Aliases matching names used elsewhere in the app
export const login = signIn;
export const signup = signUp;

// ---- Legacy compatibility shims ----
// These exist so older components (UserProfile, AuthGuard, social features)
// still compile against the real backend auth. Some are honest "not wired up
// yet" stubs rather than fake success, since the backend doesn't have real
// endpoints for them today.

export const initializeAuth = (): boolean => {
  return isAuthenticated();
};

// There's no backend endpoint to list all users (and there shouldn't be one
// without admin-only access — exposing every user's data to any logged-in
// client would be a real privacy hole). Returns just the current user so
// features built on this don't crash, but "social" features that need a
// real user directory will need a proper backend endpoint first.
export const getAllUsers = (): User[] => {
  const current = getCurrentUser();
  return current ? [current] : [];
};

export const updateUserProfile = (
  userId: number,
  updates: Partial<User>
): AuthResult => {
  return {
    success: false,
    error: 'Profile editing isn\'t connected to the backend yet. (The backend has a /api/settings endpoint that could be wired up here.)',
  };
};

export const changePassword = (
  userId: number,
  currentPassword: string,
  newPassword: string
): AuthResult => {
  return {
    success: false,
    error: 'Password change isn\'t connected to the backend yet. Use "Forgot password" from the login page instead.',
  };
};

export const deleteAccount = (userId: number): AuthResult => {
  return {
    success: false,
    error: 'Account deletion isn\'t connected to the backend yet.',
  };
};



export const validateEmail = (email: string): string | null => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!re.test(email)) return 'Enter a valid email address';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  return null;
};

// Kept as a no-op for backward compatibility with pages that still call it
export const createDemoAccount = () => {};
