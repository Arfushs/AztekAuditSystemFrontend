// src/components/admin/ReporterDetail.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, Report } from '@/types';
import { apiService } from '@/lib/api';
import { FileText, Download, Calendar, Hash, UserX, GripVertical } from 'lucide-react';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';

interface ReporterDetailProps {
    reporter: User;
    onReportUnassigned?: () => void;
}

export default function ReporterDetail({ reporter, onReportUnassigned }: ReporterDetailProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadReporterReports();
    }, [reporter.id]);

    const loadReporterReports = async () => {
        try {
            const response = await apiService.admin.getAllReports();
            const allReports = response.data;
            const reporterReports = allReports.filter((report: Report) => report.reporterId === reporter.id);
            setReports(reporterReports);
        } catch (error) {
            console.error('Failed to load reporter reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

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

    const handleUnassignReport = async (reportId: string, reportName: string) => {
        if (!confirm(`"${reportName}" raporunu bu raporcudan çıkarmak istediğinize emin misiniz?`)) return;

        try {
            await apiService.admin.unassignReport(reportId);
            loadReporterReports();
            onReportUnassigned?.();
        } catch (error) {
            console.error('Failed to unassign report:', error);
            alert('Rapor çıkarma işlemi başarısız!');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Reporter Header */}
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{reporter.name} - Atanmış Raporlar</h3>
                        <p className="text-sm text-gray-600 mt-1">Bu raporcuya atanmış tüm raporlar</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{reports.length}</div>
                        <div className="text-xs text-gray-600">Atanmış Rapor</div>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="p-6">
                {reports.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Bu raporcuya henüz rapor atanmamış</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Sağdaki listeden buraya sürükleyerek rapor atayabilirsiniz
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

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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

                                            <div className="flex items-center space-x-2">
                                                <span className="text-gray-600">Status:</span>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleUnassignReport(report.id, report.name)}
                                        className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Raporu bu raporcudan çıkar"
                                    >
                                        <UserX className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Download Buttons */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm text-gray-600">İndirilebilir İçerik:</span>

                                    {report.rawReportPath ? (
                                        <button
                                            onClick={() => handleDownloadReport(report.id, 'raw')}
                                            className="flex items-center space-x-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            <Download className="h-3 w-3" />
                                            <span>Ham Dosyalar</span>
                                        </button>
                                    ) : (
                                        <span className="text-sm text-gray-400 px-3 py-2">Ham dosya yok</span>
                                    )}

                                    {report.finalReportPath ? (
                                        <button
                                            onClick={() => handleDownloadReport(report.id, 'final')}
                                            className="flex items-center space-x-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            <Download className="h-3 w-3" />
                                            <span>Final Rapor</span>
                                        </button>
                                    ) : (
                                        <span className="text-sm text-gray-400 px-3 py-2">Final rapor yok</span>
                                    )}

                                    {!report.rawReportPath && !report.finalReportPath && (
                                        <span className="text-sm text-gray-500 italic">Henüz dosya yüklenmemiş</span>
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