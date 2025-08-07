'use client';

import { useState, useEffect, useMemo } from 'react';
import { User, Report } from '@/types';
import { apiService } from '@/lib/api';
import {
    FileText,
    Download,
    Calendar,
    Hash,
    ArrowLeft,
    Search,
    Filter,
    Settings,
    ChevronLeft,
    ChevronRight,
    Users,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import Link from 'next/link';
import ReportAssignModal from '@/components/admin/ReportAssignModal';

// Filtreleme ve sıralama türleri
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'status-priority' | 'status-reverse';
type FilterStatus = 'all' | 'draft' | 'pending' | 'assigned' | 'finalized';

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Filtreleme ve arama
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

    // Sıralama
    const [sortOption, setSortOption] = useState<SortOption>('newest');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadReportsData();
    }, []);

    const loadReportsData = async () => {
        try {
            const [reportsResponse, usersResponse] = await Promise.all([
                apiService.admin.getAllReports(),
                apiService.admin.getAllUsers()
            ]);
            setReports(reportsResponse.data);
            setUsers(usersResponse.data);
        } catch (error) {
            console.error('Failed to load reports data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Kullanıcı bilgilerini alma
    const getUserById = (userId: string) => {
        return users.find(user => user.id === userId);
    };

    const getInspectorName = (inspectorId?: string) => {
        if (!inspectorId) return 'Atanmamış';
        const inspector = getUserById(inspectorId);
        return inspector?.name || 'Bilinmiyor';
    };

    const getReporterName = (reporterId?: string) => {
        if (!reporterId) return 'Atanmamış';
        const reporter = getUserById(reporterId);
        return reporter?.name || 'Bilinmiyor';
    };

    // Filtreleme ve sıralama işlemleri
    const filteredAndSortedReports = useMemo(() => {
        const filtered = reports.filter(report => {
            // Metin arama
            const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filtresi
            const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Sıralama
        filtered.sort((a, b) => {
            switch (sortOption) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'name-asc':
                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                case 'name-desc':
                    return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
                case 'status-priority':
                    // Öncelik sırası: finalized -> assigned -> pending -> draft
                    const statusPriority = { finalized: 4, assigned: 3, pending: 2, draft: 1 };
                    return statusPriority[b.status] - statusPriority[a.status];
                case 'status-reverse':
                    // Ters öncelik: draft -> pending -> assigned -> finalized
                    const statusReverse = { draft: 4, pending: 3, assigned: 2, finalized: 1 };
                    return statusReverse[b.status] - statusReverse[a.status];
                default:
                    return 0;
            }
        });

        return filtered;
    }, [reports, searchTerm, statusFilter, sortOption]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedReports.length / itemsPerPage);
    const paginatedReports = filteredAndSortedReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Sıralama değiştirme
    const handleSortChange = (option: SortOption) => {
        setSortOption(option);
        setCurrentPage(1);
    };

    // Rapor indirme
    const handleDownloadReport = async (reportId: string, subfolder: 'raw' | 'final') => {
        try {
            const response = await apiService.shared.downloadReports(reportId, subfolder);
            const reportName = await apiService.shared.getReportNameByID(reportId);

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportName}_report_${subfolder}_files.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download report:', error);
        }
    };

    // Filtre sıfırlama
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortOption('newest');
        setCurrentPage(1);
    };

    // İstatistikler
    const stats = useMemo(() => {
        return {
            total: reports.length,
            draft: reports.filter(r => r.status === 'draft').length,
            pending: reports.filter(r => r.status === 'pending').length,
            assigned: reports.filter(r => r.status === 'assigned').length,
            finalized: reports.filter(r => r.status === 'finalized').length,
            unassigned: reports.filter(r => !r.reporterId).length
        };
    }, [reports]);

    const handleAssignmentChange = () => {
        loadReportsData();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button & Actions */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <Link
                    href="/admin"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Dashboard&#39;a Dön</span>
                </Link>
                <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Settings className="h-4 w-4" />
                    <span>Rapor Atama</span>
                </button>
            </div>

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
                <p className="text-gray-600 mt-1">Tüm sistem raporlarını görüntüle ve yönet</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Toplam</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Taslak</p>
                            <p className="text-2xl font-bold text-gray-500">{stats.draft}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Atanmış</p>
                            <p className="text-2xl font-bold text-pink-600">{stats.assigned}</p>
                        </div>
                        <Users className="h-8 w-8 text-pink-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                            <p className="text-2xl font-bold text-green-600">{stats.finalized}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Atanmamış</p>
                            <p className="text-2xl font-bold text-red-600">{stats.unassigned}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-4 mb-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Filtreleme ve Arama</h3>
                    <button
                        onClick={resetFilters}
                        className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Filtreleri Sıfırla
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Arama */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rapor adı ara..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                        />
                    </div>

                    {/* Status Filtresi */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as FilterStatus);
                            setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="draft">Taslak</option>
                        <option value="pending">Bekleyen</option>
                        <option value="assigned">Atanmış</option>
                        <option value="finalized">Tamamlanan</option>
                    </select>

                    {/* Sıralama */}
                    <select
                        value={sortOption}
                        onChange={(e) => handleSortChange(e.target.value as SortOption)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    >
                        <option value="newest">En Yeni → En Eski</option>
                        <option value="oldest">En Eski → En Yeni</option>
                        <option value="name-asc">İsim A → Z</option>
                        <option value="name-desc">İsim Z → A</option>
                        <option value="status-priority">Durum: Tamamlanan → Taslak</option>
                        <option value="status-reverse">Durum: Taslak → Tamamlanan</option>
                    </select>
                </div>

                <div className="mt-4 text-sm text-gray-700 font-medium">
                    <span>{filteredAndSortedReports.length} rapor bulundu</span>
                    {(searchTerm || statusFilter !== 'all') && (
                        <span> (toplam {reports.length} rapor)</span>
                    )}
                </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Rapor Listesi</h2>
                </div>

                {paginatedReports.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Filtrelerinize uygun rapor bulunamadı</p>
                        <button
                            onClick={resetFilters}
                            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Filtreleri temizle
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Rapor Adı
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Durum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Denetçi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Raporcu
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Oluşturulma
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    İşlemler
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {report.name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                <Hash className="h-3 w-3 mr-1" />
                                                {report.id}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                                                {getStatusText(report.status)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {report.inspectorId ? getInspectorName(report.inspectorId) : (
                                                <span className="text-red-600 font-medium">Atanmamış</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {report.reporterId ? getReporterName(report.reporterId) : (
                                                <span className="text-red-600 font-medium">Atanmamış</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                            {formatDate(report.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            {report.rawReportPath && (
                                                <button
                                                    onClick={() => handleDownloadReport(report.id, 'raw')}
                                                    className="flex items-center space-x-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                                                    title="Ham dosyaları indir"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span>Ham</span>
                                                </button>
                                            )}
                                            {report.finalReportPath && (
                                                <button
                                                    onClick={() => handleDownloadReport(report.id, 'final')}
                                                    className="flex items-center space-x-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                                                    title="Final raporu indir"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span>Final</span>
                                                </button>
                                            )}
                                            {!report.rawReportPath && !report.finalReportPath && (
                                                <span className="text-xs text-gray-400">Dosya yok</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700 font-medium">
                            Toplam <span className="font-semibold">{filteredAndSortedReports.length}</span> rapor,{' '}
                            <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span>-
                            <span className="font-semibold">
                                {Math.min(currentPage * itemsPerPage, filteredAndSortedReports.length)}
                            </span>{' '}
                            arası gösteriliyor
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="flex space-x-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1;
                                    } else if (currentPage > totalPages - 3) {
                                        pageNumber = totalPages - 4 + i;
                                    } else {
                                        pageNumber = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`px-3 py-1 text-sm rounded-lg ${
                                                currentPage === pageNumber
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
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