import {
  Organization,
  Project,
  Document,
  DocumentVersion,
  ComplianceRecord,
  ApprovalTask,
  ActivityLog,
  User,
  Notification
} from './types';

export const ORGANIZATIONS: Organization[] = [
  { id: 'org-1', name: 'ABC Builders' },
  { id: 'org-2', name: 'Skyline Developers' },
  { id: 'org-3', name: 'GreenField' }
];

export const INITIAL_USERS: User[] = [
  // ABC Builders Users (Full Enterprise Multitenant Sandbox set)
  { id: 'u-riyaz', organizationId: 'org-1', name: 'Riyaz Ahammed Adhoni', email: 'riyaz26@gmail.com', role: 'Super Admin', status: 'Active', assignedProjectIds: ['p-101', 'p-102'] },
  { id: 'u-100', organizationId: 'org-1', name: 'Vikram Sen', email: 'vikram@buildvault.io', role: 'Super Admin', status: 'Active', assignedProjectIds: ['p-101', 'p-102'] },
  { id: 'u-101', organizationId: 'org-1', name: 'Arjun Rao', email: 'arjun@abcbuilders.com', role: 'Director', status: 'Active', assignedProjectIds: ['p-101', 'p-102'] },
  { id: 'u-101b', organizationId: 'org-1', name: 'Rajesh Kumar', email: 'rajesh@abcbuilders.com', role: 'Super Admin', status: 'Active', assignedProjectIds: ['p-101', 'p-102'] },
  { id: 'u-102', organizationId: 'org-1', name: 'Priya Menon', email: 'priya@abcbuilders.com', role: 'Project Manager', status: 'Active', assignedProjectIds: ['p-101'] },
  { id: 'u-103', organizationId: 'org-1', name: 'Sundeep Roy', email: 'sundeep@abcbuilders.com', role: 'Site Engineer', status: 'Active', assignedProjectIds: ['p-101', 'p-102'] },
  { id: 'u-104', organizationId: 'org-1', name: 'Meera Joshi', email: 'meera@abcbuilders.com', role: 'Compliance Officer', status: 'Active', assignedProjectIds: ['p-101', 'p-102'] },
  { id: 'u-105', organizationId: 'org-1', name: 'Karan Bhatia', email: 'karan@abcbuilders.com', role: 'Legal Team', status: 'Active', assignedProjectIds: ['p-101', 'p-102'] },
  { id: 'u-106', organizationId: 'org-1', name: 'Divya Nair', email: 'divya@abcbuilders.com', role: 'Finance Team', status: 'Active', assignedProjectIds: ['p-101'] },
  { id: 'u-107', organizationId: 'org-1', name: 'Sanjay Kapoor', email: 'sanjay@auditors.org', role: 'Auditor', status: 'Active', assignedProjectIds: ['p-101', 'p-102'] },
  
  // Skyline Developers Users
  { id: 'u-201', organizationId: 'org-2', name: 'Samantha Reed', email: 'samantha@skylinedev.com', role: 'Super Admin', status: 'Active', assignedProjectIds: ['p-201'] },
  { id: 'u-202', organizationId: 'org-2', name: 'Gordon Skyline', email: 'gordon@skylinedev.com', role: 'Director', status: 'Active', assignedProjectIds: ['p-201', 'p-202'] },
  { id: 'u-203', organizationId: 'org-2', name: 'James Patel', email: 'james@skylinedev.com', role: 'Project Manager', status: 'Active', assignedProjectIds: ['p-201'] },
  { id: 'u-204', organizationId: 'org-2', name: 'Tariq Hussain', email: 'tariq@skylinedev.com', role: 'Site Engineer', status: 'Active', assignedProjectIds: ['p-201'] },
  
  // GreenField Users
  { id: 'u-301', organizationId: 'org-3', name: 'Elena Rostova', email: 'elena@greenfield.com', role: 'Super Admin', status: 'Active', assignedProjectIds: ['p-301'] },
  { id: 'u-302', organizationId: 'org-3', name: 'Thomas Vance', email: 'thomas@greenfield.com', role: 'Director', status: 'Active', assignedProjectIds: ['p-301'] }
];

