// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function LoginPage() {
    const [accessKey, setAccessKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showKey, setShowKey] = useState(false);

    const { login, isAuthenticated, user } = useAuth();
    const router = useRouter();

    // Zaten giriş yapmışsa yönlendir
    useEffect(() => {
        if (isAuthenticated && user) {
            switch (user.role) {
                case 'admin':
                    router.push('/admin');
                    break;
                case 'inspector':
                    router.push('/inspector');
                    break;
                case 'reporter':
                    router.push('/reporter');
                    break;
            }
        }
    }, [isAuthenticated, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accessKey.trim()) {
            setError('Erişim anahtarı gerekli');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await login(accessKey.trim());

            if (result.success && result.role) {
                // Başarılı giriş - useEffect yönlendirme yapacak
            } else {
                setError(result.error || 'Giriş hatası');
            }
        } catch (error) {
            setError('Beklenmeyen bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Aztek Denetim Sistemi
                    </h1>
                    <p className="text-gray-600">
                        Erişim anahtarınızla güvenli giriş yapın
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700 mb-2">
                            Erişim Anahtarı
                        </label>
                        <div className="relative">
                            <input
                                id="accessKey"
                                type={showKey ? 'text' : 'password'}
                                placeholder="Erişim anahtarınızı girin"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                                disabled={isLoading}
                            >
                                {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Giriş Yapılıyor...
                            </div>
                        ) : (
                            'Giriş Yap'
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500">
                        Erişim anahtarınız yoksa sistem yöneticinizle iletişime geçin.
                    </p>
                </div>
            </div>
        </div>
    );
}