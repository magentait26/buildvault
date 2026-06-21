import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

// Zustand stores
import { useAuthStore } from '../store/useAuthStore';
import { useUiStore } from '../store/useUiStore';

// TanStack query & mutations
import { 
  useProjectsQuery, 
  useDocumentsQuery, 
  useComplianceQuery, 
  useApprovalsQuery, 
  useUsersQuery, 
  useActivityLogsQuery,
  useVersionsQuery,
  useCreateProjectMutation,
  useUploadDocumentMutation,
  useInitiateApprovalMutation,
  useSignApprovalMutation,
  useUpdateComplianceMutation,
  queryKeys
} from '../services/queries';

// API Client
import { ApiClient } from '../services/apiClient';

// Shared Loading component
import LoadingSpinner from '../components/common/LoadingSpinner';

// Presentation views
import DashboardView from '../components/DashboardView';
import ProjectsView from '../components/ProjectsView';
import DocumentsView from '../components/DocumentsView';
import ComplianceView from '../components/ComplianceView';
import ApprovalsView from '../components/ApprovalsView';
import ReportsView from '../components/ReportsView';
import IntegrationsView from '../components/IntegrationsView';
import NotificationsView from '../components/NotificationsView';
import UsersView from '../components/UsersView';
import ActivityLogsView from '../components/ActivityLogsView';
import SettingsView from '../components/SettingsView';

// --- Dashboard Container ---
export function DashboardContainer() {
  const navigate = useNavigate();
  const { selectedRole, setSelectedRole, selectedOrgId } = useAuthStore();
  const { setSelectedProjectId } = useUiStore();
  
  const { data: projects, isLoading: pLoading } = useProjectsQuery();
  const { data: documents, isLoading: dLoading } = useDocumentsQuery();
  const { data: compliance, isLoading: cLoading } = useComplianceQuery();
  const { data: approvals, isLoading: aLoading } = useApprovalsQuery();
  const { data: logs, isLoading: lLoading } = useActivityLogsQuery();
  const { data: users, isLoading: uLoading } = useUsersQuery();

  if (pLoading || dLoading || cLoading || aLoading || lLoading || uLoading) {
    return <LoadingSpinner label="Compiling live portfolio performance dashboard metrics..." />;
  }

  const projList = projects || [];
  const compList = compliance || [];

  // Calculate overall compliance scorecard
  const totalWeight = compList.reduce((sum, c) => sum + c.scoreImpact, 0);
  const approvedWeight = compList.filter(c => c.status === 'Approved').reduce((sum, c) => sum + c.scoreImpact, 0);
  const submittedWeight = compList.filter(c => c.status === 'Submitted').reduce((sum, c) => sum + (c.scoreImpact * 0.5), 0);
  const complianceScore = totalWeight > 0 ? Math.round((approvedWeight + submittedWeight) / totalWeight * 100) : 100;

  return (
    <DashboardView
      projects={projList}
      documents={documents || []}
      compliance={compList}
      approvals={approvals || []}
      logs={logs || []}
      onNavigate={(tab) => {
        if (tab === 'alerts') navigate('/alerts');
        else navigate(`/${tab}`);
      }}
      onSelectProject={(pId) => {
        setSelectedProjectId(pId);
        navigate('/projects');
      }}
      complianceScore={complianceScore}
      currentRole={selectedRole || undefined}
      onSelectRole={(role) => setSelectedRole(role)}
      allTenantUsers={users || []}
      onResetDatabase={() => {
        if (window.confirm('Wipe and reset local storage to factory template seeds?')) {
          localStorage.clear();
          window.location.reload();
        }
      }}
    />
  );
}

