import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'SUPERUSER' | 'USER'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface AuthState {
  token: string | null
  user: AuthUser | null
}

const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null
const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('authUser') : null

const initialState: AuthState = {
  token: storedToken,
  user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
      if (action.payload) localStorage.setItem('authToken', action.payload)
      else localStorage.removeItem('authToken')
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
      if (action.payload) localStorage.setItem('authUser', JSON.stringify(action.payload))
      else localStorage.removeItem('authUser')
    },
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
    },
  },
})

export const { setToken, setUser, logout } = authSlice.actions
export default authSlice.reducer
