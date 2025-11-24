import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import Header from '../features/chat/Header'
import { store } from '../store/store'

const RootLayout = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <Outlet />
        <TanStackRouterDevtools />
    </div>
)

export const Route = createRootRoute({
    component: RootLayout,
    beforeLoad: ({ location }) => {
        const path = location.pathname
        const isPublic = path.startsWith('/login') || path.startsWith('/register')
        const state = store.getState()
        const token = state.auth?.token
        if (!isPublic && !token) {
            throw redirect({ to: '/login' })
        }
    },
})