export const INITIAL_PROJECTS: Project[] = [
  // ABC Builders Projects
  {
    id: 'p-101',
    organizationId: 'org-1',
    name: 'ABC Sterling Towers',
    code: 'ST-101',
    location: 'Metropolitan Square, Tower Block A',
    projectType: 'Commercial Complex & Retail Suite',
    description: 'High-density commercial real estate development block featuring state of the art eco-ventilation and multi-level parking integration.',
    status: 'Active',
    startDate: '2025-01-15',
    endDate: '2027-12-31',
    assignedTeam: [
      { userId: 'u-102', role: 'Director' },
      { userId: 'u-103', role: 'Project Manager' },
      { userId: 'u-104', role: 'Site Engineer' },
      { userId: 'u-106', role: 'Compliance Officer' }
    ]
  },
  {
    id: 'p-102',
    organizationId: 'org-1',
    name: 'ABC Oasis Residency',
    code: 'OR-102',
    location: 'Sector 42, Lakeside Boulevard',
    projectType: 'Premium Multi-Family Residential',
    description: 'A 240-unit luxury condominium project bordering Sector 42 lake with LEED Platinum green building clearance pipelines.',
    status: 'Planning',
    startDate: '2026-08-01',
    endDate: '2029-06-30',
    assignedTeam: [
      { userId: 'u-102', role: 'Director' },
      { userId: 'u-104', role: 'Site Engineer' },
      { userId: 'u-105', role: 'Legal Team' }
    ]
  },

  // Skyline Developers Projects
  {
    id: 'p-201',
    organizationId: 'org-2',
    name: 'Skyline Heights Sovereign',
    code: 'PHS-201',
    location: 'Summit Boulevard, Hillcrest',
    projectType: 'High-rise Residential',
    description: 'Ultra-exclusive residential tower featuring private elevator corridors and panoramic skyline access.',
    status: 'Active',
    startDate: '2024-06-10',
    endDate: '2027-02-15',
    assignedTeam: [
      { userId: 'u-202', role: 'Director' },
      { userId: 'u-203', role: 'Project Manager' },
      { userId: 'u-204', role: 'Site Engineer' }
    ]
  },
  {
    id: 'p-202',
    organizationId: 'org-2',
    name: 'Skyline Tech Horizon Park',
    code: 'PTH-202',
    location: 'Silicon Highway West, Zone B',
    projectType: 'Industrial / SEZ Tech Park',
    description: 'Tech SEZ campus spread across 45 acres designed for multinational enterprise workspaces and lab campuses.',
    status: 'On Hold',
    startDate: '2023-11-01',
    endDate: '2026-11-30',
    assignedTeam: [
      { userId: 'u-202', role: 'Director' }
    ]
  },

  // GreenField Projects
  {
    id: 'p-301',
    organizationId: 'org-3',
    name: 'GreenField Meadows Phase 1',
    code: 'GVM-301',
    location: 'Eco-Corridor Lane, Greenfield Valley',
    projectType: 'Low-density Sustainable Villas',
    description: 'A community of 80 self-sustaining solar-powered smart farmhouses built with organic certified rammed earth architecture.',
    status: 'Active',
    startDate: '2024-10-01',
    endDate: '2026-12-15',
    assignedTeam: [
      { userId: 'u-302', role: 'Director' }
    ]
  }
];

