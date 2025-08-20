// src/app/admin/clients/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, ClientReport } from '@/types';
import { apiService } from '@/lib/api';
import {
    Building2,
    Plus,
    X,
    Key,
    Calendar,
    ArrowLeft,
    Hash,
    Settings,
    Copy,
    Check,
    FileText,
    UserPlus,
    Search,
    Filter,
    Upload,
    Download,
    Trash2,
    UserX,
    Users,
    BarChart3,
    Eye,
    AlertCircle,
    File
} from 'lucide-react';
import { formatDate, getRoleText, downloadBlob } from '@/lib/utils';
import Link from 'next/link';
import ClientReportAssignModal from '@/components/admin/ClientReportAssignModal';

type SortOption = 'name' | 'date' | 'reportCount';
type ViewMode = 'clients' | 'reports' | 'both';

export default function AdminClientsPage() {
    // States
    const [clients, setClients] = useState<User[]>([]);
    const [clientReports, setClientReports] = useState<ClientReport[]>([]);
    const [reportFiles, setReportFiles] = useState<{[key: string]: string[]}>({});
    const [isLoading, setIsLoading] = useState(true);

    // UI States
    const [viewMode, setViewMode] = useState<ViewMode>('both');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Form States
    const [showCreateClientForm, setShowCreateClientForm] = useState(false);
    const [showCreateReportForm, setShowCreateReportForm] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newReportName, setNewReportName] = useState('');
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [isCreatingReport, setIsCreatingReport] = useState(false);



    // Upload States  
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Assignment States
    const [selectedReportForAssign, setSelectedReportForAssign] = useState<string | null>(null);

    // Modal states for file management
    const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Bulk delete states
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isDeletingFiles, setIsDeletingFiles] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [clientsResponse, clientReportsResponse] = await Promise.all([
                apiService.admin.getAllClients(),
                apiService.admin.getAllClientReports()
            ]);

            setClients(clientsResponse.data);
            setClientReports(clientReportsResponse.data);

            // Load files for each report with better error handling
            const filesData: {[key: string]: string[]} = {};
            for (const report of clientReportsResponse.data) {
                try {
                    const filesResponse = await apiService.admin.getClientReportFiles(report.id);
                    filesData[report.id] = filesResponse.data.files || [];
                } catch (error) {
                    // Silently handle file loading errors - endpoint might not be ready
                    filesData[report.id] = [];
                    // Only log non-400/404 errors
                    if (error instanceof Error && !error.message.includes('400') && !error.message.includes('404')) {
                        console.warn(`Could not load files for report ${report.id}:`, error);
                    }
                }
            }
            setReportFiles(filesData);

        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // CRUD Operations
    const handleCreateClient = async () => {
        if (!newClientName.trim()) return;
        setIsCreatingClient(true);
        try {
            await apiService.admin.createClient(newClientName.trim());
            setNewClientName('');
            setShowCreateClientForm(false);
            loadData();
        } catch (error) {
            console.error('Failed to create client:', error);
        } finally {
            setIsCreatingClient(false);
        }
    };

    const handleCreateClientReport = async () => {
        if (!newReportName.trim()) return;
        setIsCreatingReport(true);
        try {
            await apiService.admin.createClientReport(newReportName.trim());
            setNewReportName('');
            setShowCreateReportForm(false);
            loadData();
        } catch (error) {
            console.error('Failed to create client report:', error);
        } finally {
            setIsCreatingReport(false);
        }
    };

    const handleDeleteClient = async (client: User) => {
        if (!confirm(`${client.name} adlı yatırımcıyı silmek istediğinize emin misiniz?`)) return;
        try {
            await apiService.admin.deleteClient(client.id);
            loadData();
        } catch (error) {
            console.error('Failed to delete client:', error);
        }
    };

    const handleDeleteReport = async (report: ClientReport) => {
        if (!confirm(`"${report.name}" raporunu kalıcı olarak silmek istediğinize emin misiniz?`)) return;
        try {
            await apiService.admin.deleteClientReport(report.id);
            loadData();
        } catch (error) {
            console.error('Failed to delete report:', error);
        }
    };



    // Assignment Operations
    const handleAssignReport = async (reportId: string, clientId: string) => {
        try {
            await apiService.admin.assignClientReport(reportId, clientId);
            setSelectedReportForAssign(null);
            loadData();
        } catch (error) {
            console.error('Failed to assign report:', error);
        }
    };

    const handleUnassignReport = async (reportId: string) => {
        try {
            await apiService.admin.unassignClientReport(reportId);
            loadData();
        } catch (error) {
            console.error('Failed to unassign report:', error);
        }
    };

    // File Operations - Inspector Style
    const openReportModal = async (report: ClientReport) => {
        setSelectedReport(report);
        setShowReportModal(true);
        setIsLoadingFiles(true);
        try {
            const filesResponse = await apiService.admin.getClientReportFiles(report.id);
            setReportFiles(prev => ({
                ...prev,
                [report.id]: filesResponse.data.files || []
            }));
        } catch (error) {
            console.error('Failed to load files:', error);
            // If the endpoint doesn't exist or returns 400, just set empty array
            setReportFiles(prev => ({
                ...prev,
                [report.id]: []
            }));

            // Only show alert for unexpected errors (not 400 or 404)
            if (error instanceof Error && !error.message.includes('400') && !error.message.includes('404')) {
                console.warn('Dosya listesi yüklenirken beklenmeyen bir hata oluştu:', error);
            }
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setSelectedReport(null);
        setSelectedFiles([]);
    };

    const handleFileUpload = async (files: FileList) => {
        if (!files || !selectedReport || files.length === 0) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });
            await apiService.admin.uploadClientReportFiles(selectedReport.id, formData);
            alert(`${files.length} dosya başarıyla yüklendi!`);

            // Reload files
            const filesResponse = await apiService.admin.getClientReportFiles(selectedReport.id);
            setReportFiles(prev => ({
                ...prev,
                [selectedReport.id]: filesResponse.data.files || []
            }));
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
            await apiService.admin.deleteClientReportFile(selectedReport.id, fileName);

            // Update local state
            setReportFiles(prev => ({
                ...prev,
                [selectedReport.id]: prev[selectedReport.id]?.filter(f => f !== fileName) || []
            }));

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
        if (!selectedReport) return;
        const currentFiles = reportFiles[selectedReport.id] || [];
        if (selectedFiles.length === currentFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles([...currentFiles]);
        }
    };

    const handleDeleteSelectedFiles = async () => {
        if (!selectedReport || selectedFiles.length === 0) return;

        if (!confirm(`${selectedFiles.length} dosyayı silmek istediğinize emin misiniz?`)) return;

        setIsDeletingFiles(true);
        try {
            // Delete all selected files
            await Promise.all(
                selectedFiles.map(fileName =>
                    apiService.admin.deleteClientReportFile(selectedReport.id, fileName)
                )
            );

            // Update local state
            setReportFiles(prev => ({
                ...prev,
                [selectedReport.id]: prev[selectedReport.id]?.filter(f => !selectedFiles.includes(f)) || []
            }));

            setSelectedFiles([]);
            alert(`${selectedFiles.length} dosya başarıyla silindi!`);
        } catch (error) {
            console.error('Failed to delete files:', error);
            alert('Dosya silme işlemi başarısız!');
        } finally {
            setIsDeletingFiles(false);
        }
    };

    // Drag and drop handlers
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

    // Utility Functions
    const handleCopyAccessKey = async (accessKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(accessKey);
                setCopiedKey(accessKey);
                setTimeout(() => setCopiedKey(null), 2000);
                return;
            } catch (error) {
                console.error('Clipboard API failed:', error);
            }
        }

        // Fallback method
        try {
            const textArea = document.createElement('textarea');
            textArea.value = accessKey;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                setCopiedKey(accessKey);
                setTimeout(() => setCopiedKey(null), 2000);
            }
        } catch (fallbackError) {
            alert('Kopyalama işlemi başarısız oldu.');
        }
    };

    const getClientReportCount = (clientId: string) => {
        return clientReports.filter(report => report.clientId === clientId).length;
    };

    const getClientName = (clientId?: string) => {
        if (!clientId) return 'Atanmamış';
        const client = clients.find(c => c.id === clientId);
        return client?.name || 'Bilinmiyor';
    };

    // Filtering and Sorting
    const filteredAndSortedClients = clients
        .filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'date':
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                case 'reportCount':
                    aValue = getClientReportCount(a.id);
                    bValue = getClientReportCount(b.id);
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

    const filteredAndSortedReports = clientReports
        .filter(report =>
            report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getClientName(report.clientId).toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'date':
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
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
                        onClick={() => setShowCreateReportForm(!showCreateReportForm)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Yeni Rapor</span>
                    </button>
                    <button
                        onClick={() => setShowCreateClientForm(!showCreateClientForm)}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Yeni Yatırımcı</span>
                    </button>
                </div>
            </div>

            {/* Title */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Yatırımcı & Rapor Yönetimi</h1>
                <p className="text-gray-600 mt-1">Yatırımcıları ve raporlarını tek yerden yönetin</p>
            </div>

            {/* Inline Create Forms */}
            {showCreateClientForm && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-700 font-medium"
                                placeholder="Yatırımcı adını girin..."
                                disabled={isCreatingClient}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateClient()}
                            />
                        </div>
                        <button
                            onClick={handleCreateClient}
                            disabled={isCreatingClient || !newClientName.trim()}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingClient ? 'Oluşturuluyor...' : 'Oluştur'}
                        </button>
                        <button
                            onClick={() => setShowCreateClientForm(false)}
                            className="p-3 text-gray-500 hover:text-gray-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {showCreateReportForm && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newReportName}
                                onChange={(e) => setNewReportName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-700 font-medium"
                                placeholder="Yatırımcı raporu adını girin..."
                                disabled={isCreatingReport}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateClientReport()}
                            />
                        </div>
                        <button
                            onClick={handleCreateClientReport}
                            disabled={isCreatingReport || !newReportName.trim()}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingReport ? 'Oluşturuluyor...' : 'Oluştur'}
                        </button>
                        <button
                            onClick={() => setShowCreateReportForm(false)}
                            className="p-3 text-gray-500 hover:text-gray-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Building2 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Toplam Yatırımcı</p>
                            <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Toplam Rapor</p>
                            <p className="text-2xl font-bold text-gray-900">{clientReports.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Atanmış Rapor</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {clientReports.filter(r => r.clientId).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Ortalama Rapor</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {clients.length > 0 ? (clientReports.filter(r => r.clientId).length / clients.length).toFixed(1) : '0'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Yatırımcı veya rapor ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-700 font-medium"
                        />
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Görünüm:</span>
                        <select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as ViewMode)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        >
                            <option value="both" className="text-gray-900">Hepsi</option>
                            <option value="clients" className="text-gray-900">Sadece Yatırımcılar</option>
                            <option value="reports" className="text-gray-900">Sadece Raporlar</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Sırala:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        >
                            <option value="name" className="text-gray-900">İsim</option>
                            <option value="date" className="text-gray-900">Tarih</option>
                            {viewMode !== 'reports' && <option value="reportCount" className="text-gray-900">Rapor Sayısı</option>}
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title={sortOrder === 'asc' ? 'Azalan sıralama' : 'Artan sıralama'}
                        >
                            <Filter className={`h-4 w-4 text-gray-700 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Clients Section */}
                {(viewMode === 'both' || viewMode === 'clients') && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Yatırımcılar ({filteredAndSortedClients.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {filteredAndSortedClients.length === 0 ? (
                                <div className="text-center py-8">
                                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Yatırımcı bulunamadı</p>
                                </div>
                            ) : (
                                filteredAndSortedClients.map((client) => (
                                    <div key={client.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="p-3 bg-purple-100 rounded-full">
                                                    <Building2 className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-6 mb-3">
                                                        <div className="flex-1">
                                                            <div className="text-lg font-semibold text-gray-900">
                                                                {client.name}
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                                <Hash className="h-3 w-3" />
                                                                <span>ID: {client.id}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                                                {getRoleText(client.role)}
                                                            </span>
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                                {getClientReportCount(client.id)} rapor
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Key className="h-4 w-4 text-gray-400" />
                                                            <span className="text-gray-600">Erişim Anahtarı:</span>
                                                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-800 text-xs">
                                                                {client.accessKey}
                                                            </code>
                                                            <button
                                                                onClick={(e) => handleCopyAccessKey(client.accessKey, e)}
                                                                className="ml-1 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                                                title="Erişim anahtarını kopyala"
                                                            >
                                                                {copiedKey === client.accessKey ? (
                                                                    <Check className="h-3 w-3 text-green-600" />
                                                                ) : (
                                                                    <Copy className="h-3 w-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar className="h-4 w-4 text-gray-400" />
                                                            <span className="text-gray-600">Oluşturulma:</span>
                                                            <span className="text-gray-800">
                                                                {formatDate(client.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleDeleteClient(client)}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Reports Section */}
                {(viewMode === 'both' || viewMode === 'reports') && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Yatırımcı Raporları ({filteredAndSortedReports.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {filteredAndSortedReports.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Rapor bulunamadı</p>
                                </div>
                            ) : (
                                filteredAndSortedReports.map((report) => (
                                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                <div className="p-3 bg-green-100 rounded-full">
                                                    <FileText className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-6 mb-3">
                                                        <div className="flex-1">
                                                            <div className="text-lg font-semibold text-gray-900">
                                                                {report.name}
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                                <Hash className="h-3 w-3" />
                                                                <span>ID: {report.id}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                                Yatırımcı Raporu
                                                            </span>
                                                            {report.clientId ? (
                                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                                                    {getClientName(report.clientId)}
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                                    Atanmamış
                                                                </span>
                                                            )}
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
                                                            <span className="text-gray-600">Atama:</span>
                                                            {report.clientId ? (
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-gray-800">{getClientName(report.clientId)}</span>
                                                                    <button
                                                                        onClick={() => handleUnassignReport(report.id)}
                                                                        className="p-1 text-orange-600 hover:text-orange-800"
                                                                        title="Atamayı kaldır"
                                                                    >
                                                                        <UserX className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <select
                                                                    onChange={(e) => e.target.value && handleAssignReport(report.id, e.target.value)}
                                                                    className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    defaultValue=""
                                                                >
                                                                    <option value="" className="text-gray-700">Yatırımcı seçin</option>
                                                                    {clients.map(client => (
                                                                        <option key={client.id} value={client.id} className="text-gray-900">
                                                                            {client.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Clean File Management Section */}
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-medium text-gray-700">Dosya Yönetimi</span>
                                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                                    {reportFiles[report.id]?.length || 0} dosya
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => openReportModal(report)}
                                                                className="flex items-center space-x-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                                <span>Dosya Yönetimi</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 ml-4">
                                                <button
                                                    onClick={() => handleDeleteReport(report)}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Client Report Assign Modal */}
            <ClientReportAssignModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onAssignmentChange={loadData}
            />

            {/* File Management Modal - Inspector Style */}
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
                                        <span className="text-gray-600">Atama:</span>
                                        <span className="ml-2 text-gray-800">
                                            {selectedReport.clientId ? getClientName(selectedReport.clientId) : 'Atanmamış'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Oluşturulma:</span>
                                        <span className="ml-2 text-gray-800">{formatDate(selectedReport.createdAt)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Dosya Sayısı:</span>
                                        <span className="ml-2 font-medium text-gray-800">{reportFiles[selectedReport.id]?.length || 0}</span>
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
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Dosyalar ({reportFiles[selectedReport.id]?.length || 0})
                                        </h3>
                                        {(reportFiles[selectedReport.id]?.length || 0) > 0 && (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={selectAllFiles}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    {selectedFiles.length === (reportFiles[selectedReport.id]?.length || 0) ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
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
                                        {(reportFiles[selectedReport.id]?.length || 0) > 0 && (
                                            <button
                                                onClick={() => handleDownloadReport(selectedReport.id, selectedReport.name)}
                                                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
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
                                ) : (reportFiles[selectedReport.id]?.length || 0) === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">Henüz dosya yüklenmemiş</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Yukarıdaki alanı kullanarak dosya yükleyebilirsiniz
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {(reportFiles[selectedReport.id] || []).map((fileName, index) => (
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
                                                    <FileText className="h-4 w-4 text-gray-500" />
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