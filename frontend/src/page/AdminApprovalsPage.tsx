import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useApproveUserMutation, useListPendingUsersQuery, useRejectUserMutation, useGrantSuperuserMutation } from '../store/apiSlice'
import { CheckCircle, XCircle, RefreshCw, Users, Crown } from 'lucide-react'

export default function AdminApprovalsPage() {
  const { t } = useTranslation()
  const { data, isFetching, refetch } = useListPendingUsersQuery()
  const [approve, { isLoading: approving }] = useApproveUserMutation()
  const [reject, { isLoading: rejecting }] = useRejectUserMutation()
  const [grantSuperuser, { isLoading: grantingSuper }] = useGrantSuperuserMutation()

  const handleApprove = async (id: string) => {
    await approve({ id }).unwrap()
    await refetch()
  }

  const handleReject = async (id: string) => {
    await reject({ id }).unwrap()
    await refetch()
  }

  const handleGrantSuperuser = async (id: string) => {
    await grantSuperuser({ id }).unwrap()
    await refetch()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-start px-6 py-8"
      style={{ minHeight: 'calc(100vh - 73px)' }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <motion.div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-3 rounded-2xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {t('auth.approvals.title')}
              </h1>
              <p className="text-gray-600 mt-1">{t('auth.approvals.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => refetch()}
          disabled={isFetching}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          {t('auth.approvals.refresh')}
        </motion.button>

        {/* Content */}
        {isFetching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-200"
          >
            <div className="animate-spin mb-4">
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">{t('auth.approvals.loading')}</p>
          </motion.div>
        ) : !data || data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-200"
          >
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold text-gray-700">{t('auth.approvals.allCaughtUp')}</p>
            <p className="text-gray-600 mt-1">{t('auth.approvals.noPending')}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="text-sm font-medium text-gray-600 mb-4">
              {data.length} {data.length === 1 ? t('auth.approvals.pendingOne') : `${t('auth.approvals.pending', { count: data.length })}`}
            </div>
            <AnimatePresence mode="popLayout">
              {data.map((u, index) => (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{u.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{u.email}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {t('auth.approvals.applied')} {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                      {u.role === 'SUPERUSER' && (
                        <div className="flex items-center gap-1 mt-2">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <p className="text-xs font-medium text-amber-600">{t('auth.approvals.isSuperuser')}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {u.role !== 'SUPERUSER' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={grantingSuper}
                          onClick={() => handleGrantSuperuser(u.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Crown className="w-4 h-4" />
                          {t('auth.approvals.makeSuperuser')}
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={approving}
                        onClick={() => handleApprove(u.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {t('auth.approvals.approve')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={rejecting}
                        onClick={() => handleReject(u.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                        {t('auth.approvals.reject')}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
