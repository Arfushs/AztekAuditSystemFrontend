// src/components/admin/ClientDetail.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, ClientReport } from '@/types';
import { apiService } from '@/lib/api';
import { FileText, Download, Calendar, Hash, UserX, GripVertical, Upload, Trash2 } from 'lucide-react';
import { formatDate, getStatusColor, getStatusText, downloadBlob } from '@/lib/utils';

interface ClientDetailProps {
    client: User;
    onReportUnassigned?: () => void;
}

export default function ClientDetail({ client, onReportUnassigned }: ClientDetailProps) {
    const [reports, setReports] = useState<ClientReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});

    useEffect(() => {
        loadClientReports();
    }, [client.id]);

    const loadClientReports = async () => {
        try {
            const response = await apiService.admin.getAllClientReports();
            const allReports = response.data;
            const clientReports = allReports.filter((report: ClientReport) => report.clientId === client.id);
            setReports(clientReports);
        } catch (error) {
            console.error('Failed to load client reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = async (reportId: string, reportName: string) => {
        try {
            const response = await apiService.admin.downloadClientReportZip(reportId);
            const blob = new Blob([response.data]);
            downloadBlob(blob, `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.zip`);
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Rapor indirme işlemi başarısız!');
        }
    };

    const handleFileUpload = async (reportId: string, files: FileList) => {
        if (!files || files.length === 0) return;

        setUploadingFiles(prev => ({ ...prev, [reportId]: true }));

        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('files', file);
            });

            await apiService.admin.uploadClientReportFiles(reportId, formData);
            loadClientReports(); // Reload to get updated file info
            alert('Dosyalar başarıyla yüklendi!');
        } catch (error) {
            console.error('Failed to upload files:', error);
            alert('Dosya yükleme işlemi başarısız!');
        } finally {
            setUploadingFiles(prev => ({ ...prev, [reportId]: false }));
        }
    };

    const handleUnassignReport = async (reportId: string, reportName: string) => {
        if (!confirm(`"${reportName}" raporunu bu yatırımcıdan çıkarmak istediğinize emin misiniz?`)) return;

        try {
            await apiService.admin.unassignClientReport(reportId);
            loadClientReports();
            onReportUnassigned?.();
        } catch (error) {
            console.error('Failed to unassign report:', error);
            alert('Rapor çıkarma işlemi başarısız!');
        }
    };

    const handleDeleteReport = async (reportId: string, reportName: string) => {
        if (!confirm(`"${reportName}" raporunu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;

        try {
            await apiService.admin.deleteClientReport(reportId);
            loadClientReports();
            onReportUnassigned?.();
            alert('Rapor başarıyla silindi!');
        } catch (error) {
            console.error('Failed to delete report:', error);
            alert('Rapor silme işlemi başarısız!');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Client Header */}
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{client.name} - Atanmış Raporlar</h3>
                        <p className="text-sm text-gray-600 mt-1">Bu yatırımcıya atanmış tüm raporlar</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">{reports.length}</div>
                        <div className="text-xs text-gray-600">Atanmış Rapor</div>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="p-6">
                {reports.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Bu yatırımcıya henüz rapor atanmamış</p>
                        <p className="text-sm text-gray-400 mt-2">
                            &#34;Rapor Atama&#34; butonunu kullanarak rapor atayabilirsiniz
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                                {/* Report Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <GripVertical className="h-4 w-4 text-gray-400" />
                                            <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <Hash className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">ID:</span>
                                                <code className="bg-gray-200 px-3 py-1 rounded font-mono text-gray-900 text-sm font-medium">
                                                    {report.id}
                                                </code>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">Oluşturulma:</span>
                                                <span className="text-gray-800">
                                                    {formatDate(report.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => handleUnassignReport(report.id, report.name)}
                                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Raporu bu yatırımcıdan çıkar"
                                        >
                                            <UserX className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteReport(report.id, report.name)}
                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Raporu kalıcı olarak sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* File Upload Section */}
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Dosya Yönetimi:</span>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => e.target.files && handleFileUpload(report.id, e.target.files)}
                                            className="hidden"
                                            id={`file-upload-${report.id}`}
                                            disabled={uploadingFiles[report.id]}
                                        />
                                        <label
                                            htmlFor={`file-upload-${report.id}`}
                                            className={`flex items-center space-x-2 text-sm px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                uploadingFiles[report.id]
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                        >
                                            <Upload className="h-3 w-3" />
                                            <span>{uploadingFiles[report.id] ? 'Yükleniyor...' : 'Dosya Yükle'}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Download Button */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">İndirilebilir İçerik:</span>

                                    {report.filePath ? (
                                        <button
                                            onClick={() => handleDownloadReport(report.id, report.name)}
                                            className="flex items-center space-x-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            <Download className="h-3 w-3" />
                                            <span>Raporu İndir (.zip)</span>
                                        </button>
                                    ) : (
                                        <span className="text-sm text-gray-400 px-3 py-2">Henüz dosya yüklenmemiş</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}