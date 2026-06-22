import React, { useState } from 'react';
import { Project, ComplianceRecord, ComplianceType, ComplianceStatus, Role, User } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { settingsService } from '../services/settingsService';
import { 
  CheckSquare, ShieldAlert, AlertTriangle, Calendar, Search, Filter, 
  TrendingUp, HelpCircle, FileText, CheckCircle2, XCircle, ArrowUpRight, Clock, ChevronDown, X
} from 'lucide-react';

interface ComplianceViewProps {
  projects: Project[];
  compliance: ComplianceRecord[];
  currentRole: Role;
  currentUser: User;
  onUpdateComplianceTypeStatus: (
    projectId: string,
    complianceType: ComplianceType,
    status: ComplianceStatus,
    expiryDate?: string
  ) => void;
  onAddLog: (action: string, details: string) => void;
}

const COMPLIANCE_TYPES: ComplianceType[] = [
  'RERA Registration', 'Fire NOC', 'Occupancy Certificate', 'Environmental Clearance', 
  'Labor License', 'Building Approval', 'Airport NOC'
];

export const getGoverningAgency = (type: string) => {
  switch (type) {
    case 'RERA Registration': return 'Real Estate Regulatory Authority (RERA)';
    case 'Fire NOC': return 'Municipal Fire Department';
    case 'Occupancy Certificate': return 'Urban Development Authority';
    case 'Environmental Clearance': return 'State Pollution Control Board';
    case 'Labor License': return 'Department of Labour';
    case 'Building Approval': return 'Municipal Corporation';
    case 'Airport NOC': return 'Airports Authority of India (AAI)';
    default: return 'Municipal Authority';
  }
};

