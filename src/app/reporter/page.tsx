// src/app/reporter/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Report } from '@/types';
import { apiService } from '@/lib/api';
import {
    FileText,
    Calendar,
    Hash,
    Upload,
    Download,
    Trash2,
    Eye,
    FolderOpen,
    Clock,
    CheckCircle,
    AlertCircle,
    Users,
    X,
    File,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Briefcase
} from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';

// Filtreleme ve sıralama türleri
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'status-priority' | 'status-reverse';
type FilterStatus = 'all' | 'draft' | 'pending' | 'assigned' | 'finalized';

export default function ReporterDashboard() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [rawFiles, setRawFiles] = useState<string[]>([]);
    const [finalFiles, setFinalFiles] = useState<string[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Final dosya silme state'leri
    const [selectedFinalFiles, setSelectedFinalFiles] = useState<string[]>([]);
    const [isDeletingFiles, setIsDeletingFiles] = useState(false);

    // Filtreleme ve arama
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

    // Sıralama
    const [sortOption, setSortOption] = useState<SortOption>('newest');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        loadMyAssignedReports();
    }, []);

    const loadMyAssignedReports = async () => {
        try {
            const reporterId = localStorage.getItem('userId') || '';
            if (!reporterId) {
                console.error('Reporter ID not found');
                return;
            }

            // Reporter'ın kendi API'sini kullan
            const response = await apiService.reporter.getMyAssignedReports(reporterId);
            setReports(response.data);
        } catch (error) {
            console.error('Failed to load assigned reports:', error);
        } finally {
            setIsLoading(false);
        }
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
                    const statusPriority = { finalized: 4, assigned: 3, pending: 2, draft: 1 };
                    return statusPriority[b.status] - statusPriority[a.status];
                case 'status-reverse':
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

    // Filtre sıfırlama
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortOption('newest');
        setCurrentPage(1);
    };

    const handleDownloadReport = async (reportId: string, subfolder: 'raw' | 'final', reportName?: string) => {
        try {
            const response = await apiService.shared.downloadReports(reportId, subfolder);
            const safeName = reportName
                ? reportName.replace(/[^a-zA-Z0-9_\-\.]/g, '_').replace(/_{2,}/g, '_')
                : `report_${reportId.slice(0, 8)}`;
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeName}_${subfolder}_files.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Dosya indirme işlemi başarısız!');
        }
    };

    // Modal functions
    const openReportModal = async (report: Report) => {
        setSelectedReport(report);
        setShowReportModal(true);
        setIsLoadingFiles(true);

        try {
            // Reporter için özel dosya listesi API'si
            const response = await apiService.reporter.getReportFiles(report.id);
            setRawFiles(response.data.rawFiles || []);
            setFinalFiles(response.data.finalFiles || []);
        } catch (error) {
            console.error('Failed to load files:', error);
            setRawFiles([]);
            setFinalFiles([]);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setSelectedReport(null);
        setRawFiles([]);
        setFinalFiles([]);
        setSelectedFinalFiles([]);
    };

    const handleFinalFileUpload = async (files: FileList) => {
        if (!files || !selectedReport || files.length === 0) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });
            await apiService.reporter.uploadFinalFiles(selectedReport.id, formData);
            alert(`${files.length} final dosya başarıyla yüklendi!`);

            // Dosya listesini yenile
            const response = await apiService.reporter.getReportFiles(selectedReport.id);
            setFinalFiles(response.data.finalFiles || []);

            // Rapor listesini yenile
            loadMyAssignedReports();
        } catch (error) {
            console.error('Final file upload failed:', error);
            alert('Final dosya yükleme işlemi başarısız!');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteFinalFile = async (fileName: string) => {
        if (!selectedReport || !confirm(`"${fileName}" final dosyasını silmek istediğinize emin misiniz?`)) return;
        try {
            // Reporter için özel delete API'si
            await apiService.reporter.deleteFinalFile(selectedReport.id, fileName);

            // Final dosya listesini yenile
            const response = await apiService.reporter.getReportFiles(selectedReport.id);
            setFinalFiles(response.data.finalFiles || []);
            alert('Final dosya başarıyla silindi!');
        } catch (error) {
            console.error('Failed to delete final file:', error);
            alert('Final dosya silme işlemi başarısız!');
        }
    };

    // Final dosya bulk delete functions
    const toggleFinalFileSelection = (fileName: string) => {
        setSelectedFinalFiles(prev =>
            prev.includes(fileName)
                ? prev.filter(f => f !== fileName)
                : [...prev, fileName]
        );
    };

    const selectAllFinalFiles = () => {
        if (selectedFinalFiles.length === finalFiles.length) {
            setSelectedFinalFiles([]);
        } else {
            setSelectedFinalFiles([...finalFiles]);
        }
    };

    const handleDeleteSelectedFinalFiles = async () => {
        if (!selectedReport || selectedFinalFiles.length === 0) return;

        if (!confirm(`${selectedFinalFiles.length} final dosyayı silmek istediğinize emin misiniz?`)) return;

        setIsDeletingFiles(true);
        try {
            await Promise.all(
                selectedFinalFiles.map(fileName =>
                    apiService.reporter.deleteFinalFile(selectedReport.id, fileName)
                )
            );

            // Final dosya listesini yenile
            const response = await apiService.reporter.getReportFiles(selectedReport.id);
            setFinalFiles(response.data.finalFiles || []);
            setSelectedFinalFiles([]);
            alert(`${selectedFinalFiles.length} final dosya başarıyla silindi!`);
        } catch (error) {
            console.error('Failed to delete final files:', error);
            alert('Final dosya silme işlemi başarısız!');
        } finally {
            setIsDeletingFiles(false);
        }
    };

    // İstatistikler
    const stats = {
        total: reports.length,
        draft: reports.filter(r => r.status === 'draft').length,
        pending: reports.filter(r => r.status === 'pending').length,
        assigned: reports.filter(r => r.status === 'assigned').length,
        finalized: reports.filter(r => r.status === 'finalized').length,
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFinalFileUpload(files);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Atanmış Raporlarım</h1>
                    <p className="text-gray-600 mt-1">Size atanmış raporları görüntüle ve final dosyalarını yükle</p>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <Briefcase className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Raporcu Paneli</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                            <p className="text-sm font-medium text-gray-600">Üzerimde</p>
                            <p className="text-2xl font-bold text-green-600">{stats.assigned}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.finalized}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-blue-400" />
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
                        className="ml-auto text-sm text-green-600 hover:text-green-800 font-medium"
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                        />
                    </div>
                    {/* Status Filtresi */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as FilterStatus);
                            setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="draft">Taslak</option>
                        <option value="pending">Bekleyen</option>
                        <option value="assigned">Üzerimde</option>
                        <option value="finalized">Tamamlanan</option>
                    </select>
                    {/* Sıralama */}
                    <select
                        value={sortOption}
                        onChange={(e) => handleSortChange(e.target.value as SortOption)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
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

            {/* Reports List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Atanmış Rapor Listesi</h2>
                </div>
                {paginatedReports.length === 0 ? (
                    <div className="text-center py-12">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        {reports.length === 0 ? (
                            <>
                                <p className="text-gray-500 mb-4">Henüz size atanmış rapor bulunmuyor</p>
                                <p className="text-sm text-gray-400">Admin tarafından rapor atandığında burada görünecek</p>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-500">Filtrelerinize uygun rapor bulunamadı</p>
                                <button
                                    onClick={resetFilters}
                                    className="mt-2 text-green-600 hover:text-green-800 font-medium"
                                >
                                    Filtreleri temizle
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {paginatedReports.map((report) => (
                            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <FolderOpen className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {report.name}
                                                </h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Hash className="h-3 w-3 text-gray-500" />
                                                    <span className="text-xs text-gray-700 font-medium">{report.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">Atanma:</span>
                                                <span className="text-gray-800">
                                                    {formatDate(report.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-gray-600">Durum:</span>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                                                    {getStatusText(report.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <FolderOpen className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">Klasör ID:</span>
                                                <code className="bg-gray-200 px-2 py-1 rounded text-xs font-medium text-gray-800">
                                                    {report.folderId}
                                                </code>
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={() => openReportModal(report)}
                                                className="flex items-center space-x-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm transition-colors"
                                            >
                                                <Eye className="h-3 w-3" />
                                                <span>Detay & Final Upload</span>
                                            </button>
                                            {report.rawReportPath && (
                                                <button
                                                    onClick={() => handleDownloadReport(report.id, 'raw', report.name)}
                                                    className="flex items-center space-x-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm transition-colors"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span>Ham Dosyalar İndir</span>
                                                </button>
                                            )}
                                            {report.finalReportPath && (
                                                <button
                                                    onClick={() => handleDownloadReport(report.id, 'final', report.name)}
                                                    className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm transition-colors"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span>Final Rapor İndir</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                                    ? 'bg-green-600 text-white'
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

            {/* Report Detail Modal */}
            {showReportModal && selectedReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{selectedReport.name}</h2>
                                <p className="text-sm text-gray-600 mt-1">Raw Dosya İndirme & Final Dosya Yönetimi</p>
                            </div>
                            <button
                                onClick={closeReportModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {/* Report Info */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Durum:</span>
                                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReport.status)}`}>
                                            {getStatusText(selectedReport.status)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Atanma:</span>
                                        <span className="ml-2 text-gray-800">{formatDate(selectedReport.createdAt)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Raw Dosya:</span>
                                        <span className="ml-2 font-medium text-gray-800">{rawFiles.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Final Dosya:</span>
                                        <span className="ml-2 font-medium text-gray-800">{finalFiles.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Raw Files Section - Sadece İndirme */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">Ham Dosyalar ({rawFiles.length})</h3>
                                        {rawFiles.length > 0 && (
                                            <button
                                                onClick={() => handleDownloadReport(selectedReport.id, 'raw', selectedReport.name)}
                                                className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                                            >
                                                Tümünü İndir
                                            </button>
                                        )}
                                    </div>

                                    <div className="border rounded-lg bg-indigo-50 border-indigo-200 p-4">
                                        {isLoadingFiles ? (
                                            <div className="text-center py-6">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                                                <p className="text-sm text-indigo-700">Ham dosyalar yükleniyor...</p>
                                            </div>
                                        ) : rawFiles.length === 0 ? (
                                            <div className="text-center py-6">
                                                <Download className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                                                <p className="text-indigo-700 font-medium">Henüz ham dosya yüklenmemiş</p>
                                                <p className="text-sm text-indigo-600 mt-1">Denetçi dosyaları yüklediğinde burada görünecek</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {rawFiles.map((fileName, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-200">
                                                        <div className="flex items-center space-x-3">
                                                            <File className="h-4 w-4 text-indigo-500" />
                                                            <span className="text-sm text-gray-900">{fileName}</span>
                                                        </div>
                                                        <Download className="h-4 w-4 text-indigo-500" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Final Files Section - Upload & Delete */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <h3 className="text-lg font-medium text-gray-900">Final Dosyalar ({finalFiles.length})</h3>
                                            {finalFiles.length > 0 && (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={selectAllFinalFiles}
                                                        className="text-sm text-green-600 hover:text-green-800 font-medium"
                                                    >
                                                        {selectedFinalFiles.length === finalFiles.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
                                                    </button>
                                                    {selectedFinalFiles.length > 0 && (
                                                        <span className="text-sm text-gray-600">
                                                            ({selectedFinalFiles.length} seçili)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {selectedFinalFiles.length > 0 && (
                                                <button
                                                    onClick={handleDeleteSelectedFinalFiles}
                                                    disabled={isDeletingFiles}
                                                    className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                                                >
                                                    {isDeletingFiles ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                            <span>Siliniyor...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Trash2 className="h-3 w-3" />
                                                            <span>Seçilenleri Sil ({selectedFinalFiles.length})</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {finalFiles.length > 0 && (
                                                <button
                                                    onClick={() => handleDownloadReport(selectedReport.id, 'final', selectedReport.name)}
                                                    className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
                                                >
                                                    Tümünü İndir
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Final File Upload Area */}
                                    <div className="border rounded-lg bg-green-50 border-green-200 p-4">
                                        <div
                                            className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors cursor-pointer"
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('final-file-input')?.click()}
                                        >
                                            {isUploading ? (
                                                <div className="space-y-2">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                                                    <p className="text-sm text-green-700">Final dosyalar yükleniyor...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="h-6 w-6 text-green-500 mx-auto mb-2" />
                                                    <p className="text-green-700 font-medium">Final Dosya Yükle</p>
                                                    <p className="text-sm text-green-600 mt-1">Dosyaları sürükleyip bırakın veya tıklayın</p>
                                                    <input
                                                        id="final-file-input"
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => e.target.files && handleFinalFileUpload(e.target.files)}
                                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Final Files List */}
                                    <div className="border rounded-lg bg-green-50 border-green-200 p-4">
                                        {finalFiles.length === 0 ? (
                                            <div className="text-center py-4">
                                                <Upload className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                                <p className="text-green-700 font-medium">Henüz final dosya yüklenmemiş</p>
                                                <p className="text-sm text-green-600 mt-1">Yukarıdaki alandan final dosyalarınızı yükleyebilirsiniz</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {finalFiles.map((fileName, index) => (
                                                    <div
                                                        key={index}
                                                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                            selectedFinalFiles.includes(fileName)
                                                                ? 'bg-green-100 border-green-300'
                                                                : 'bg-white border-green-200 hover:bg-green-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedFinalFiles.includes(fileName)}
                                                                onChange={() => toggleFinalFileSelection(fileName)}
                                                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                            />
                                                            <File className="h-4 w-4 text-green-500" />
                                                            <span className="text-sm text-gray-900">{fileName}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteFinalFile(fileName)}
                                                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                                            title="Bu final dosyayı sil"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bulk Delete Info */}
                                    {selectedFinalFiles.length > 0 && (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                                <span className="text-sm text-amber-700 font-medium">
                                                    {selectedFinalFiles.length} final dosya seçildi. Toplu silmek için &#34;Seçilenleri Sil&#34; butonunu kullanın.
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={closeReportModal}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}