export const INITIAL_DOCUMENTS: Document[] = [
  // ABC Sterling Towers (p-101) Documents
  {
    id: 'doc-101',
    organizationId: 'org-1',
    projectId: 'p-101',
    name: 'RERA-Registration-ST101-App',
    category: 'RERA',
    tags: ['RERA', 'Registration', 'Official'],
    uploadDate: '2025-02-20',
    uploadedBy: 'Maya Lin',
    uploadedRole: 'Project Manager',
    latestVersion: 2,
    status: 'Active'
  },
  {
    id: 'doc-102',
    organizationId: 'org-1',
    projectId: 'p-101',
    name: 'Fire-Safety-NOC-Certificate',
    category: 'Approvals',
    tags: ['Fire', 'NOC', 'Safety'],
    uploadDate: '2026-06-01',
    uploadedBy: 'Marcus Brody',
    uploadedRole: 'Site Engineer',
    latestVersion: 3,
    status: 'Active'
  },
  {
    id: 'doc-103',
    organizationId: 'org-1',
    projectId: 'p-101',
    name: 'Environmental-Impact-Clearance-ST',
    category: 'Environmental',
    tags: ['EIA', 'Green', 'Clearance'],
    uploadDate: '2025-01-28',
    uploadedBy: 'Maya Lin',
    uploadedRole: 'Project Manager',
    latestVersion: 1,
    status: 'Active'
  },
  {
    id: 'doc-104',
    organizationId: 'org-1',
    projectId: 'p-101',
    name: 'Structural-Stability-Audit-Report-V1',
    category: 'Construction',
    tags: ['Audit', 'Structural', 'Engineering'],
    uploadDate: '2026-06-12',
    uploadedBy: 'Marcus Brody',
    uploadedRole: 'Site Engineer',
    latestVersion: 1,
    status: 'Draft'
  },
  {
    id: 'doc-105',
    organizationId: 'org-1',
    projectId: 'p-101',
    name: 'Airport-Height-NOC-Civil-Aviation',
    category: 'Approvals',
    tags: ['NOC', 'Airport', 'Aviation'],
    uploadDate: '2026-06-14',
    uploadedBy: 'Marcus Brody',
    uploadedRole: 'Site Engineer',
    latestVersion: 2,
    status: 'Draft'
  },

  // ABC Oasis Residency (p-102) Documents
  {
    id: 'doc-106',
    organizationId: 'org-1',
    projectId: 'p-102',
    name: 'Oasis-Master-Plan-Architectural-Layout',
    category: 'Land Records',
    tags: ['Blueprint', 'Layout', 'Masterplan'],
    uploadDate: '2026-05-18',
    uploadedBy: 'Devon Carter',
    uploadedRole: 'Director',
    latestVersion: 1,
    status: 'Active'
  },
  {
    id: 'doc-107',
    organizationId: 'org-1',
    projectId: 'p-102',
    name: 'Lakeside-Land-Title-Deed-Notarized',
    category: 'Legal',
    tags: ['Deed', 'Title', 'Legal'],
    uploadDate: '2026-05-20',
    uploadedBy: 'Fiona Vance',
    uploadedRole: 'Legal Team',
    latestVersion: 1,
    status: 'Active'
  },

  // Skyline Heights (p-201) Documents
  {
    id: 'doc-201',
    organizationId: 'org-2',
    projectId: 'p-201',
    name: 'RERA-Filing-Skylineheights',
    category: 'RERA',
    tags: ['RERA', 'Filing'],
    uploadDate: '2024-07-02',
    uploadedBy: 'James Patel',
    uploadedRole: 'Project Manager',
    latestVersion: 1,
    status: 'Active'
  },
  {
    id: 'doc-202',
    organizationId: 'org-2',
    projectId: 'p-201',
    name: 'Fire-Safety-Clearance-Heights',
    category: 'Approvals',
    tags: ['NOC', 'Fire-Safety'],
    uploadDate: '2026-06-13',
    uploadedBy: 'Tariq Hussain',
    uploadedRole: 'Site Engineer',
    latestVersion: 2,
    status: 'Draft'
  }
];

