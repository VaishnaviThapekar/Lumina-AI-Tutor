'use client';

import { useEffect } from 'react';
import { pingBackend } from '@/lib/api';

/**
 * Background Keep-Alive Ping Component
 * Triggers a non-blocking health check ping to Render backend on page load
 * so the container wakes up early before the user completes action requests.
 */
export default function BackendKeepAlive() {
  useEffect(() => {
    // Non-blocking background keep-alive call
    pingBackend().catch(() => {});
  }, []);

  return null;
}
