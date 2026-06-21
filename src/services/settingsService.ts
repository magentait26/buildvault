/**
 * Centralized Settings Service for BuildVault
 * Matches the Laravel API structure & handles multi-tenant isolated state
 */

export interface OrganizationSettings {
  companyName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  gstRegistration: string;
  defaultTimezone: string;
  defaultCurrency: string;
  defaultLanguage: string;
}

export interface ProjectSettings {
  projectCategories: string[];
  documentCategories: string[];
  approvalStages: string[];
  complianceChecklists: { id: string; name: string; types: string[] }[];
  defaultProjectStatuses: string[];
}

export interface RolePermission {
  roleName: string;
  modulesEnabled: string[]; // ['dashboard', 'projects', 'documents', 'approvals', 'compliance', 'integrations', 'settings']
  canApprove: boolean;
  documentPermissions: {
    upload: boolean;
    view: boolean;
    delete: boolean;
  };
}

export interface IntegrationConfig {
  enabled: boolean;
  apiKey: string;
  secret: string;
  webhookUrl: string;
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  lastSync: string;
  errorLog: string;
  additionalParams: Record<string, any>;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  whatsappAlerts: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  approvalReminders: boolean;
  complianceExpiryReminders: boolean;
  documentUploadAlerts: boolean;
}

export interface ComplianceSettings {
  complianceTypes: string[];
  expiryReminderDays: number;
  mandatoryDocuments: string[];
  approvalAuthorities: string[];
  escalationRules: string;
}

export interface StorageSettings {
  storageProvider: 'AWS S3' | 'MinIO' | 'Azure Blob' | 'Google Cloud';
  bucketName: string;
  region: string;
  folderStructure: string;
  fileSizeLimit: number; // in MB
  allowedFileTypes: string[]; // e.g. ['.pdf', '.dwf', '.dwg', '.png', '.xlsx']
  retentionPeriodYears: number;
}

export interface AuditSecuritySettings {
  sessionTimeoutMinutes: number;
  passwordPolicy: string; // 'Standard' | 'Strong' | 'Strict'
  twoFactorRequirement: boolean;
  ipRestriction: string; // Range or comma-separated IPs
  loginAudit: boolean;
  downloadAudit: boolean;
  documentAccessAudit: boolean;
}

export interface TenantSubscription {
  planName: 'Starter' | 'Growth' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'Trialing';
  enabledModules: string[]; // actual toggled modules
}

