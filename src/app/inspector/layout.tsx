// src/app/inspector/layout.tsx
'use client';

import AuthGuard from '@/components/layout/AuthGuard';
import { useEffect, useState } from 'react';
import { User } from '@/types';
import { apiService } from '@/lib/api';
import { FileText, LogOut, User as UserIcon } from 'lucide-react';

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
    const [canRender, setCanRender] = useState(false);
    const [inspector, setInspector] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Client-side check
        const accessKey = localStorage.getItem('accessKey');
        const userRole = localStorage.getItem('userRole');

        if (!accessKey || !userRole) {
            console.log('🚫 No auth in inspector layout, redirecting...');
            window.location.replace('/login');
            return;
        }

        if (userRole !== 'inspector') {
            console.log('🚫 Not inspector in layout, redirecting to own panel...');
            window.location.replace(`/${userRole}`);
            return;
        }

        loadInspectorProfile();
        setCanRender(true);
    }, []);

    const loadInspectorProfile = async () => {
        try {
            const inspectorId = localStorage.getItem('userId') || '';
            if (!inspectorId) {
                console.error('Inspector ID not found');
                return;
            }

            const response = await apiService.inspector.getProfile(inspectorId);
            setInspector(response.data);
        } catch (error) {
            console.error('Failed to load inspector profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessKey');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
    };

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
        <AuthGuard requiredRole="inspector">
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm border-b">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Denetçi Panel</h1>
                                {isLoading ? (
                                    <p className="text-sm text-gray-600">Yükleniyor...</p>
                                ) : inspector ? (
                                    <div className="flex items-center space-x-3">
                                        <p className="text-sm text-gray-600">
                                            Hoş geldin, <span className="font-medium text-blue-600">{inspector.name}</span>
                                        </p>
                                        <div className="text-xs bg-gray-900 px-2 py-1 rounded">
                                            ID: {inspector.id}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-600">Profil yüklenemedi</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {inspector && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <UserIcon className="h-4 w-4" />
                                    <span>{inspector.name}</span>
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