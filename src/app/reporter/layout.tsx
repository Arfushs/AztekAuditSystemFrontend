// src/app/reporter/layout.tsx
'use client';

import AuthGuard from '@/components/layout/AuthGuard';
import { useEffect, useState } from 'react';
import { User } from '@/types';
import { apiService } from '@/lib/api';
import { FileText, LogOut, User as UserIcon, Briefcase } from 'lucide-react';

export default function ReporterLayout({ children }: { children: React.ReactNode }) {
    const [canRender, setCanRender] = useState(false);
    const [reporter, setReporter] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Client-side check
        const accessKey = localStorage.getItem('accessKey');
        const userRole = localStorage.getItem('userRole');

        if (!accessKey || !userRole) {
            console.log('🚫 No auth in reporter layout, redirecting...');
            window.location.replace('/login');
            return;
        }

        if (userRole !== 'reporter') {
            console.log('🚫 Not reporter in layout, redirecting to own panel...');
            window.location.replace(`/${userRole}`);
            return;
        }

        loadReporterProfile();
        setCanRender(true);
    }, []);

    const loadReporterProfile = async () => {
        try {
            // Reporter profil API'si henüz yok, localStorage'dan bilgi alalım
            const reporterId = localStorage.getItem('userId') || '';
            const reporterName = localStorage.getItem('userName') || '';

            if (reporterId && reporterName) {
                setReporter({
                    id: reporterId,
                    name: reporterName,
                    role: 'reporter',
                    accessKey: localStorage.getItem('accessKey') || '',
                    createdAt: ''
                });
            }
        } catch (error) {
            console.error('Failed to load reporter profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessKey');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        window.location.href = '/login';
    };

    if (!canRender) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard requiredRole="reporter">
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm border-b">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Briefcase className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Raporcu Panel</h1>
                                {isLoading ? (
                                    <p className="text-sm text-gray-600">Yükleniyor...</p>
                                ) : reporter ? (
                                    <div className="flex items-center space-x-3">
                                        <p className="text-sm text-gray-600">
                                            Hoş geldin, <span className="font-medium text-green-600">{reporter.name}</span>
                                        </p>
                                        <div className="text-xs bg-gray-900 px-2 py-1 rounded">
                                            ID: {reporter.id}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-600">Profil yüklenemedi</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {reporter && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <UserIcon className="h-4 w-4" />
                                    <span>{reporter.name}</span>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Çıkış</span>
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