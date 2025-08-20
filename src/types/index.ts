// src/types/index.ts

export type UserRole = 'admin' | 'inspector' | 'reporter' | 'client';

export interface User {
    id: string;
    name: string;
    role: UserRole; // Burada UserRole type'ını kullan
    accessKey: string;
    createdAt: string;
}

export interface Report {
    id: string;
    name: string;
    status: 'draft' | 'pending' | 'assigned' | 'finalized';
    createdAt: string;
    folderId: string;
    inspectorId?: string;
    reporterId?: string;
    clientId?: string;
    rawReportPath?: string;
    finalReportPath?: string;
}

export interface ClientReport {
    id: string;
    name: string;
    clientId?: string;
    adminId: string;
    createdAt: string;
    filePath?: string;
}

export interface Folder {
    id: string;
    name: string;
    inspectorID?: string;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export interface FileInfo {
    name: string;
    size?: number;
    type?: string;
    url?: string;
}

export interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
}

export interface LoginResponse {
    success: boolean;
    user?: User;
    role?: UserRole;
    error?: string;
}