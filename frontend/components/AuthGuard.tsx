'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isAuthenticated, initializeAuth } from '@/lib/auth';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

export default function AuthGuard({ children, requireAuth = false, redirectTo = '/dashboard' }: AuthGuardProps) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isAllowed, setIsAllowed] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Only run once on mount
        initializeAuth();
    }, []);

    useEffect(() => {
        // Don't check until session is loaded
        if (status === 'loading') {
            return;
        }

        // Prevent multiple redirects
        if (hasRedirected.current) {
            return;
        }

        const hasSession = status === 'authenticated';
        const hasLocalAuth = isAuthenticated();
        const authenticated = hasSession || hasLocalAuth;

        if (requireAuth && !authenticated) {
            // User needs auth but doesn't have it
            hasRedirected.current = true;
            router.push('/login');
            return;
        }

        if (!requireAuth && authenticated) {
            // User is logged in but trying to access login/signup
            hasRedirected.current = true;
            router.push(redirectTo);
            return;
        }

        // User is allowed
        setIsAllowed(true);
        setIsChecking(false);
    }, [status, requireAuth, redirectTo, router]);

    if (isChecking || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    return isAllowed ? <>{children}</> : null;
}