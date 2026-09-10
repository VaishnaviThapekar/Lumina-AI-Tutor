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
  firstName?: string;
  lastName?: string;
  createdAt: string; // alias of created_at, always populated by storeSession
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

// Safe JSON parser
export const safeJsonParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

// ---- Token / cached-user storage ----

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(USER_KEY);
  return safeJsonParse<User | null>(data, null);
};

const storeSession = (token: string, user: User): User => {
  const enriched: User = { ...user, createdAt: user.created_at };
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(enriched));
  }
  return enriched;
};

export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    import('next-auth/react').then(({ signOut }) => {
      signOut({ redirect: false });
    });
  }
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

// ---- Secure OAuth sync with token verification ----

export const syncOAuthSession = async (
  provider: string,
  token: string,
  name?: string | null,
  email?: string | null
): Promise<AuthResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/oauth-login`, {
      provider,
      token,
      name: name || undefined,
      email: email || undefined,
    });
    const { access_token, user } = response.data;
    const enriched = storeSession(access_token, user);
    return { success: true, user: enriched };
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return { success: false, error: detail || 'Could not complete OAuth authentication.' };
  }
};

// ---- Settings Operations ----

export const initializeAuth = (): boolean => {
  return isAuthenticated();
};

export const getAllUsers = (): User[] => {
  const current = getCurrentUser();
  return current ? [current] : [];
};

export const updateUserProfile = async (
  userId: number,
  updates: Partial<User>
): Promise<AuthResult> => {
  try {
    const token = getToken();
    const response = await axios.put(
      `${API_BASE_URL}/api/settings/profile`,
      { username: updates.username, email: updates.email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const current = getCurrentUser();
    const updated: User = {
      ...(current as User),
      username: response.data.username,
      email: response.data.email,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
    return { success: true, user: updated };
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return { success: false, error: detail || 'Failed to update profile' };
  }
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> => {
  try {
    const token = getToken();
    await axios.put(
      `${API_BASE_URL}/api/settings/password`,
      { current_password: currentPassword, new_password: newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true };
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return { success: false, error: detail || 'Failed to change password' };
  }
};

export const deleteAccount = async (
  userId: number,
  password?: string
): Promise<AuthResult> => {
  try {
    const token = getToken();
    await axios.delete(`${API_BASE_URL}/api/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { password: password || undefined },
    });
    logout();
    return { success: true };
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return { success: false, error: detail || 'Failed to delete account' };
  }
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
  if (password.length > 72) return 'Password must not exceed 72 characters';
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 50) return 'Username must not exceed 50 characters';
  return null;
};

export const createDemoAccount = () => {};