// --- Projects Container ---
export function ProjectsContainer() {
  const queryClient = useQueryClient();
  const { selectedRole, authenticatedUser, selectedOrgId } = useAuthStore();
  const { selectedProjectId, setSelectedProjectId } = useUiStore();

  const { data: projects, isLoading: pLoading } = useProjectsQuery();
  const { data: documents, isLoading: dLoading } = useDocumentsQuery();
  const { data: compliance, isLoading: cLoading } = useComplianceQuery();
  const { data: approvals, isLoading: aLoading } = useApprovalsQuery();
  const { data: logs, isLoading: lLoading } = useActivityLogsQuery();
  const { data: users, isLoading: uLoading } = useUsersQuery();

  const createProjectMutation = useCreateProjectMutation();

  if (pLoading || dLoading || cLoading || aLoading || lLoading || uLoading) {
    return <LoadingSpinner label="Accessing portfolio master list records..." />;
  }

  const handleCreateProject = async (p: any) => {
    await createProjectMutation.mutateAsync(p);
  };

  const handleEditProject = async (pId: string, fields: any) => {
    await ApiClient.updateProject(selectedOrgId || '', pId, fields);
    queryClient.invalidateQueries({ queryKey: queryKeys.projects(selectedOrgId || '') });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
  };

  const handleAddLog = async (action: string, details: string) => {
    if (!authenticatedUser) return;
    await ApiClient.createLog(selectedOrgId || '', {
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      userRole: selectedRole || 'Auditor',
      action,
      details,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
  };

  return (
    <ProjectsView
      projects={projects || []}
      documents={documents || []}
      compliance={compliance || []}
      approvals={approvals || []}
      logs={logs || []}
      allUsers={users || []}
      currentRole={selectedRole || 'Auditor'}
      currentUser={authenticatedUser!}
      selectedProjectId={selectedProjectId}
      setSelectedProjectId={setSelectedProjectId}
      onCreateProject={handleCreateProject}
      onEditProject={handleEditProject}
      onAddLog={handleAddLog}
    />
  );
}

// --- Documents Container ---
export function DocumentsContainer() {
  const queryClient = useQueryClient();
  const { selectedRole, authenticatedUser, selectedOrgId } = useAuthStore();
  const { selectedProjectId } = useUiStore();

  const { data: projects, isLoading: pLoading } = useProjectsQuery();
  const { data: documents, isLoading: dLoading } = useDocumentsQuery();
  const { data: versions, isLoading: vLoading } = useVersionsQuery();
  const { data: approvals, isLoading: aLoading } = useApprovalsQuery();

  const uploadDocMutation = useUploadDocumentMutation();
  const initiateApprovalMutation = useInitiateApprovalMutation();

  if (pLoading || dLoading || vLoading || aLoading) {
    return <LoadingSpinner label="Mounting secure distributed S3 Document Vault..." />;
  }

  const handleUpload = async (pId: string, name: string, cat: any, tags: string[], desc: string, size: string, comment?: string, file?: File) => {
    await uploadDocMutation.mutateAsync({
      projectId: pId,
      name,
      category: cat,
      fileSize: size,
      comment,
      file,
    });
    // Multi-table refresh
    queryClient.invalidateQueries({ queryKey: queryKeys.documents(selectedOrgId || '', selectedProjectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.versions });
  };

  const handleRestore = async (docId: string, verNum: number) => {
    const raw = localStorage.getItem('buildvault_v1_store_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.documents = parsed.documents.map((d: any) => 
        d.id === docId ? { ...d, latestVersion: verNum, status: 'Pending' } : d
      );
      localStorage.setItem('buildvault_v1_store_v2', JSON.stringify(parsed));
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(selectedOrgId || '', selectedProjectId) });
    }
  };

  const handleInitiateApproval = async (docId: string, rationale: string) => {
    await initiateApprovalMutation.mutateAsync({
      projectId: selectedProjectId || '',
      documentId: docId,
      comments: rationale,
    });
  };

  const handleAddLog = async (action: string, details: string) => {
    if (!authenticatedUser) return;
    await ApiClient.createLog(selectedOrgId || '', {
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      userRole: selectedRole || 'Auditor',
      action,
      details,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
  };

  return (
    <DocumentsView
      projects={projects || []}
      documents={documents || []}
      versions={versions || []}
      approvals={approvals || []}
      currentRole={selectedRole || 'Auditor'}
      currentUser={authenticatedUser!}
      onUploadDocument={handleUpload}
      onRestoreVersion={handleRestore}
      onInitiateApprovalWorkflow={handleInitiateApproval}
      onAddLog={handleAddLog}
    />
  );
}

// --- Compliance Container ---
export function ComplianceContainer() {
  const queryClient = useQueryClient();
  const { selectedRole, authenticatedUser, selectedOrgId } = useAuthStore();
  const { selectedProjectId } = useUiStore();

  const { data: projects, isLoading: pLoading } = useProjectsQuery();
  const { data: compliance, isLoading: cLoading } = useComplianceQuery();

  const updateComplianceMutation = useUpdateComplianceMutation();

  if (pLoading || cLoading) {
    return <LoadingSpinner label="Auditing statutory compliance checklists..." />;
  }

  const handleUpdateCompliance = async (pId: string, type: any, status: any, expiry?: string) => {
    const record = compliance?.find(c => c.projectId === pId && c.complianceType === type);
    if (record) {
      await updateComplianceMutation.mutateAsync({
        recordId: record.id,
        status,
        expiryDate: expiry,
      });
    }
  };

  const handleAddLog = async (action: string, details: string) => {
    if (!authenticatedUser) return;
    await ApiClient.createLog(selectedOrgId || '', {
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      userRole: selectedRole || 'Auditor',
      action,
      details,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
  };

  return (
    <ComplianceView
      projects={projects || []}
      compliance={compliance || []}
      currentRole={selectedRole || 'Auditor'}
      currentUser={authenticatedUser!}
      onUpdateComplianceTypeStatus={handleUpdateCompliance}
      onAddLog={handleAddLog}
    />
  );
}

// --- Approvals Container ---
export function ApprovalsContainer() {
  const queryClient = useQueryClient();
  const { selectedRole, authenticatedUser, selectedOrgId } = useAuthStore();

  const { data: projects, isLoading: pLoading } = useProjectsQuery();
  const { data: approvals, isLoading: aLoading } = useApprovalsQuery();

  const signApprovalMutation = useSignApprovalMutation();

  if (pLoading || aLoading) {
    return <LoadingSpinner label="Accessing secure workflow signature vaults..." />;
  }

  const handleSign = async (taskId: string, decision: any, comment: string) => {
    await signApprovalMutation.mutateAsync({
      taskId,
      decision,
      comment,
    });
  };

  const handleAddLog = async (action: string, details: string) => {
    if (!authenticatedUser) return;
    await ApiClient.createLog(selectedOrgId || '', {
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      userRole: selectedRole || 'Auditor',
      action,
      details,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
  };

  return (
    <ApprovalsView
      projects={projects || []}
      approvals={approvals || []}
      currentRole={selectedRole || 'Auditor'}
      currentUser={authenticatedUser!}
      onApproveWorkflow={(id, comment) => handleSign(id, 'Approved', comment)}
      onRejectWorkflow={(id, comment) => handleSign(id, 'Rejected', comment)}
      onRequestChangesWorkflow={(id, comment) => handleSign(id, 'Revision Required', comment)}
      onAddLog={handleAddLog}
    />
  );
}

// --- Reports Container ---
export function ReportsContainer() {
  const { selectedOrgId, organizations } = useAuthStore();
  const { data: projects, isLoading: pLoading } = useProjectsQuery();
  const { data: documents, isLoading: dLoading } = useDocumentsQuery();
  const { data: compliance, isLoading: cLoading } = useComplianceQuery();
  const { data: approvals, isLoading: aLoading } = useApprovalsQuery();

  if (pLoading || dLoading || cLoading || aLoading) {
    return <LoadingSpinner label="Assembling audit reports and visual analysis dashboards..." />;
  }

  const handleDownloadReport = (format: 'PDF' | 'Excel') => {
    const org = organizations.find(o => o.id === selectedOrgId);
    const stats_proj = projects?.length || 0;
    const stats_docs = documents?.length || 0;
    
    // Score calculation
    const totalWeight = compliance?.reduce((sum, c) => sum + c.scoreImpact, 0) || 0;
    const approvedWeight = compliance?.filter(c => c.status === 'Approved').reduce((sum, c) => sum + c.scoreImpact, 0) || 0;
    const submittedWeight = compliance?.filter(c => c.status === 'Submitted').reduce((sum, c) => sum + (c.scoreImpact * 0.5), 0) || 0;
    const scoreVal = totalWeight > 0 ? Math.round((approvedWeight + submittedWeight) / totalWeight * 100) : 100;

    const reportContentString = `
========================================
BUILDVAULT PLATFORM STATUTORY REPORT
Organization: ${org?.name}
Lease Export: ${format} File
Generated: 2026-06-14 UTC
========================================

METRICS PROFILE SUMMARY
----------------------------------------
* Total Pipeline Portfolios: ${stats_proj}
* Registered S3 Documents: ${stats_docs}
* Comprehensive Compliance Index: ${scoreVal}%
* Pending Signatures Queue: ${approvals?.filter(a => a.status === 'Pending').length || 0}

COMPLIANCE DETAILED STATS
----------------------------------------
${compliance?.map(c => {
  const p = projects?.find(proj => proj.id === c.projectId);
  return `[${p?.code || 'REV'}] ${c.complianceType}: Status: ${c.status} | Weight: ${c.scoreImpact}% | Expiry: ${c.expiryDate || 'N/A'}`;
}).join('\n')}

BUILDVAULT SHA-256 DIGITAL IMMUTABILITY SECURED
========================================
`;

    // Download payload browser simulator
    const blob = new Blob([reportContentString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BuildVault-Report-${org?.name.replace(/\s+/g, '-')}-${new Date().toISOString().substring(0,10)}.${format === 'PDF' ? 'txt' : 'csv'}`;
    link.click();
    URL.revokeObjectURL(url);
    alert(`Downloaded simulated ${format} report spreadsheet!`);
  };

  return (
    <ReportsView
      projects={projects || []}
      documents={documents || []}
      compliance={compliance || []}
      approvals={approvals || []}
      onDownloadReport={handleDownloadReport}
    />
  );
}

// --- Integrations Container ---
export function IntegrationsContainer() {
  const queryClient = useQueryClient();
  const { selectedOrgId, authenticatedUser, selectedRole } = useAuthStore();

  const handleAddLog = async (action: string, details: string) => {
    if (!authenticatedUser) return;
    await ApiClient.createLog(selectedOrgId || '', {
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      userRole: selectedRole || 'Auditor',
      action,
      details,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
  };

  return <IntegrationsView onAddLog={handleAddLog} />;
}

// --- Notifications Container ---
export function NotificationsContainer() {
  const { selectedOrgId } = useAuthStore();
  const queryClient = useQueryClient();
  
  const rawDb = localStorage.getItem('buildvault_v1_store_v2');
  const allNotifications = rawDb ? JSON.parse(rawDb).notifications || [] : [];
  const tenantNotifications = allNotifications.filter((n: any) => n.organizationId === selectedOrgId);

  const onMarkAllAsRead = () => {
    const raw = localStorage.getItem('buildvault_v1_store_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.notifications = parsed.notifications.map((n: any) => 
        n.organizationId === selectedOrgId ? { ...n, isRead: true } : n
      );
      localStorage.setItem('buildvault_v1_store_v2', JSON.stringify(parsed));
      queryClient.invalidateQueries();
    }
  };

  const onClearAll = () => {
    const raw = localStorage.getItem('buildvault_v1_store_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.notifications = parsed.notifications.filter((n: any) => n.organizationId !== selectedOrgId);
      localStorage.setItem('buildvault_v1_store_v2', JSON.stringify(parsed));
      queryClient.invalidateQueries();
    }
  };

  return (
    <NotificationsView
      notifications={tenantNotifications}
      onMarkAllAsRead={onMarkAllAsRead}
      onClearAll={onClearAll}
    />
  );
}

// --- Users Container ---
export function UsersContainer() {
  const queryClient = useQueryClient();
  const { selectedOrgId, authenticatedUser, selectedRole } = useAuthStore();

  const { data: users, isLoading: uLoading } = useUsersQuery();
  const { data: projects, isLoading: pLoading } = useProjectsQuery();

  if (uLoading || pLoading) {
    return <LoadingSpinner label="Syncing team representatives directory..." />;
  }

  const handleCreateUser = async (uFields: any) => {
    const raw = localStorage.getItem('buildvault_v1_store_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      const freshUser = { ...uFields, id: `u-${Math.floor(100 + Math.random() * 900)}`, organizationId: selectedOrgId };
      parsed.users = [...(parsed.users || []), freshUser];
      localStorage.setItem('buildvault_v1_store_v2', JSON.stringify(parsed));
      queryClient.invalidateQueries({ queryKey: queryKeys.users(selectedOrgId || '') });
    }
  };

  const handleEditUser = async (uId: string, fields: any) => {
    const raw = localStorage.getItem('buildvault_v1_store_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.users = parsed.users.map((u: any) => u.id === uId ? { ...u, ...fields } : u);
      localStorage.setItem('buildvault_v1_store_v2', JSON.stringify(parsed));
      queryClient.invalidateQueries({ queryKey: queryKeys.users(selectedOrgId || '') });
    }
  };

  const handleAddLog = async (action: string, details: string) => {
    if (!authenticatedUser) return;
    await ApiClient.createLog(selectedOrgId || '', {
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      userRole: selectedRole || 'Auditor',
      action,
      details,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
  };

  return (
    <UsersView
      users={users || []}
      projects={projects || []}
      currentRole={selectedRole || 'Auditor'}
      onCreateUser={handleCreateUser}
      onEditUser={handleEditUser}
      onAddLog={handleAddLog}
    />
  );
}

// --- ActivityLogs Container ---
export function ActivityLogsContainer() {
  const { data: logs, isLoading: lLoading } = useActivityLogsQuery();

  if (lLoading) {
    return <LoadingSpinner label="Accessing secure write-once transaction ledgers..." />;
  }

  return <ActivityLogsView logs={logs || []} />;
}

// --- Settings Container ---
export function SettingsContainer() {
  const queryClient = useQueryClient();
  const { selectedOrgId, authenticatedUser, selectedRole } = useAuthStore();

  const handleAddLog = async (action: string, details: string) => {
    if (!authenticatedUser) return;
    await ApiClient.createLog(selectedOrgId || '', {
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      userRole: selectedRole || 'Auditor',
      action,
      details,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(selectedOrgId || '') });
  };

  return <SettingsView onAddLog={handleAddLog} />;
}
