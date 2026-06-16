import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Report } from '../types'

export default function FieldWorkerDashboard() {
    // 1. STATE
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState('')

    // 2. FUNCTIONS
    const fetchAssignedReports = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('assigned_to', user.id)
            .order('created_at', { ascending: false })

        if (!error && data) setReports(data)
        setLoading(false)
    }

    const markCleared = async (id: string) => {
        setErrorMessage('')
        setProcessingId(id)

        const { error } = await supabase
            .from('reports')
            .update({ status: 'cleared' })
            .eq('id', id)

        if (error) setErrorMessage(error.message)
        else fetchAssignedReports()

        setProcessingId(null)
    }

    // 3. USEEFFECT
    useEffect(() => {
        fetchAssignedReports()

        const channel = supabase
            .channel('field-worker-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
                fetchAssignedReports()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // 4. JSX
    if (loading) return <div className="p-8 text-center">Loading assigned reports...</div>

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-yellow-600 mb-6">My Assigned Reports</h1>

            {errorMessage && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{errorMessage}</div>
            )}

            <div className="space-y-4">
                {reports.length === 0 && (
                    <p className="text-center text-gray-500">No reports assigned to you yet.</p>
                )}
                {reports.map(report => {
                    const isProcessing = processingId === report.id

                    return (
                        <div key={report.id} className="bg-white p-4 rounded shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{report.description}</p>
                                    <p className="text-sm mt-1">
                                        Status: <span className={`font-semibold ${
                                            report.status === 'cleared' ? 'text-green-600' : 'text-yellow-600'
                                        }`}>{report.status}</span>
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-500 underline mt-1 inline-block"
                                    >
                                        📍 Open in Google Maps
                                    </a>
                                </div>
                                {report.photo_url && (
                                    <img src={report.photo_url} alt="report" className="w-20 h-20 object-cover rounded ml-4" />
                                )}
                            </div>

                            {report.status !== 'cleared' && (
                                <button
                                    className="mt-3 text-sm bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                                    onClick={() => markCleared(report.id)}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Updating...' : 'Mark as Cleared'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
