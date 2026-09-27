import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  activeModal: string | null
  selectedMemberId: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
  setSelectedMemberId: (id: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  selectedMemberId: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setSelectedMemberId: (id) => set({ selectedMemberId: id }),
}))
