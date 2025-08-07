// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { User, UserRole } from '@/types';

interface LoginResult {
    success: boolean;
    role?: UserRole;
    error?: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Component mount olduğunda localStorage'dan kontrol et
        const initAuth = () => {
            const accessKey = localStorage.getItem('accessKey');
            const userRole = localStorage.getItem('userRole');

            if (accessKey && userRole) {
                setUser({
                    id: '',
                    name: '',
                    accessKey,
                    role: userRole as UserRole,
                    createdAt: ''
                });
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (accessKey: string): Promise<LoginResult> => {
        try {
            setIsLoading(true);

            // Rolleri sırayla test et
            const roles: UserRole[] = ['admin', 'inspector', 'reporter'];

            for (const role of roles) {
                try {
                    const response = await apiService.testAccess(role, accessKey);

                    // Başarılı - bu rolde erişim var
                    localStorage.setItem('accessKey', accessKey);
                    localStorage.setItem('userRole', role);

                    setUser({
                        id: '',
                        name: '',
                        accessKey,
                        role,
                        createdAt: ''
                    });

                    return { success: true, role };

                } catch (error: unknown) {
                    const axiosError = error as { response?: { status?: number }; message?: string };

                    // 400 hatası alıyorsak endpoint'e erişebiliyoruz demektir (sadece parametre hatası)
                    if (axiosError.response?.status === 400) {
                        localStorage.setItem('accessKey', accessKey);
                        localStorage.setItem('userRole', role);

                        setUser({
                            id: '',
                            name: '',
                            accessKey,
                            role,
                            createdAt: ''
                        });

                        return { success: true, role };
                    }
                    // 401 veya 403 ise bu rolde yetkisi yok, devam et
                    continue;
                }
            }

            // Hiçbir rolde erişim bulunamadı
            return { success: false, error: 'Geçersiz erişim anahtarı' };

        } catch (error) {
            return { success: false, error: 'Bağlantı hatası' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('accessKey');
        localStorage.removeItem('userRole');
        setUser(null);
    };

    const hasRole = (requiredRole: UserRole): boolean => {
        return user?.role === requiredRole;
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole
    };
}