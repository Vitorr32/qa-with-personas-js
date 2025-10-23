import { createFileRoute, redirect } from '@tanstack/react-router'
import ResponsePage from '../page/ResponsePage'
import { store } from '../store/store'

export const Route = createFileRoute('/response')({
  component: RouteComponent,
  beforeLoad: async (_) => {
    const question = store.getState().question.question
    if (!question || question.trim() === '') {
      throw redirect({ to: '/' })
    }
  }
})

function RouteComponent() {
  return <ResponsePage />
}
