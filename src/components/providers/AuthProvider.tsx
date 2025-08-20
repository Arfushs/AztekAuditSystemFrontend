// src/components/providers/AuthProvider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        console.log('🚀 AuthProvider mounted, pathname:', pathname);
        console.log('🌍 Window location:', window.location.href);
        console.log('🔧 localStorage available:', typeof Storage !== 'undefined');

        // Client-side kontrolü
        if (typeof window === 'undefined') {
            console.log('❌ Not in browser context');
            return;
        }

        // Protected routes'a client eklendi
        const protectedRoutes = ['/admin', '/inspector', '/reporter', '/client'];
        const isProtectedRoute = protectedRoutes.some(route => {
            const matches = pathname.startsWith(route);
            console.log(`📝 Checking route ${route} against ${pathname}: ${matches}`);
            return matches;
        });

        console.log('🛡️ Is protected route:', isProtectedRoute);

        if (isProtectedRoute) {
            const accessKey = localStorage.getItem('accessKey');
            const userRole = localStorage.getItem('userRole');

            console.log('🔍 AuthProvider check:', {
                pathname,
                hasAuth: !!accessKey,
                role: userRole,
                accessKeyValue: accessKey
            });

            if (!accessKey || !userRole) {
                console.log('🚫 No authentication, redirecting to login');
                console.log('🔄 About to redirect to /login');

                // Farklı redirect yöntemleri dene
                console.log('🔄 Method 1: window.location.replace');
                window.location.replace('/login');

                // Backup yöntem
                setTimeout(() => {
                    console.log('🔄 Method 2: window.location.href');
                    window.location.href = '/login';
                }, 100);

                return;
            }

            // Rol kontrolü (client eklendi)
            const currentRole = pathname.split('/')[1]; // admin, inspector, reporter, client
            console.log('🎭 Role check:', { currentRole, userRole });

            // Valid roles array'ine client eklendi
            const validRoles = ['admin', 'inspector', 'reporter', 'client'];

            if (!validRoles.includes(userRole)) {
                console.log('🚫 Invalid user role, redirecting to login');
                window.location.replace('/login');
                return;
            }

            if (currentRole !== userRole) {
                console.log('🚫 Wrong role access, redirecting to correct panel');
                const targetUrl = `/${userRole}`;
                console.log('🔄 Redirecting to:', targetUrl);
                window.location.replace(targetUrl);
                return;
            }

            console.log('✅ Authentication passed');
        }
    }, [pathname]);

    return <>{children}</>;
}