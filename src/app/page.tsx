// src/app/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Kullanıcı giriş yapmışsa rolüne göre yönlendir
        switch (user?.role) {
            case 'admin':
                router.push('/admin');
                break;
            case 'inspector':
                router.push('/inspector');
                break;
            case 'reporter':
                router.push('/reporter');
                break;
            default:
                router.push('/login');
        }
    }, [isLoading, isAuthenticated, user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Yönlendiriliyor...</p>
            </div>
        </div>
    );
}