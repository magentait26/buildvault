/**
 * BuildVault Types
 */

export type Role = 'Super Admin' | 'Director' | 'Project Manager' | 'Site Engineer' | 'Legal Team' | 'Compliance Officer' | 'Finance Team' | 'Auditor';

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';

export type DocumentCategory =
  | 'Land Records'
  | 'Legal'
  | 'RERA'
  | 'Approvals'
  | 'Construction'
  | 'Environmental'
  | 'Finance'
  | 'Contracts'
  | 'Sales'
  | 'Customer Handover'
  | 'Litigation';

export type DocumentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Revision Required';

export type ComplianceType =
  | 'RERA Registration'
  | 'Fire NOC'
  | 'Occupancy Certificate'
  | 'Environmental Clearance'
  | 'Labor License'
  | 'Building Approval'
  | 'Airport NOC';

export type ComplianceStatus = 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'Expired';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Revision Required';

export interface Organization {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  location: string;
  projectType: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  assignedTeam: { userId: string; role: Role }[];
}

export interface Document {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  category: DocumentCategory;
  tags: string[];
  uploadDate: string;
  uploadedBy: string;
  uploadedRole: Role;
  latestVersion: number;
  status: DocumentStatus;
  description?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  comment?: string;
}

export interface ComplianceRecord {
  id: string;
  organizationId: string;
  projectId: string;
  complianceType: ComplianceType;
  status: ComplianceStatus;
  submissionDate?: string;
  expiryDate?: string;
  documentId?: string; // Reference to the document backing this compliance
  scoreImpact: number; // Percentage point weight of this compliance
}

export interface ApprovalHistoryEntry {
  id: string;
  action: 'Created' | 'Approved' | 'Rejected' | 'Requested Changes' | 'Re-submitted';
  user: string;
  role: Role;
  comment?: string;
  timestamp: string;
}

export interface ApprovalTask {
  id: string;
  organizationId: string;
  projectId: string;
  documentId: string;
  documentName: string;
  category: DocumentCategory;
  requestedBy: string;
  requestedRole: Role;
  requestedDate: string;
  status: ApprovalStatus;
  comments: string;
  history: ApprovalHistoryEntry[];
}

export interface ActivityLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string; // 'Login' | 'Logout' | 'Upload' | 'Download' | 'Approval' | 'Rejection' | 'User Creation' | 'Project Creation' | ...
  details: string;
  timestamp: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Inactive' | 'Invited';
  assignedProjectIds: string[]; // Projects they can access
}

export interface Notification {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  type: 'Upload' | 'ApprovalRequested' | 'ApprovalApproved' | 'ApprovalRejected' | 'ExpiryWarning' | 'ExpiryAlert';
  isRead: boolean;
  timestamp: string;
}
