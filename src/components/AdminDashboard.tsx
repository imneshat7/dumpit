import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Report } from '../types'
import MapView from './MapView'

export default function AdminDashboard() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReports()

        // Real-time listener
        const channel = supabase
            .channel('reports-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reports'
            }, () => {
                fetchReports()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchReports = async () => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) setReports(data)
        setLoading(false)
    }

 const updateStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id)

  if (error) alert(error.message)
  else fetchReports()
}
    if (loading) return <div className="p-8 text-center">Loading reports...</div>

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-green-700 mb-6">Admin Dashboard</h1>

            <MapView reports={reports} />

            <div className="mt-6 space-y-4">
                {reports.length === 0 && (
                    <p className="text-center text-gray-500">No reports yet.</p>
                )}
                {reports.map(report => (
                    <div key={report.id} className="bg-white p-4 rounded shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium">{report.description}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    📍 {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                                </p>
                                <p className="text-sm mt-1">
                                    Status: <span className={`font-semibold ${report.status === 'cleared' ? 'text-green-600' :
                                            report.status === 'assigned' ? 'text-yellow-600' :
                                                'text-red-600'
                                        }`}>{report.status}</span>
                                </p>
                            </div>
                            {report.photo_url && (
                                <img
                                    src={report.photo_url}
                                    alt="report"
                                    className="w-20 h-20 object-cover rounded ml-4"
                                />
                            )}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                className="text-sm bg-yellow-500 text-white px-3 py-1 rounded"
                                onClick={() => updateStatus(report.id, 'assigned')}
                            >
                                Assign
                            </button>
                            <button
                                className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                                onClick={() => updateStatus(report.id, 'cleared')}
                            >
                                Mark Cleared
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}