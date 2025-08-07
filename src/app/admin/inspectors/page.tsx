'use client';

import Link from 'next/link';
import { formatDate, getRoleText } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { apiService } from '@/lib/api';
import { UserPlus, Users, Plus, X, Key, Calendar, ArrowLeft, Hash, ChevronRight } from 'lucide-react';
import InspectorDetail from '@/components/admin/InspectorDetail';

export default function InspectorsPage() {
    const [inspectors, setInspectors] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newInspectorName, setNewInspectorName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedInspector, setSelectedInspector] = useState<User | null>(null);

    useEffect(() => {
        loadInspectors();
    }, []);

    const loadInspectors = async () => {
        try {
            const response = await apiService.admin.getAllUsers();
            const allUsers = response.data;
            const inspectorUsers = allUsers.filter((user: User) => user.role === 'inspector');
            setInspectors(inspectorUsers);
        } catch (error) {
            console.error('Failed to load inspectors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateInspector = async () => {
        if (!newInspectorName.trim()) return;
        setIsCreating(true);
        try {
            await apiService.admin.createInspector(newInspectorName.trim());
            setNewInspectorName('');
            setShowCreateForm(false);
            loadInspectors();
        } catch (error) {
            console.error('Failed to create inspector:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteInspector = async (inspectorId: string) => {
        try {
            await apiService.admin.deleteInspector(inspectorId);
            // Listeyi yenile
            loadInspectors();
        } catch (error) {
            console.error('Failed to delete inspector:', error);
            alert('Denetçi silinirken bir hata oluştu!');
        }
    };

    const handleInspectorClick = (inspector: User) => {
        setSelectedInspector(inspector);
    };

    const handleBackToList = () => {
        setSelectedInspector(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Eğer bir denetçi seçilmişse, detay sayfasını göster
    if (selectedInspector) {
        return (
            <div className="space-y-6">
                {/* Back to List Button */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <button
                        onClick={handleBackToList}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Denetçi Listesine Dön</span>
                    </button>
                </div>

                {/* Inspector Detail Component */}
                <InspectorDetail inspector={selectedInspector} />
            </div>
        );
    }

    // Ana denetçi listesi
    return (
        <div className="space-y-6">
            {/* Back Button - En üstte */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <Link
                    href="/admin"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Dashboard&#39;a Dön</span>
                </Link>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Yeni Denetçi</span>
                </button>
            </div>

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Denetçiler</h1>
                <p className="text-gray-600 mt-1">Sistem denetçilerini yönet</p>
            </div>

            {/* Inline Create Form */}
            {showCreateForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newInspectorName}
                                onChange={(e) => setNewInspectorName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                placeholder="Denetçi adını girin..."
                                disabled={isCreating}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateInspector()}
                            />
                        </div>
                        <button
                            onClick={handleCreateInspector}
                            disabled={isCreating || !newInspectorName.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="p-3 text-gray-500 hover:text-gray-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{inspectors.length}</p>
                        <p className="text-sm text-gray-600">Toplam Denetçi</p>
                    </div>
                </div>
            </div>

            {/* Simple List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Denetçi Listesi</h2>
                    <p className="text-sm text-gray-600 mt-1">Detayları görmek için bir denetçiye tıklayın</p>
                </div>
                {inspectors.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Henüz denetçi bulunmuyor</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {inspectors.map((inspector) => (
                            <div
                                key={inspector.id}
                                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => handleInspectorClick(inspector)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="p-3 bg-blue-100 rounded-full">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            {/* Ana Bilgiler */}
                                            <div className="flex items-center space-x-6 mb-3">
                                                <div>
                                                    <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {inspector.name}
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                        <Hash className="h-3 w-3" />
                                                        <span>ID: {inspector.id}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                        {getRoleText(inspector.role)}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Detay Bilgiler */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <Key className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">Erişim Anahtarı:</span>
                                                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-800 text-xs">
                                                        {inspector.accessKey}
                                                    </code>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">Oluşturulma:</span>
                                                    <span className="text-gray-800">
                                                        {formatDate(inspector.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click
                                                if (confirm('Bu denetçiyi silmek istediğinize emin misiniz?')) {
                                                    // Delete logic buraya
                                                    handleDeleteInspector(inspector.id);
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            Sil
                                        </button>
                                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
