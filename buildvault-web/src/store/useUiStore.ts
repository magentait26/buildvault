import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  selectedProjectId: string | null;
  activeView: string; // fallback matching previous tab implementation
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  setActiveView: (view: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  selectedProjectId: null,
  activeView: 'dashboard',

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
  setActiveView: (view) => set({ activeView: view }),
}));
