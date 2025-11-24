import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  useApproveUserMutation,
  useListPendingUsersQuery,
  useRejectUserMutation,
  useGrantSuperuserMutation,
  useListAllUsersQuery,
  useSearchUsersQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useDeleteAllRejectedUsersMutation,
} from '../store/apiSlice'
import { CheckCircle, XCircle, RefreshCw, Users, Crown, Trash2, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

type TabType = 'all' | 'pending' | 'rejected'
type UserStatus = 'APPROVED' | 'PENDING' | 'REJECTED'

interface User {
  id: string
  email: string
  name: string
  role: string
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export default function AdminApprovalsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [searchQuery, setSearchQuery] = useState('')

  // Queries
  const { data: allUsers = [], isFetching: fetchingAll, refetch: refetchAll } = useListAllUsersQuery()
  const { data: pendingUsers = [], isFetching: fetchingPending, refetch: refetchPending } = useListPendingUsersQuery()
  const { data: searchResults = [] } = useSearchUsersQuery(searchQuery, { skip: !searchQuery || searchQuery.trim().length === 0 })

  // Memoized filtered results for search within each tab
  const filteredPendingResults = useMemo(() => {
    if (!searchQuery.trim()) return pendingUsers
    return pendingUsers.filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [pendingUsers, searchQuery])

  const rejectedUsers = useMemo(() => {
    return allUsers.filter(u => u.status === 'REJECTED')
  }, [allUsers])

  const filteredRejectedResults = useMemo(() => {
    if (!searchQuery.trim()) return rejectedUsers
    return rejectedUsers.filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [rejectedUsers, searchQuery])

  // Mutations
  const [approve, { isLoading: approving }] = useApproveUserMutation()
  const [reject, { isLoading: rejecting }] = useRejectUserMutation()
  const [grantSuperuser, { isLoading: grantingSuper }] = useGrantSuperuserMutation()
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateUserStatusMutation()
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation()
  const [deleteAllRejectedUsers, { isLoading: deletingAll }] = useDeleteAllRejectedUsersMutation()

  const displayedUsers = useMemo(() => {
    if (activeTab === 'pending') return filteredPendingResults
    if (activeTab === 'rejected') return filteredRejectedResults
    if (searchQuery.trim().length > 0) return searchResults
    return allUsers
  }, [activeTab, filteredPendingResults, filteredRejectedResults, searchQuery, searchResults, allUsers])

  const handleApprove = async (id: string) => {
    await approve({ id }).unwrap()
    await refetchPending()
    await refetchAll()
  }

  const handleReject = async (id: string) => {
    await reject({ id }).unwrap()
    await refetchPending()
    await refetchAll()
  }

  const handleGrantSuperuser = async (id: string) => {
    await grantSuperuser({ id }).unwrap()
    if (activeTab === 'pending') await refetchPending()
    await refetchAll()
  }

  const handleUpdateStatus = async (id: string, status: UserStatus) => {
    await updateStatus({ id, status }).unwrap()
    await refetchPending()
    await refetchAll()
  }

  const handleDeleteUser = async (id: string) => {
    if (confirm(t('auth.approvals.confirmDelete'))) {
      await deleteUser({ id }).unwrap()
      await refetchPending()
      await refetchAll()
    }
  }

  const handleDeleteAllRejected = async () => {
    if (confirm(t('auth.approvals.confirmDeleteAll'))) {
      await deleteAllRejectedUsers({ ids: rejectedUsers.map(u => u.id) }).unwrap()
      await refetchAll()
    }
  }

  const handleRefresh = async () => {
    await refetchAll()
    await refetchPending()
  }

  const isFetching = activeTab === 'pending' ? fetchingPending : fetchingAll
  const isLoading = approving || rejecting || grantingSuper || updatingStatus || deleting || deletingAll

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
        className="w-full max-w-6xl"
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

        {/* Tabs and Controls */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
            {['pending', 'all', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as TabType)
                  setSearchQuery('')
                }}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t(`auth.approvals.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)} ({tab === 'pending' ? pendingUsers.length : tab === 'all' ? allUsers.length : rejectedUsers.length})
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-3 flex-wrap items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              {t('auth.approvals.refresh')}
            </motion.button>

            <div className="flex-1 min-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('auth.approvals.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

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
        ) : displayedUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-200"
          >
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold text-gray-700">
              {activeTab === 'pending' && t('auth.approvals.allCaughtUp')}
              {activeTab === 'rejected' && t('auth.approvals.noRejected')}
              {activeTab === 'all' && searchQuery && t('auth.approvals.noSearchResults')}
              {activeTab === 'all' && !searchQuery && t('auth.approvals.noUsers')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {activeTab === 'rejected' && rejectedUsers.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">
                  {displayedUsers.length} {displayedUsers.length === 1 ? t('auth.approvals.userOne') : t('auth.approvals.users', { count: displayedUsers.length })}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                  onClick={handleDeleteAllRejected}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('auth.approvals.removeAll')}
                </motion.button>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {displayedUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        {user.role === 'SUPERUSER' && (
                          <div className="flex items-center gap-1">
                            <Crown className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-medium text-amber-600">{t('auth.approvals.isSuperuser')}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <p className="text-xs text-gray-500">
                          {t('auth.approvals.applied')} {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          user.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* Pending Tab Actions */}
                      {activeTab === 'pending' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                            onClick={() => handleApprove(user.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {t('auth.approvals.approve')}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                            onClick={() => handleReject(user.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-4 h-4" />
                            {t('auth.approvals.reject')}
                          </motion.button>
                        </>
                      )}

                      {/* All Users Tab Actions */}
                      {activeTab === 'all' && (
                        <>
                          {user.status === 'PENDING' && (
                            <>
                              {user.role !== 'SUPERUSER' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={isLoading}
                                  onClick={() => handleGrantSuperuser(user.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                  <Crown className="w-4 h-4" />
                                </motion.button>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isLoading}
                                onClick={() => handleApprove(user.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isLoading}
                                onClick={() => handleReject(user.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                              </motion.button>
                            </>
                          )}
                          {user.status === 'APPROVED' && user.role !== 'SUPERUSER' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={isLoading}
                              onClick={() => handleGrantSuperuser(user.id)}
                              className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              <Crown className="w-4 h-4" />
                            </motion.button>
                          )}
                          {user.role !== 'SUPERUSER' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={isLoading}
                              onClick={() => handleDeleteUser(user.id)}
                              className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </>
                      )}

                      {/* Rejected Tab Actions */}
                      {activeTab === 'rejected' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                            onClick={() => handleUpdateStatus(user.id, 'PENDING')}
                            className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
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
