'use client';

import { useState, useEffect } from 'react';
import { User, Report } from '@/types';
import { apiService } from '@/lib/api';
import { X, FileText, Users, ArrowRight, Search, ArrowLeft, ChevronDown, ChevronRight, UserMinus } from 'lucide-react';
import { formatDate, getStatusColor, getStatusText, getRoleText } from '@/lib/utils';

interface ReportAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssignmentChange: () => void;
}

export default function ReportAssignModal({
                                              isOpen,
                                              onClose,
                                              onAssignmentChange
                                          }: ReportAssignModalProps) {
    const [unassignedReports, setUnassignedReports] = useState<Report[]>([]);
    const [allReports, setAllReports] = useState<Report[]>([]);
    const [reporters, setReporters] = useState<User[]>([]);
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [selectedReporter, setSelectedReporter] = useState<User | null>(null);
    const [selectedUnassignReports, setSelectedUnassignReports] = useState<string[]>([]);
    const [expandedReporter, setExpandedReporter] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersResponse, reportsResponse] = await Promise.all([
                apiService.admin.getAllUsers(),
                apiService.admin.getAllReports()
            ]);

            const allUsers = usersResponse.data;
            const allReports = reportsResponse.data;

            setReporters(allUsers.filter((user: User) => user.role === 'reporter'));
            setAllReports(allReports);
            setUnassignedReports(allReports.filter((report: Report) => !report.reporterId));
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignReports = async () => {
        if (!selectedReporter || selectedReports.length === 0) return;

        setIsLoading(true);
        try {
            await Promise.all(
                selectedReports.map(reportId =>
                    apiService.admin.assignReportToReporter(selectedReporter.id, reportId)
                )
            );

            setSelectedReports([]);
            setSelectedReporter(null);
            await loadData();
            onAssignmentChange();
            alert(`${selectedReports.length} rapor başarıyla atandı!`);
        } catch (error) {
            console.error('Failed to assign reports:', error);
            alert('Rapor atama işlemi başarısız!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnassignReports = async () => {
        if (selectedUnassignReports.length === 0) return;

        setIsLoading(true);
        try {
            await Promise.all(
                selectedUnassignReports.map(reportId =>
                    apiService.admin.unassignReport(reportId)
                )
            );

            setSelectedUnassignReports([]);
            setExpandedReporter(null);
            await loadData();
            onAssignmentChange();
            alert(`${selectedUnassignReports.length} rapor başarıyla çıkarıldı!`);
        } catch (error) {
            console.error('Failed to unassign reports:', error);
            alert('Rapor çıkarma işlemi başarısız!');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleReportSelection = (reportId: string) => {
        setSelectedReports(prev =>
            prev.includes(reportId)
                ? prev.filter(id => id !== reportId)
                : [...prev, reportId]
        );
    };

    const toggleUnassignReportSelection = (reportId: string) => {
        setSelectedUnassignReports(prev =>
            prev.includes(reportId)
                ? prev.filter(id => id !== reportId)
                : [...prev, reportId]
        );
    };

    const selectAllReports = () => {
        if (selectedReports.length === filteredReports.length) {
            setSelectedReports([]);
        } else {
            setSelectedReports(filteredReports.map(r => r.id));
        }
    };

    const getReporterReports = (reporterId: string) => {
        return allReports.filter(report => report.reporterId === reporterId);
    };

    const getReporterReportCount = (reporterId: string) => {
        return getReporterReports(reporterId).length;
    };

    const toggleReporterExpansion = (reporterId: string) => {
        setExpandedReporter(expandedReporter === reporterId ? null : reporterId);
        setSelectedUnassignReports([]);
    };

    const filteredReports = unassignedReports.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xl">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={onClose}
                                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Geri Dön</span>
                                </button>
                                <div className="h-4 w-px bg-gray-300"></div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Rapor Atama Yönetimi
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Sol: Rapor ata • Sağ: Rapor çıkar
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex h-[calc(90vh-180px)]">
                        {isLoading ? (
                            <div className="flex items-center justify-center w-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <>
                                {/* Reports Section - Left */}
                                <div className="w-1/2 border-r border-gray-200 flex flex-col">
                                    <div className="p-4 border-b border-gray-200 bg-blue-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                Atanmamış Raporlar ({filteredReports.length})
                                            </h3>
                                            {filteredReports.length > 0 && (
                                                <button
                                                    onClick={selectAllReports}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    {selectedReports.length === filteredReports.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Rapor ara..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {filteredReports.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                                <p>Atanmamış rapor bulunmuyor</p>
                                            </div>
                                        ) : (
                                            filteredReports.map((report) => (
                                                <div
                                                    key={report.id}
                                                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                                        selectedReports.includes(report.id)
                                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                    }`}
                                                    onClick={() => toggleReportSelection(report.id)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedReports.includes(report.id)}
                                                            onChange={() => toggleReportSelection(report.id)}
                                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-gray-900 truncate mb-1">
                                                                {report.name}
                                                            </h4>
                                                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                                                                <span>{formatDate(report.createdAt)}</span>
                                                                <span className={`px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
                                                                    {getStatusText(report.status)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Reporters Section - Right */}
                                <div className="w-1/2 flex flex-col">
                                    <div className="p-4 border-b border-gray-200 bg-green-50">
                                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                                            Raporlamacılar ({reporters.length})
                                        </h3>
                                        {selectedReports.length > 0 && selectedReporter && (
                                            <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3">
                                                <p className="text-sm text-gray-600 mb-1">Atanacak:</p>
                                                <p className="font-medium text-blue-600">{selectedReports.length} rapor → {selectedReporter.name}</p>
                                            </div>
                                        )}
                                        {selectedUnassignReports.length > 0 && (
                                            <div className="bg-white border border-red-200 rounded-lg p-3">
                                                <p className="text-sm text-gray-600 mb-1">Çıkarılacak:</p>
                                                <p className="font-medium text-red-600">{selectedUnassignReports.length} rapor</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {reporters.map((reporter) => {
                                            const reporterReports = getReporterReports(reporter.id);
                                            const reportCount = reporterReports.length;
                                            const isExpanded = expandedReporter === reporter.id;

                                            return (
                                                <div key={reporter.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    {/* Reporter Header */}
                                                    <div
                                                        className={`p-3 cursor-pointer transition-all ${
                                                            selectedReporter?.id === reporter.id
                                                                ? 'bg-green-50 border-green-200'
                                                                : 'hover:bg-gray-50'
                                                        }`}
                                                        onClick={() => setSelectedReporter(reporter)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="p-2 bg-green-100 rounded-full">
                                                                    <Users className="h-4 w-4 text-green-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-gray-900 truncate">
                                                                        {reporter.name}
                                                                    </h4>
                                                                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                                                        <span>{getRoleText(reporter.role)}</span>
                                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                                                            {reportCount} rapor
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {reportCount > 0 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleReporterExpansion(reporter.id);
                                                                    }}
                                                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Reporter Reports */}
                                                    {isExpanded && reportCount > 0 && (
                                                        <div className="border-t border-gray-200 bg-gray-50 p-3">
                                                            <div className="space-y-2">
                                                                {reporterReports.map((report) => (
                                                                    <div
                                                                        key={report.id}
                                                                        className={`border rounded p-2 cursor-pointer transition-all ${
                                                                            selectedUnassignReports.includes(report.id)
                                                                                ? 'border-red-500 bg-red-50'
                                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                                        }`}
                                                                        onClick={() => toggleUnassignReportSelection(report.id)}
                                                                    >
                                                                        <div className="flex items-start space-x-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedUnassignReports.includes(report.id)}
                                                                                onChange={() => toggleUnassignReportSelection(report.id)}
                                                                                className="mt-1 h-3 w-3 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                                            />
                                                                            <div className="flex-1 min-w-0">
                                                                                <h5 className="text-sm font-medium text-gray-900 truncate">
                                                                                    {report.name}
                                                                                </h5>
                                                                                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                                                    <span>{formatDate(report.createdAt)}</span>
                                                                                    <span className={`px-1 py-0.5 rounded ${getStatusColor(report.status)}`}>
                                                                                        {getStatusText(report.status)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {selectedReports.length > 0 && selectedReporter ? (
                                    <span>
                                        <strong>{selectedReports.length} rapor</strong> → <strong>{selectedReporter.name}</strong>
                                    </span>
                                ) : selectedUnassignReports.length > 0 ? (
                                    <span>
                                        <strong>{selectedUnassignReports.length} rapor</strong> çıkarılacak
                                    </span>
                                ) : (
                                    <span>Atama/çıkarma yapmak için raporları seçin</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    İptal
                                </button>
                                {selectedUnassignReports.length > 0 && (
                                    <button
                                        onClick={handleUnassignReports}
                                        disabled={isLoading}
                                        className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <UserMinus className="h-4 w-4" />
                                        <span>Çıkar ({selectedUnassignReports.length})</span>
                                    </button>
                                )}
                                {selectedReports.length > 0 && selectedReporter && (
                                    <button
                                        onClick={handleAssignReports}
                                        disabled={isLoading}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                        <span>Ata ({selectedReports.length})</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
