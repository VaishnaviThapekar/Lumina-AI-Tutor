'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getToken, getCurrentUser, syncOAuthSession } from '@/lib/auth';

/**
 * When a user signs in via Google/GitHub, NextAuth creates its own session,
 * but our app's actual features (upload, chat, quiz, flashcards) all run
 * against the real FastAPI backend and require OUR JWT, not NextAuth's.
 *
 * This component watches for a NextAuth session and, if we don't already
 * have a backend token FOR THAT SAME ACCOUNT (someone may have switched
 * Google accounts while an old token was still stored), exchanges the
 * session for a real one by calling /api/auth/oauth-login. Mounted once
 * in the root layout so it runs on every page.
 */
export default function OAuthUserSync() {
  const { data: session, status } = useSession();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    if (syncing) return;

    const existingUser = getCurrentUser();
    if (getToken() && existingUser?.email === session.user.email) {
      return; // already have a real token for this exact account
    }

    setSyncing(true);
    syncOAuthSession(session.user.email, session.user.name).finally(() => {
      setSyncing(false);
    });
  }, [status, session, syncing]);

  return null;
}
