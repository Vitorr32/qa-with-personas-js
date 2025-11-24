import { useState } from 'react'
import { useRegisterMutation } from '../store/apiSlice'
import { Link } from '@tanstack/react-router'

export default function RegisterPage() {
  const [register, { isLoading }] = useRegisterMutation()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMsg(null)
    try {
      const res = await register({ email, name, password }).unwrap()
      setMsg(res.message || 'Registered. Await approval if required.')
    } catch (err: any) {
      setError(err?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Register</h2>
      {msg && <div className="text-green-700 mb-2">{msg}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" minLength={8} required />
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded">
          {isLoading ? 'Submitting...' : 'Create account'}
        </button>
      </form>
      <div className="mt-4 text-sm">
        Already have an account? <Link to="/login" className="text-blue-600 underline">Login</Link>
      </div>
    </div>
  )
}
