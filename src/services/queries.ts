import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from './apiClient';
import { useAuthStore } from '../store/useAuthStore';
import { useUiStore } from '../store/useUiStore';
import { Project, Document, ComplianceStatus, Role } from '../types';

// Query Keys namespaces
export const queryKeys = {
  projects: (orgId: string) => ['projects', orgId] as const,
  projectDetails: (orgId: string, projectId: string) => ['projects', orgId, projectId] as const,
  documents: (orgId: string, projectId?: string | null) => ['documents', orgId, projectId || 'all'] as const,
  compliance: (orgId: string, projectId?: string | null) => ['compliance', orgId, projectId || 'all'] as const,
  approvals: (orgId: string) => ['approvals', orgId] as const,
  users: (orgId: string) => ['users', orgId] as const,
  activityLogs: (orgId: string) => ['activityLogs', orgId] as const,
  versions: ['versions'] as const,
};

// Custom query hooks reactive to zustand stores
export function useVersionsQuery() {
  return useQuery({
    queryKey: queryKeys.versions,
    queryFn: () => ApiClient.getVersions(),
    staleTime: 60 * 1000,
  });
}

export function useProjectsQuery() {
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  return useQuery({
    queryKey: queryKeys.projects(selectedOrgId || ''),
    queryFn: () => ApiClient.getProjects(selectedOrgId || ''),
    enabled: !!selectedOrgId,
    staleTime: 60 * 1000, // 1 minute stale time
  });
}

export function useDocumentsQuery() {
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  const selectedProjectId = useUiStore((state) => state.selectedProjectId);
  return useQuery({
    queryKey: queryKeys.documents(selectedOrgId || '', selectedProjectId),
    queryFn: () => ApiClient.getDocuments(selectedOrgId || '', selectedProjectId),
    enabled: !!selectedOrgId,
    staleTime: 30 * 1000,
  });
}

export function useComplianceQuery() {
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  const selectedProjectId = useUiStore((state) => state.selectedProjectId);
  return useQuery({
    queryKey: queryKeys.compliance(selectedOrgId || '', selectedProjectId),
    queryFn: () => ApiClient.getComplianceRecords(selectedOrgId || '', selectedProjectId),
    enabled: !!selectedOrgId,
    staleTime: 35 * 1000,
  });
}

export function useApprovalsQuery() {
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  return useQuery({
    queryKey: queryKeys.approvals(selectedOrgId || ''),
    queryFn: () => ApiClient.getApprovalTasks(selectedOrgId || ''),
    enabled: !!selectedOrgId,
    staleTime: 30 * 1000,
  });
}

export function useUsersQuery() {
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  return useQuery({
    queryKey: queryKeys.users(selectedOrgId || ''),
    queryFn: () => ApiClient.getUsers(selectedOrgId || ''),
    enabled: !!selectedOrgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useActivityLogsQuery() {
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  return useQuery({
    queryKey: queryKeys.activityLogs(selectedOrgId || ''),
    queryFn: () => ApiClient.getActivityLogs(selectedOrgId || ''),
    enabled: !!selectedOrgId,
    staleTime: 10 * 1000,
  });
}

// Mutations for state updates
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  
  return useMutation({
    mutationFn: (newProj: Omit<Project, 'id' | 'organizationId'>) => 
      ApiClient.createProject(selectedOrgId || '', newProj),
    onSuccess: () => {
      // Invalidate projects cache to trigger reactive updates
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(selectedOrgId || '') });
    },
  });
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  const selectedProjectId = useUiStore((state) => state.selectedProjectId);
  const authenticatedUser = useAuthStore((state) => state.authenticatedUser);
  const selectedRole = useAuthStore((state) => state.selectedRole);

  return useMutation({
    mutationFn: async (payload: { name: string; category: any; fileSize: string; comment?: string; projectId: string; file?: File }) => {
      if (!selectedOrgId || !authenticatedUser || !selectedRole) {
        throw new Error('Unauthenticated query state context missing');
      }
      
      const realProjectId = payload.projectId;

      // 1. Plan/Intend release in S3
      const { uploadTokenId, s3Key } = await ApiClient.uploadDocumentIntent(selectedOrgId, realProjectId, {
        name: payload.name,
        category: payload.category,
        fileSize: payload.fileSize,
        comment: payload.comment,
        uploadedBy: authenticatedUser.name,
      });

      // 2. Commit asset indexing to Database backend
      return ApiClient.confirmUpload(selectedOrgId, realProjectId, {
        name: payload.name,
        category: payload.category,
        fileSize: payload.fileSize,
        uploadedBy: authenticatedUser.name,
        uploadedRole: selectedRole,
        s3Key,
        file: payload.file,
        comment: payload.comment || `Committed structural index via transaction ${uploadTokenId}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(selectedOrgId || '', selectedProjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
    },
  });
}

export function useInitiateApprovalMutation() {
  const queryClient = useQueryClient();
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  const authenticatedUser = useAuthStore((state) => state.authenticatedUser);
  const selectedRole = useAuthStore((state) => state.selectedRole);

  return useMutation({
    mutationFn: (payload: { projectId: string; documentId: string; comments: string }) => {
      if (!selectedOrgId || !authenticatedUser || !selectedRole) {
        throw new Error('Unauthenticated state context missing');
      }
      return ApiClient.initiateApproval(selectedOrgId, {
        projectId: payload.projectId,
        documentId: payload.documentId,
        comments: payload.comments,
        requestedBy: authenticatedUser.name,
        requestedRole: selectedRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals(selectedOrgId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(selectedOrgId || '') });
    },
  });
}

export function useSignApprovalMutation() {
  const queryClient = useQueryClient();
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  const authenticatedUser = useAuthStore((state) => state.authenticatedUser);
  const selectedRole = useAuthStore((state) => state.selectedRole);

  return useMutation({
    mutationFn: (payload: { taskId: string; decision: 'Approved' | 'Rejected' | 'Revision Required'; comment: string }) => {
      if (!selectedOrgId || !authenticatedUser || !selectedRole) {
        throw new Error('Unauthenticated state context missing');
      }
      return ApiClient.signApproval(selectedOrgId, payload.taskId, payload.decision, {
        user: authenticatedUser.name,
        role: selectedRole,
        comment: payload.comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals(selectedOrgId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(selectedOrgId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.compliance(selectedOrgId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
    },
  });
}

export function useUpdateComplianceMutation() {
  const queryClient = useQueryClient();
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  const selectedProjectId = useUiStore((state) => state.selectedProjectId);

  return useMutation({
    mutationFn: (payload: { recordId: string; status: ComplianceStatus; expiryDate?: string }) => {
      if (!selectedOrgId) throw new Error('Organization context required');
      return ApiClient.updateComplianceStatus(selectedOrgId, payload.recordId, payload.status, payload.expiryDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.compliance(selectedOrgId || '', selectedProjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
    },
  });
}
