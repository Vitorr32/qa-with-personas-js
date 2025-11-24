import { createFileRoute } from '@tanstack/react-router'
import RegisterPage from '../page/RegisterPage'

export const Route = createFileRoute('/register')({
  component: () => <RegisterPage />,
})
