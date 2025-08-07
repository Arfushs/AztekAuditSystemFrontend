// src/app/inspector/page.tsx
'use client';

export default function InspectorDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Denetçi Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Yeni Rapor Oluştur</h3>
                    <p className="text-gray-600 mb-4">Yeni denetim raporu başlatın</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Rapor Oluştur
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Mevcut Raporlar</h3>
                    <p className="text-gray-600 mb-4">Oluşturduğunuz raporları görüntüleyin</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Raporları Görüntüle
                    </button>
                </div>
            </div>
        </div>
    );
}