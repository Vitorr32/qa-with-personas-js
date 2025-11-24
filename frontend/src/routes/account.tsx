import { createFileRoute } from '@tanstack/react-router'
import AccountPage from '../page/AccountPage'

export const Route = createFileRoute('/account')({
  component: () => <AccountPage />,
})
