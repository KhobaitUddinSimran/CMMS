// User Store - User profile state
import { create } from 'zustand'

interface UserStore {
  profile: any | null
  setProfile: (profile: any) => void
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}))
