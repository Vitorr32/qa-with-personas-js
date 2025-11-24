import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminApprovalsPage from '../page/AdminApprovalsPage'
import { store } from '../store/store'

export const Route = createFileRoute('/admin/approvals')({
  beforeLoad: () => {
    const state = store.getState()
    const user = state.auth.user
    if (!user || user.role !== 'SUPERUSER') {
      throw redirect({ to: '/' })
    }
  },
  component: () => <AdminApprovalsPage />,
})
