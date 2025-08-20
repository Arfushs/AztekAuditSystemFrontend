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

            const response = await apiService.login(accessKey);

            if (response.data.success) {
                const { user: userData, role } = response.data;

                const userObj: User = {
                    id: userData.id,
                    name: userData.name,
                    accessKey: userData.accessKey,
                    role: userData.role as UserRole,
                    createdAt: userData.createdAt
                };

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
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Bağlantı hatası';

            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const loginLegacy = async (accessKey: string): Promise<LoginResult> => {
        try {
            setIsLoading(true);

            const roles: UserRole[] = ['admin', 'inspector', 'reporter', 'client'];

            for (const role of roles) {
                try {
                    const response = await apiService.testAccess(role, accessKey);

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
                    continue;
                }
            }

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

    const isClient = (): boolean => {
        return user?.role === 'client';
    };

    const isAdmin = (): boolean => {
        return user?.role === 'admin';
    };

    const isInspector = (): boolean => {
        return user?.role === 'inspector';
    };

    const isReporter = (): boolean => {
        return user?.role === 'reporter';
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginLegacy,
        logout,
        hasRole,
        isClient,
        isAdmin,
        isInspector,
        isReporter
    };
}