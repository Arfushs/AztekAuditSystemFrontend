// src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5099/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessKey');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const apiService = {
    // Auth APIs
    login: async (accessKey: string) => {
        const tempApi = axios.create({
            baseURL: API_BASE_URL,
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        });
        return tempApi.post('/shared/login', { accessKey });
    },

    testAccess: async (role: string, accessKey: string) => {
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
                return tempApi.get('/inspectors/profile?inspectorId=00000000-0000-0000-0000-000000000000');
            case 'reporter':
                return tempApi.post('/reporters/upload-final-files?reportId=test');
            case 'client':
                return tempApi.get('/clients/my-reports');
            default:
                throw new Error('Invalid role');
        }
    },

    // Admin APIs
    admin: {
        // User Management
        getAllUsers: () => api.get('/admins/get-all-users'),
        getAllReports: () => api.get('/admins/get-all-reports'),
        createInspector: (name: string) => api.post(`/admins/create-inspector?name=${encodeURIComponent(name)}`),
        createReporter: (name: string) => api.post(`/admins/create-reporter?name=${encodeURIComponent(name)}`),
        assignReportToReporter: (reporterId: string, reportId: string) =>
            api.post(`/admins/assign-report-to-reporter?reporterId=${reporterId}&reportId=${reportId}`),
        unassignReport: (reportId: string) => api.post(`/admins/unassign-report?reportId=${reportId}`),
        deleteInspector: (id: string) => api.delete(`/admins/delete-inspector/${id}`),
        deleteReporter: (id: string) => api.delete(`/admins/delete-reporter/${id}`),

        // Client Management
        createClient: (name: string) => api.post(`/admins/create-client?name=${encodeURIComponent(name)}`),
        getAllClients: () => api.get('/admins/get-all-clients'),
        deleteClient: (id: string) => api.delete(`/admins/delete-client/${id}`),

        // Client Reports Management
        createClientReport: (name: string) => api.post(`/admins/create-client-report?name=${encodeURIComponent(name)}`),
        getAllClientReports: () => api.get('/admins/get-all-client-reports'),
        getClientReport: (reportId: string) => api.get(`/admins/get-client-report/${reportId}`),
        updateClientReportName: (reportId: string, name: string) =>
            api.put(`/admins/update-client-report-name/${reportId}?name=${encodeURIComponent(name)}`),
        assignClientReport: (reportId: string, clientId: string) =>
            api.post(`/admins/assign-client-report?reportId=${reportId}&clientId=${clientId}`),
        unassignClientReport: (reportId: string) => api.post(`/admins/unassign-client-report?reportId=${reportId}`),
        deleteClientReport: (reportId: string) => api.delete(`/admins/delete-client-report/${reportId}`),

        // Client Report Files
        uploadClientReportFile: (reportId: string, file: FormData) =>
            api.post(`/admins/upload-client-report-file/${reportId}`, file, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),
        uploadClientReportFiles: (reportId: string, files: FormData) =>
            api.post(`/admins/upload-client-report-files/${reportId}`, files, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),
        getClientReportFiles: (reportId: string) => api.get(`/admins/get-client-report-files/${reportId}`),
        deleteClientReportFile: (reportId: string, fileName: string) =>
            api.delete(`/admins/delete-client-report-file/${reportId}?fileName=${encodeURIComponent(fileName)}`),
        downloadClientReportZip: (reportId: string) =>
            api.get(`/admins/download-client-report-zip/${reportId}`, { responseType: 'blob' }),
    },

    // Inspector APIs
    inspector: {
        createReport: (reportName: string, inspectorId: string) =>
            api.post(`/inspectors/create-report?reportName=${encodeURIComponent(reportName)}&inspectorId=${inspectorId}`),
        getProfile: (inspectorId: string) => api.get(`/inspectors/profile?inspectorId=${inspectorId}`),
        getMyReports: (inspectorId: string) => api.get(`/inspectors/my-reports?inspectorId=${inspectorId}`),
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

        getCurrentInspectorId: (): string => {
            if (typeof window !== 'undefined') {
                return localStorage.getItem('userId') || '';
            }
            return '';
        }
    },

    // Reporter APIs
    reporter: {
        uploadFinalFiles: (reportId: string, files: FormData) =>
            api.post(`/reporters/upload-final-files?reportId=${reportId}`, files, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),
        getMyAssignedReports: (reporterId: string) => api.get(`/reporters/my-assigned-reports?reporterId=${reporterId}`),
        getReportFiles: (reportId: string) => api.get(`/reporters/report-files/${reportId}`),
        deleteFinalFile: (reportId: string, fileName: string) =>
            api.delete(`/reporters/delete-final-file/${reportId}?fileName=${encodeURIComponent(fileName)}`),

        getCurrentReporterId: (): string => {
            if (typeof window !== 'undefined') {
                return localStorage.getItem('userId') || '';
            }
            return '';
        }
    },

    // Client APIs
    client: {
        getMyReports: () => api.get('/clients/my-reports'),
        getMyReport: (reportId: string) => api.get(`/clients/my-reports/${reportId}`),
        getMyReportFiles: (reportId: string) => api.get(`/clients/my-reports/${reportId}/files`),
        downloadReportZip: (reportId: string) =>
            api.get(`/clients/download-report-zip/${reportId}`, { responseType: 'blob' }),
        getDownloadUrl: (reportId: string, fileName: string) =>
            api.get(`/clients/download-file/${reportId}?fileName=${encodeURIComponent(fileName)}`),
        getProfile: () => api.get('/clients/profile'),

        getCurrentClientId: (): string => {
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
            try {
                const response = await api.get(`/shared/get-report-name-by-id?reportId=${reportId}`);
                return response.data || null;
            } catch (error) {
                return null;
            }
        }
    },
};