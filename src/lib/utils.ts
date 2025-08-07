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
            return 'Raporlamacı Üstünde';
        case 'finalized':
            return 'Tamamlandı';
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
        default:
            return 'Bilinmiyor';
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