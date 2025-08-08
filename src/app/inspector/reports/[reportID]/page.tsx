// src/app/inspector/reports/[reportId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Report } from '@/types';
import { apiService } from '@/lib/api';
import {
    ArrowLeft,
    FileText,
    Upload,
    Trash2,
    Download,
    Calendar,
    Hash,
    FolderOpen,
    Plus,
    AlertCircle,
    CheckCircle2,
    X,
    File
} from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import Link from 'next/link';

interface FileInfo {
    name: string;
    size?: number;
    uploadDate?: string;
}

export default function InspectorReportDetailPage() {
    const params = useParams();
    const reportId = params?.reportId as string;

    const [report, setReport] = useState<Report | null>(null);
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const filesPerPage = 10;
    const totalPages = Math.ceil(files.length / filesPerPage);
    const paginatedFiles = files.slice((currentPage - 1) * filesPerPage, currentPage * filesPerPage);

    useEffect(() => {
        if (reportId) {
            loadReportDetail();
            loadReportFiles();
        }
    }, [reportId]);

    const loadReportDetail = async () => {
        try {
            const inspectorId = localStorage.getItem('userId') || '';
            const response = await apiService.inspector.getMyReports(inspectorId);
            const reportData = response.data.find((r: Report) => r.id === reportId);
            setReport(reportData || null);
        } catch (error) {
            console.error('Failed to load report detail:', error);
        }
    };

    const loadReportFiles = async () => {
        try {
            const response = await apiService.inspector.getReportFiles(reportId);
            const rawFiles = response.data.rawFiles || [];
            setFiles(rawFiles.map((fileName: string) => ({ name: fileName })));
        } catch (error) {
            console.error('Failed to load report files:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (selectedFiles: FileList) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            Array.from(selectedFiles).forEach((file) => {
                formData.append('files', file);
            });

            // Simüle upload progress
            const interval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            await apiService.inspector.uploadRawFiles(reportId, formData);

            clearInterval(interval);
            setUploadProgress(100);

            setTimeout(() => {
                setUploadProgress(0);
                setIsUploading(false);
                loadReportFiles();
                alert(`${selectedFiles.length} dosya başarıyla yüklendi!`);
            }, 500);

        } catch (error) {
            console.error('File upload failed:', error);
            alert('Dosya yükleme işlemi başarısız!');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteFile = async (fileName: string) => {
        if (!confirm(`"${fileName}" dosyasını silmek istediğinize emin misiniz?`)) return;

        try {
            await apiService.inspector.deleteFile(reportId, fileName);
            loadReportFiles();
            alert('Dosya başarıyla silindi!');
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Dosya silme işlemi başarısız!');
        }
    };

    const handleDownloadReport = async (subfolder: 'raw' | 'final') => {
        try {
            const response = await apiService.shared.downloadReports(reportId, subfolder);
            const reportName = await apiService.shared.getReportNameByID(reportId);

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportName}_${subfolder}_files.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Dosya indirme işlemi başarısız!');
        }
    };

    // Drag & Drop handlers
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files);
        }
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFileUpload(e.target.files);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">Rapor bulunamadı</p>
                <Link href="/inspector" className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block">
                    ← Geri dön
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <Link
                    href="/inspector"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Raporlarım&apos;a Dön</span>
                </Link>
                <div className="flex items-center space-x-3">
                    {files.length > 0 && (
                        <button
                            onClick={() => handleDownloadReport('raw')}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            <span>Tüm Dosyaları İndir</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Report Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FolderOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
                            <div className="flex items-center space-x-2 mt-1">
                                <Hash className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-500">{report.id}</span>
                            </div>
                        </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {getStatusText(report.status)}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Oluşturulma:</span>
                        <span className="text-gray-800">{formatDate(report.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Klasör ID:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{report.folderId}</code>
                    </div>
                    <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Dosya Sayısı:</span>
                        <span className="font-medium text-gray-800">{files.length}</span>
                    </div>
                </div>
            </div>

            {/* File Upload Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dosya Yükleme</h2>

                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {isUploading ? (
                        <div className="space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600">Dosyalar yükleniyor...</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-500">{uploadProgress}%</p>
                        </div>
                    ) : (
                        <>
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                Dosyalarınızı buraya sürükleyin
                            </p>
                            <p className="text-gray-500 mb-4">veya</p>
                            <label className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                                <Plus className="h-4 w-4" />
                                <span>Dosya Seç</span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                            </label>
                            <p className="text-xs text-gray-400 mt-3">
                                Çoklu dosya seçimi desteklenir
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Files List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Dosya Listesi ({files.length})
                        </h2>
                        {files.length > filesPerPage && (
                            <div className="text-sm text-gray-600">
                                Sayfa {currentPage} / {totalPages}
                            </div>
                        )}
                    </div>
                </div>

                {files.length === 0 ? (
                    <div className="text-center py-12">
                        <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Henüz dosya yüklenmemiş</p>
                        <p className="text-sm text-gray-400">Yukarıdaki alandan dosya yükleyebilirsiniz</p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-gray-200">
                            {paginatedFiles.map((file, index) => (
                                <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <File className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{file.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {file.size && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFile(file.name)}
                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Dosyayı sil"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    {((currentPage - 1) * filesPerPage) + 1}-{Math.min(currentPage * filesPerPage, files.length)} / {files.length} dosya
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Önceki
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Sonraki
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}