export const INITIAL_VERSIONS: DocumentVersion[] = [
  // RERA Doc v1 & v2 (doc-101)
  {
    id: 'v-101-1',
    documentId: 'doc-101',
    versionNumber: 1,
    fileName: 'RERA-Registration-ST101-App_v1.pdf',
    fileSize: '4.8 MB',
    uploadDate: '2025-02-15',
    uploadedBy: 'Maya Lin',
    comment: 'Initial RERA application draft for internal legal review'
  },
  {
    id: 'v-101-2',
    documentId: 'doc-101',
    versionNumber: 2,
    fileName: 'RERA-Registration-ST101-App_v2_Signed.pdf',
    fileSize: '5.1 MB',
    uploadDate: '2025-02-20',
    uploadedBy: 'Maya Lin',
    comment: 'Final RERA certificate with registrar signature stamp'
  },

  // Fire safety NOC (doc-102)
  {
    id: 'v-102-1',
    documentId: 'doc-102',
    versionNumber: 1,
    fileName: 'Fire_NOC_Plan_V1.pdf',
    fileSize: '2.4 MB',
    uploadDate: '2026-04-10',
    uploadedBy: 'Marcus Brody',
    comment: 'Draft schematics sent for fire inspector guidelines'
  },
  {
    id: 'v-102-2',
    documentId: 'doc-102',
    versionNumber: 2,
    fileName: 'Fire_NOC_Plan_V2_Corrected.pdf',
    fileSize: '2.5 MB',
    uploadDate: '2026-05-15',
    uploadedBy: 'Marcus Brody',
    comment: 'Incorporated fire exit distance corrections'
  },
  {
    id: 'v-102-3',
    documentId: 'doc-102',
    versionNumber: 3,
    fileName: 'Fire-Safety-NOC-Certificate-Stamped.pdf',
    fileSize: '1.8 MB',
    uploadDate: '2026-06-01',
    uploadedBy: 'Marcus Brody',
    comment: 'Final approved Fire NOC with certificate number #FNC-2026-092'
  },

  // Environmental Impact Clearance (doc-103)
  {
    id: 'v-103-1',
    documentId: 'doc-103',
    versionNumber: 1,
    fileName: 'Environmental-Impact-Clearance-ST_EIA.pdf',
    fileSize: '12.4 MB',
    uploadDate: '2025-01-28',
    uploadedBy: 'Maya Lin',
    comment: 'Pre-construction State EIA approval letter'
  },

  // Structural Stability (doc-104)
  {
    id: 'v-104-1',
    documentId: 'doc-104',
    versionNumber: 1,
    fileName: 'Structural-Stability-Audit-Report-V1_SiteRun.pdf',
    fileSize: '8.1 MB',
    uploadDate: '2026-06-12',
    uploadedBy: 'Marcus Brody',
    comment: 'Site core drilling load-test structural stability verification'
  },

  // Airport Height NOC (doc-105)
  {
    id: 'v-105-1',
    documentId: 'doc-105',
    versionNumber: 1,
    fileName: 'Airport_Height_Limits_Form.pdf',
    fileSize: '1.2 MB',
    uploadDate: '2026-06-10',
    uploadedBy: 'Marcus Brody',
    comment: 'Initial height constraint submission to DGAC'
  },
  {
    id: 'v-105-2',
    documentId: 'doc-105',
    versionNumber: 2,
    fileName: 'Airport-Height-NOC-Civil-Aviation_Submitted.pdf',
    fileSize: '1.5 MB',
    uploadDate: '2026-06-14',
    uploadedBy: 'Marcus Brody',
    comment: 'Revised submission requesting 120m clearance, currently rejected by authority'
  },

  // Oasis Master Plan (doc-106)
  {
    id: 'v-106-1',
    documentId: 'doc-106',
    versionNumber: 1,
    fileName: 'Oasis-Master-Plan-Architectural-Layout_Draft.pdf',
    fileSize: '15.2 MB',
    uploadDate: '2026-05-18',
    uploadedBy: 'Devon Carter',
    comment: 'Project layout with green park and sewage lines highlighted'
  },

  // Lakeside land title (doc-107)
  {
    id: 'v-107-1',
    documentId: 'doc-107',
    versionNumber: 1,
    fileName: 'Lakeside-Land-Title-Deed-Notarized_Copy.pdf',
    fileSize: '3.7 MB',
    uploadDate: '2026-05-20',
    uploadedBy: 'Fiona Vance',
    comment: 'Registered deed verifying clear title from public record'
  },

  // Skyline Heights docs (doc-201, doc-202)
  {
    id: 'v-201-1',
    documentId: 'doc-201',
    versionNumber: 1,
    fileName: 'RERA_Heights_Registration_Certificate.pdf',
    fileSize: '4.1 MB',
    uploadDate: '2024-07-02',
    uploadedBy: 'James Patel',
    comment: 'Active RERA code issued'
  },
  {
    id: 'v-202-1',
    documentId: 'doc-202',
    versionNumber: 1,
    fileName: 'Fire_NOC_Draft_Heights.pdf',
    fileSize: '2.1 MB',
    uploadDate: '2026-06-10',
    uploadedBy: 'Tariq Hussain',
    comment: 'First filing copy'
  },
  {
    id: 'v-202-2',
    documentId: 'doc-202',
    versionNumber: 2,
    fileName: 'Fire-Safety-Clearance-Heights_Final.pdf',
    fileSize: '2.4 MB',
    uploadDate: '2026-06-13',
    uploadedBy: 'Tariq Hussain',
    comment: 'Awaiting director validation signature'
  }
];

