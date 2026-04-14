// Auth Store - User authentication state
import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthStore {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: false,
  login: async (_email: string, _password: string) => {
    // Call API
    set({ loading: true })
    // ... API logic
    set({ loading: false })
  },
  logout: () => set({ user: null, token: null }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
}))
