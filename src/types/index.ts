// src/types/index.ts

export interface User {
    id: string;
    name: string;
    role: 'admin' | 'inspector' | 'reporter';
    accessKey: string;
    createdAt: string;
}

export interface Report {
    id: string;
    name: string;
    status: 'draft' | 'pending' |'assigned'|'finalized';
    createdAt: string;
    folderId: string;
    inspectorId?: string;
    reporterId?: string;
    clientId?: string;
    rawReportPath?: string;
    finalReportPath?: string;
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

export type UserRole = 'admin' | 'inspector' | 'reporter';