export interface SubscriptionPlanDef {
  name: 'Starter' | 'Growth' | 'Enterprise';
  monthlyPrice: number;
  maxProjects: number;
  maxStorageMB: number;
  allowedModules: string[];
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDef[] = [
  {
    name: 'Starter',
    monthlyPrice: 49,
    maxProjects: 2,
    maxStorageMB: 500,
    allowedModules: ['dashboard', 'projects', 'documents', 'settings'],
    description: 'Perfect for small, local property builders starting digitization.'
  },
  {
    name: 'Growth',
    monthlyPrice: 199,
    maxProjects: 10,
    maxStorageMB: 5000,
    allowedModules: ['dashboard', 'projects', 'documents', 'compliance', 'settings', 'alerts'],
    description: 'Suited for regional active developers managing multiple compliance boards.'
  },
  {
    name: 'Enterprise',
    monthlyPrice: 499,
    maxProjects: 100,
    maxStorageMB: 50000,
    allowedModules: ['dashboard', 'projects', 'documents', 'compliance', 'approvals', 'integrations', 'settings', 'alerts', 'users'],
    description: 'Full-suite automation, third-party integrations, and sequence-based approvals.'
  }
];

export interface TenantSettings {
  organizationId: string;
  organization: OrganizationSettings;
  projects: ProjectSettings;
  rolePermissions: RolePermission[];
  integrations: {
    awsS3: IntegrationConfig;
    emailSmtp: IntegrationConfig;
    whatsappApi: IntegrationConfig;
    smsGateway: IntegrationConfig;
    docuSign: IntegrationConfig;
    acc: IntegrationConfig;
    procore: IntegrationConfig;
    slackTeams: IntegrationConfig;
    ocrProvider: IntegrationConfig;
    paymentGateway: IntegrationConfig;
  };
  notifications: NotificationSettings;
  compliance: ComplianceSettings;
  storage: StorageSettings;
  security: AuditSecuritySettings;
  subscription: TenantSubscription;
}

const DEFAULT_SETTINGS = (orgId: string, orgName: string): TenantSettings => ({
  organizationId: orgId,
  organization: {
    companyName: orgName || 'BuildVault Tenant',
    logoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=150&auto=format&fit=crop',
    address: 'Sector V, Salt Lake, Kolkata, India',
    phone: '+91 98765 43210',
    email: `ops@${(orgName || 'tenant').toLowerCase().replace(/\s+/g, '')}.com`,
    gstRegistration: '19AAACB1234E1Z4',
    defaultTimezone: 'Asia/Kolkata',
    defaultCurrency: 'INR',
    defaultLanguage: 'English',
  },
  projects: {
    projectCategories: ['Commercial', 'Residential', 'Infrastructure', 'Industrial'],
    documentCategories: [
      'Land Records',
      'Legal',
      'RERA',
      'Approvals',
      'Construction',
      'Environmental',
      'Finance',
      'Contracts',
      'Sales',
      'Customer Handover',
      'Litigation'
    ],
    approvalStages: ['Draft Approval', 'SRE Review', 'Legal Consent', 'Director Release', 'Third Party Audit'],
    complianceChecklists: [
      { id: 'rera-pack', name: 'Standard RERA Checklist', types: ['RERA Registration', 'Building Approval'] },
      { id: 'site-ready', name: 'Pre-construction Permits', types: ['Environmental Clearance', 'Fire NOC', 'Labor License'] }
    ],
    defaultProjectStatuses: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
  },
  rolePermissions: [
    {
      roleName: 'Super Admin',
      modulesEnabled: ['dashboard', 'projects', 'documents', 'approvals', 'compliance', 'integrations', 'settings'],
      canApprove: true,
      documentPermissions: { upload: true, view: true, delete: true }
    },
    {
      roleName: 'Director',
      modulesEnabled: ['dashboard', 'projects', 'documents', 'approvals', 'compliance', 'settings'],
      canApprove: true,
      documentPermissions: { upload: true, view: true, delete: false }
    },
    {
      roleName: 'Project Manager',
      modulesEnabled: ['dashboard', 'projects', 'documents', 'approvals', 'compliance'],
      canApprove: true,
      documentPermissions: { upload: true, view: true, delete: false }
    },
    {
      roleName: 'Site Engineer',
      modulesEnabled: ['dashboard', 'projects', 'documents', 'compliance'],
      canApprove: false,
      documentPermissions: { upload: true, view: true, delete: false }
    },
    {
      roleName: 'Compliance Officer',
      modulesEnabled: ['dashboard', 'projects', 'documents', 'compliance'],
      canApprove: true,
      documentPermissions: { upload: true, view: true, delete: false }
    },
    {
      roleName: 'Legal Team',
      modulesEnabled: ['dashboard', 'projects', 'documents', 'compliance'],
      canApprove: true,
      documentPermissions: { upload: true, view: true, delete: false }
    },
    {
      roleName: 'Finance Team',
      modulesEnabled: ['dashboard', 'projects', 'documents'],
      canApprove: false,
      documentPermissions: { upload: true, view: true, delete: false }
    },
    {
      roleName: 'Auditor',
      modulesEnabled: ['dashboard', 'projects', 'documents', 'compliance'],
      canApprove: false,
      documentPermissions: { upload: false, view: true, delete: false }
    }
  ],
  integrations: {
    awsS3: {
      enabled: true,
      apiKey: 'AKIAIOSFODNN7EXAMPLE',
      secret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      webhookUrl: 'https://api.buildvault.io/v1/webhooks/s3',
      status: 'connected',
      lastSync: '2026-06-15 12:44:02',
      errorLog: 'None',
      additionalParams: { bucket: 'buildvault-production-storage', region: 'ap-south-1' }
    },
    emailSmtp: {
      enabled: true,
      apiKey: 'smtp.sendgrid.net',
      secret: 'SG.examplekey.signature_hash_verification',
      webhookUrl: 'https://api.buildvault.io/v1/webhooks/smtp',
      status: 'connected',
      lastSync: '2026-06-15 10:20:11',
      errorLog: 'None',
      additionalParams: { port: 587, encryption: 'STARTTLS' }
    },
    whatsappApi: {
      enabled: false,
      apiKey: '',
      secret: '',
      webhookUrl: '',
      status: 'disconnected',
      lastSync: 'Never',
      errorLog: 'Webhook handshake failed - unauthorized recipient',
      additionalParams: { phoneId: '', businessId: '' }
    },
    smsGateway: {
      enabled: false,
      apiKey: '',
      secret: '',
      webhookUrl: '',
      status: 'disconnected',
      lastSync: 'Never',
      errorLog: 'None',
      additionalParams: { senderId: 'BLDVLT' }
    },
    docuSign: {
      enabled: false,
      apiKey: '',
      secret: '',
      webhookUrl: '',
      status: 'disconnected',
      lastSync: 'Never',
      errorLog: 'None',
      additionalParams: { accountId: '' }
    },
    acc: {
      enabled: false,
      apiKey: '',
      secret: '',
      webhookUrl: '',
      status: 'disconnected',
      lastSync: 'Never',
      errorLog: 'None',
      additionalParams: {}
    },
    procore: {
      enabled: false,
      apiKey: '',
      secret: '',
      webhookUrl: '',
      status: 'disconnected',
      lastSync: 'Never',
      errorLog: 'None',
      additionalParams: {}
    },
    slackTeams: {
      enabled: false,
      apiKey: '',
      secret: '',
      webhookUrl: '',
      status: 'disconnected',
      lastSync: 'Never',
      errorLog: 'None',
      additionalParams: { channelId: '' }
    },
    ocrProvider: {
      enabled: true,
      apiKey: 'ocr_google_cloud_v2_key',
      secret: 'gcp_service_account_private_pem_secret',
      webhookUrl: 'https://api.buildvault.io/v1/webhooks/ocr',
      status: 'connected',
      lastSync: '2026-06-15 14:12:55',
      errorLog: 'None',
      additionalParams: { confidenceThreshold: 85 }
    },
    paymentGateway: {
      enabled: false,
      apiKey: '',
      secret: '',
      webhookUrl: '',
      status: 'disconnected',
      lastSync: 'Never',
      errorLog: 'None',
      additionalParams: { merchantId: '' }
    }
  },
  notifications: {
    emailAlerts: true,
    whatsappAlerts: false,
    smsAlerts: false,
    pushNotifications: true,
    approvalReminders: true,
    complianceExpiryReminders: true,
    documentUploadAlerts: true,
  },
  compliance: {
    complianceTypes: [
      'RERA Registration',
      'Fire NOC',
      'Occupancy Certificate',
      'Environmental Clearance',
      'Labor License',
      'Building Approval',
      'Airport NOC'
    ],
    expiryReminderDays: 30,
    mandatoryDocuments: ['Land Deed', 'Architect Blueprint', 'Environmental NOC'],
    approvalAuthorities: ['Municipal Board', 'RERA Council', 'Fire Commissioner'],
    escalationRules: 'If RERA compliance approaches within 14 days without OC, notify Director and Compliance Officer with High Priority warning cascade.',
  },
  storage: {
    storageProvider: 'AWS S3',
    bucketName: 'buildvault-production-storage',
    region: 'ap-south-1',
    folderStructure: '/{project_code}/{category}/{year}/',
    fileSizeLimit: 50, // 50MB
    allowedFileTypes: ['.pdf', '.dwg', '.dwf', '.xlsx', '.docx', '.png', '.jpg'],
    retentionPeriodYears: 7,
  },
  security: {
    sessionTimeoutMinutes: 30,
    passwordPolicy: 'Strong',
    twoFactorRequirement: false,
    ipRestriction: '',
    loginAudit: true,
    downloadAudit: true,
    documentAccessAudit: true,
  },
  subscription: {
    planName: orgId === 'org-1' ? 'Enterprise' : orgId === 'org-2' ? 'Growth' : 'Starter',
    status: 'Active',
    enabledModules: orgId === 'org-1' 
      ? ['dashboard', 'projects', 'documents', 'compliance', 'approvals', 'integrations', 'settings', 'alerts', 'users']
      : orgId === 'org-2'
        ? ['dashboard', 'projects', 'documents', 'compliance', 'settings', 'alerts']
        : ['dashboard', 'projects', 'documents', 'settings']
  }
});

export const settingsService = {
  /**
   * Get settings for a specific tenant organization
   */
  getTenantSettings(orgId: string, orgName: string = 'ABC Builders'): TenantSettings {
    const key = `buildvault_settings_tenant_${orgId}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Ensure structure compatibility by deep merging defaults
        const defaults = DEFAULT_SETTINGS(orgId, orgName);
        return {
          ...defaults,
          ...parsed,
          organization: { ...defaults.organization, ...(parsed.organization || {}) },
          projects: { ...defaults.projects, ...(parsed.projects || {}) },
          integrations: { ...defaults.integrations, ...(parsed.integrations || {}) },
          notifications: { ...defaults.notifications, ...(parsed.notifications || {}) },
          compliance: { ...defaults.compliance, ...(parsed.compliance || {}) },
          storage: { ...defaults.storage, ...(parsed.storage || {}) },
          security: { ...defaults.security, ...(parsed.security || {}) },
          subscription: { ...defaults.subscription, ...(parsed.subscription || {}) },
        };
      } catch (e) {
        console.error('Error fetching settings for tenant', orgId, e);
      }
    }
    
    // Save defaults
    const defaults = DEFAULT_SETTINGS(orgId, orgName);
    this.saveTenantSettings(orgId, defaults);
    return defaults;
  },

  /**
   * Save settings for a specific tenant organization
   */
  saveTenantSettings(orgId: string, settings: TenantSettings): void {
    const key = `buildvault_settings_tenant_${orgId}`;
    localStorage.setItem(key, JSON.stringify(settings));
  },

  /**
   * Simulate backend check for integration handshake
   */
  testIntegrationConnection(
    integrationKey: keyof TenantSettings['integrations'],
    config: IntegrationConfig
  ): Promise<{ success: boolean; status: 'connected' | 'error'; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!config.enabled) {
          resolve({
            success: false,
            status: 'error',
            message: 'Integration is disabled. Enable toggle first.'
          });
          return;
        }

        if (!config.apiKey || !config.secret) {
          resolve({
            success: false,
            status: 'error',
            message: 'Missing essential coordinates: API Key / Secret fields must be filled.'
          });
          return;
        }

        // Simulating different connector successes
        const labels: Record<string, string> = {
          awsS3: 'AWS S3 Container Service',
          emailSmtp: 'SMTP Communication Gateway',
          whatsappApi: 'WhatsApp Business API Server',
          smsGateway: 'Celerity SMS Relay Hub',
          docuSign: 'DocuSign OAuth Broker',
          acc: 'Autodesk Construction Cloud REST Engine',
          procore: 'Procore Sandbox Connect',
          slackTeams: 'Slack Incoming Webhook Daemon',
          ocrProvider: 'Google Cloud Document AI Engine',
          paymentGateway: 'Stripe API Secure Portal'
        };

        const label = labels[integrationKey] || 'Connector Service';
        const isSuccessful = config.apiKey.length > 3 && config.secret.length > 5;

        if (isSuccessful) {
          resolve({
            success: true,
            status: 'connected',
            message: `Handshake authorized successfully. ${label} is active.`
          });
        } else {
          resolve({
            success: false,
            status: 'error',
            message: `Handshake rejected by ${label}. Invalid access token or signature.`
          });
        }
      }, 1000);
    });
  }
};
