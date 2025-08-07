// src/app/reporter/layout.tsx
'use client';

import AuthGuard from '@/components/layout/AuthGuard';

export default function ReporterLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard requiredRole="reporter">
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm border-b">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h1 className="text-xl font-semibold">Raporcu Panel</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Raporcu</span>
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