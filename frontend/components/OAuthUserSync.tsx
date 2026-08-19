'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getToken, syncOAuthSession } from '@/lib/auth';

/**
 * When a user signs in via Google/GitHub, NextAuth creates its own session,
 * but our app's actual features (upload, chat, quiz, flashcards) all run
 * against the real FastAPI backend and require OUR JWT, not NextAuth's.
 *
 * This component watches for a NextAuth session and, if we don't already
 * have a backend token, exchanges the session for a real one by calling
 * /api/auth/oauth-login. Mounted once in the root layout so it runs on
 * every page.
 */
export default function OAuthUserSync() {
  const { data: session, status } = useSession();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    if (getToken()) return; // already have a real backend token
    if (syncing) return;

    setSyncing(true);
    syncOAuthSession(session.user.email, session.user.name).finally(() => {
      setSyncing(false);
    });
  }, [status, session, syncing]);

  return null;
}
