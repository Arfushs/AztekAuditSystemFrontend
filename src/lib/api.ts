// src/lib/api.ts - Updated Inspector API Service
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 saniye timeout
});

// Request interceptor - her request'e access_key header'ını ekle
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const accessKey = localStorage.getItem('accessKey');
            if (accessKey) {
                config.headers['access_key'] = accessKey;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - hata durumlarını handle et
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Client-side kontrolü
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessKey');
                localStorage.removeItem('userRole');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// API Service Functions
export const apiService = {
    // Auth - YENİ LOGIN API
    login: async (accessKey: string) => {
        // Access key olmadan API çağrısı yap
        const tempApi = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        return tempApi.post('/shared/login', { accessKey });
    },

    // Eski testAccess metodunu kaldırabiliriz veya backup olarak saklayabiliriz
    testAccess: async (role: string, accessKey: string) => {
        // Artık kullanılmayacak, ama backup olarak kalsın
        const tempApi = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'access_key': accessKey
            },
            timeout: 30000,
        });

        switch (role) {
            case 'admin':
                return tempApi.get('/admins/get-all-users');
            case 'inspector':
                // Inspector için profil çekmeyi dene - daha güvenli
                return tempApi.get('/inspectors/profile?inspectorId=00000000-0000-0000-0000-000000000000');
            case 'reporter':
                return tempApi.post('/reporters/upload-final-files?reportId=test');
            default:
                throw new Error('Invalid role');
        }
    },

    // Admin APIs
    admin: {
        getAllUsers: () => api.get('/admins/get-all-users'),
        getAllReports: () => api.get('/admins/get-all-reports'),
        createInspector: (name: string) => api.post(`/admins/create-inspector?name=${encodeURIComponent(name)}`),
        createReporter: (name: string) => api.post(`/admins/create-reporter?name=${encodeURIComponent(name)}`),
        assignReportToReporter: (reporterId: string, reportId: string) =>
            api.post(`/admins/assign-report-to-reporter?reporterId=${reporterId}&reportId=${reportId}`),
        unassignReport: (reportId: string) => api.post(`/admins/unassign-report?reportId=${reportId}`),
        deleteInspector: (id: string) => api.delete(`/admins/delete-inspector/${id}`),
        deleteReporter: (id: string) => api.delete(`/admins/delete-reporter/${id}`),
    },

    // Inspector APIs - UPDATED & EXPANDED
    inspector: {
        // Mevcut API'ler - Inspector ID gerekli olanlar
        createReport: (reportName: string, inspectorId: string) =>
            api.post(`/inspectors/create-report?reportName=${encodeURIComponent(reportName)}&inspectorId=${inspectorId}`),

        // Inspector ID gerekli olanlar - Profile ve Reports
        getProfile: (inspectorId: string) => api.get(`/inspectors/profile?inspectorId=${inspectorId}`),
        getMyReports: (inspectorId: string) => api.get(`/inspectors/my-reports?inspectorId=${inspectorId}`),

        // Inspector ID gerekli OLMAYANLAR - ReportId yeterli
        uploadRawFiles: (reportId: string, files: FormData) =>
            api.post(`/inspectors/upload-raw-files?reportId=${reportId}`, files, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),
        getReportFiles: (reportId: string) => api.get(`/inspectors/report-files/${reportId}`),
        deleteFile: (reportId: string, fileName: string) =>
            api.delete(`/inspectors/delete-file/${reportId}?fileName=${encodeURIComponent(fileName)}`),
        updateReportStatus: (reportId: string, status: string) =>
            api.put(`/inspectors/update-report-status/${reportId}?status=${status}`),
        deleteReport: (reportId: string) => api.delete(`/inspectors/delete-report/${reportId}`),
        updateReportName: (reportId: string, name: string) =>
            api.put(`/inspectors/update-report-name/${reportId}?name=${encodeURIComponent(name)}`),

        // Helper metod
        getCurrentInspectorId: (): string => {
            if (typeof window !== 'undefined') {
                return localStorage.getItem('userId') || '';
            }
            return '';
        }
    },

    // Reporter APIs
    reporter: {
        // Mevcut API
        uploadFinalFiles: (reportId: string, files: FormData) =>
            api.post(`/reporters/upload-final-files?reportId=${reportId}`, files, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),

        // Yeni API'ler - Reporter için gerekli
        getMyAssignedReports: (reporterId: string) => api.get(`/reporters/my-assigned-reports?reporterId=${reporterId}`),
        getReportFiles: (reportId: string) => api.get(`/reporters/report-files/${reportId}`),
        deleteFinalFile: (reportId: string, fileName: string) =>
            api.delete(`/reporters/delete-final-file/${reportId}?fileName=${encodeURIComponent(fileName)}`),

        // Helper metod
        getCurrentReporterId: (): string => {
            if (typeof window !== 'undefined') {
                return localStorage.getItem('userId') || '';
            }
            return '';
        }
    },

    // Shared APIs
    shared: {
        downloadReports: (reportId: string, subfolder: 'raw' | 'final') =>
            api.get(`/shared/download-reports?reportId=${reportId}&subfolder=${subfolder}`, {
                responseType: 'blob'
            }),
        getReportNameByID: async (reportId: string): Promise<string | null> => {
            const response = await api.get(`/shared/get-report-name-by-id?reportId=${reportId}`);
            return response.data || null;
        }
    },
};