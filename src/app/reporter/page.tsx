// src/app/reporter/page.tsx
'use client';

export default function ReporterDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Raporcu Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Atanmış Raporlar</h3>
                    <p className="text-gray-600 mb-4">Size atanmış raporları görüntüleyin</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Raporları Görüntüle
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Final Raporları</h3>
                    <p className="text-gray-600 mb-4">Final raporlarını yükleyin</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Rapor Yükle
                    </button>
                </div>
            </div>
        </div>
    );
}