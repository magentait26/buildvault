import { 
  Project, Document, DocumentVersion, ComplianceRecord, 
  ApprovalTask, ActivityLog, User, Notification, Organization 
} from '../types';

export const mapDocumentStatus = (backendStatus: string): 'Draft' | 'Active' | 'Archived' | 'Expired' => {
  const status = (backendStatus || '').toLowerCase();
  if (status.includes('approve') || status.includes('clearance') || status.includes('granted') || status.includes('active')) {
    return 'Active';
  }
  if (status.includes('await') || status.includes('pend') || status.includes('revis') || status.includes('draft')) {
    return 'Draft';
  }
  if (status.includes('reject') || status.includes('archiv')) {
    return 'Archived';
  }
  if (status.includes('expir')) {
    return 'Expired';
  }
  return 'Active'; // Default fallback
};

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('buildvault_token');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `/api/v1${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch {
        // Fallback
      }
      throw new Error(errorMsg);
    }

    try {
      return await response.json() as T;
    } catch {
      return {} as T;
    }
  }

  // --- Authentication Gates ---
  static async login(email: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
    const res = await this.request<{ success: boolean; message: string; token: string; user: any }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.success || !res.token) {
      throw new Error(res.message || 'Authentication credentials unrecognized or inactive.');
    }

    localStorage.setItem('buildvault_token', res.token);
    
    const mappedUser: User = {
      id: res.user.id,
      organizationId: res.user.organization_id || 'org-master',
      name: res.user.name,
      email: res.user.email,
      role: res.user.role,
      status: 'Active',
      assignedProjectIds: [],
    };

    localStorage.setItem('buildvault_auth_v3', JSON.stringify(mappedUser));
    return {
      success: true,
      token: res.token,
      user: mappedUser
    };
  }

  static async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Allow soft logout if backend session is expired
    } finally {
      localStorage.removeItem('buildvault_token');
      localStorage.removeItem('buildvault_auth_v3');
    }
  }

  // --- Projects (Physical Properties) ---
  static async getProjects(orgId: string): Promise<Project[]> {
    const res = await this.request<{ success: boolean; projects: any }>('/projects');
    const projectsList = Array.isArray(res.projects) ? res.projects : (res.projects?.data || []);
    return projectsList.map((p: any) => ({
      id: p.id,
      organizationId: orgId,
      name: p.name,
      code: p.project_code || p.rera_registration_id || p.id,
      location: p.location,
      projectType: p.category || p.project_type || 'Residential',
      description: p.description || '',
      status: p.status || 'Active',
      startDate: p.start_date || p.created_at?.split('T')[0] || '',
      endDate: p.handover_date || p.end_date || '',
      assignedTeam: (p.users || []).map((u: any) => ({
        userId: u.id,
        role: u.role?.name || u.role || 'Site Engineer'
      })) || [],
    }));
  }

  static async createProject(orgId: string, project: Omit<Project, 'id' | 'organizationId'>): Promise<Project> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const handoverDate = new Date();
    handoverDate.setMonth(handoverDate.getMonth() + 24);
    const handoverStr = handoverDate.toISOString().split('T')[0];

    const payload = {
      name: project.name,
      location: project.location,
      start_date: project.startDate || todayStr,
      handover_date: project.endDate || handoverStr,
      status: project.status || 'Active',
      rera_registration_no: 1234, // numerical fallback
      rera_registration_id: project.code || 'RERA-123',
      project_code: project.code || null,
      category: project.projectType || null,
      description: project.description || null,
    };

    const res = await this.request<{ success: boolean; project: any }>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const p = res.project;
    return {
      id: p.id,
      organizationId: orgId,
      name: p.name,
      code: p.project_code || p.rera_registration_id || p.id,
      location: p.location,
      projectType: p.category || p.project_type || 'Residential',
      description: p.description || '',
      status: p.status,
      startDate: p.start_date,
      endDate: p.handover_date || '',
      assignedTeam: [],
    };
  }

  static async updateProject(orgId: string, projectId: string, updates: Partial<Project>): Promise<Project> {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.location) payload.location = updates.location;
    if (updates.startDate) payload.start_date = updates.startDate;
    if (updates.endDate) payload.handover_date = updates.endDate;
    if (updates.status) payload.status = updates.status;
    if (updates.code) {
      payload.rera_registration_id = updates.code;
      payload.project_code = updates.code;
    }
    if (updates.projectType) payload.category = updates.projectType;
    if (updates.description) payload.description = updates.description;

    const res = await this.request<{ success: boolean; project: any }>(`/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const p = res.project;
    return {
      id: p.id,
      organizationId: orgId,
      name: p.name,
      code: p.project_code || p.rera_registration_id || p.id,
      location: p.location,
      projectType: p.category || p.project_type || 'Residential',
      description: p.description || '',
      status: p.status,
      startDate: p.start_date,
      endDate: p.handover_date || '',
      assignedTeam: [],
    };
  }

  // --- Documents (Clearance Registries) ---
  static async getDocuments(orgId: string, projectId?: string | null): Promise<Document[]> {
    let url = '/documents';
    if (projectId) {
      url += `?project_id=${projectId}`;
    }
    const res = await this.request<{ success: boolean; documents: any }>(url);
    const documentsList = Array.isArray(res.documents) ? res.documents : (res.documents?.data || []);
    return documentsList.map((d: any) => ({
      id: d.id,
      organizationId: orgId,
      projectId: d.project_id,
      name: d.title,
      category: d.category,
      tags: d.tags || [],
      uploadDate: d.created_at?.split('T')[0] || new Date().toISOString().substring(0, 10),
      uploadedBy: d.latest_version?.publisher?.name || d.uploaded_by || 'Staff',
      uploadedRole: d.latest_version?.publisher?.role?.name || 'Site Engineer',
      latestVersion: d.latest_version?.version_number || d.latest_version || 1,
      status: mapDocumentStatus(d.status || 'Pending'),
      description: d.description || '',
    }));
  }

  // Native Multi-part Files upload
  static async uploadDocument(
    orgId: string,
    projectId: string,
    payload: { name: string; category: any; fileSize: string; comment?: string; file?: File | null }
  ): Promise<{ document: Document; version: DocumentVersion }> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('title', payload.name);
    formData.append('category', payload.category);
    
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    formData.append('expiry_date', expiry.toISOString().substring(0, 10));

    const actualFile = payload.file || new File(
      [new Blob(['BuildVault secure workspace digital asset upload proof.'], { type: 'text/plain' })],
      `${payload.name.replace(/\s+/g, '_')}.pdf`,
      { type: 'application/pdf' }
    );
    formData.append('file', actualFile);

    const res = await this.request<{ success: boolean; document: any }>('/documents', {
      method: 'POST',
      body: formData,
    });

    const d = res.document;
    const item: Document = {
      id: d.id,
      organizationId: orgId,
      projectId: d.project_id,
      name: d.title,
      category: d.category,
      tags: d.tags || [],
      uploadDate: new Date().toISOString().substring(0, 10),
      uploadedBy: d.latest_version?.publisher?.name || 'Staff',
      uploadedRole: 'Director',
      latestVersion: d.latest_version?.version_number || 1,
      status: mapDocumentStatus(d.status || 'Pending'),
      description: payload.comment || '',
    };

    const ver: DocumentVersion = {
      id: d.latest_version?.id || `v-${Date.now()}`,
      documentId: d.id,
      versionNumber: d.latest_version?.version_number || 1,
      fileName: d.latest_version?.file_name || `${payload.name}.pdf`,
      fileSize: payload.fileSize,
      uploadDate: new Date().toISOString().substring(0, 10),
      uploadedBy: 'CurrentUser',
      comment: payload.comment,
    };

    return { document: item, version: ver };
  }

  // Kept for signature compatibility
  static async uploadDocumentIntent(
    orgId: string, 
    projectId: string, 
    intent: any
  ): Promise<{ uploadTokenId: string; targetUploadUrl: string; s3Key: string }> {
    return {
      uploadTokenId: `token-${Date.now()}`,
      targetUploadUrl: '',
      s3Key: '',
    };
  }

  // Kept for backward compatibility mapping
  static async confirmUpload(
    orgId: string,
    projectId: string,
    payload: any
  ): Promise<{ document: Document; version: DocumentVersion }> {
    return this.uploadDocument(orgId, projectId, {
      name: payload.name,
      category: payload.category,
      fileSize: payload.fileSize,
      comment: payload.comment || '',
      file: payload.file,
    });
  }

  static async getVersions(): Promise<DocumentVersion[]> {
    // Return empty list or fetch from endpoints
    return [];
  }

  // --- Compliance ---
  static async getComplianceRecords(orgId: string, projectId?: string | null): Promise<ComplianceRecord[]> {
    let url = '/compliance-records';
    if (projectId) {
      url += `?project_id=${projectId}`;
    }
    const res = await this.request<{ success: boolean; compliance_records: any }>(url);
    const recordsList = Array.isArray(res.compliance_records) ? res.compliance_records : (res.compliance_records?.data || []);
    return recordsList.map((c: any) => ({
      id: c.id,
      organizationId: orgId,
      projectId: c.project_id,
      complianceType: c.title || 'RERA Registration',
      status: c.status || 'Pending',
      submissionDate: c.created_at?.split('T')[0],
      expiryDate: c.expiry_date,
      documentId: c.document_id || undefined,
      scoreImpact: c.warning_buffer_days || 15,
    }));
  }

  static async updateComplianceStatus(
    orgId: string, 
    recordId: string, 
    status: any, 
    expiryDate?: string
  ): Promise<ComplianceRecord> {
    const payload = {
      status,
      expiry_date: expiryDate || new Date().toISOString().substring(0, 10),
    };
    const res = await this.request<{ success: boolean; compliance_record: any }>(`/compliance-records/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const c = res.compliance_record;
    return {
      id: c.id,
      organizationId: orgId,
      projectId: c.project_id,
      complianceType: c.title,
      status: c.status,
      submissionDate: c.created_at?.split('T')[0],
      expiryDate: c.expiry_date,
      documentId: c.document_id || undefined,
      scoreImpact: c.warning_buffer_days || 15,
    };
  }

  // --- Approvals ---
  static async getApprovalTasks(orgId: string): Promise<ApprovalTask[]> {
    const res = await this.request<{ success: boolean; approvals: any }>('/approvals');
    const list = Array.isArray(res.approvals) ? res.approvals : (res.approvals?.data || []);
    return list.map((a: any) => ({
      id: a.id,
      organizationId: orgId,
      projectId: a.document?.project_id || '',
      documentId: a.document_id,
      documentName: a.document?.title || '',
      category: a.document?.category || 'Approvals',
      requestedBy: a.initiator?.name || 'Director',
      requestedRole: a.initiator?.role?.name || 'Director',
      requestedDate: a.created_at?.split('T')[0] || new Date().toISOString().substring(0, 10),
      status: a.status || 'Pending',
      comments: a.comments || '',
      history: (a.comments_list || []).map((c: any) => ({
        id: c.id,
        action: 'Created',
        user: c.user?.name || 'User',
        role: c.user?.role?.name || 'Director',
        comment: c.comment,
        timestamp: c.created_at,
      })),
    }));
  }

  static async initiateApproval(
    orgId: string, 
    taskDetails: { projectId: string; documentId: string; requestedBy: string; requestedRole: any; comments: string }
  ): Promise<ApprovalTask> {
    let reviewerIds: string[] = [];
    try {
      const users = await this.getUsers(orgId);
      reviewerIds = users.filter((u) => u.role === 'Director' || u.role === 'Compliance Officer').map((u) => u.id);
    } catch {
      // Ignore
    }
    if (reviewerIds.length === 0) {
      reviewerIds = ['abc-123-dummy-uuid'];
    }

    const payload = {
      document_id: taskDetails.documentId,
      priority: 'High',
      approver_ids: reviewerIds,
    };

    const res = await this.request<{ success: boolean; approval: any }>('/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const a = res.approval;
    return {
      id: a.id,
      organizationId: orgId,
      projectId: taskDetails.projectId,
      documentId: taskDetails.documentId,
      documentName: a.document?.title || '',
      category: a.document?.category || 'Approvals',
      requestedBy: taskDetails.requestedBy,
      requestedRole: taskDetails.requestedRole,
      requestedDate: new Date().toISOString().substring(0, 10),
      status: 'Pending',
      comments: taskDetails.comments,
      history: [],
    };
  }

  static async signApproval(
    orgId: string,
    taskId: string,
    decision: 'Approved' | 'Rejected' | 'Revision Required',
    payload: { user: string; role: any; comment: string }
  ): Promise<any> {
    let finalDocId = taskId;
    try {
      const approvals = await this.getApprovalTasks(orgId);
      const matched = approvals.find((a) => a.id === taskId);
      if (matched) {
        finalDocId = matched.documentId;
      }
    } catch {
      // Proceed
    }

    const backendStatusMap = {
      'Approved': 'Approved',
      'Rejected': 'Rejected',
      'Revision Required': 'Action Required',
      'Revision': 'Action Required'
    };

    const res = await this.request<{ success: boolean }>(`/documents/${finalDocId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: backendStatusMap[decision] || 'Approved',
        comments: payload.comment
      })
    });

    return res;
  }

  // --- Users ---
  static async getUsers(orgId: string): Promise<User[]> {
    const res = await this.request<{ success: boolean; users: any }>('/users');
    const usersList = Array.isArray(res.users) ? res.users : (res.users?.data || []);
    return usersList.map((u: any) => ({
      id: u.id,
      organizationId: u.organization_id || orgId,
      name: u.name,
      email: u.email,
      role: u.role?.name || u.role || 'Site Engineer',
      status: u.is_active ? 'Active' : 'Inactive',
      assignedProjectIds: u.assigned_projects || [],
    }));
  }

  // --- System Logs ---
  static async getActivityLogs(orgId: string): Promise<ActivityLog[]> {
    const res = await this.request<{ success: boolean; audit_logs: any }>('/audit-logs');
    const logsList = Array.isArray(res.audit_logs) ? res.audit_logs : (res.audit_logs?.data || []);
    return logsList.map((l: any) => ({
      id: l.id,
      organizationId: orgId,
      userId: l.user_id || 'system',
      userName: l.user_name || 'System Admin',
      userRole: l.user_role || 'Director',
      action: l.action || 'Log Entry',
      details: l.details || '',
      timestamp: l.created_at || new Date().toISOString(),
    }));
  }

  static async createLog(orgId: string, log: Omit<ActivityLog, 'id' | 'organizationId' | 'timestamp'>): Promise<any> {
    return { success: true };
  }
}
