import React, { useState } from 'react';
import { Project, Document, ComplianceRecord, ApprovalTask, ActivityLog, Role, User } from '../types';
import { settingsService } from '../services/settingsService';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Building2, FileText, CheckSquare, ShieldAlert, TrendingUp, 
  Calendar, AlertTriangle, ArrowRight, UserCheck, ShieldCheck, 
  Clock, Activity, ArrowUpRight, Database, RefreshCw, Smartphone,
  Info, Sparkles, Sliders, ChevronRight
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  documents: Document[];
  compliance: ComplianceRecord[];
  approvals: ApprovalTask[];
  logs: ActivityLog[];
  onNavigate: (tab: string) => void;
  onSelectProject: (projectId: string) => void;
  complianceScore: number;
  
  // Sandbox parameters
  currentRole?: Role;
  onSelectRole?: (role: Role) => void;
  allTenantUsers?: User[];
  onResetDatabase?: () => void;
}

export default function DashboardView({
  projects,
  documents,
  compliance,
  approvals,
  logs,
  onNavigate,
  onSelectProject,
  complianceScore,
  currentRole,
  onSelectRole,
  allTenantUsers = [],
  onResetDatabase
}: DashboardProps) {
  const selectedOrgId = useAuthStore((state) => state.selectedOrgId);
  const settings = settingsService.getTenantSettings(selectedOrgId || 'org-1');
  const enabledModules = settings?.subscription?.enabledModules || [];
  const isApprovalsModuleOn = enabledModules.includes('approvals');
  const isComplianceModuleOn = enabledModules.includes('compliance');

  // Toggle for Right Activity Rail
  const [isActivityRailExpanded, setIsActivityRailExpanded] = useState(true);

  // Statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const totalDocs = documents.length;
  const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;
  
  const today = new Date('2026-06-14');
  const expiringRecords = compliance.filter(c => {
    if (!c.expiryDate) return false;
    const expDate = new Date(c.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return c.status === 'Expired' || (c.status === 'Approved' && diffDays > 0 && diffDays <= 90);
  });

  const criticalAlerts = compliance.filter(c => c.status === 'Expired' || c.status === 'Rejected');

  // Interactive Project Compliance Status List
  const projectSummaries = projects.map(proj => {
    const projCompliances = compliance.filter(c => c.projectId === proj.id);
    const projDocs = documents.filter(d => d.projectId === proj.id);
    
    let score = 100;
    if (projCompliances.length > 0) {
      const approvedPoints = projCompliances
        .filter(c => c.status === 'Approved')
        .reduce((sum, c) => sum + c.scoreImpact, 0);
      const submittedPoints = projCompliances
        .filter(c => c.status === 'Submitted')
        .reduce((sum, c) => sum + (c.scoreImpact * 0.5), 0);
      const totalPossiblePoints = projCompliances.reduce((sum, c) => sum + c.scoreImpact, 0);
      
      score = totalPossiblePoints > 0 
        ? Math.round((approvedPoints + submittedPoints) / totalPossiblePoints * 100) 
        : 100;
    }

    return {
      id: proj.id,
      name: proj.name,
      code: proj.code,
      location: proj.location,
      status: proj.status,
      docsCount: projDocs.length,
      score: score
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans select-none dark:text-slate-100">
      
      {/* Upper Grid Layout: Column 1 is main, Column 2 is dedicated Right Activity Rail */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Side (3 columns wide) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Welcome Greeting Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-colors duration-150">
            <div className="absolute right-0 bottom-0 top-0 opacity-[0.03] dark:opacity-[0.05] w-1/3 flex items-center justify-center pointer-events-none select-none">
              <Building2 className="w-56 h-56 text-slate-800 dark:text-slate-100" />
            </div>
            <div className="relative z-10 max-w-2xl space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-305 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                🏢 EXECUTIVE CONTROL PORTAL
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans mt-1">
                Real Estate Development & Compliance Dashboard
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-sans font-medium">
                Welcome to BuildVault. Monitor statutory clearances, verify RERA compliance targets, dispatch critical construction sign-offs, and inspect active legal and structural records across all portfolio properties.
              </p>
            </div>
          </div>

          {/* Modern Standalone KPI Cards */}
          {(() => {
            const visibleCardsCount = 3 + (isApprovalsModuleOn ? 1 : 0) + (isComplianceModuleOn ? 1 : 0);
            const gridColsClass = 
              visibleCardsCount === 3 
                ? 'lg:grid-cols-3' 
                : visibleCardsCount === 4 
                  ? 'lg:grid-cols-4' 
                  : 'lg:grid-cols-5';

            return (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4`}>
                
                {/* Metric 1: Active Projects */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">Active Projects</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeProjects}</h3>
                      <p className="text-[10px] inline-flex items-center gap-1 font-semibold text-slate-400 dark:text-slate-500 font-sans mt-0.5">
                        Out of {totalProjects} total
                      </p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 text-[#115e59] rounded-xl border border-slate-200 dark:border-slate-700/50">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                  </div>
                </div>

                {/* Metric 2: Documents */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">Documents</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalDocs}</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-sans uppercase tracking-wider mt-0.5">Secure Vault Storage</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700/50">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                  </div>
                </div>

                {/* Metric 3: Pending Approvals */}
                {isApprovalsModuleOn && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">Pending Approvals</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{pendingApprovals}</h3>
                        <p className={`text-[10px] font-bold font-sans mt-0.5 ${pendingApprovals > 0 ? 'text-amber-600 dark:text-[#F59E0B]' : 'text-slate-405 dark:text-slate-400'}`}>
                          {pendingApprovals > 0 ? 'Awaiting verification' : 'All clear'}
                        </p>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 text-[#eab308] rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <CheckSquare className="w-4.5 h-4.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Metric 4: Compliance Score */}
                {isComplianceModuleOn && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">Compliance Score</p>
                        <h3 className="text-3xl font-black text-slate-909 dark:text-white tracking-tight">{complianceScore}%</h3>
                        <div className="w-18 bg-slate-100 dark:bg-slate-800 h-1 mt-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500 bg-[#7C3AED]"
                            style={{ width: `${complianceScore}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 text-[#7C3AED] rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Metric 5: Users */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">Users</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{allTenantUsers.length}</h3>
                      <p className="text-[10px] text-emerald-600 dark:text-[#16A34A] uppercase font-bold font-sans mt-0.5">
                        Authorized Team
                      </p>
                    </div>
                    <div className="bg-[#eefcf9] dark:bg-emerald-950/20 p-2 text-emerald-600 dark:text-[#16A34A] rounded-xl border border-emerald-100 dark:border-emerald-955/30">
                      <UserCheck className="w-4.5 h-4.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Active Properties Portfolio Status */}
          <div className={`grid grid-cols-1 ${isComplianceModuleOn ? 'lg:grid-cols-3' : ''} gap-6`}>
            
            {/* Project compliance table */}
            <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 ${isComplianceModuleOn ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4 shadow-xs transition-colors duration-150`}>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">Active Properties Portfolio Status</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-505 font-medium mt-0.5">File metrics across active properties</p>
                </div>
                <button 
                  onClick={() => onNavigate('projects')}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer font-semibold font-sans shadow-3xs"
                >
                  All Projects <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 pt-1">
                {projectSummaries.map(proj => (
                  <div 
                    key={proj.id} 
                    onClick={() => { onSelectProject(proj.id); onNavigate('projects'); }}
                    className="group p-3 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-805 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/80">
                          {proj.code}
                        </span>
                        <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs tracking-tight group-hover:text-blue-600 dark:group-hover:text-[#0EA5E9] transition-colors font-sans">
                          {proj.name}
                        </h5>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{proj.location}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 dark:text-slate-540 block font-semibold uppercase">Cataloged Docs</span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{proj.docsCount} files</span>
                      </div>

                      {isComplianceModuleOn && (
                        <>
                          <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative" title={`Score: ${proj.score}%`}>
                            <div 
                              className="h-full rounded-full bg-[#0EA5E9]"
                              style={{ width: `${proj.score}%` }}
                            ></div>
                          </div>

                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full inline-block w-14 text-center ${
                            proj.score >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400' : 
                            proj.score >= 50 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-805 dark:text-amber-400' : 
                            'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400'
                          }`}>
                            {proj.score}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Compliance Health Circle Score Gauge */}
            {isComplianceModuleOn && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-5 shadow-xs flex flex-col justify-between transition-colors duration-150">
              <div>
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">Portfolio Clearance Health</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-505 font-medium mt-0.5">Corporate clearance rate compiled from weighted indices</p>
                </div>

                {/* Circular Gauge */}
                <div className="flex flex-col items-center justify-center py-5">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        fill="transparent"
                        stroke="#f1f5f9"
                        className="dark:stroke-slate-800"
                        strokeWidth="8"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        fill="transparent"
                        stroke={complianceScore >= 80 ? '#16A34A' : complianceScore >= 60 ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - complianceScore / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute text-center flex flex-col justify-center items-center">
                      <span className="text-2xl font-black text-slate-905 dark:text-white font-sans tracking-tight">{complianceScore}%</span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-0.5">
                        {complianceScore >= 85 ? 'Secure' : complianceScore >= 65 ? 'Warning' : 'Critical'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub score table */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-801/40 p-1 rounded transition-colors font-sans">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                      <span>Approved Clearances</span>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {compliance.filter(c => c.status === 'Approved').length}
                    </span>
                  </div>

                  <div className="flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-801/40 p-1 rounded transition-colors font-sans">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#0EA5E9]"></span>
                      <span>Pending Verification</span>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {compliance.filter(c => c.status === 'Submitted' || c.status === 'Pending').length}
                    </span>
                  </div>

                  <div className="flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-801/40 p-1 rounded transition-colors font-sans text-rose-600 dark:text-[#DC2626]">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                      <span>Expired / Hazards</span>
                    </div>
                    <span className="font-extrabold">
                      {compliance.filter(c => c.status === 'Expired' || c.status === 'Rejected').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button 
                  onClick={() => onNavigate('compliance')}
                  className="w-full text-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 py-2.5 rounded-lg bg-white dark:bg-slate-90 shadow-3xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  Verify Compliance <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
            )}

          </div>

        </div>

        {/* Right Column: Executive Activity Rail Sidebar (Exactly as requested) */}
        <div className="xl:col-span-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs flex flex-col h-[calc(100vh-10rem)] max-h-[850px] sticky top-24 overflow-y-auto space-y-6 transition-colors duration-150">
          
          {/* Header of Activity Rail */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center select-none shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="text-[#0EA5E9] w-4.5 h-4.5" />
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-sans">
                Activity Rail
              </h4>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {/* Critical Expiry Alerts */}
          {isComplianceModuleOn && (
            <div className="space-y-3 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-500 tracking-wider block">Risk Review Queue</span>
              <div className="space-y-2">
                {criticalAlerts.length === 0 && expiringRecords.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs font-sans">
                    No critical risks.
                  </div>
                ) : (
                  <>
                    {criticalAlerts.slice(0, 2).map(rec => {
                      const proj = projects.find(p => p.id === rec.projectId);
                      return (
                        <div key={rec.id} className="p-3 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-2.5">
                          <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-[#DC2626] p-1.5 rounded-lg mt-0.5 shrink-0">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5 font-sans">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[8px] font-extrabold text-rose-700 dark:text-[#DC2626] bg-rose-100/40 dark:bg-rose-950/30 px-1 py-0.5 rounded">
                                HAZARD
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-400">{proj?.code}</span>
                            </div>
                            <h5 className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">{rec.complianceType}</h5>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                              Filing rejected or expired. Urgent renewal requested.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {expiringRecords.filter(r => r.status === 'Approved').slice(0, 1).map(rec => {
                      const proj = projects.find(p => p.id === rec.projectId);
                      return (
                        <div key={rec.id} className="p-3 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-105 dark:border-amber-900/30 rounded-xl flex items-start gap-2.5">
                          <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-750 dark:text-[#F59E0B] p-1.5 rounded-lg mt-0.5 shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5 font-sans">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[8px] font-extrabold text-amber-700 dark:text-[#F59E0B] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                                RENEWAL RISK
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-400">{proj?.code}</span>
                            </div>
                            <h5 className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">{rec.complianceType}</h5>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal font-medium">Expires on {rec.expiryDate}</p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Secure Audit Trail Feed (Immutable list) */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-500 tracking-wider block shrink-0">Immutable Audit Trail</span>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {logs.map(log => {
                const isApproval = log.action === 'Approval' || log.action === 'Rejection';
                const isUpload = log.action === 'Upload';
                const isCreation = log.action === 'Project Creation' || log.action === 'User Creation';

                return (
                  <div key={log.id} className="text-xs flex gap-2.5 items-start border-b border-slate-50 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0 font-sans">
                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest text-[#0ea5e9] text-center uppercase mt-0.5 w-18 shrink-0 truncate border ${
                      isApproval ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400' :
                      isUpload ? 'bg-blue-50 dark:bg-blue-905/20 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-sky-400' :
                      isCreation ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 text-purple-800 dark:text-purple-400' :
                      'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350'
                    }`}>
                      {log.action}
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="text-slate-700 dark:text-slate-300 leading-snug text-[11px] font-sans font-medium">{log.details}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                        <span className="text-slate-550 dark:text-slate-400 truncate max-w-[65px]">{log.userName}</span>
                        <span>•</span>
                        <span className="shrink-0">{log.timestamp.split('T')[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
