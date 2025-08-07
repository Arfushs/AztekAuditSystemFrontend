// src/components/layout/LogoutButton.tsx
'use client';

export default function LogoutButton() {
    const handleLogout = () => {
        localStorage.removeItem('accessKey');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
    };

    return (
        <button
            onClick={handleLogout}
            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
            Çıkış
        </button>
    );
}