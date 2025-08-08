'use client';

import { useState, useEffect, useMemo } from 'react';
import { Report } from '@/types';
import { apiService } from '@/lib/api';
import { FileText, Plus, Calendar, Hash, Upload, Download, Trash2, Eye, FolderOpen, Clock, CheckCircle, AlertCircle, Users, X, File, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';

// Filtreleme ve sıralama türleri
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'status-priority' | 'status-reverse';
type FilterStatus = 'all' | 'draft' | 'pending' | 'assigned' | 'finalized';

export default function InspectorDashboard() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newReportName, setNewReportName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Modal states
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportFiles, setReportFiles] = useState<string[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Bulk delete states
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
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
        loadMyReports();
    }, []);

    const loadMyReports = async () => {
        try {
            const inspectorId = localStorage.getItem('userId') || '';
            if (!inspectorId) {
                console.error('Inspector ID not found');
                return;
            }
            const response = await apiService.inspector.getMyReports(inspectorId);
            setReports(response.data);
        } catch (error) {
            console.error('Failed to load reports:', error);
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

    // Filtre sıfırlama
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortOption('newest');
        setCurrentPage(1);
    };

    const handleCreateReport = async () => {
        if (!newReportName.trim()) return;
        setIsCreating(true);
        try {
            const inspectorId = localStorage.getItem('userId') || '';
            await apiService.inspector.createReport(newReportName.trim(), inspectorId);
            setNewReportName('');
            setShowCreateForm(false);
            loadMyReports();
            alert('Rapor başarıyla oluşturuldu!');
        } catch (error) {
            console.error('Failed to create report:', error);
            alert('Rapor oluşturma işlemi başarısız!');
        } finally {
            setIsCreating(false);
        }
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
            const response = await apiService.inspector.getReportFiles(report.id);
            setReportFiles(response.data.rawFiles || []);
        } catch (error) {
            console.error('Failed to load files:', error);
            setReportFiles([]);
            if (error instanceof Error) {
                console.error('Failed to load reports:', error.message);
            } else {
                console.error('Failed to load reports:', String(error));
            }
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setSelectedReport(null);
        setReportFiles([]);
        setSelectedFiles([]); // Seçili dosyaları temizle
    };

    const handleFileUpload = async (files: FileList) => {
        if (!files || !selectedReport || files.length === 0) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });
            await apiService.inspector.uploadRawFiles(selectedReport.id, formData);
            alert(`${files.length} dosya başarıyla yüklendi!`);
            const response = await apiService.inspector.getReportFiles(selectedReport.id);
            setReportFiles(response.data.rawFiles || []);
            loadMyReports();
        } catch (error) {
            console.error('File upload failed:', error);
            alert('Dosya yükleme işlemi başarısız!');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteFile = async (fileName: string) => {
        if (!selectedReport || !confirm(`"${fileName}" dosyasını silmek istediğinize emin misiniz?`)) return;
        try {
            await apiService.inspector.deleteFile(selectedReport.id, fileName);
            const response = await apiService.inspector.getReportFiles(selectedReport.id);
            setReportFiles(response.data.rawFiles || []);
            alert('Dosya başarıyla silindi!');
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Dosya silme işlemi başarısız!');
        }
    };

    // Bulk delete functions
    const toggleFileSelection = (fileName: string) => {
        setSelectedFiles(prev =>
            prev.includes(fileName)
                ? prev.filter(f => f !== fileName)
                : [...prev, fileName]
        );
    };

    const selectAllFiles = () => {
        if (selectedFiles.length === reportFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles([...reportFiles]);
        }
    };

    const handleDeleteSelectedFiles = async () => {
        if (!selectedReport || selectedFiles.length === 0) return;

        if (!confirm(`${selectedFiles.length} dosyayı silmek istediğinize emin misiniz?`)) return;

        setIsDeletingFiles(true);
        try {
            // Tüm seçili dosyaları sil
            await Promise.all(
                selectedFiles.map(fileName =>
                    apiService.inspector.deleteFile(selectedReport.id, fileName)
                )
            );

            // Dosya listesini yenile
            const response = await apiService.inspector.getReportFiles(selectedReport.id);
            setReportFiles(response.data.rawFiles || []);
            setSelectedFiles([]);
            alert(`${selectedFiles.length} dosya başarıyla silindi!`);
        } catch (error) {
            console.error('Failed to delete files:', error);
            alert('Dosya silme işlemi başarısız!');
        } finally {
            setIsDeletingFiles(false);
        }
    };

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Raporlarım</h1>
                    <p className="text-gray-600 mt-1">Oluşturduğun raporları görüntüle ve yönet</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Yeni Rapor</span>
                </button>
            </div>

            {/* Create Report Form */}
            {showCreateForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Rapor Oluştur</h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newReportName}
                                onChange={(e) => setNewReportName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-600"
                                placeholder="Rapor adını girin..."
                                disabled={isCreating}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateReport()}
                            />
                        </div>
                        <button
                            onClick={handleCreateReport}
                            disabled={isCreating || !newReportName.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="px-4 py-3 text-gray-500 hover:text-gray-700"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}

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
                            <p className="text-sm font-medium text-gray-600">Raporcuda</p>
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
                        <option value="assigned">Raporcuda</option>
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

            {/* Reports List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Rapor Listesi</h2>
                </div>
                {paginatedReports.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        {reports.length === 0 ? (
                            <>
                                <p className="text-gray-500 mb-4">Henüz rapor oluşturmamışsın</p>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    İlk raporunu oluştur →
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-500">Filtrelerinize uygun rapor bulunamadı</p>
                                <button
                                    onClick={resetFilters}
                                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
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
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <FolderOpen className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {report.name}
                                                </h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Hash className="h-3 w-3 text-gray-400" />
                                                    <span className="text-xs text-gray-500">{report.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">Oluşturulma:</span>
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
                                                <code className="bg-gray-900 px-2 py-1 rounded text-xs">
                                                    {report.folderId}
                                                </code>
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={() => openReportModal(report)}
                                                className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm transition-colors"
                                            >
                                                <Eye className="h-3 w-3" />
                                                <span>Detay</span>
                                            </button>
                                            {report.rawReportPath && (
                                                <button
                                                    onClick={() => handleDownloadReport(report.id, 'raw', report.name)}
                                                    className="flex items-center space-x-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm transition-colors"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span>Ham Dosyalar</span>
                                                </button>
                                            )}
                                            {report.finalReportPath && (
                                                <button
                                                    onClick={() => handleDownloadReport(report.id, 'final', report.name)}
                                                    className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm transition-colors"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span>Final Rapor</span>
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

            {/* Report Detail Modal */}
            {showReportModal && selectedReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{selectedReport.name}</h2>
                                <p className="text-sm text-gray-600 mt-1">Dosya Yönetimi</p>
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
                                        <span className="text-gray-600">Oluşturulma:</span>
                                        <span className="ml-2 text-gray-800">{formatDate(selectedReport.createdAt)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Dosya Sayısı:</span>
                                        <span className="ml-2 font-medium text-gray-800">{reportFiles.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">ID:</span>
                                        <code className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded font-medium text-gray-800">{selectedReport.id.slice(0, 8)}</code>
                                    </div>
                                </div>
                            </div>
                            {/* File Upload */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Dosya Yükle</h3>
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('file-input')?.click()}
                                >
                                    {isUploading ? (
                                        <div className="space-y-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="text-sm text-gray-600">Yükleniyor...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                            <div className="space-y-2">
                                                <p className="text-blue-600 hover:text-blue-700 font-medium">
                                                    Dosyaları seçin veya sürükleyip bırakın
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Birden fazla dosya seçebilirsiniz
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Desteklenen formatlar: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP
                                                </p>
                                            </div>
                                            <input
                                                id="file-input"
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Upload Progress Info */}
                                {isUploading && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            <span className="text-sm text-blue-700 font-medium">
                                                Dosyalar yükleniyor, lütfen bekleyin...
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Alternative File Selection Button */}
                            <div className="mb-4">
                                <label className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                                    <Upload className="h-4 w-4" />
                                    <span>Dosya Seç (Çoklu)</span>
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Ctrl/Cmd tuşu ile birden fazla dosya seçebilirsiniz
                                </p>
                            </div>
                            {/* Files List */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-4">
                                        <h3 className="text-lg font-medium text-gray-900">Dosyalar ({reportFiles.length})</h3>
                                        {reportFiles.length > 0 && (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={selectAllFiles}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    {selectedFiles.length === reportFiles.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
                                                </button>
                                                {selectedFiles.length > 0 && (
                                                    <span className="text-sm text-gray-600">
                                                        ({selectedFiles.length} seçili)
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {selectedFiles.length > 0 && (
                                            <button
                                                onClick={handleDeleteSelectedFiles}
                                                disabled={isDeletingFiles}
                                                className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            >
                                                {isDeletingFiles ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                        <span>Siliniyor...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-3 w-3" />
                                                        <span>Seçilenleri Sil ({selectedFiles.length})</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {reportFiles.length > 0 && (
                                            <button
                                                onClick={() => handleDownloadReport(selectedReport.id, 'raw', selectedReport.name)}
                                                className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                                            >
                                                Tümünü İndir
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isLoadingFiles ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                        <p className="text-sm text-gray-600">Dosyalar yükleniyor...</p>
                                    </div>
                                ) : reportFiles.length === 0 ? (
                                    <div className="text-center py-8">
                                        <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">Henüz dosya yüklenmemiş</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {reportFiles.map((fileName, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                                    selectedFiles.includes(fileName)
                                                        ? 'bg-blue-50 border border-blue-200'
                                                        : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFiles.includes(fileName)}
                                                        onChange={() => toggleFileSelection(fileName)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <File className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm text-gray-900">{fileName}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteFile(fileName)}
                                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                                    title="Bu dosyayı sil"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Bulk Delete Info */}
                                {selectedFiles.length > 0 && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <span className="text-sm text-amber-700 font-medium">
                                                {selectedFiles.length} dosya seçildi. Toplu silmek için &#34;Seçilenleri Sil&#34; butonunu kullanın.
                                            </span>
                                        </div>
                                    </div>
                                )}
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
