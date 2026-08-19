'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getAllUsers } from '@/lib/auth';

export default function OAuthUserSync() {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user && typeof window !== 'undefined') {
            // @ts-ignore
            if (session.user.isOAuth) {
                // This is an OAuth user, sync to localStorage
                const users = JSON.parse(localStorage.getItem('lumina_users') || '[]');

                const existingUser = users.find((u: any) => u.email === session.user?.email);

                if (!existingUser) {
                    // Create new user in localStorage
                    const newUser = {
                        id: Date.now(),
                        username: session.user.name || session.user.email?.split('@')[0] || 'user',
                        email: session.user.email || '',
                        firstName: session.user.name?.split(' ')[0] || '',
                        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
                        avatar: session.user.image,
                        createdAt: new Date().toISOString(),
                    };

                    users.push(newUser);
                    localStorage.setItem('lumina_users', JSON.stringify(users));

                    // Set as current user in auth storage
                    const authData = {
                        user: newUser,
                        token: `oauth_${newUser.id}_${Date.now()}`,
                    };
                    localStorage.setItem('lumina_auth', JSON.stringify(authData));
                } else {
                    // User exists, just set as current
                    const authData = {
                        user: existingUser,
                        token: `oauth_${existingUser.id}_${Date.now()}`,
                    };
                    localStorage.setItem('lumina_auth', JSON.stringify(authData));
                }
            }
        }
    }, [session]);

    return null; // This component doesn't render anything
}