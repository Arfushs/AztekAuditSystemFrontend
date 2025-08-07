'use client';

import { useState, useEffect } from 'react';
import { User, Report } from '@/types';
import { apiService } from '@/lib/api';
import { UserPlus, Users, Plus, X, Key, Calendar, ArrowLeft, Hash, ChevronRight, Settings } from 'lucide-react';
import { formatDate, getRoleText } from '@/lib/utils';
import Link from 'next/link';
import ReporterDetail from '@/components/admin/ReporterDetail';
import ReportAssignModal from '@/components/admin/ReportAssignModal';

export default function ReportersPage() {
    const [reporters, setReporters] = useState<User[]>([]);
    const [selectedReporter, setSelectedReporter] = useState<User | null>(null);
    const [reportCounts, setReportCounts] = useState<{[key: string]: number}>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newReporterName, setNewReporterName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        loadReporters();
    }, []);

    const loadReporters = async () => {
        try {
            const [usersResponse, reportsResponse] = await Promise.all([
                apiService.admin.getAllUsers(),
                apiService.admin.getAllReports()
            ]);
            const allUsers = usersResponse.data;
            const allReports = reportsResponse.data;
            const reporterUsers = allUsers.filter((user: User) => user.role === 'reporter');

            // Her raporcu için rapor sayısını hesapla
            const counts: {[key: string]: number} = {};
            reporterUsers.forEach((reporter: User) => {
                counts[reporter.id] = allReports.filter((report: Report) => report.reporterId === reporter.id).length;
            });

            setReporters(reporterUsers);
            setReportCounts(counts);
        } catch (error) {
            console.error('Failed to load reporters:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateReporter = async () => {
        if (!newReporterName.trim()) return;
        setIsCreating(true);
        try {
            await apiService.admin.createReporter(newReporterName.trim());
            setNewReporterName('');
            setShowCreateForm(false);
            loadReporters();
        } catch (error) {
            console.error('Failed to create reporter:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteReporter = async (reporter: User) => {
        if (!confirm(`${reporter.name} adlı raporcuyu silmek istediğinize emin misiniz?`)) return;
        try {
            await apiService.admin.deleteReporter(reporter.id);
            if (selectedReporter?.id === reporter.id) {
                setSelectedReporter(null);
            }
            loadReporters();
        } catch (error) {
            console.error('Failed to delete reporter:', error);
        }
    };

    const handleReporterClick = (reporter: User) => {
        setSelectedReporter(reporter);
    };

    const handleBackToList = () => {
        setSelectedReporter(null);
    };

    const handleReportUnassigned = () => {
        loadReporters(); // Rapor counts'u güncellemek için
    };

    const handleAssignmentChange = () => {
        loadReporters();
        if (selectedReporter) {
            handleReportUnassigned();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    // Eğer bir raporcu seçilmişse, detay sayfasını göster
    if (selectedReporter) {
        return (
            <div className="space-y-6">
                {/* Back to List Button */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <button
                        onClick={handleBackToList}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Raporcu Listesine Dön</span>
                    </button>
                </div>

                {/* Reporter Detail Component */}
                <ReporterDetail
                    reporter={selectedReporter}
                    onReportUnassigned={handleReportUnassigned}
                />
            </div>
        );
    }

    // Ana raporcu listesi
    return (
        <div className="space-y-6">
            {/* Back Button */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <Link
                    href="/admin"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Dashboard&#39;a Dön</span>
                </Link>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Settings className="h-4 w-4" />
                        <span>Rapor Atama</span>
                    </button>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Yeni Raporcu</span>
                    </button>
                </div>
            </div>

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Raporcular</h1>
                <p className="text-gray-600 mt-1">Sistem raporcularını yönet</p>
            </div>

            {/* Inline Create Form */}
            {showCreateForm && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newReporterName}
                                onChange={(e) => setNewReporterName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                placeholder="Raporcu adını girin..."
                                disabled={isCreating}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateReporter()}
                            />
                        </div>
                        <button
                            onClick={handleCreateReporter}
                            disabled={isCreating || !newReporterName.trim()}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="p-3 bg-green-50 rounded-lg">
                        <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{reporters.length}</p>
                        <p className="text-sm text-gray-600">Toplam Raporcu</p>
                    </div>
                </div>
            </div>

            {/* Reporters List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Raporcu Listesi</h2>
                    <p className="text-sm text-gray-600 mt-1">Raporlarını görmek için bir raporcuya tıklayın</p>
                </div>
                {reporters.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Henüz raporcu bulunmuyor</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {reporters.map((reporter) => (
                            <div
                                key={reporter.id}
                                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => handleReporterClick(reporter)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="p-3 bg-green-100 rounded-full">
                                            <Users className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            {/* Ana Bilgiler */}
                                            <div className="flex items-center space-x-6 mb-3">
                                                <div>
                                                    <div className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                                        {reporter.name}
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                        <Hash className="h-3 w-3" />
                                                        <span>ID: {reporter.id}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                        {getRoleText(reporter.role)}
                                                    </span>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                        {reportCounts[reporter.id] || 0} rapor
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Detay Bilgiler */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <Key className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">Erişim Anahtarı:</span>
                                                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-800 text-xs">
                                                        {reporter.accessKey}
                                                    </code>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">Oluşturulma:</span>
                                                    <span className="text-gray-800">
                                                        {formatDate(reporter.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteReporter(reporter);
                                            }}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            Sil
                                        </button>
                                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Report Assign Modal */}
            <ReportAssignModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onAssignmentChange={handleAssignmentChange}
            />
        </div>
    );
}
