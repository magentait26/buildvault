import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Bell, Database, Check, AlertCircle, 
  Settings, Sliders, Play, Trash2, Plus, X, RefreshCw, Eye, EyeOff, 
  Lock, Fingerprint, Key, Globe, Link, Sparkles, Server, Mail, MessageSquare, 
  FileText, Shield, HardDrive, ListCheck, ClipboardList, HelpCircle, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { settingsService, TenantSettings, IntegrationConfig, RolePermission, SUBSCRIPTION_PLANS } from '../services/settingsService';

interface SettingsViewProps {
  onAddLog: (action: string, details: string) => void;
}

type TabType = 
  | 'organization' 
  | 'projects' 
  | 'permissions' 
  | 'integrations' 
  | 'notifications' 
  | 'compliance' 
  | 'storage' 
  | 'security'
  | 'subscription';

export default function SettingsView({ onAddLog }: SettingsViewProps) {
  const { selectedOrgId, organizations } = useAuthStore();
  const currentOrg = organizations.find(o => o.id === selectedOrgId) || { id: 'org-1', name: 'ABC Builders' };
  
  // Active inner settings tab
  const [activeTab, setActiveTab] = useState<TabType>('organization');

  // Local copy of all tenant settings
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  
  // Loading & status states
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Active integration sub-selection
  const [activeIntegrationKey, setActiveIntegrationKey] = useState<keyof TenantSettings['integrations']>('awsS3');
  // Secret visibility map
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Active role selector for permissions matrix
  const [selectedRoleName, setSelectedRoleName] = useState<string>('Director');

  // Input holding states for chips
  const [newCategory, setNewCategory] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('');
  const [newApprovalStage, setNewApprovalStage] = useState('');
  const [newComplianceType, setNewComplianceType] = useState('');
  const [newFileType, setNewFileType] = useState('');
  const [newAuthority, setNewAuthority] = useState('');

  // Hydrate settings when selected organization changes
  useEffect(() => {
    if (selectedOrgId) {
      const config = settingsService.getTenantSettings(selectedOrgId, currentOrg.name);
      setSettings(config);
    }
  }, [selectedOrgId, currentOrg.name]);

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-[#115e59] mb-2" />
        <span className="text-xs font-sans font-medium">Synchronizing Secure Workspace Settings...</span>
      </div>
    );
  }

  const handleSave = (tabName: string) => {
    if (!selectedOrgId) return;
    settingsService.saveTenantSettings(selectedOrgId, settings);
    
    // Log to Immutable global ledgers
    onAddLog('Settings Synchronized', `Reconfigured [${tabName}] preferences under isolated organization authorization context.`);

    setSuccessMessage(`Changes in [${tabName}] synchronized successfully!`);
    setIsSuccessVisible(true);
    setTimeout(() => setIsSuccessVisible(false), 3000);
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Integration test helper
  const handleTestIntegration = async (key: keyof TenantSettings['integrations']) => {
    setTestingConnection(key);
    setTestResult(null);

    const config = settings.integrations[key];
    const result = await settingsService.testIntegrationConnection(key, config);
    
    setTestingConnection(null);
    setTestResult({ success: result.success, message: result.message });

    // Update connection status in local states
    setSettings(prev => {
      if (!prev) return null;
      const updatedIntegrations = { ...prev.integrations };
      updatedIntegrations[key] = {
        ...updatedIntegrations[key],
        status: result.status,
        lastSync: result.success ? new Date().toISOString().replace('T', ' ').substring(0, 19) : updatedIntegrations[key].lastSync,
        errorLog: result.success ? 'None' : result.message
      };
      return { ...prev, integrations: updatedIntegrations };
    });

    onAddLog('Integration Verified', `Initiated automated connection test for gateway connector: ${key}. Handshake result: ${result.success ? 'Success' : 'Failed'}`);
  };

  // Role permissions helpers
  const handleRolePermissionChange = (
    field: 'modulesEnabled' | 'canApprove' | 'upload' | 'view' | 'delete',
    value: any
  ) => {
    setSettings(prev => {
      if (!prev) return null;
      const permissions = prev.rolePermissions.map(p => {
        if (p.roleName === selectedRoleName) {
          if (field === 'canApprove') {
            return { ...p, canApprove: value };
          }
          if (field === 'modulesEnabled') {
            const hasModule = p.modulesEnabled.includes(value);
            const newList = hasModule
              ? p.modulesEnabled.filter(m => m !== value)
              : [...p.modulesEnabled, value];
            return { ...p, modulesEnabled: newList };
          }
          if (field === 'upload' || field === 'view' || field === 'delete') {
            return {
              ...p,
              documentPermissions: {
                ...p.documentPermissions,
                [field]: value
              }
            };
          }
        }
        return p;
      });
      return { ...prev, rolePermissions: permissions };
    });
  };

  // Helper lists for chips updates
  const addCategory = () => {
    if (!newCategory.trim()) return;
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        projects: {
          ...prev.projects,
          projectCategories: [...prev.projects.projectCategories, newCategory.trim()]
        }
      };
    });
    setNewCategory('');
  };

  const removeCategory = (index: number) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        projects: {
          ...prev.projects,
          projectCategories: prev.projects.projectCategories.filter((_, i) => i !== index)
        }
      };
    });
  };

  const addDocCategory = () => {
    if (!newDocCategory.trim()) return;
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        projects: {
          ...prev.projects,
          documentCategories: [...prev.projects.documentCategories, newDocCategory.trim()]
        }
      };
    });
    setNewDocCategory('');
  };

  const removeDocCategory = (index: number) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        projects: {
          ...prev.projects,
          documentCategories: prev.projects.documentCategories.filter((_, i) => i !== index)
        }
      };
    });
  };

  const addApprovalStage = () => {
    if (!newApprovalStage.trim()) return;
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        projects: {
          ...prev.projects,
          approvalStages: [...prev.projects.approvalStages, newApprovalStage.trim()]
        }
      };
    });
    setNewApprovalStage('');
  };

  const removeApprovalStage = (index: number) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        projects: {
          ...prev.projects,
          approvalStages: prev.projects.approvalStages.filter((_, i) => i !== index)
        }
      };
    });
  };

  const addComplianceType = () => {
    if (!newComplianceType.trim()) return;
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        compliance: {
          ...prev.compliance,
          complianceTypes: [...prev.compliance.complianceTypes, newComplianceType.trim()]
        }
      };
    });
    setNewComplianceType('');
  };

  const removeComplianceType = (index: number) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        compliance: {
          ...prev.compliance,
          complianceTypes: prev.compliance.complianceTypes.filter((_, i) => i !== index)
        }
      };
    });
  };

  const addFileType = () => {
    if (!newFileType.trim()) return;
    const cleanType = newFileType.trim().startsWith('.') ? newFileType.trim() : `.${newFileType.trim()}`;
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        storage: {
          ...prev.storage,
          allowedFileTypes: [...prev.storage.allowedFileTypes, cleanType]
        }
      };
    });
    setNewFileType('');
  };

  const removeFileType = (index: number) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        storage: {
          ...prev.storage,
          allowedFileTypes: prev.storage.allowedFileTypes.filter((_, i) => i !== index)
        }
      };
    });
  };

  const addAuthority = () => {
    if (!newAuthority.trim()) return;
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        compliance: {
          ...prev.compliance,
          approvalAuthorities: [...prev.compliance.approvalAuthorities, newAuthority.trim()]
        }
      };
    });
    setNewAuthority('');
  };

  const removeAuthority = (index: number) => {
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        compliance: {
          ...prev.compliance,
          approvalAuthorities: prev.compliance.approvalAuthorities.filter((_, i) => i !== index)
        }
      };
    });
  };

  // Pre-configured lists for dropdown selection
  const TIMEZONES = ['Asia/Kolkata', 'UTC', 'Europe/London', 'America/New_York', 'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney'];
  const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'];
  const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Arabic', 'Russian'];

  const selectedPermission = settings.rolePermissions.find(p => p.roleName === selectedRoleName) || {
    roleName: selectedRoleName,
    modulesEnabled: [],
    canApprove: false,
    documentPermissions: { upload: false, view: false, delete: false }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#115e59] dark:text-emerald-400 block tracking-widest font-mono">
            SECURE ENTERPRISE BACK COCKPIT
          </span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans mt-0.5">Settings Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Configure metadata, authorization filters, notifications, and telemetry connectors isolated for: <span className="font-extrabold text-[#115e59]">{currentOrg.name}</span>
          </p>
        </div>
        
        {isSuccessVisible && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 font-sans shadow-3xs animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span className="font-medium text-emerald-800">{successMessage}</span>
          </div>
        )}
      </div>

      {/* Main Container Grid - Sidebar and Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Category Navigator */}
        <div className="col-span-1 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans px-2">
              Sectors Directory
            </span>
            <nav className="space-y-1">
              {[
                { id: 'organization', label: '1. Organization Details', icon: Building2 },
                { id: 'projects', label: '2. Project Parameters', icon: Sliders },
                { id: 'permissions', label: '3. Role permissions', icon: Lock },
                { id: 'integrations', label: '4. Third-party gateways', icon: Link },
                { id: 'notifications', label: '5. Notification Routing', icon: Bell },
                { id: 'compliance', label: '6. Quality & compliance', icon: CheckCircle2 },
                { id: 'storage', label: '7. Cloud Storage config', icon: Database },
                { id: 'security', label: '8. Access & Firewalls', icon: ShieldCheck }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      setTestResult(null);
                    }}
                    className={`w-full text-left text-xs font-semibold py-3 px-4 rounded-xl flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-[#115e59] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-[#eefcf9]/80 hover:text-[#115e59]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-[#ebf5f3] border border-[#bfe0d8] rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#115e59]">
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise Isolation Guard</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-slate-600">
              Settings altered here are applied using strict organization boundaries. Database pipelines are locked within legal schema bounds of <span className="font-bold">{currentOrg.name}</span>.
            </p>
          </div>
        </div>

        {/* Right Side: Tab Workspace */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: Organization Settings */}
          {activeTab === 'organization' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Organization Settings</h3>
                    <p className="text-[11px] text-slate-500">Global organization metadata used on regulatory blueprints and legal filings.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('Organization Settings')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <div className="flex items-center gap-4">
                    <img 
                      src={settings.organization.logoUrl} 
                      alt="Company Logo Preview" 
                      className="h-14 w-14 object-cover rounded-xl border border-slate-200 shadow-3xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=150';
                      }}
                    />
                    <div className="space-y-1">
                      <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">Company Logo URL</label>
                      <input 
                        type="text" 
                        value={settings.organization.logoUrl} 
                        onChange={e => setSettings({
                          ...settings,
                          organization: { ...settings.organization, logoUrl: e.target.value }
                        })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59] font-mono"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">Company Name</label>
                  <input 
                    type="text" 
                    value={settings.organization.companyName} 
                    onChange={e => setSettings({
                      ...settings,
                      organization: { ...settings.organization, companyName: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">GST / Corporate Registration ID</label>
                  <input 
                    type="text" 
                    value={settings.organization.gstRegistration} 
                    onChange={e => setSettings({
                      ...settings,
                      organization: { ...settings.organization, gstRegistration: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">Operations Email</label>
                  <input 
                    type="email" 
                    value={settings.organization.email} 
                    onChange={e => setSettings({
                      ...settings,
                      organization: { ...settings.organization, email: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">Primary Contact Phone</label>
                  <input 
                    type="text" 
                    value={settings.organization.phone} 
                    onChange={e => setSettings({
                      ...settings,
                      organization: { ...settings.organization, phone: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59]"
                  />
                </div>

                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">Corporate Headquarters Address</label>
                  <textarea 
                    rows={2}
                    value={settings.organization.address} 
                    onChange={e => setSettings({
                      ...settings,
                      organization: { ...settings.organization, address: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">Default Timezone</label>
                  <select
                    value={settings.organization.defaultTimezone}
                    onChange={e => setSettings({
                      ...settings,
                      organization: { ...settings.organization, defaultTimezone: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59]"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">Base Currency</label>
                  <select
                    value={settings.organization.defaultCurrency}
                    onChange={e => setSettings({
                      ...settings,
                      organization: { ...settings.organization, defaultCurrency: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59]"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">Primary Portal Language</label>
                  <select
                    value={settings.organization.defaultLanguage}
                    onChange={e => setSettings({
                      ...settings,
                      organization: { ...settings.organization, defaultLanguage: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59]"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Project Parameters */}
          {activeTab === 'projects' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Project Parameters</h3>
                    <p className="text-[11px] text-slate-500">Configure global tags, legal categories, and document workflow channels.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('Project Parameters')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              <div className="space-y-5 divide-y divide-slate-100">
                
                {/* 1. Project Categories */}
                <div className="space-y-3 pt-1">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">
                    Project Typology Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {settings.projects.projectCategories.map((cat, i) => (
                      <span key={cat} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#f2faf7] border border-[#bfe0d8] text-[#115e59] rounded-full">
                        <span>{cat}</span>
                        <button type="button" onClick={() => removeCategory(i)} className="text-xs hover:text-red-600 font-bold font-sans">
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input 
                      type="text" 
                      placeholder="Add new category (e.g. Mixed-Use)"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addCategory()}
                      className="text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59] flex-1"
                    />
                    <button type="button" onClick={addCategory} className="px-3 py-2 bg-[#115e59] hover:bg-[#0d4a46] text-white rounded-lg text-xs font-bold font-sans">
                      Add
                    </button>
                  </div>
                </div>

                {/* 2. Document Categories */}
                <div className="space-y-3 pt-4">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">
                    Configured Document Directories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {settings.projects.documentCategories.map((dcat, i) => (
                      <span key={dcat} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-full">
                        <span>{dcat}</span>
                        <button type="button" onClick={() => removeDocCategory(i)} className="text-xs hover:text-red-600 font-bold">
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input 
                      type="text" 
                      placeholder="Add document category (e.g. structural)"
                      value={newDocCategory}
                      onChange={e => setNewDocCategory(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addDocCategory()}
                      className="text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59] flex-1"
                    />
                    <button type="button" onClick={addDocCategory} className="px-3 py-2 bg-[#115e59] hover:bg-[#0d4a46] text-white rounded-lg text-xs font-bold font-sans">
                      Add
                    </button>
                  </div>
                </div>

                {/* 3. Approval Stages */}
                <div className="space-y-3 pt-4">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">
                    Document approval Route stages Sequence
                  </label>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    Stages that files can travel through before getting final certified signatures.
                  </p>
                  <div className="space-y-2">
                    {settings.projects.approvalStages.map((stage, i) => (
                      <div key={stage} className="flex items-center justify-between text-xs font-bold p-3 bg-slate-50 border border-slate-100 rounded-xl max-w-md">
                        <div className="flex items-center gap-3">
                          <span className="h-5 w-5 rounded-full bg-[#115e59] text-white text-[10px] font-mono flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <span className="text-slate-800 font-sans">{stage}</span>
                        </div>
                        <button type="button" onClick={() => removeApprovalStage(i)} className="text-slate-400 hover:text-red-600 p-1 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm pt-1">
                    <input 
                      type="text" 
                      placeholder="e.g. SRE Safety Check"
                      value={newApprovalStage}
                      onChange={e => setNewApprovalStage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addApprovalStage()}
                      className="text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59] flex-1"
                    />
                    <button type="button" onClick={addApprovalStage} className="px-3 py-2 bg-[#115e59] hover:bg-[#0d4a46] text-white rounded-lg text-xs font-bold font-sans">
                      Add
                    </button>
                  </div>
                </div>

                {/* 4. Checklist Templates */}
                <div className="space-y-3 pt-4">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">
                    Compliance Checklist Templates
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {settings.projects.complianceChecklists.map((template) => (
                      <div key={template.id} className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 shadow-3xs">
                        <div className="flex items-center gap-1.5">
                          <ClipboardList className="w-4 h-4 text-[#115e59]" />
                          <h4 className="font-extrabold text-xs text-slate-900">{template.name}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {template.types.map(t => (
                            <span key={t} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Role & Permission Matrix */}
          {activeTab === 'permissions' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Module Access & Permissions Matrix</h3>
                    <p className="text-[11px] text-slate-500">Fine-tune module visibility rights and document ledger operations per role.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('Permissions Matrix')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              <div className="space-y-5">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Target Verification & Testing Role
                    </label>
                    <p className="text-[11px] text-slate-500">Select which corporate group to re-configure.</p>
                  </div>
                  <select
                    value={selectedRoleName}
                    onChange={e => setSelectedRoleName(e.target.value)}
                    className="text-xs font-semibold p-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#115e59] w-full sm:w-64"
                  >
                    {['Super Admin', 'Director', 'Project Manager', 'Site Engineer', 'Compliance Officer', 'Legal Team', 'Finance Team', 'Auditor'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest">Active Permissions for {selectedRoleName}</h4>
                      <p className="text-xxs text-slate-400 mt-0.5">Toggle modules and execution codes allowed for this classification.</p>
                    </div>
                  </div>

                  {/* 1. Modules checks */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">
                      Modules Activated in Side Drawer
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                      {[
                        { id: 'dashboard', label: '📊 Telemetry Dashboard' },
                        { id: 'projects', label: '🏢 Projects Track' },
                        { id: 'documents', label: '📂 Digital Vault' },
                        { id: 'approvals', label: '✒️ Approvals Board' },
                        { id: 'compliance', label: '📅 Compliance OC' },
                        { id: 'integrations', label: '🔌 Integrations Hub' },
                        { id: 'settings', label: '⚙️ Settings Cabin' }
                      ].map(module => {
                        const isChecked = selectedPermission.modulesEnabled.includes(module.id);
                        return (
                          <label key={module.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleRolePermissionChange('modulesEnabled', module.id)}
                              className="accent-[#115e59] h-4 w-4"
                            />
                            <span className="font-semibold text-slate-700">{module.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Direct Execution rights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    
                    {/* Approvals */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-slate-850 block">Approval Signing Authority</span>
                        <p className="text-[10.5px] text-slate-400">Can reject or endorse files into municipal queues.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedPermission.canApprove}
                        onChange={e => handleRolePermissionChange('canApprove', e.target.checked)}
                        className="accent-[#115e59] h-4 w-4"
                      />
                    </div>

                    {/* CRUD Document uploads */}
                    <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                      <span className="text-xs font-extrabold text-slate-850 block">Document Vault Security CRUD</span>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedPermission.documentPermissions.upload}
                            onChange={e => handleRolePermissionChange('upload', e.target.checked)}
                            className="accent-[#115e59]"
                          />
                          <span>Upload</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedPermission.documentPermissions.view}
                            onChange={e => handleRolePermissionChange('view', e.target.checked)}
                            className="accent-[#115e59]"
                          />
                          <span>View</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedPermission.documentPermissions.delete}
                            onChange={e => handleRolePermissionChange('delete', e.target.checked)}
                            className="accent-[#115e59]"
                          />
                          <span>Delete</span>
                        </label>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Integration Gateways */}
          {activeTab === 'integrations' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <Link className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Integration Configuration Hub</h3>
                    <p className="text-[11px] text-slate-500">Provide credentials for storage targets, notifications alerts, and API engines.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('Integration Settings')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              {/* Grid - list of integrations left, specific selection on right */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                
                {/* Selector */}
                <div className="md:col-span-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono px-1">
                    Select Gateway API
                  </label>
                  <div className="space-y-1 border-r border-slate-150 pr-2">
                    {[
                      { key: 'awsS3', label: 'AWS S3 Bucket', icon: Server, enabled: settings.integrations.awsS3.enabled },
                      { key: 'emailSmtp', label: 'Grid SMTP Host', icon: Mail, enabled: settings.integrations.emailSmtp.enabled },
                      { key: 'whatsappApi', label: 'WhatsApp Alert API', icon: MessageSquare, enabled: settings.integrations.whatsappApi.enabled },
                      { key: 'smsGateway', label: 'Sms Delivery Gateway', icon: Key, enabled: settings.integrations.smsGateway.enabled },
                      { key: 'docuSign', label: 'DocuSign Signatures', icon: FileText, enabled: settings.integrations.docuSign.enabled },
                      { key: 'acc', label: 'ACC / Autodesk Dev', icon: Globe, enabled: settings.integrations.acc.enabled },
                      { key: 'procore', label: 'Procore Sandbox', icon: Server, enabled: settings.integrations.procore.enabled },
                      { key: 'slackTeams', label: 'Slack Webhooks', icon: MessageSquare, enabled: settings.integrations.slackTeams.enabled },
                      { key: 'ocrProvider', label: 'Google Doc AI OCR', icon: Sparkles, enabled: settings.integrations.ocrProvider.enabled },
                      { key: 'paymentGateway', label: 'Merchant Gateway', icon: Server, enabled: settings.integrations.paymentGateway.enabled }
                    ].map(item => {
                      const Icon = item.icon;
                      const isSelected = activeIntegrationKey === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setActiveIntegrationKey(item.key as any);
                            setTestResult(null);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-[#1a4e45]/10 text-[#115e59] border-l-4 border-[#115e59] pl-3.5'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          
                          <span className={`inline-block h-2 w-2 rounded-full ${
                            settings.integrations[item.key as keyof TenantSettings['integrations']].status === 'connected'
                              ? 'bg-emerald-500'
                              : 'bg-slate-300'
                          }`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Editor */}
                <div className="md:col-span-2 space-y-4">
                  
                  {activeIntegrationKey && (
                    <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/20 space-y-4">
                      
                      {/* Title & switch */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-sm text-[#115e59] uppercase font-mono">
                            {activeIntegrationKey.toUpperCase()} CONNECT GATEWAY
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Status:{' '}
                            <span className={`font-bold ${
                              settings.integrations[activeIntegrationKey].status === 'connected' ? 'text-emerald-500' : 'text-slate-500'
                            }`}>
                              {settings.integrations[activeIntegrationKey].status.toUpperCase()}
                            </span>
                          </span>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.integrations[activeIntegrationKey].enabled}
                            onChange={e => {
                              const updated = { ...settings.integrations };
                              updated[activeIntegrationKey] = {
                                ...updated[activeIntegrationKey],
                                enabled: e.target.checked,
                                status: e.target.checked ? updated[activeIntegrationKey].status : 'disconnected'
                              };
                              setSettings({ ...settings, integrations: updated });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#115e59]"></div>
                        </label>
                      </div>

                      {/* Connection details */}
                      <div className="space-y-3 pt-1">
                        
                        <div className="space-y-1">
                          <label className="text-xxs font-bold text-slate-400 block font-mono">API ACCESS KEY (OR CLIENT ENDPOINT HOST)</label>
                          <input 
                            type="text"
                            value={settings.integrations[activeIntegrationKey].apiKey}
                            onChange={e => {
                              const updated = { ...settings.integrations };
                              updated[activeIntegrationKey] = {
                                ...updated[activeIntegrationKey],
                                apiKey: e.target.value
                              };
                              setSettings({ ...settings, integrations: updated });
                            }}
                            placeholder="e.g. key_aws_prod_access_101"
                            disabled={!settings.integrations[activeIntegrationKey].enabled}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59] bg-white font-mono disabled:opacity-50"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-xxs font-bold text-slate-400 block font-mono">API SECRET (OR TOKEN PASSPHRASE)</label>
                            <button
                              type="button"
                              onClick={() => toggleSecret(activeIntegrationKey)}
                              className="text-xxs text-[#115e59] font-bold flex items-center gap-0.5"
                            >
                              {showSecrets[activeIntegrationKey] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {showSecrets[activeIntegrationKey] ? 'Mask' : 'Reveal'}
                            </button>
                          </div>
                          <input 
                            type={showSecrets[activeIntegrationKey] ? 'text' : 'password'}
                            value={settings.integrations[activeIntegrationKey].secret}
                            onChange={e => {
                              const updated = { ...settings.integrations };
                              updated[activeIntegrationKey] = {
                                ...updated[activeIntegrationKey],
                                secret: e.target.value
                              };
                              setSettings({ ...settings, integrations: updated });
                            }}
                            placeholder="••••••••••••••••••••"
                            disabled={!settings.integrations[activeIntegrationKey].enabled}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59] bg-white font-mono disabled:opacity-50"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xxs font-bold text-slate-400 block font-mono">WEBHOOK HANDLER INGRESS URL</label>
                          <input 
                            type="text"
                            value={settings.integrations[activeIntegrationKey].webhookUrl}
                            onChange={e => {
                              const updated = { ...settings.integrations };
                              updated[activeIntegrationKey] = {
                                ...updated[activeIntegrationKey],
                                webhookUrl: e.target.value
                              };
                              setSettings({ ...settings, integrations: updated });
                            }}
                            placeholder="https://api.buildvault.io/v1/webhooks/s3"
                            disabled={!settings.integrations[activeIntegrationKey].enabled}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59] bg-white font-mono disabled:opacity-50"
                          />
                        </div>

                        {/* Connection Test Trigger */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleTestIntegration(activeIntegrationKey)}
                            disabled={testingConnection !== null || !settings.integrations[activeIntegrationKey].enabled}
                            className="w-full py-2.5 bg-slate-900 text-white font-bold text-xxs uppercase tracking-wider rounded-lg transition-colors hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {testingConnection === activeIntegrationKey ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Verifying Handshake Handover...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current text-emerald-400 border-none" />
                                <span>Validate Credentials & Connect</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Test results indicator */}
                        {testResult && (
                          <div className={`p-3 rounded-lg border text-xxs font-mono flex items-start gap-1 px-4 ${
                            testResult.success
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <div>
                              <span className="font-bold underline block mb-0.5">Automated Gate Test Logic:</span>
                              {testResult.message}
                            </div>
                          </div>
                        )}

                        {/* Logs */}
                        <div className="pt-2 space-y-1 text-xxs font-mono border-t border-slate-100 mt-2 text-slate-500">
                          <div className="flex justify-between">
                            <span>LAST SYNC HEARTBEAT:</span>
                            <span className="text-slate-800 font-bold">{settings.integrations[activeIntegrationKey].lastSync}</span>
                          </div>
                          <div>
                            <span className="block mb-0.5">CONNECTOR ERROR LOG:</span>
                            <div className="bg-slate-950 text-emerald-400 p-2.5 rounded-lg max-h-16 overflow-y-auto selection:bg-emerald-900 border border-slate-800 font-sans text-[10px]">
                              {settings.integrations[activeIntegrationKey].errorLog}
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* TAB 5: Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-5 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Notification Preferences</h3>
                    <p className="text-[11px] text-slate-500">Select which automated events push logs, mobile tags, and messaging alerts.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('Notification Preferences')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              <div className="space-y-4 divide-y divide-slate-100 font-sans text-xs">
                
                <div className="flex items-center justify-between py-1">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">Email System Alerts</h4>
                    <p className="text-xxs text-slate-400">Trigger standard email logs for legal endorsement processes.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.notifications.emailAlerts}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailAlerts: e.target.checked }
                    })}
                    className="accent-[#115e59] h-4.5 w-4.5"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">WhatsApp Dispatch Rules</h4>
                    <p className="text-xxs text-slate-400">Reroute high priority task approvals directly to supervisors' WhatsApp cards.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.notifications.whatsappAlerts}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, whatsappAlerts: e.target.checked }
                    })}
                    className="accent-[#115e59] h-4.5 w-4.5"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">SMS cellular notifications</h4>
                    <p className="text-xxs text-slate-400">Emergency compliance notifications over standard cellular carriers.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.notifications.smsAlerts}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smsAlerts: e.target.checked }
                    })}
                    className="accent-[#115e59] h-4.5 w-4.5"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">BuildVault Native Push Alerts</h4>
                    <p className="text-xxs text-slate-400">Send persistent telemetry tags into mobile simulator frameworks.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, pushNotifications: e.target.checked }
                    })}
                    className="accent-[#115e59] h-4.5 w-4.5"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">Escrow Approval reminders</h4>
                    <p className="text-xxs text-slate-400">Weekly automated emails alerting directors when files sit in approval states too long.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.notifications.approvalReminders}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, approvalReminders: e.target.checked }
                    })}
                    className="accent-[#115e59] h-4.5 w-4.5"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">Compliance expiry reminders</h4>
                    <p className="text-xxs text-slate-400">Automated warning cascades based on the expiry reminder days configuration.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.notifications.complianceExpiryReminders}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, complianceExpiryReminders: e.target.checked }
                    })}
                    className="accent-[#115e59] h-4.5 w-4.5"
                  />
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: Compliance Rules */}
          {activeTab === 'compliance' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Compliance & Regulatory settings</h3>
                    <p className="text-[11px] text-slate-500">Configure expiration thresholds, certified authorities, and automated warnings.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('Compliance Settings')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              <div className="space-y-5">
                
                {/* Expiry alerts days */}
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xxs font-bold text-slate-400 block font-mono">EXPIRY WARN ALERTS CASCADE OFFSET (DAYS)</label>
                  <input 
                    type="number"
                    value={settings.compliance.expiryReminderDays}
                    onChange={e => setSettings({
                      ...settings,
                      compliance: { ...settings.compliance, expiryReminderDays: parseInt(e.target.value) || 30 }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59]"
                  />
                </div>

                {/* Compliance type listings */}
                <div className="space-y-3 pt-2">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">
                    Monitored Compliance Certifications
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {settings.compliance.complianceTypes.map((type, i) => (
                      <span key={type} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#f2faf7] border border-[#bfe0d8] text-[#115e59] rounded-full">
                        <span>{type}</span>
                        <button type="button" onClick={() => removeComplianceType(i)} className="text-xs hover:text-red-650 font-bold">
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input 
                      type="text" 
                      placeholder="e.g. Tree Cutting Clearance"
                      value={newComplianceType}
                      onChange={e => setNewComplianceType(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addComplianceType()}
                      className="text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59] flex-1"
                    />
                    <button type="button" onClick={addComplianceType} className="px-3 py-2 bg-[#115e59] hover:bg-[#0d4a46] text-white rounded-lg text-xs font-bold font-sans">
                      Add
                    </button>
                  </div>
                </div>

                {/* Certified Authorities list */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">
                    Signatory Legal Authorities (Boards)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {settings.compliance.approvalAuthorities.map((auth, i) => (
                      <span key={auth} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-full">
                        <span>{auth}</span>
                        <button type="button" onClick={() => removeAuthority(i)} className="text-xs hover:text-red-650 font-bold">
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input 
                      type="text" 
                      placeholder="e.g. Tree cutting Board"
                      value={newAuthority}
                      onChange={e => setNewAuthority(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addAuthority()}
                      className="text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59] flex-1"
                    />
                    <button type="button" onClick={addAuthority} className="px-3 py-2 bg-[#115e59] hover:bg-[#0d4a46] text-white rounded-lg text-xs font-bold font-sans">
                      Add
                    </button>
                  </div>
                </div>

                {/* Escalation Rules */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 font-sans">
                  <label className="text-xxs font-bold text-slate-400 block font-mono">AUTOMATED COMPLIANCE ESCALATION DECAL RULES</label>
                  <p className="text-[10.5px] text-slate-400 leading-normal mb-1">
                    Describe escalation logic for unresolved expiring clearances.
                  </p>
                  <textarea 
                    rows={3}
                    value={settings.compliance.escalationRules}
                    onChange={e => setSettings({
                      ...settings,
                      compliance: { ...settings.compliance, escalationRules: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59] bg-white font-mono leading-normal"
                    placeholder="Describe custom logic..."
                  />
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: Cloud Storage Configuration */}
          {activeTab === 'storage' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Cloud Storage Bucket architecture</h3>
                    <p className="text-[11px] text-slate-500">Fine-tune partition routes, allowed formats, and individual size locks.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('Cloud Storage Parameters')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 block font-mono">PRIMARY STORAGE INFRASTRUCTURE PROVIDER</label>
                  <select
                    value={settings.storage.storageProvider}
                    onChange={e => setSettings({
                      ...settings,
                      storage: { ...settings.storage, storageProvider: e.target.value as any }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-[#115e59]"
                  >
                    <option value="AWS S3">AWS S3 Infrastructure</option>
                    <option value="MinIO">MinIO Private Container</option>
                    <option value="Azure Blob">Azure Blob Storage</option>
                    <option value="Google Cloud">Google Cloud storage bucket</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 block font-mono">S3 INSTANCE BUCKET NAME</label>
                  <input 
                    type="text"
                    value={settings.storage.bucketName}
                    onChange={e => setSettings({
                      ...settings,
                      storage: { ...settings.storage, bucketName: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 block font-mono">GEOGRAPHIC CLUSTER REGION</label>
                  <input 
                    type="text"
                    value={settings.storage.region}
                    onChange={e => setSettings({
                      ...settings,
                      storage: { ...settings.storage, region: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 block font-mono">FILE LIMIT LOCK per UPLOAD (MB)</label>
                  <input 
                    type="number"
                    value={settings.storage.fileSizeLimit}
                    onChange={e => setSettings({
                      ...settings,
                      storage: { ...settings.storage, fileSizeLimit: parseInt(e.target.value) || 50 }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59]"
                  />
                </div>

                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-xxs font-bold text-slate-400 block font-mono">ORGANIZATIONAL PATH STRUCTURE TEMPLATE</label>
                  <input 
                    type="text"
                    value={settings.storage.folderStructure}
                    onChange={e => setSettings({
                      ...settings,
                      storage: { ...settings.storage, folderStructure: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59] font-mono"
                  />
                </div>

                <div className="space-y-3 col-span-1 md:col-span-2 pt-2 border-t border-slate-100">
                  <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block font-mono">
                    Allowed Document Extensions Allowlist
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {settings.storage.allowedFileTypes.map((type, i) => (
                      <span key={type} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-full font-mono">
                        <span>{type}</span>
                        <button type="button" onClick={() => removeFileType(i)} className="text-xs hover:text-red-600 font-bold">
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input 
                      type="text" 
                      placeholder="e.g. .dwg"
                      value={newFileType}
                      onChange={e => setNewFileType(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addFileType()}
                      className="text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-[#115e59] flex-1 font-mono"
                    />
                    <button type="button" onClick={addFileType} className="px-3 py-2 bg-[#115e59] hover:bg-[#0d4a46] text-white rounded-lg text-xs font-bold font-sans">
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 col-span-1 md:col-span-2">
                  <label className="text-xxs font-bold text-slate-400 block font-mono">FILE PERSISTENCE & RETENTION PERIOD (YEARS)</label>
                  <input 
                    type="number"
                    value={settings.storage.retentionPeriodYears}
                    onChange={e => setSettings({
                      ...settings,
                      storage: { ...settings.storage, retentionPeriodYears: parseInt(e.target.value) || 7 }
                    })}
                    className="w-24 text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59]"
                  />
                  <p className="text-[10.5px] text-slate-400 leading-normal pt-1">
                    Compliance legal mandate: Archival logs and versions will be purged from AWS after this threshold duration.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 8: Access Control & firewalls */}
          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Access, IP Firewalls & Security</h3>
                    <p className="text-[11px] text-slate-500">Configure corporate password strength policies, 2FA locks, and IP access restrictions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('Security Access Configurations')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              <div className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  <div className="space-y-1.5">
                    <label className="text-xxs font-bold text-slate-400 block font-mono">INACTIVE SESSION AUTO TIMEOUT (MINUTES)</label>
                    <input 
                      type="number"
                      value={settings.security.sessionTimeoutMinutes}
                      onChange={e => setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeoutMinutes: parseInt(e.target.value) || 30 }
                      })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xxs font-bold text-slate-400 block font-mono">PASSWORD STRENGTH POLICIES</label>
                    <select
                      value={settings.security.passwordPolicy}
                      onChange={e => setSettings({
                        ...settings,
                        security: { ...settings.security, passwordPolicy: e.target.value }
                      })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-[#115e59]"
                    >
                      <option value="Standard">Standard (Min 8 chars, 1 number)</option>
                      <option value="Strong">Strong (Min 10 chars, uppercase, alphanumeric)</option>
                      <option value="Strict">Strict (Min 12 chars, symbol required, 90 day expiry cycling)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xxs font-bold text-slate-400 block font-mono">WHITELISTED OFFICE IP RANGE ALLOWLIST</label>
                    <input 
                      type="text"
                      placeholder="e.g. 192.168.1.1, 10.0.0.0/24 (Leave empty to disable IP restriction)"
                      value={settings.security.ipRestriction}
                      onChange={e => setSettings({
                        ...settings,
                        security: { ...settings.security, ipRestriction: e.target.value }
                      })}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#115e59] font-mono text-[11px]"
                    />
                  </div>

                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 font-sans text-xs">
                  
                  <div className="flex items-center justify-between py-1">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800">Require Multi-Factor Authentication (2FA)</h4>
                      <p className="text-xxs text-slate-400 font-medium">All users are locked from actions until they complete an OTP verify.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.security.twoFactorRequirement}
                        onChange={e => setSettings({
                          ...settings,
                          security: { ...settings.security, twoFactorRequirement: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#115e59]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800">Track and Log Login Sequences</h4>
                      <p className="text-xxs text-slate-400 font-medium">Persists client telemetry details into write-once ledger queues.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.security.loginAudit}
                        onChange={e => setSettings({
                          ...settings,
                          security: { ...settings.security, loginAudit: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#115e59]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800">Track and Log Document Downloads</h4>
                      <p className="text-xxs text-slate-400 font-medium">Every file requested by users triggers an unalterable transaction sign.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.security.downloadAudit}
                        onChange={e => setSettings({
                          ...settings,
                          security: { ...settings.security, downloadAudit: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#115e59]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800">Track and Log Metadata Accesses</h4>
                      <p className="text-xxs text-slate-400 font-medium">Capture system telemetry of every user viewing folders or checking properties.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.security.documentAccessAudit}
                        onChange={e => setSettings({
                          ...settings,
                          security: { ...settings.security, documentAccessAudit: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#115e59]"></div>
                    </label>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 9: Plans & Modules Config */}
          {activeTab === 'subscription' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-6 animate-in fade-in duration-200" id="subscription-settings-panel">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#d1e7e2] text-[#115e59] rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">System Modules & Quotas</h3>
                    <p className="text-[11px] text-slate-500">Configure licensed workspace modules, toggle enterprise feature limits, and audit organization quotas.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('System Modules Configurations')}
                  className="px-4 py-1.5 text-xxs font-bold uppercase tracking-wider text-white bg-[#115e59] hover:bg-[#0d4a46] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  Save Section
                </button>
              </div>

              <div className="space-y-6">
                
                {/* Plans Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 block font-mono uppercase tracking-wider">Select Corporate Organization tier</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {SUBSCRIPTION_PLANS.map((plan) => {
                      const isCurrent = settings.subscription?.planName === plan.name;
                      return (
                        <div 
                          key={plan.name}
                          onClick={() => {
                            // Assign plan and auto-conflate authorized modules
                            const autoModules = plan.allowedModules;
                            setSettings({
                              ...settings,
                              subscription: {
                                ...settings.subscription,
                                planName: plan.name,
                                enabledModules: autoModules
                              }
                            });
                          }}
                          className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                            isCurrent 
                              ? 'border-[#115e59] bg-[#eefcf9]/40 ring-1 ring-[#115e59]/30 shadow-xs' 
                              : 'border-slate-200 hover:border-[#115e59]/40 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-sm text-slate-800">{plan.name}</span>
                              {isCurrent && (
                                <span className="bg-[#115e59] text-white text-[8px] font-bold font-mono px-2 py-0.5 rounded-full uppercase">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal">{plan.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-400 font-medium">Monthly Rate</span>
                              <span className="font-extrabold text-[#115e59] font-mono">${plan.monthlyPrice}/mo</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-400 font-medium">Project Capacity</span>
                              <span className="font-extrabold text-slate-800 font-mono">
                                {plan.maxProjects >= 100 ? 'Unlimited' : `${plan.maxProjects} Sites`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-400 font-medium">Core Cloud Storage</span>
                              <span className="font-extrabold text-slate-800 font-mono">{plan.maxStorageMB >= 1000 ? `${plan.maxStorageMB / 1000} GB` : `${plan.maxStorageMB} MB`}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modules Enabling Section */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 block font-mono uppercase tracking-wider">Enforceable Module Routing Switches</h4>
                    <p className="text-[10.5px] text-slate-500">Toggling modules affects live sidebar navigation routes. You can only toggle modules supported by your chosen plan tier.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'dashboard', name: '📊 Operations Dashboard', desc: 'Centralized live KPI aggregates and portfolios summary.' },
                      { id: 'projects', name: '🏗️ Property Pipeline Projects', desc: 'Manage project specifications, RERA codes, and site blueprints.' },
                      { id: 'documents', name: '📁 Document Control Vault', desc: 'Organize files, version history, S3 storage mappings.' },
                      { id: 'compliance', name: '🛡️ Local Authority Compliance', desc: 'Track clearances, RERA certifications, municipal approvals.' },
                      { id: 'approvals', name: '✒️ Sequence-Based Approvals', desc: 'Draft approvals, SRE review gateways, director release signatures.', requiresPlan: 'Enterprise' },
                      { id: 'integrations', name: '🔌 Connected Third-Party Gateways', desc: 'Connect Autodesk Procore, AWS S3 buckets, and SMS platforms.', requiresPlan: 'Enterprise' },
                      { id: 'alerts', name: '🔔 Notification Alert Routing', desc: 'Automate push updates and WhatsApp alerts.', requiresPlan: 'Growth' },
                      { id: 'users', name: '👥 Multi-Role Permissions', desc: 'Access controls and simulated team mappings.', requiresPlan: 'Enterprise' }
                    ].map((mod) => {
                      const activePlanDef = SUBSCRIPTION_PLANS.find(p => p.name === (settings.subscription?.planName || 'Starter'));
                      const isAllowedByPlan = activePlanDef ? activePlanDef.allowedModules.includes(mod.id) : false;
                      const isChecked = settings.subscription?.enabledModules?.includes(mod.id) || false;

                      const handleCheckboxChange = (checked: boolean) => {
                        if (!isAllowedByPlan) return;
                        let nextModules = [...(settings.subscription?.enabledModules || [])];
                        if (checked) {
                          if (!nextModules.includes(mod.id)) nextModules.push(mod.id);
                        } else {
                          nextModules = nextModules.filter(m => m !== mod.id);
                        }
                        setSettings({
                          ...settings,
                          subscription: {
                            ...settings.subscription,
                            enabledModules: nextModules
                          }
                        });
                      };

                      return (
                        <div 
                          key={mod.id}
                          className={`p-3 border rounded-xl flex items-start gap-3 transition-all ${
                            !isAllowedByPlan 
                              ? 'bg-slate-50 border-slate-100 opacity-60' 
                              : isChecked 
                                ? 'border-[#115e59]/30 bg-[#eefcf9]/15' 
                                : 'border-slate-100 bg-white'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            disabled={!isAllowedByPlan}
                            checked={isChecked}
                            onChange={(e) => handleCheckboxChange(e.target.checked)}
                            className="mt-1 accent-[#115e59] cursor-pointer"
                            id={`mod-check-${mod.id}`}
                          />
                          <div className="space-y-0.5">
                            <label htmlFor={`mod-check-${mod.id}`} className="block text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                              {mod.name}
                              {!isAllowedByPlan && (
                                <span className="bg-rose-50 text-rose-700 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase">
                                  REQUIRES {mod.requiresPlan}
                                </span>
                              )}
                            </label>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{mod.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Production Readiness Checklist */}
                <div className="pt-5 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-2.5 bg-emerald-50 text-emerald-700 text-xxs font-mono font-bold rounded-lg uppercase tracking-wider">
                      Ready For Launch
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 font-sans">🚀 BuildVault MVP Production Readiness Checklist</h4>
                  </div>
                  
                  <p className="text-[10.5px] text-slate-500 leading-normal">
                    This interactive checklist tracks essential hardening components completed in preparation for production launch. Ticking these boxes marks them off within the current administrative session context.
                  </p>

                  <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4.5 space-y-3">
                    {[
                      { 
                        id: 'pr-1', 
                        title: 'Dynamic Organization Isolation Guard', 
                        desc: 'Verified Enterprise Settings merge engine. Standalone workspace data maps dynamically using unique local/cloud organization IDs, preventing cross-organization leakages.', 
                        defaultChecked: true 
                      },
                      { 
                        id: 'pr-2', 
                        title: 'Dynamic Enterprise Module Licensing', 
                        desc: 'Configured Starter, Growth, and Enterprise tiers. Interactive routing switches auto-filter navigation sidebar layouts following structural enabling matrix.', 
                        defaultChecked: true 
                      },
                      { 
                        id: 'pr-3', 
                        title: 'Multi-Role Permissions Enforcement', 
                        desc: 'Role-driven workspace module overrides are checked. Restricts Site Engineers, Compliance Officers, and Auditors to their respective approved modules.', 
                        defaultChecked: true 
                      },
                      { 
                        id: 'pr-4', 
                        title: 'Secured Cloud Intake Validation Rules', 
                        desc: 'Implemented real-time, organization-driven size checks and extension whitelist filters, blocking fraudulent file formats and oversized uploads at intake.', 
                        defaultChecked: true 
                      },
                      { 
                        id: 'pr-5', 
                        title: 'Write-Once Audit Log Ledger Path', 
                        desc: 'System mutation routes (uploads, version restorals, approval transitions) trigger persistent JSON logging, maintaining an unalterable forensic track.', 
                        defaultChecked: true 
                      },
                      { 
                        id: 'pr-6', 
                        title: 'Third-Party S3 Storage & Core Gateways Mapping', 
                        desc: 'External S3 Bucket pathing logic behaves dynamically. Mapped prefix pattern of s3://{org_id}/{project_code}/{category}/{file_name}_v{version}.pdf for live sync.', 
                        defaultChecked: false 
                      }
                    ].map((item) => {
                      return (
                        <div key={item.id} className="flex items-start gap-3 p-2.5 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 transition-colors">
                          <input 
                            type="checkbox"
                            defaultChecked={item.defaultChecked}
                            className="mt-1 accent-[#115e59] cursor-pointer"
                            id={item.id}
                          />
                          <div className="space-y-0.5">
                            <label htmlFor={item.id} className="block text-[11px] font-bold text-slate-800 cursor-pointer">
                              {item.title}
                            </label>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