export const INITIAL_COMPLIANCE: ComplianceRecord[] = [
  // Compliance for ABC Sterling Towers (p-101)
  {
    id: 'comp-101',
    organizationId: 'org-1',
    projectId: 'p-101',
    complianceType: 'RERA Registration',
    status: 'Approved',
    submissionDate: '2025-02-20',
    expiryDate: '2030-02-20',
    documentId: 'doc-101',
    scoreImpact: 20
  },
  {
    id: 'comp-102',
    organizationId: 'org-1',
    projectId: 'p-101',
    complianceType: 'Fire NOC',
    status: 'Approved',
    submissionDate: '2026-06-01',
    expiryDate: '2027-06-01', // Expiring in one year
    documentId: 'doc-102',
    scoreImpact: 15
  },
  {
    id: 'comp-103',
    organizationId: 'org-1',
    projectId: 'p-101',
    complianceType: 'Environmental Clearance',
    status: 'Approved',
    submissionDate: '2025-01-28',
    expiryDate: '2031-01-28',
    documentId: 'doc-103',
    scoreImpact: 15
  },
  {
    id: 'comp-104',
    organizationId: 'org-1',
    projectId: 'p-101',
    complianceType: 'Building Approval',
    status: 'Approved',
    submissionDate: '2025-01-10',
    expiryDate: '2028-01-10',
    scoreImpact: 15
  },
  {
    id: 'comp-105',
    organizationId: 'org-1',
    projectId: 'p-101',
    complianceType: 'Labor License',
    status: 'Expired', // Critical expired alert
    submissionDate: '2025-05-15',
    expiryDate: '2026-05-15', // Already expired past month
    scoreImpact: 15
  },
  {
    id: 'comp-106',
    organizationId: 'org-1',
    projectId: 'p-101',
    complianceType: 'Airport NOC',
    status: 'Rejected', // Rejected status triggers revision workflow
    submissionDate: '2026-06-14',
    documentId: 'doc-105',
    scoreImpact: 10
  },
  {
    id: 'comp-107',
    organizationId: 'org-1',
    projectId: 'p-101',
    complianceType: 'Occupancy Certificate',
    status: 'Pending', // Building still in construction phase
    scoreImpact: 10
  },

  // Compliance for ABC Oasis Residency (p-102) - All pending or planning stage
  {
    id: 'comp-108',
    organizationId: 'org-1',
    projectId: 'p-102',
    complianceType: 'Building Approval',
    status: 'Approved',
    submissionDate: '2026-05-18',
    expiryDate: '2029-05-18',
    documentId: 'doc-106',
    scoreImpact: 20
  },
  {
    id: 'comp-109',
    organizationId: 'org-1',
    projectId: 'p-102',
    complianceType: 'RERA Registration',
    status: 'Pending',
    scoreImpact: 20
  },
  {
    id: 'comp-110',
    organizationId: 'org-1',
    projectId: 'p-102',
    complianceType: 'Fire NOC',
    status: 'Pending',
    scoreImpact: 15
  },

  // Compliance for Skyline Heights (p-201)
  {
    id: 'comp-201',
    organizationId: 'org-2',
    projectId: 'p-201',
    complianceType: 'RERA Registration',
    status: 'Approved',
    submissionDate: '2024-07-02',
    expiryDate: '2029-07-02',
    documentId: 'doc-201',
    scoreImpact: 25
  },
  {
    id: 'comp-202',
    organizationId: 'org-2',
    projectId: 'p-201',
    complianceType: 'Fire NOC',
    status: 'Submitted', // Awaiting approval task
    submissionDate: '2026-06-13',
    documentId: 'doc-202',
    scoreImpact: 25
  },
  {
    id: 'comp-203',
    organizationId: 'org-2',
    projectId: 'p-201',
    complianceType: 'Building Approval',
    status: 'Approved',
    submissionDate: '2024-05-01',
    expiryDate: '2027-05-01',
    scoreImpact: 25
  },
  {
    id: 'comp-204',
    organizationId: 'org-2',
    projectId: 'p-201',
    complianceType: 'Occupancy Certificate',
    status: 'Pending',
    scoreImpact: 25
  }
];

