// src/components/layout/AuthGuard.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@/types';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    redirectTo?: string;
}

export default function AuthGuard({
                                      children,
                                      requiredRole,
                                      redirectTo = '/login'
                                  }: AuthGuardProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (isLoading) return; // Henüz yükleniyor

        // Giriş yapmamış
        if (!isAuthenticated) {
            window.location.replace('/login');
            return;
        }

        // Rol gereksinimine uymuyorsa kendi paneline yönlendir
        if (requiredRole && user?.role !== requiredRole) {
            switch (user?.role) {
                case 'admin':
                    window.location.replace('/admin');
                    break;
                case 'inspector':
                    window.location.replace('/inspector');
                    break;
                case 'reporter':
                    window.location.replace('/reporter');
                    break;
                default:
                    window.location.replace('/login');
            }
            return;
        }

        setIsChecking(false);
    }, [isLoading, isAuthenticated, user, requiredRole]);

    // Yükleniyor durumu
    if (isLoading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yetkilendirme kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    // Giriş yapmamış veya yetki yok
    if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-pulse text-gray-600">
                        Yönlendiriliyor...
                    </div>
                </div>
            </div>
        );
    }

    // Her şey tamam, içeriği göster
    return <>{children}</>;
}