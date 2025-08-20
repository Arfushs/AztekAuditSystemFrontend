// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

export function formatDateShort(date: string | Date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}

export function getStatusColor(status: string) {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'assigned':
            return 'bg-pink-100 text-pink-800';
        case 'finalized':
            return 'bg-green-100 text-green-800';
        case 'completed':
            return 'bg-blue-100 text-blue-800';
        case 'sent':
            return 'bg-purple-100 text-purple-800';
        case 'viewed':
            return 'bg-indigo-100 text-indigo-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export function getStatusText(status: string) {
    switch (status) {
        case 'draft':
            return 'Taslak';
        case 'pending':
            return 'Beklemede';
        case 'assigned':
            return 'Atanmış';
        case 'finalized':
            return 'Tamamlandı';
        case 'completed':
            return 'Tamamlandı';
        case 'sent':
            return 'Gönderildi';
        case 'viewed':
            return 'Görüntülendi';
        default:
            return 'Bilinmiyor';
    }
}

export function getRoleText(role: string) {
    switch (role) {
        case 'admin':
            return 'Yönetici';
        case 'inspector':
            return 'Denetçi';
        case 'reporter':
            return 'Raporcu';
        case 'client':
            return 'Yatırımcı';
        default:
            return 'Bilinmiyor';
    }
}

export function getRoleColor(role: string) {
    switch (role) {
        case 'admin':
            return 'bg-red-100 text-red-800';
        case 'inspector':
            return 'bg-blue-100 text-blue-800';
        case 'reporter':
            return 'bg-green-100 text-green-800';
        case 'client':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

export function getFileIcon(filename: string): string {
    const ext = getFileExtension(filename);
    switch (ext) {
        case 'pdf':
            return '📄';
        case 'doc':
        case 'docx':
            return '📝';
        case 'xls':
        case 'xlsx':
            return '📊';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return '🖼️';
        case 'zip':
        case 'rar':
            return '📦';
        default:
            return '📎';
    }
}