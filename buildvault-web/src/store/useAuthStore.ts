import { create } from 'zustand';
import { User, Role, Organization } from '../types';

interface AuthState {
  authenticatedUser: User | null;
  selectedOrgId: string | null;
  selectedRole: Role | null;
  isImpersonating: boolean;
  originalAdminUser: User | null; // For holding the Super Admin when impersonating
  organizations: Organization[];
  
  // Actions
  login: (user: User, orgId: string) => void;
  logout: () => void;
  setSelectedOrgId: (orgId: string) => void;
  setSelectedRole: (role: Role) => void;
  startImpersonation: (tenantOrgId: string, targetRole: Role) => void;
  stopImpersonation: () => void;
  setOrganizations: (orgs: Organization[]) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authenticatedUser: null,
  selectedOrgId: null,
  selectedRole: null,
  isImpersonating: false,
  originalAdminUser: null,
  organizations: [],

  login: (user, orgId) => {
    set({
      authenticatedUser: user,
      selectedOrgId: orgId,
      selectedRole: user.role,
      isImpersonating: false,
      originalAdminUser: null,
    });
    localStorage.setItem('buildvault_auth_v3', JSON.stringify(user));
  },

  logout: () => {
    set({
      authenticatedUser: null,
      selectedOrgId: null,
      selectedRole: null,
      isImpersonating: false,
      originalAdminUser: null,
    });
    localStorage.removeItem('buildvault_auth_v3');
  },

  setSelectedOrgId: (orgId) => {
    set({ selectedOrgId: orgId });
  },

  setSelectedRole: (role) => {
    set({ selectedRole: role });
  },

  startImpersonation: (tenantOrgId, targetRole) => {
    const { authenticatedUser, isImpersonating, originalAdminUser } = get();
    if (!authenticatedUser) return;

    // Save the genuine Super Admin user if not already impersonating
    const adminToPreserve = isImpersonating ? originalAdminUser : authenticatedUser;

    set({
      selectedOrgId: tenantOrgId,
      selectedRole: targetRole,
      isImpersonating: true,
      originalAdminUser: adminToPreserve,
    });
  },

  stopImpersonation: () => {
    const { originalAdminUser } = get();
    if (!originalAdminUser) return;

    set({
      authenticatedUser: originalAdminUser,
      selectedOrgId: originalAdminUser.organizationId,
      selectedRole: originalAdminUser.role,
      isImpersonating: false,
      originalAdminUser: null,
    });
  },

  setOrganizations: (orgs) => {
    set({ organizations: orgs });
  },
}));
