// src/components/admin/AdminNavigation.tsx
'use client';

import { Users, FileText, UserPlus, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigationItems = [
    {
        name: 'Dashboard',
        href: '/admin',
        icon: Settings,
        description: 'Genel Bakış'
    },
    {
        name: 'Denetçiler',
        href: '/admin/inspectors',
        icon: Users,
        description: 'Denetçi Yönetimi'
    },
    {
        name: 'Raporcular',
        href: '/admin/reporters',
        icon: UserPlus,
        description: 'Raporcu Yönetimi'
    },
    {
        name: 'Raporlar',
        href: '/admin/reports',
        icon: FileText,
        description: 'Tüm Raporlar'
    }
];

export default function AdminNavigation() {
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem('accessKey');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-sm text-gray-700 mt-1">Yönetici Dashboard</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <div>
                                    <div>{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.description}</div>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Yönetici</p>
                            <p className="text-xs text-gray-1000">Admin Panel</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Çıkış Yap"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}