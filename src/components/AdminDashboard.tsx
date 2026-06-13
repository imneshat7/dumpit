import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Report, Profile } from '../types'
import MapView from './MapView'

export default function AdminDashboard() {
    // 1. STATE
    const [reports, setReports] = useState<Report[]>([])
    const [fieldWorkers, setFieldWorkers] = useState<Profile[]>([])
    // Maps report.id → selected worker's profile id
    const [selectedWorker, setSelectedWorker] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)

    // 2. FUNCTIONS
    const fetchReports = async () => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) setReports(data)
        setLoading(false)
    }

    // Fetches only field workers from profiles table
    const fetchFieldWorkers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'field_worker') // filter by role column

        if (!error && data) setFieldWorkers(data)
    }

    // Assigns a specific worker to a report and sets status to 'assigned'
    const assignWorker = async (reportId: string) => {
        const workerId = selectedWorker[reportId]

        // Guard: don't proceed if no worker selected for this report
        if (!workerId) {
            alert('Select a field worker first.')
            return
        }

        const { error } = await supabase
            .from('reports')
            .update({
                assigned_to: workerId,  // the field worker's profile id
                status: 'assigned'
            })
            .eq('id', reportId)

        if (error) alert(error.message)
        else fetchReports()
    }

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchReports()
    }

    // 3. USEEFFECT
    useEffect(() => {
        fetchReports()
        fetchFieldWorkers() // fetch field workers once on mount

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

    // 4. JSX
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
                                    Status: <span className={`font-semibold ${
                                        report.status === 'cleared' ? 'text-green-600' :
                                        report.status === 'assigned' ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>{report.status}</span>
                                </p>
                                {/* Show assigned worker id if already assigned */}
                                {report.assigned_to && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        👷 Assigned to: {
                                            // Look up the worker's name from our local fieldWorkers list
                                            fieldWorkers.find(w => w.id === report.assigned_to)?.full_name
                                            ?? report.assigned_to // fallback to raw id if not found
                                        }
                                    </p>
                                )}
                            </div>
                            {report.photo_url && (
                                <img
                                    src={report.photo_url}
                                    alt="report"
                                    className="w-20 h-20 object-cover rounded ml-4"
                                />
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3 items-center">
                            {/* Dropdown: one per report, tracked by report.id */}
                            <select
                                className="text-sm border rounded px-2 py-1"
                                value={selectedWorker[report.id] ?? ''}
                                onChange={e =>
                                    // Update only the entry for this specific report id
                                    setSelectedWorker(prev => ({
                                        ...prev,           // keep all other report selections
                                        [report.id]: e.target.value  // update this report's selection
                                    }))
                                }
                            >
                                <option value=''>Select worker</option>
                                {fieldWorkers.map(worker => (
                                    <option key={worker.id} value={worker.id}>
                                        {worker.full_name}
                                    </option>
                                ))}
                            </select>

                            <button
                                className="text-sm bg-yellow-500 text-white px-3 py-1 rounded"
                                onClick={() => assignWorker(report.id)}
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