export default function ComplianceView({
  projects,
  compliance,
  currentRole,
  currentUser,
  onUpdateComplianceTypeStatus,
  onAddLog
}: ComplianceViewProps) {
  const { selectedOrgId } = useAuthStore();
  const settings = settingsService.getTenantSettings(selectedOrgId || 'org-1');
  const complianceTypes = (settings?.compliance?.complianceTypes as ComplianceType[]) || COMPLIANCE_TYPES;

  // Navigation & filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Status Change form state
  const [targetProjectId, setTargetProjectId] = useState('');
  const [targetType, setTargetType] = useState<ComplianceType>(complianceTypes[0] || 'RERA Registration');
  const [targetStatus, setTargetStatus] = useState<ComplianceStatus>('Pending');
  const [targetExpiry, setTargetExpiry] = useState('');

  // Can edit? Only Director or Compliance Officer
  const canAmendCompliance = currentRole === 'Super Admin' || currentRole === 'Director' || currentRole === 'Compliance Officer';

  // Calculations for filtered compliance list
  const filteredCompliance = compliance.filter(rec => {
    const matchesProject = selectedProjectId === 'all' || rec.projectId === selectedProjectId;
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    return matchesProject && matchesStatus;
  });

  // Calculate stats based on active project selection
  const activeCompliance = compliance.filter(c => selectedProjectId === 'all' || c.projectId === selectedProjectId);
  const totalWeightPossible = activeCompliance.reduce((s, c) => s + c.scoreImpact, 0);
  const approvedWeightPoints = activeCompliance
    .filter(c => c.status === 'Approved')
    .reduce((s, c) => s + c.scoreImpact, 0);
  const submittedWeightPoints = activeCompliance
    .filter(c => c.status === 'Submitted')
    .reduce((s, c) => s + (c.scoreImpact * 0.5), 0); // Submitted counts half weight

  const localScore = totalWeightPossible > 0 
    ? Math.round((approvedWeightPoints + submittedWeightPoints) / totalWeightPossible * 100) 
    : 100;

  const missingApprovals = activeCompliance.filter(c => c.status !== 'Approved');
  const expiredCount = activeCompliance.filter(c => c.status === 'Expired').length;
  const criticalCount = activeCompliance.filter(c => c.status === 'Rejected').length;

  const handleSubmitStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectId) return;

    onUpdateComplianceTypeStatus(
      targetProjectId,
      targetType,
      targetStatus,
      targetExpiry || undefined
    );

    const proj = projects.find(p => p.id === targetProjectId);
    onAddLog('Compliance State Changed', `Compliance manual override of ${targetType} to ${targetStatus} for project ${proj?.name || '---'}`);
    
    setShowStatusModal(false);
    setTargetExpiry('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">STATUTORY AUDITOR</span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-0.5">Municipal Statutory Clearances</h2>
          <p className="text-xs text-slate-500 mt-0.5">Validate RERA registration, environmental clearance filings, and occupancy certificates</p>
        </div>

        {canAmendCompliance && (
          <button
            onClick={() => {
              setTargetProjectId(projects[0]?.id || '');
              setTargetType('RERA Registration');
              setTargetStatus('Approved');
              setShowStatusModal(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-colors flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Override Clearance Status</span>
          </button>
        )}
      </div>

      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Index Score */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-sans">Compliance Rating</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{localScore}%</h3>
              <span className={`text-xxs font-semibold ${localScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                ★★★★★
              </span>
            </div>
          </div>
          <p className="text-[10px] font-medium text-slate-400 mt-3 uppercase tracking-wide">
            Weighted portfolio clearance ratio
          </p>
        </div>

        {/* KPI: Missing Approvals */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-sans">Pending Milestones</span>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">{missingApprovals.length}</h3>
          </div>
          <p className="text-[10px] font-medium text-slate-400 mt-3 uppercase tracking-wide">
            Outstanding filings
          </p>
        </div>

        {/* KPI: Expired Checklists */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-sans">Expired records</span>
            <h3 className={`text-3xl font-bold tracking-tight mt-2 ${expiredCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {expiredCount}
            </h3>
          </div>
          <p className={`text-[10px] font-medium mt-3 uppercase tracking-wide ${expiredCount > 0 ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
            Requires immediate renewal
          </p>
        </div>

        {/* KPI: Rejected Workflows */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-sans">Disputed / Refused</span>
            <h3 className={`text-3xl font-bold tracking-tight mt-2 ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {criticalCount}
            </h3>
          </div>
          <p className="text-[10px] font-medium text-slate-440 mt-3 uppercase tracking-wide text-slate-400">
            Filing corrections needed
          </p>
        </div>
      </div>

      {/* Primary Content Filter matrix */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center shadow-3xs">
        
        {/* Project Selector Dropdown */}
        <div className="w-full sm:w-64">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.8 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">📂 Directory: All Active Properties</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>🏢 {p.name}</option>
            ))}
          </select>
        </div>

        {/* Status filtering dropdown */}
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.8 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">🔍 Status: All Filings</option>
            <option value="Approved">✔️ Approved / Certificate Issued</option>
            <option value="Submitted">⏳ Submitted for Review</option>
            <option value="Pending">⚠️ Pending Submission</option>
            <option value="Expired">❌ Expired</option>
            <option value="Rejected">🚫 Rejected Filing</option>
          </select>
        </div>
      </div>

      {/* Compliance Checklist Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
        {filteredCompliance.length === 0 ? (
          <div className="text-center py-16 text-slate-450 space-y-2">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-205" />
            <p className="text-xs">No statutory checklist points correspond with active selections.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Clearance Metric Category</th>
                  <th className="py-3 px-4">Authorized Property Location</th>
                  <th className="py-3 px-4">Governing Authority</th>
                  <th className="py-3 px-4">Valid Period</th>
                  <th className="py-3 px-4">Score Impact</th>
                  <th className="py-3 px-4 text-right">Filing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompliance.map(rec => {
                  const proj = projects.find(p => p.id === rec.projectId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {rec.complianceType}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {proj ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700">{proj.name}</span>
                            <span className="text-[10px] font-mono block text-slate-400">{proj.code}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-505 text-slate-500 font-medium">
                        {getGoverningAgency(rec.complianceType)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-450">
                        {rec.expiryDate ? (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Expires {rec.expiryDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xxs font-sans uppercase">Continuous Certificate</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {rec.scoreImpact} pts
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                          rec.status === 'Approved' ? 'bg-emerald-50 text-emerald-800' :
                          rec.status === 'Submitted' ? 'bg-blue-50 text-blue-800' :
                          rec.status === 'Pending' ? 'bg-amber-50 text-amber-800' :
                          'bg-rose-50 text-rose-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            rec.status === 'Approved' ? 'bg-emerald-500' :
                            rec.status === 'Submitted' ? 'bg-blue-500' :
                            rec.status === 'Pending' ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}></span>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual status update dialog Sheet */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowStatusModal(false)}></div>
          
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 font-sans text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Manual Statutory Override</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStatus} className="space-y-4">
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Property Site Location</label>
                <select
                  value={targetProjectId}
                  onChange={e => setTargetProjectId(e.target.value)}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                  required
                >
                  <option value="" disabled>Select property site...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>🏢 {p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block">Clearance Type</label>
                  <select
                    value={targetType}
                    onChange={e => setTargetType(e.target.value as ComplianceType)}
                    className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                  >
                    {complianceTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block">Clearance Status</label>
                  <select
                    value={targetStatus}
                    onChange={e => setTargetStatus(e.target.value as ComplianceStatus)}
                    className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                  >
                    <option value="Approved">✔️ Approved / Certificate Active</option>
                    <option value="Submitted">⏳ Submitted / Under Audit</option>
                    <option value="Pending">⚠️ Pending / Incomplete</option>
                    <option value="Expired">❌ Expired</option>
                    <option value="Rejected">🚫 Rejected Filing</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-600 block">Certificate Expiry Date</label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>
                <input
                  type="date"
                  value={targetExpiry}
                  onChange={e => setTargetExpiry(e.target.value)}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg border border-slate-950 cursor-pointer shadow-3xs"
              >
                Save Manual Compliance Audit Override
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
