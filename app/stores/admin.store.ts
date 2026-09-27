import { create } from 'zustand'

interface AdminState {
  admin: { id: string; username: string } | null
  setAdmin: (admin: { id: string; username: string } | null) => void
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  setAdmin: (admin) => set({ admin }),
}))
