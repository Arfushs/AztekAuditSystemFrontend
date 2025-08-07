// src/app/admin/layout.tsx
'use client';

import AuthGuard from '@/components/layout/AuthGuard';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [canRender, setCanRender] = useState(false);

    useEffect(() => {
        // Client-side check
        const accessKey = localStorage.getItem('accessKey');
        const userRole = localStorage.getItem('userRole');

        if (!accessKey || !userRole) {
            console.log('🚫 No auth in admin layout, redirecting...');
            window.location.replace('/login');
            return;
        }

        if (userRole !== 'admin') {
            console.log('🚫 Not admin in layout, redirecting to own panel...');
            window.location.replace(`/${userRole}`);
            return;
        }

        setCanRender(true);
    }, []);

    if (!canRender) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard requiredRole="admin">
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm border-b">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h1 style={{ color: 'black', fontWeight: 'bold' }} className="text-xl">Aztek Admin Panel</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Yönetici</span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('accessKey');
                                    localStorage.removeItem('userRole');
                                    window.location.href = '/login';
                                }}
                                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                </header>
                <main className="p-6">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}