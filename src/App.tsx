import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ReportForm from './components/ReportForm'
import AdminDashboard from './components/AdminDashboard'

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
      else setRole(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (data) setRole(data.role)
  }

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('Account created. You can now sign in.')
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (user && role) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-between items-center px-6 py-4 bg-white shadow">
          <h1 className="text-xl font-bold text-green-700">DumpIt</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 capitalize">{role}</span>
            <button
              className="text-sm text-red-500 underline"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex justify-center p-6">
          {role === 'admin' && <AdminDashboard />}
          {role === 'citizen' && <ReportForm />}
          {role === 'field_worker' && <p>Field Worker view coming soon.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-700">DumpIt</h1>
        <input
          className="w-full border p-2 mb-4 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-4 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-green-600 text-white p-2 rounded mb-2"
          onClick={handleSignIn}
          disabled={loading}
        >
          Sign In
        </button>
        <button
          className="w-full bg-gray-600 text-white p-2 rounded"
          onClick={handleSignUp}
          disabled={loading}
        >
          Sign Up
        </button>
        {message && <p className="mt-4 text-center text-sm text-red-500">{message}</p>}
      </div>
    </div>
  )
}