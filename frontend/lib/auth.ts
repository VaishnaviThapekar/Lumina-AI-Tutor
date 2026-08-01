// lib/auth.ts - Enhanced authentication with persistent sessions

const USERS_KEY = 'lumina_users';
const SESSION_KEY = 'lumina_session';
const REMEMBER_ME_KEY = 'lumina_remember_me';

export interface User {
  id: number;
  email: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface Session {
  userId: number;
  email: string;
  username: string;
  expiresAt: number;
  rememberMe: boolean;
}

// Create demo account on app initialization (optional - can be removed)
export const createDemoAccount = () => {
  // Demo account creation removed
  // Users must sign up normally
};

// Get all users
const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

// Get current session
export const getSession = (): Session | null => {
  if (typeof window === 'undefined') return null;

  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;

  const session: Session = JSON.parse(sessionData);

  // Check if session is expired
  if (Date.now() > session.expiresAt) {
    // If not remember me, clear session
    if (!session.rememberMe) {
      logout();
      return null;
    }
    // If remember me, extend session
    extendSession(session);
  }

  return session;
};

// Extend session expiration
const extendSession = (session: Session) => {
  const newExpiry = session.rememberMe
    ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    : Date.now() + (24 * 60 * 60 * 1000); // 1 day

  session.expiresAt = newExpiry;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

// Get current user
export const getCurrentUser = (): User | null => {
  const session = getSession();
  if (!session) return null;

  const users = getUsers();
  return users.find(u => u.id === session.userId) || null;
};

// Sign up new user
export const signUp = (email: string, username: string, password: string): { success: boolean; error?: string } => {
  const users = getUsers();

  // Check if email already exists
  if (users.some(u => u.email === email)) {
    return { success: false, error: 'Email already exists' };
  }

  // Create new user
  const newUser: User = {
    id: Date.now(),
    email,
    username,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Auto-login after signup with remember me
  createSession(newUser, true);

  return { success: true };
};

// Sign in user
export const signIn = (email: string, password: string, rememberMe: boolean = true): { success: boolean; error?: string } => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  createSession(user, rememberMe);
  return { success: true };
};

// Create session
const createSession = (user: User, rememberMe: boolean = true) => {
  const expiresAt = rememberMe
    ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days for remember me
    : Date.now() + (24 * 60 * 60 * 1000); // 1 day otherwise

  const session: Session = {
    userId: user.id,
    email: user.email,
    username: user.username,
    expiresAt,
    rememberMe,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Store remember me preference
  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  // Don't remove REMEMBER_ME_KEY - keep the preference
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};

// Update user profile
export const updateUserProfile = (userId: number, updates: Partial<User>): { success: boolean; error?: string } => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return { success: false, error: 'User not found' };
  }

  // Check if email is being changed and already exists
  if (updates.email && updates.email !== users[userIndex].email) {
    if (users.some(u => u.email === updates.email)) {
      return { success: false, error: 'Email already exists' };
    }
  }

  // Update user
  users[userIndex] = { ...users[userIndex], ...updates };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Update session if email or username changed
  if (updates.email || updates.username) {
    const session = getSession();
    if (session) {
      session.email = updates.email || session.email;
      session.username = updates.username || session.username;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }

  return { success: true };
};

// Change password
export const changePassword = (userId: number, currentPassword: string, newPassword: string): { success: boolean; error?: string } => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.password !== currentPassword) {
    return { success: false, error: 'Current password is incorrect' };
  }

  user.password = newPassword;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { success: true };
};

// Delete account
export const deleteAccount = (userId: number, password: string): { success: boolean; error?: string } => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.password !== password) {
    return { success: false, error: 'Incorrect password' };
  }

  const updatedUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

  logout();

  return { success: true };
};

// Initialize auth system - check for existing session
export const initializeAuth = () => {
  createDemoAccount();

  // Check if there's a valid session
  const session = getSession();
  if (session) {
    // Session is valid, user stays logged in
    return true;
  }

  return false;
};

// OAuth Login - Google
export const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
  // In a real implementation, this would redirect to Google OAuth
  // For now, return a placeholder
  return {
    success: false,
    error: 'Google OAuth integration coming soon! Please use email/password for now.',
  };
};

// OAuth Login - GitHub
export const signInWithGitHub = async (): Promise<{ success: boolean; error?: string }> => {
  // In a real implementation, this would redirect to GitHub OAuth
  // For now, return a placeholder
  return {
    success: false,
    error: 'GitHub OAuth integration coming soon! Please use email/password for now.',
  };
};

// Handle OAuth callback (for when user returns from OAuth provider)
export const handleOAuthCallback = async (
  provider: 'google' | 'github',
  userData: { email: string; name: string; id: string }
): Promise<{ success: boolean; error?: string }> => {
  const users = getUsers();

  // Check if user already exists with this OAuth provider
  let user = users.find(u => u.email === userData.email);

  if (!user) {
    // Create new user from OAuth data
    user = {
      id: Date.now(),
      email: userData.email,
      username: userData.name,
      password: '', // OAuth users don't have passwords
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Create session
  createSession(user, true); // Always remember OAuth logins

  return { success: true };
};

// Get all users (for social features)
export const getAllUsers = (): User[] => {
  return getUsers();
};

// Search users by username or email
export const searchUsers = (query: string): User[] => {
  const users = getUsers();
  const lowerQuery = query.toLowerCase();
  return users.filter(
    u => u.username.toLowerCase().includes(lowerQuery) ||
      u.email.toLowerCase().includes(lowerQuery)
  );
};