export const INITIAL_APPROVALS: ApprovalTask[] = [
  {
    id: 'appr-101',
    organizationId: 'org-1',
    projectId: 'p-101',
    documentId: 'doc-104',
    documentName: 'Structural-Stability-Audit-Report-V1_SiteRun.pdf',
    category: 'Construction',
    requestedBy: 'Marcus Brody',
    requestedRole: 'Site Engineer',
    requestedDate: '2026-06-12',
    status: 'Pending',
    comments: 'Requesting validation of structural loads from ground core tests.',
    history: [
      {
        id: 'h-101-1',
        action: 'Created',
        user: 'Marcus Brody',
        role: 'Site Engineer',
        comment: 'Uploading stable audit logs from floor site core tests.',
        timestamp: '2026-06-12 11:30'
      }
    ]
  },
  {
    id: 'appr-102',
    organizationId: 'org-1',
    projectId: 'p-101',
    documentId: 'doc-105',
    documentName: 'Airport-Height-NOC-Civil-Aviation_Submitted.pdf',
    category: 'Approvals',
    requestedBy: 'Marcus Brody',
    requestedRole: 'Site Engineer',
    requestedDate: '2026-06-10',
    status: 'Revision Required',
    comments: 'The elevation angle metrics require corrections. Let us modify the core projection angles and resubmit.',
    history: [
      {
        id: 'h-102-1',
        action: 'Created',
        user: 'Marcus Brody',
        role: 'Site Engineer',
        comment: 'First draft submitted on standard DGAC forms.',
        timestamp: '2026-06-10 09:12'
      },
      {
        id: 'h-102-2',
        action: 'Requested Changes',
        user: 'Caleb Evans',
        role: 'Compliance Officer',
        comment: 'The coordinate set is off by 2 seconds latitude. Please fix core survey metrics and submit v2.',
        timestamp: '2026-06-11 15:45'
      },
      {
        id: 'h-102-3',
        action: 'Re-submitted',
        user: 'Marcus Brody',
        role: 'Site Engineer',
        comment: 'Amended coordinate surveys attached in v2.',
        timestamp: '2026-06-14 17:15'
      }
    ]
  },
  {
    id: 'appr-201',
    organizationId: 'org-2',
    projectId: 'p-201',
    documentId: 'doc-202',
    documentName: 'Fire-Safety-Clearance-Heights_Final.pdf',
    category: 'Approvals',
    requestedBy: 'Tariq Hussain',
    requestedRole: 'Site Engineer',
    requestedDate: '2026-06-13',
    status: 'Pending',
    comments: 'Certified Fire Safety blueprint for Skyline Heights tower requires Director approval to upload.',
    history: [
      {
        id: 'h-201-1',
        action: 'Created',
        user: 'Tariq Hussain',
        role: 'Site Engineer',
        comment: 'Created with Fire Marshall validated signature.',
        timestamp: '2026-06-13 16:10'
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    organizationId: 'org-1',
    title: 'New Document Uploaded',
    message: 'Marcus Brody uploaded Structural-Stability-Audit-Report-V1 to ABC Sterling Towers.',
    type: 'Upload',
    isRead: false,
    timestamp: '2026-06-12 11:30'
  },
  {
    id: 'n-2',
    organizationId: 'org-1',
    title: 'Approval Requested',
    message: 'Structural-Stability-Audit-Report-V1 requires your review.',
    type: 'ApprovalRequested',
    isRead: false,
    timestamp: '2026-06-12 11:32'
  },
  {
    id: 'n-3',
    organizationId: 'org-1',
    title: 'Compliance Expired Alert',
    message: 'Labor License compliance has EXPIRED (Expired May 15, 2026) for ABC Sterling Towers.',
    type: 'ExpiryAlert',
    isRead: false,
    timestamp: '2026-06-14 00:01'
  },
  {
    id: 'n-4',
    organizationId: 'org-1',
    title: 'Revision Issued',
    message: 'Airport-Height-NOC-Civil-Aviation requires revisions.',
    type: 'ApprovalRejected',
    isRead: true,
    timestamp: '2026-06-11 15:45'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'al-1', organizationId: 'org-1', userId: 'u-101', userName: 'Alexander Sterling', userRole: 'Super Admin', action: 'Login', details: 'Authenticated via Supabase Auth successfully.', timestamp: '2026-06-14 09:00:22' },
  { id: 'al-2', organizationId: 'org-1', userId: 'u-102', userName: 'Devon Carter', userRole: 'Director', action: 'Approval', details: 'Approved project outline and assigned Maya Lin to project ABC Sterling Towers.', timestamp: '2026-06-14 09:41:05' },
  { id: 'al-3', organizationId: 'org-1', userId: 'u-104', userName: 'Marcus Brody', userRole: 'Site Engineer', action: 'Upload', details: 'Uploaded Fire-Safety-NOC-Certificate (v3) to RERA folder.', timestamp: '2026-06-14 10:15:30' },
  { id: 'al-4', organizationId: 'org-1', userId: 'u-101', userName: 'Alexander Sterling', userRole: 'Super Admin', action: 'User Creation', details: 'Created user Caleb Evans and granted Compliance Officer access rights.', timestamp: '2026-06-14 11:02:11' },
  { id: 'al-5', organizationId: 'org-1', userId: 'u-104', userName: 'Marcus Brody', userRole: 'Site Engineer', action: 'Upload', details: 'Uploaded v2 of Airport-Height-NOC-Civil-Aviation.', timestamp: '2026-06-14 17:15:00' },
  { id: 'al-6', organizationId: 'org-2', userId: 'u-201', userName: 'Samantha Reed', userRole: 'Super Admin', action: 'Project Creation', details: 'Configured new project entry: Skyline Heights Sovereign.', timestamp: '2026-06-14 17:40:22' }
];
