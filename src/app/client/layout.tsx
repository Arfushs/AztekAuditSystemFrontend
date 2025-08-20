// src/app/client/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { Building2, LogOut, User as UserIcon } from 'lucide-react';
import { apiService } from '@/lib/api';

interface ClientLayoutProps {
    children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    const [canRender, setCanRender] = useState(false);
    const [clientName, setClientName] = useState<string>('');
    const [clientId, setClientId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Client-side check
        const accessKey = localStorage.getItem('accessKey');
        const userRole = localStorage.getItem('userRole');

        if (!accessKey || !userRole) {
            console.log('🚫 No auth in client layout, redirecting...');
            window.location.replace('/login');
            return;
        }

        if (userRole !== 'client') {
            console.log('🚫 Not client in layout, redirecting to own panel...');
            window.location.replace(`/${userRole}`);
            return;
        }

        loadClientProfile();
        setCanRender(true);
    }, []);

    const loadClientProfile = async () => {
        try {
            const response = await apiService.client.getProfile();
            setClientName(response.data.name);
            setClientId(response.data.id);
        } catch (error) {
            console.error('Failed to load client profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
            localStorage.removeItem('accessKey');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            window.location.href = '/login';
        }
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Yatırımcı Panel</h1>
                            {isLoading ? (
                                <p className="text-sm text-gray-600">Yükleniyor...</p>
                            ) : clientName ? (
                                <div className="flex items-center space-x-3">
                                    <p className="text-sm text-gray-600">
                                        Hoş geldin, <span className="font-medium text-blue-600">{clientName}</span>
                                    </p>
                                    {clientId && (
                                        <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                            ID: {clientId}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-red-600">Profil yüklenemedi</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {clientName && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <UserIcon className="h-4 w-4" />
                                <span>{clientName}</span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Çıkış</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                {children}
            </main>
        </div>
    );
}