// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, Clock } from 'lucide-react';
import { apiService } from '@/lib/api';
import { User, Report } from '@/types';
import Link from 'next/link';

interface DashboardStats {
    totalInspectors: number;
    totalReporters: number;
    totalReports: number;
    finalizedReports: number;
    pendingReports: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalInspectors: 0,
        totalReporters: 0,
        totalReports: 0,
        finalizedReports: 0,
        pendingReports: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [usersResponse, reportsResponse] = await Promise.all([
                apiService.admin.getAllUsers(),
                apiService.admin.getAllReports()
            ]);

            const users: User[] = usersResponse.data;
            const reports: Report[] = reportsResponse.data;

            setStats({
                totalInspectors: users.filter(u => u.role === 'inspector').length,
                totalReporters: users.filter(u => u.role === 'reporter').length,
                totalReports: reports.length,
                finalizedReports: reports.filter(r => r.status === 'finalized').length,
                pendingReports: reports.filter(r => r.status === 'pending').length
            });
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const statsCards = [
        {
            name: 'Toplam Denetçi',
            value: stats.totalInspectors.toString(),
            icon: Users,
            color: 'bg-blue-50 text-blue-600',
            href: '/admin/inspectors'
        },
        {
            name: 'Toplam Raporcu',
            value: stats.totalReporters.toString(),
            icon: Users,
            color: 'bg-green-50 text-green-600',
            href: '/admin/reporters'
        },
        {
            name: 'Toplam Rapor',
            value: stats.totalReports.toString(),
            icon: FileText,
            color: 'bg-purple-50 text-purple-600',
            href: '/admin/reports'
        },
        {
            name: 'Bekleyen Rapor',
            value: stats.pendingReports.toString(),
            icon: Clock,
            color: 'bg-amber-50 text-amber-600',
            href: '/admin/reports?status=pending'
        }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Sistem genel durumu ve hızlı işlemler</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.name}
                            href={stat.href}
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all hover:scale-105"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Main Sections */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Ana Bölümler</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Denetçiler Section */}
                    <Link
                        href="/admin/inspectors"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl transition-all hover:scale-105 group"
                    >
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-blue-500 rounded-lg">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Denetim Ekibi</h3>
                                <p className="text-blue-100 text-sm">Denetçi yönetimi</p>
                            </div>
                        </div>
                        <div className="border-t border-blue-500 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-100 text-sm">Toplam Denetçi</span>
                                <span className="text-2xl font-bold">{stats.totalInspectors}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Raporcular Section */}
                    <Link
                        href="/admin/reporters"
                        className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl transition-all hover:scale-105 group"
                    >
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-green-500 rounded-lg">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Raporlama Ekibi</h3>
                                <p className="text-green-100 text-sm">Raporcu yönetimi</p>
                            </div>
                        </div>
                        <div className="border-t border-green-500 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-green-100 text-sm">Toplam Raporcu</span>
                                <span className="text-2xl font-bold">{stats.totalReporters}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Raporlar Section */}
                    <Link
                        href="/admin/reports"
                        className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl transition-all hover:scale-105 group"
                    >
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="p-3 bg-purple-500 rounded-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Raporlar</h3>
                                <p className="text-purple-100 text-sm">Rapor yönetimi</p>
                            </div>
                        </div>
                        <div className="border-t border-purple-500 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-purple-100 text-sm">Toplam Rapor</span>
                                <span className="text-2xl font-bold">{stats.totalReports}</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Sistem Durumu</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {(stats.finalizedReports / Math.max(stats.totalReports, 1) * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Tamamlanan Raporlar</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{(stats.totalReports / Math.max(stats.totalInspectors, 1)).toFixed(1)}</div>
                        <div className="text-sm text-gray-600">Denetçi Başına Rapor</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.totalInspectors + stats.totalReporters}</div>
                        <div className="text-sm text-gray-600">Toplam Kullanıcı</div>
                    </div>
                </div>
            </div>
        </div>
    );
}