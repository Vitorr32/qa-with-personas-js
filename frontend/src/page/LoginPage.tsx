import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLoginMutation } from '../store/apiSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setToken, setUser } from '../store/authSlice'
import { Link, useRouter } from '@tanstack/react-router'

export default function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const auth = useAppSelector(s => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [login, { isLoading }] = useLoginMutation()

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
      dispatch(setUser({
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role as any,
        status: res.user.status as any,
      }))
      router.navigate({ to: '/' })
    } catch (err: any) {
      setError(err?.data?.message || t('auth.login.loginFailed'))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center px-6"
      style={{ minHeight: 'calc(100vh - 73px)' }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {t('auth.login.title')}
          </h1>
          <p className="text-gray-600">{t('auth.login.subtitle')}</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <motion.div whileHover={{ scale: 1.01 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.login.emailLabel')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.login.emailPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div whileHover={{ scale: 1.01 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.login.passwordLabel')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg shadow-blue-200 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.login.signingIn') : t('auth.login.signInButton')}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">{t('auth.login.dontHaveAccount')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="w-full block text-center py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all font-medium"
          >
            {t('auth.login.createAccount')}
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
