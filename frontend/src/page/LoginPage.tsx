import { useEffect, useState } from 'react'
import { useLoginMutation, useMeQuery } from '../store/apiSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setToken, setUser } from '../store/authSlice'
import { Link, useRouter } from '@tanstack/react-router'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const auth = useAppSelector(s => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [login, { isLoading }] = useLoginMutation()
  const { refetch: refetchMe } = useMeQuery(undefined, { skip: !auth.token })

  useEffect(() => {
    if (auth.token && auth.user?.status === 'APPROVED') {
      router.navigate({ to: '/' })
    }
  }, [auth.token, auth.user, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await login({ email, password }).unwrap()
      dispatch(setToken(res.accessToken))
      // Optionally decode or just call /me after login
      const me = await refetchMe().unwrap()
      dispatch(setUser({
        id: me.id,
        email: me.email,
        name: me.name,
        role: me.role as any,
        status: me.status as any,
      }))
      router.navigate({ to: '/' })
    } catch (err: any) {
      setError(err?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="mt-4 text-sm">
        New here? <Link to="/register" className="text-blue-600 underline">Create an account</Link>
      </div>
    </div>
  )
}
