// src/app/client/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ClientReport } from '@/types';
import { apiService } from '@/lib/api';
import {
    FileText,
    Download,
    Calendar,
    Hash,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    Building2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Sıralama türleri
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export default function ClientDashboard() {
    const [reports, setReports] = useState<ClientReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filtreleme ve arama
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('newest');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        loadClientData();
    }, []);

    const loadClientData = async () => {
        try {
            setIsLoading(true);

            // Get client reports
            const reportsResponse = await apiService.client.getMyReports();
            setReports(reportsResponse.data);
        } catch (error) {
            console.error('Failed to load client reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtreleme ve sıralama işlemleri
    const filteredAndSortedReports = useMemo(() => {
        const filtered = reports.filter(report =>
            report.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

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
                default:
                    return 0;
            }
        });

        return filtered;
    }, [reports, searchTerm, sortOption]);

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
        setSortOption('newest');
        setCurrentPage(1);
    };

    const handleDownloadReport = async (reportId: string, reportName: string) => {
        try {
            const response = await apiService.client.downloadReportZip(reportId);
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Rapor indirme işlemi başarısız!');
        }
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
                    <p className="text-gray-600 mt-1">
                        Size özel hazırlanan raporları görüntüleyebilir ve indirebilirsiniz.
                    </p>
                </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Toplam Raporunuz</p>
                        <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Size özel hazırlanan raporlar</p>
                    </div>
                    <FileText className="h-12 w-12 text-blue-400" />
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-4 mb-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Arama ve Sıralama</h3>
                    {(searchTerm || sortOption !== 'newest') && (
                        <button
                            onClick={resetFilters}
                            className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Sıfırla
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                        />
                    </div>
                    {/* Sıralama */}
                    <select
                        value={sortOption}
                        onChange={(e) => handleSortChange(e.target.value as SortOption)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                        <option value="newest" className="text-gray-900">En Yeni → En Eski</option>
                        <option value="oldest" className="text-gray-900">En Eski → En Yeni</option>
                        <option value="name-asc" className="text-gray-900">İsim A → Z</option>
                        <option value="name-desc" className="text-gray-900">İsim Z → A</option>
                    </select>
                </div>
                <div className="mt-4 text-sm text-gray-700 font-medium">
                    <span>{filteredAndSortedReports.length} rapor bulundu</span>
                    {searchTerm && (
                        <span> (toplam {reports.length} rapor)</span>
                    )}
                </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                    <h2 className="text-lg font-semibold text-gray-900">Rapor Listesi</h2>
                </div>

                {paginatedReports.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        {reports.length === 0 ? (
                            <>
                                <p className="text-gray-500 mb-2">Henüz size atanmış rapor bulunmuyor</p>
                                <p className="text-sm text-gray-400">
                                    Raporlar hazırlandığında burada görüntülenecek
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-500">Arama kriterlerinize uygun rapor bulunamadı</p>
                                <button
                                    onClick={resetFilters}
                                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Aramayı temizle
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {paginatedReports.map((report) => (
                            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className="p-3 bg-blue-100 rounded-full">
                                            <FolderOpen className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    {report.name}
                                                </h3>
                                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                    <Hash className="h-3 w-3" />
                                                    <span>ID: {report.id}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">Oluşturulma:</span>
                                                    <span className="text-gray-800">
                                                        {formatDate(report.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-600">Durum:</span>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                        Size Atanmış
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Download Button */}
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => handleDownloadReport(report.id, report.name)}
                                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    <span>Raporu İndir</span>
                                                </button>
                                                <span className="text-xs text-gray-500">
                                                    ZIP dosyası olarak indirilecek
                                                </span>
                                            </div>
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
                                                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
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
        </div>
    );
}