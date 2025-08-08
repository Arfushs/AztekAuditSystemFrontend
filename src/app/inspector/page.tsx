// İstatistikler// src/app/inspector/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Report } from '@/types';
import { apiService } from '@/lib/api';
import {
    FileText,
    Plus,
    Calendar,
    Hash,
    Upload,
    Download,
    Trash2,
    Edit3,
    Eye,
    FolderOpen,
    Clock,
    CheckCircle,
    AlertCircle,
    Users,
    X,
    File
} from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';

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

    const handleCreateReport = async () => {
        if (!newReportName.trim()) return;

        setIsCreating(true);
        try {
            // Inspector ID'yi localStorage'dan al
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

    const handleDeleteReport = async (report: Report) => {
        if (!confirm(`"${report.name}" raporunu silmek istediğinize emin misiniz?`)) return;

        try {
            await apiService.inspector.deleteReport(report.id);
            loadMyReports();
            alert('Rapor başarıyla silindi!');
        } catch (error) {
            console.error('Failed to delete report:', error);
            alert('Rapor silme işlemi başarısız!');
        }
    };

    const handleDownloadReport = async (reportId: string, subfolder: 'raw' | 'final', reportName?: string) => {
        try {
            const response = await apiService.shared.downloadReports(reportId, subfolder);

            // Rapor ismini temizle (dosya adı için güvenli hale getir)
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
            // Geçici olarak boş array set et
            setReportFiles([]);

            // Hata detayını göster (geliştirme için)
            if (error.response?.status === 500) {
                console.error('500 Error details:', error.response?.data);
                alert('Backend API hatası: getReportFiles endpoint kontrol edilmeli');
            }
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setSelectedReport(null);
        setReportFiles([]);
    };

    const handleFileUpload = async (files: FileList) => {
        if (!files || !selectedReport) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });

            await apiService.inspector.uploadRawFiles(selectedReport.id, formData);
            alert(`${files.length} dosya başarıyla yüklendi!`);

            // Refresh file list
            const response = await apiService.inspector.getReportFiles(selectedReport.id);
            setReportFiles(response.data.rawFiles || []);

            // Refresh reports list
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

            // Refresh file list
            const response = await apiService.inspector.getReportFiles(selectedReport.id);
            setReportFiles(response.data.rawFiles || []);

            alert('Dosya başarıyla silindi!');
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Dosya silme işlemi başarısız!');
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
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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

            {/* Reports List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Rapor Listesi</h2>
                </div>

                {reports.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Henüz rapor oluşturmamışsın</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            İlk raporunu oluştur →
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {reports.map((report) => (
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
                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
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

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDeleteReport(report)}
                                        className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Raporu sil"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
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
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                    {isUploading ? (
                                        <div className="space-y-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="text-sm text-gray-600">Yükleniyor...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                            <label className="cursor-pointer">
                                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                                    Dosya seçin
                                                </span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                                />
                                            </label>
                                            <p className="text-sm text-gray-500 mt-1">veya dosyaları sürükleyip bırakın</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Files List */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-medium text-gray-900">Dosyalar ({reportFiles.length})</h3>
                                    {reportFiles.length > 0 && (
                                        <button
                                            onClick={() => handleDownloadReport(selectedReport.id, 'raw', selectedReport.name)}
                                            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                                        >
                                            Tümünü İndir
                                        </button>
                                    )}
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
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <File className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm text-gray-900">{fileName}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteFile(fileName)}
                                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                                    title="Dosyayı sil"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
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