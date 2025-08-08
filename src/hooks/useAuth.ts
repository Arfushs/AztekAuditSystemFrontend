// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { User, UserRole } from '@/types';

interface LoginResult {
    success: boolean;
    role?: UserRole;
    user?: User;
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
            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName');

            if (accessKey && userRole && userId && userName) {
                setUser({
                    id: userId,
                    name: userName,
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

            // Yeni login API'sini kullan
            const response = await apiService.login(accessKey);

            if (response.data.success) {
                const { user: userData, role } = response.data;

                // User object oluştur
                const userObj: User = {
                    id: userData.id,
                    name: userData.name,
                    accessKey: userData.accessKey,
                    role: userData.role as UserRole,
                    createdAt: userData.createdAt
                };

                // LocalStorage'a kaydet
                localStorage.setItem('accessKey', accessKey);
                localStorage.setItem('userRole', role);
                localStorage.setItem('userId', userData.id);
                localStorage.setItem('userName', userData.name);

                setUser(userObj);

                return { success: true, role: role as UserRole, user: userObj };
            } else {
                return { success: false, error: response.data.error };
            }

        } catch (error: any) {
            // Network veya server hatası
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Bağlantı hatası';

            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // Fallback - eski sistem için (gerekirse)
    const loginLegacy = async (accessKey: string): Promise<LoginResult> => {
        try {
            setIsLoading(true);

            // Rolleri sırayla test et (eski sistem)
            const roles: UserRole[] = ['admin', 'inspector', 'reporter'];

            for (const role of roles) {
                try {
                    const response = await apiService.testAccess(role, accessKey);

                    // Başarılı - bu rolde erişim var
                    localStorage.setItem('accessKey', accessKey);
                    localStorage.setItem('userRole', role);

                    const userObj: User = {
                        id: '',
                        name: '',
                        accessKey,
                        role,
                        createdAt: ''
                    };

                    setUser(userObj);
                    return { success: true, role, user: userObj };

                } catch (error: unknown) {
                    const axiosError = error as { response?: { status?: number }; message?: string };

                    // 400 hatası alıyorsak endpoint'e erişebiliyoruz demektir (sadece parametre hatası)
                    if (axiosError.response?.status === 400) {
                        localStorage.setItem('accessKey', accessKey);
                        localStorage.setItem('userRole', role);

                        const userObj: User = {
                            id: '',
                            name: '',
                            accessKey,
                            role,
                            createdAt: ''
                        };

                        setUser(userObj);
                        return { success: true, role, user: userObj };
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
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
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
        loginLegacy, // Backup olarak
        logout,
        hasRole
    };
}