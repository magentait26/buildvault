import React from 'react';
import { Power, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  category: 'CRM' | 'ERP' | 'Storage' | 'Communication';
  description: string;
  monogram: string;
  monogramColor: string;
  connected: boolean;
}

interface IntegrationsViewProps {
  onAddLog: (action: string, details: string) => void;
}

export default function IntegrationsView({ onAddLog }: IntegrationsViewProps) {
  // Store integration states in localStorage for persistence
  const [integrations, setIntegrations] = React.useState<IntegrationItem[]>(() => {
    const cached = localStorage.getItem('buildvault_integrations_v1');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'salesforce', name: 'Salesforce', category: 'CRM', description: 'Sync leads and customer records.', monogram: 'SA', monogramColor: 'text-blue-600 bg-blue-50 border-blue-200', connected: true },
      { id: 'zoho', name: 'Zoho CRM', category: 'CRM', description: 'Two-way contact sync.', monogram: 'ZO', monogramColor: 'text-yellow-600 bg-yellow-50 border-yellow-200', connected: false },
      { id: 'hubspot', name: 'HubSpot', category: 'CRM', description: 'Marketing and CRM pipeline.', monogram: 'HU', monogramColor: 'text-orange-600 bg-orange-50 border-orange-200', connected: false },
      
      { id: 'sap', name: 'SAP', category: 'ERP', description: 'Enterprise resource planning.', monogram: 'SA', monogramColor: 'text-sky-600 bg-sky-50 border-sky-200', connected: false },
      { id: 'oracle', name: 'Oracle', category: 'ERP', description: 'Finance and procurement.', monogram: 'OR', monogramColor: 'text-red-600 bg-red-50 border-red-200', connected: false },
      { id: 'tally', name: 'Tally', category: 'ERP', description: 'Accounts and inventory.', monogram: 'TA', monogramColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', connected: true },
      
      { id: 's3', name: 'AWS S3', category: 'Storage', description: 'Object storage backend.', monogram: 'AW', monogramColor: 'text-amber-600 bg-amber-50 border-amber-200', connected: true },
      { id: 'azure-blob', name: 'Azure Blob', category: 'Storage', description: 'Microsoft cloud storage.', monogram: 'AZ', monogramColor: 'text-blue-500 bg-blue-50/50 border-blue-150', connected: false },
      { id: 'gcs', name: 'Google Cloud Storage', category: 'Storage', description: 'Google cloud bucket sync.', monogram: 'GO', monogramColor: 'text-red-500 bg-red-50/50 border-red-150', connected: false },
      { id: 'sharepoint', name: 'SharePoint', category: 'Storage', description: 'Microsoft document libraries.', monogram: 'SH', monogramColor: 'text-teal-600 bg-teal-50 border-teal-200', connected: false },
      
      { id: 'whatsapp', name: 'WhatsApp', category: 'Communication', description: 'Send approval requests.', monogram: 'WH', monogramColor: 'text-green-600 bg-green-50 border-green-200', connected: true },
      { id: 'gmail', name: 'Gmail', category: 'Communication', description: 'Send and receive email.', monogram: 'GM', monogramColor: 'text-rose-600 bg-rose-50 border-rose-200', connected: true },
      { id: 'outlook', name: 'Outlook', category: 'Communication', description: 'Microsoft email and calendar.', monogram: 'OU', monogramColor: 'text-blue-600 bg-blue-50 border-blue-200', connected: false },
      { id: 'teams', name: 'Teams', category: 'Communication', description: 'Microsoft Teams notifications.', monogram: 'TE', monogramColor: 'text-indigo-600 bg-indigo-50 border-indigo-200', connected: false },
      { id: 'slack', name: 'Slack', category: 'Communication', description: 'Real-time notifications.', monogram: 'SL', monogramColor: 'text-purple-600 bg-purple-50 border-purple-200', connected: false }
    ];
  });

  const saveIntegrations = (newItems: IntegrationItem[]) => {
    setIntegrations(newItems);
    localStorage.setItem('buildvault_integrations_v1', JSON.stringify(newItems));
  };

  const handleToggleConnect = (id: string, name: string, isCurrentlyConnected: boolean) => {
    const updated = integrations.map(item => {
      if (item.id === id) {
        return { ...item, connected: !isCurrentlyConnected };
      }
      return item;
    });
    saveIntegrations(updated);

    if (isCurrentlyConnected) {
      onAddLog('Integration Disconnected', `Severed automated channel pipeline connection with integration client: ${name}`);
    } else {
      onAddLog('Integration Connected', `Established API integration link with ${name}. Automated actions enabled.`);
    }
  };

  // Grouped items
  const crmItems = integrations.filter(i => i.category === 'CRM');
  const erpItems = integrations.filter(i => i.category === 'ERP');
  const storageItems = integrations.filter(i => i.category === 'Storage');
  const communicationItems = integrations.filter(i => i.category === 'Communication');

  const renderCategory = (title: string, items: IntegrationItem[]) => (
    <div className="space-y-4" id={`integration-category-${title.toLowerCase()}`}>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(item => (
          <div 
            key={item.id} 
            id={`integration-card-${item.id}`}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col justify-between hover:border-slate-350 hover:shadow-2xs transition-all relative"
          >
            {/* Top Indicator */}
            <div className="flex justify-between items-start mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${item.monogramColor}`}>
                {item.monogram}
              </div>
              {item.connected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" /> Connected
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-450 text-slate-400 mr-1.5 mt-0.5">
                  Available
                </span>
              )}
            </div>

            {/* Content info */}
            <div className="space-y-1 mb-5">
              <h4 className="font-semibold text-sm text-slate-900 tracking-tight font-sans">
                {item.name}
              </h4>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Footer action button */}
            <button
              onClick={() => handleToggleConnect(item.id, item.name, item.connected)}
              id={`integration-btn-${item.id}`}
              className={`w-full py-2 px-4 rounded-lg font-semibold text-xs tracking-wide transition-colors cursor-pointer ${
                item.connected 
                  ? 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-800' 
                  : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-500'
              }`}
            >
              {item.connected ? 'Manage' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Title */}
      <div>
        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">ENTERPRISE CHANNELS</span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-0.5">Integrations</h2>
        <p className="text-xs text-slate-500 mt-0.5">Connect BuildVault with the tools your teams already use.</p>
      </div>

      {/* Main categories */}
      <div className="space-y-10">
        {renderCategory('CRM', crmItems)}
        {renderCategory('ERP', erpItems)}
        {renderCategory('Storage', storageItems)}
        {renderCategory('Communication', communicationItems)}
      </div>

    </div>
  );
}
