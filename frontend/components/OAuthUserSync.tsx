'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getToken, getCurrentUser, syncOAuthSession } from '@/lib/auth';

/**
 * When a user signs in via Google/GitHub, NextAuth creates its own session.
 * This component securely exchanges the verified provider identity with
 * the backend /api/auth/oauth-login endpoint.
 */
export default function OAuthUserSync() {
  const { data: session, status } = useSession();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    if (syncing) return;

    const existingUser = getCurrentUser();
    const targetName = session.user.name || session.user.email.split('@')[0];
    if (getToken() && existingUser?.email === session.user.email && existingUser?.username === targetName) {
      return; // already have a real token for this exact account
    }

    const provider = (session as any).provider || 'google';
    const providerToken = (session as any).providerToken || (session as any).id || '';

    setSyncing(true);
    syncOAuthSession(provider, providerToken, session.user.name, session.user.email).finally(() => {
      setSyncing(false);
    });
  }, [status, session, syncing]);

  return null;
}
