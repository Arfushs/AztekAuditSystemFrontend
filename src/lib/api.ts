// src/lib/api.ts
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
    // Auth
    testAccess: async (role: string, accessKey: string) => {
        // Geçici header ile API çağrısı
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
                return tempApi.post('/inspectors/create-report?reportName=test&inspectorId=test');
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

    // Inspector APIs
    inspector: {
        createReport: (reportName: string, inspectorId: string) =>
            api.post(`/inspectors/create-report?reportName=${encodeURIComponent(reportName)}&inspectorId=${inspectorId}`),
        uploadRawFiles: (reportId: string, files: FormData) =>
            api.post(`/inspectors/upload-raw-files?reportId=${reportId}`, files, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),
    },

    // Reporter APIs
    reporter: {
        uploadFinalFiles: (reportId: string, files: FormData) =>
            api.post(`/reporters/upload-final-files?reportId=${reportId}`, files, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),
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