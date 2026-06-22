import React, { useState } from 'react';
import { Project, Document, ComplianceRecord, ApprovalTask, ActivityLog, User, Role, ProjectStatus } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { settingsService } from '../services/settingsService';
import { 
  Building2, Plus, Search, Filter, Calendar, MapPin, Tag, Activity, Users, FileText, 
  CheckSquare, ArrowLeft, Edit3, UserPlus, Info, CheckCircle2, RotateCcw, AlertCircle, X
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  documents: Document[];
  compliance: ComplianceRecord[];
  approvals: ApprovalTask[];
  logs: ActivityLog[];
  allUsers: User[];
  currentRole: Role;
  currentUser: User;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  onCreateProject: (project: Omit<Project, 'id' | 'organizationId'>) => void;
  onEditProject: (projectId: string, updatedFields: Partial<Project>) => void;
  onAddLog: (action: string, details: string) => void;
}

const getGoverningAgency = (type: string) => {
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

export default function ProjectsView({
  projects,
  documents,
  compliance,
  approvals,
  logs,
  allUsers,
  currentRole,
  currentUser,
  selectedProjectId,
  setSelectedProjectId,
  onCreateProject,
  onEditProject,
  onAddLog
}: ProjectsViewProps) {
  // Permissions & Modules check
  const { selectedOrgId } = useAuthStore();
  const settings = settingsService.getTenantSettings(selectedOrgId || 'org-1');
  const enabledModules = settings?.subscription?.enabledModules || ['dashboard', 'projects', 'documents', 'settings', 'users'];
  const isApprovalsModuleOn = enabledModules.includes('approvals');
  const isComplianceModuleOn = enabledModules.includes('compliance');

  // Navigation & filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectDetailTab, setProjectDetailTab] = useState<'overview' | 'documents' | 'compliance' | 'approvals' | 'team' | 'logs'>('overview');

  // New Project Form State
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjLocation, setNewProjLocation] = useState('');
  const [newProjType, setNewProjType] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjStatus, setNewProjStatus] = useState<ProjectStatus>('Planning');
  const [newProjStart, setNewProjStart] = useState('2026-06-15');
  const [newProjEnd, setNewProjEnd] = useState('2028-12-31');
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('Active');
  const [editDesc, setEditDesc] = useState('');

  // Selected Project Details
  const activeProj = projects.find(p => p.id === selectedProjectId);
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.code.toLowerCase().includes(search.toLowerCase()) ||
                          p.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Role permissions checking
  const canModifyProject = currentRole === 'Super Admin' || currentRole === 'Director' || currentRole === 'Project Manager';

  const resetForm = () => {
    setNewProjName('');
    setNewProjCode('');
    setNewProjLocation('');
    setNewProjType('');
    setNewProjDesc('');
    setNewProjStatus('Planning');
    setNewProjStart('2026-06-15');
    setNewProjEnd('2028-12-31');
    setAssignedUsers([]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjCode) return;

    onCreateProject({
      name: newProjName,
      code: newProjCode,
      location: newProjLocation,
      projectType: newProjType,
      description: newProjDesc,
      status: newProjStatus,
      startDate: newProjStart,
      endDate: newProjEnd,
      assignedTeam: assignedUsers.map(uId => {
        const u = allUsers.find(user => user.id === uId);
        return { userId: uId, role: u ? u.role : 'Site Engineer' };
      })
    });

    onAddLog('Project Creation', `Created new project folder ${newProjName} (${newProjCode})`);
    resetForm();
    setShowCreateModal(false);
  };

  const startEdit = () => {
    if (!activeProj) return;
    setEditName(activeProj.name);
    setEditStatus(activeProj.status);
    setEditDesc(activeProj.description);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!selectedProjectId || !activeProj) return;
    onEditProject(selectedProjectId, {
      name: editName,
      status: editStatus,
      description: editDesc
    });
    onAddLog('Project Update', `Amended specifications and status to ${editStatus} on project ${editName}`);
    setIsEditing(false);
  };

  // Filtered lists for the selected project
  const projDocs = documents.filter(d => d.projectId === selectedProjectId);
  const projCompliance = compliance.filter(c => c.projectId === selectedProjectId);
  const projApprovals = approvals.filter(a => a.projectId === selectedProjectId);
  
  // Calculate average compliance score of project
  let projectScore = 100;
  if (projCompliance.length > 0) {
    const approvedPoints = projCompliance.filter(c => c.status === 'Approved').reduce((acc, c) => acc + c.scoreImpact, 0);
    const submittedPoints = projCompliance.filter(c => c.status === 'Submitted').reduce((acc, c) => acc + (c.scoreImpact * 0.5), 0);
    const totalPossible = projCompliance.reduce((acc, c) => acc + c.scoreImpact, 0);
    projectScore = totalPossible > 0 ? Math.round((approvedPoints + submittedPoints) / totalPossible * 100) : 100;
  }

  // Handle Team Member Assignment Simulation
  const [candidateTeammateId, setCandidateTeammateId] = useState('');
  const handleAssignTeammate = () => {
    if (!candidateTeammateId || !activeProj) return;
    const targetUser = allUsers.find(u => u.id === candidateTeammateId);
    if (!targetUser) return;
    
    // Check if user already exists
    if (activeProj.assignedTeam.some(t => t.userId === candidateTeammateId)) {
      alert('Representative is already active on this clearance project.');
      return;
    }

    const updatedTeam = [...activeProj.assignedTeam, { userId: candidateTeammateId, role: targetUser.role }];
    onEditProject(activeProj.id, { assignedTeam: updatedTeam });
    onAddLog('Team Update', `Assigned team member ${targetUser.name} (${targetUser.role}) to property project ${activeProj.name}`);
    setCandidateTeammateId('');
    alert(`Successfully assigned ${targetUser.name} to project site!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {selectedProjectId === null ? (
        // ==========================================
        // 1. MASTER PORTFOLIO PIPELINES (LIST VIEW)
        // ==========================================
        <div className="space-y-6">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">PORTFOLIO REGISTRAR</span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-0.5">Real Estate Property Pipelines</h2>
              <p className="text-xs text-slate-500 mt-0.5">Verify property clearances and municipal RERA registration status</p>
            </div>

            {canModifyProject && (
              <button
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-colors flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Register Property</span>
              </button>
            )}
          </div>

          {/* Filtering row */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center shadow-3xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search active assets by title code, site or city region..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs border border-slate-225 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white placeholder:text-slate-400 text-slate-800"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <div className="inline-flex border border-slate-205 rounded-lg overflow-hidden bg-slate-50/50 p-0.5 w-full md:w-auto">
                {['all', 'Active', 'Planning', 'Completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex-1 md:flex-none ${
                      statusFilter === status 
                        ? 'bg-white text-slate-900 font-semibold shadow-3xs' 
                        : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    {status === 'all' ? 'All Sites' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clean Property Pipeline Grid */}
          {filteredProjects.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-16 text-center text-slate-400 space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-200" />
              <p className="text-xs">No active pipeline properties matches current filtration criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(p => {
                const pDocs = documents.filter(d => d.projectId === p.id);
                const pCompliances = compliance.filter(c => c.projectId === p.id);
                const approvedCount = pCompliances.filter(c => c.status === 'Approved').length;

                return (
                  <div 
                    key={p.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-3xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      
                      {/* Top stats */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-semibold tracking-tight">
                            {p.code}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {p.name}
                          </h3>
                        </div>
                        <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'Active' ? 'bg-emerald-50 text-emerald-800' :
                          p.status === 'Planning' ? 'bg-amber-50 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {p.description}
                      </p>

                      <div className="flex items-center gap-3 text-xxs text-slate-405 font-sans font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {p.location}
                        </span>
                        <span>•</span>
                        <span>{p.projectType}</span>
                      </div>

                      {/* Small Progress indicators */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-50">
                        <div className="flex justify-between text-[11px] font-medium text-slate-450">
                          <span>Statutory clearance progress</span>
                          <span className="font-semibold text-slate-700">
                            {approvedCount} / {pCompliances.length} Approved
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-slate-900 h-full rounded-full transition-all"
                            style={{ 
                              width: `${pCompliances.length > 0 ? (approvedCount / pCompliances.length * 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                    </div>

                    <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider">
                        📂 {pDocs.length} Cataloged pdfs
                      </span>
                      <button
                        onClick={() => setSelectedProjectId(p.id)}
                        className="text-slate-800 hover:text-slate-950 hover:underline font-semibold cursor-pointer"
                      >
                        Inspect Site Profile →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        // ==========================================
        // 2. DETAILED SITE PROPERTY FILE INTERVIEW (SINGLE VIEW)
        // ==========================================
        <div className="space-y-6">
          
          {/* Detailed Profile Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <button
              onClick={() => setSelectedProjectId(null)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Reset to Portfolio List
            </button>

            {canModifyProject && (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 p-1 px-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer shadow-3xs"
              >
                <Edit3 className="w-3.5 h-3.5" /> Modify Property Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Project Details Columns Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-3xs">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-150 px-1.5 py-0.5 rounded font-semibold">{activeProj?.code}</span>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{activeProj?.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">{activeProj?.description}</p>
              </div>

              {/* Status table specs */}
              <div className="border-t border-slate-100 pt-3 space-y-2 font-sans text-xs text-slate-500">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Pipeline Status</span>
                  <span className="font-semibold text-slate-800 uppercase">{activeProj?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Site Region</span>
                  <span className="font-semibold text-slate-800">{activeProj?.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Class</span>
                  <span className="font-semibold text-slate-800">{activeProj?.projectType}</span>
                </div>
                {isComplianceModuleOn ? (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Portfolio health score</span>
                    <span className="font-bold text-slate-800 text-right">{projectScore}%</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Total documents</span>
                    <span className="font-bold text-slate-800 text-right">{projDocs.length} files</span>
                  </div>
                )}
              </div>

              {/* RERA and PMC specifics */}
              {isComplianceModuleOn ? (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <h4 className="font-semibold text-slate-700 font-sans mb-1 uppercase tracking-tight text-[10px]">PMC Compliance targets</h4>
                  <p className="text-slate-500 text-[11px]">All submissions must be certified under structural guidelines. Land title registrations are validated offline by legal counsel.</p>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <h4 className="font-semibold text-slate-700 font-sans mb-1 uppercase tracking-tight text-[10px]">Document Library</h4>
                  <p className="text-slate-500 text-[11px]">All document versions are archived securely. Use the site vault tab to upload and track PDFs or drawings.</p>
                </div>
              )}
            </div>

            {/* Right Submenus navigation area */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Detailed Inner Tab Selectors */}
              <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs pb-1 shrink-0">
                {[
                  { id: 'overview', label: 'Property Summary' },
                  { id: 'documents', label: 'Site S3 vault' },
                  ...(isComplianceModuleOn ? [{ id: 'compliance', label: 'Municipal compliance checklist' }] : []),
                  { id: 'team', label: 'Active Personnel Desk' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setProjectDetailTab(tab.id as any)}
                    className={`py-1.5 px-3 font-semibold transition-all cursor-pointer border-b-2 ${
                      projectDetailTab === tab.id
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Renders */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs min-h-[300px]">
                
                {/* 1. Inside Overview */}
                {projectDetailTab === 'overview' && (
                  <div className="space-y-4 font-sans text-xs">
                    <h5 className="font-bold text-slate-900 uppercase tracking-tight text-[11px]">Construction Timelines & Audits</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Commencement</span>
                        <span className="font-semibold text-slate-700">{activeProj?.startDate}</span>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Projected Signoff</span>
                        <span className="font-semibold text-slate-700">{activeProj?.endDate}</span>
                      </div>
                    </div>

                    {isComplianceModuleOn && (
                      <div className="space-y-2 pt-2 border-t border-slate-50">
                        <span className="font-semibold text-slate-700 text-[11px] block">Clearance Health Ratios</span>
                        <div className="flex gap-1">
                          <div className="flex-1 bg-emerald-50 border border-emerald-100 p-2 text-center rounded-lg">
                            <span className="text-[10px] text-slate-400 block font-semibold">Approved Certs</span>
                            <span className="text-sm font-bold text-emerald-700">{projCompliance.filter(c => c.status === 'Approved').length}</span>
                          </div>
                          <div className="flex-1 bg-amber-50/40 border border-amber-100 p-2 text-center rounded-lg">
                            <span className="text-[10px] text-slate-400 block font-semibold">Awaiting Verification</span>
                            <span className="text-sm font-bold text-amber-700">{projCompliance.filter(c => c.status === 'Submitted' || c.status === 'Pending').length}</span>
                          </div>
                          <div className="flex-1 bg-rose-50 border border-rose-100 p-2 text-center rounded-lg">
                            <span className="text-[10px] text-slate-400 block font-semibold">Hazards</span>
                            <span className="text-sm font-bold text-rose-700">{projCompliance.filter(c => c.status === 'Expired' || c.status === 'Rejected').length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Document checklist */}
                {projectDetailTab === 'documents' && (
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <h5 className="font-bold text-slate-905 uppercase tracking-wide text-[10px]">Property Catalog Pdfs</h5>
                      <span className="text-xxs font-mono text-slate-400">{projDocs.length} files located</span>
                    </div>

                    {projDocs.length === 0 ? (
                      <p className="text-slate-400 italic py-10 text-center">No active cloud assets uploaded to this property partition directory yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {projDocs.map(doc => (
                          <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 p-2 rounded transition-all">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 block">{doc.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{doc.id} • latest v{doc.latestVersion}</span>
                            </div>
                            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                              doc.status === 'Active' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-650'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Statutory checkpoints checklist */}
                {projectDetailTab === 'compliance' && (
                  <div className="space-y-3 font-sans text-xs">
                    <div className="pb-2 border-b border-slate-50">
                      <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Municipal Statutory Checkpoints</h5>
                    </div>

                    {projCompliance.length === 0 ? (
                      <p className="text-slate-405 italic py-10 text-center">No statutory clearance nodes assigned to this site pipeline yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {projCompliance.map(rec => (
                          <div key={rec.id} className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-1.5 hover:border-slate-200">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-800">{rec.complianceType}</span>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                rec.status === 'Approved' ? 'bg-emerald-50 text-emerald-800' :
                                rec.status === 'Submitted' ? 'bg-blue-50 text-blue-800' :
                                'bg-rose-50 text-rose-800'
                              }`}>{rec.status}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-sans uppercase">
                              <span>Agency: {getGoverningAgency(rec.complianceType)}</span>
                              <span>Weight: {rec.scoreImpact} points</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Team representatives checklist */}
                {projectDetailTab === 'team' && (
                  <div className="space-y-5 font-sans text-xs">
                    <div className="pb-2 border-b border-slate-50 flex justify-between items-center">
                      <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Authorized Representatives & PMC Architect</h5>
                    </div>

                    <div className="space-y-2">
                      {activeProj?.assignedTeam.map(t => {
                        const representative = allUsers.find(u => u.id === t.userId);
                        return representative ? (
                          <div key={t.userId} className="p-3 bg-slate-50 border border-slate-105 rounded-xl flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 block">{representative.name}</span>
                              <span className="text-[10px] text-slate-405 font-mono block uppercase">{t.role} Desk • {representative.email}</span>
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-600 border border-slate-150 uppercase font-sans">
                              Site authorized
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>

                    {/* PMC Addition Action and Personnel add tool */}
                    {canModifyProject && (
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <label className="font-semibold text-slate-600 block text-[10px] uppercase tracking-wider font-sans">Assign Representative / Consultant Partner</label>
                        <div className="flex gap-2">
                          <select
                            value={candidateTeammateId}
                            onChange={e => setCandidateTeammateId(e.target.value)}
                            className="bg-white border border-slate-205 rounded-lg p-2 flex-1 text-xs focus:outline-none"
                          >
                            <option value="">Choose partner analyst from representative ledger...</option>
                            {allUsers
                              .filter(u => !activeProj?.assignedTeam.some(t => t.userId === u.id))
                              .map(u => (
                                <option key={u.id} value={u.id}>
                                  👤 {u.name} ({u.role})
                                </option>
                              ))
                            }
                          </select>
                          <button
                            onClick={handleAssignTeammate}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Assign Site Partner
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Collapsible Edit parameters Sheet */}
          {isEditing && activeProj && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsEditing(false)}></div>
              
              <div className="relative bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Amend property parameters</h3>
                  <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 block">Workspace Title</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full p-2 border border-slate-205 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 block">Detailed Description</label>
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      className="w-full p-2 border border-slate-205 rounded-lg focus:outline-none h-20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 block">Pipeline Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as ProjectStatus)}
                      className="w-full p-2 border border-slate-205 bg-white rounded-lg focus:outline-none"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <button
                    onClick={saveEdit}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg cursor-pointer transition-colors shadow-3xs"
                  >
                    Amend property specifications
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Workspace Creation registration dialog Sheet */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowCreateModal(false)}></div>
          
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Register Corporate Development Asset</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Workspace Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Skyline Heights"
                    value={newProjName}
                    onChange={e => setNewProjName(e.target.value)}
                    className="w-full p-2 border border-slate-205 rounded-lg focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Unique Code Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. PRE-03"
                    value={newProjCode}
                    onChange={e => setNewProjCode(e.target.value)}
                    className="w-full p-2 border border-slate-205 rounded-lg focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Site Region/City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Metro Area"
                    value={newProjLocation}
                    onChange={e => setNewProjLocation(e.target.value)}
                    className="w-full p-2 border border-slate-205 rounded-lg focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Building Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Mixed Residential Complex"
                    value={newProjType}
                    onChange={e => setNewProjType(e.target.value)}
                    className="w-full p-2 border border-slate-205 rounded-lg focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Pipeline Status</label>
                <select
                  value={newProjStatus}
                  onChange={e => setNewProjStatus(e.target.value as ProjectStatus)}
                  className="w-full p-2 border border-slate-205 bg-white rounded-lg focus:outline-none"
                >
                  <option value="Planning">Planning Phase</option>
                  <option value="Active">Operational / Groundbreaking</option>
                  <option value="Completed">Completed Profile</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Property Brief Summary</label>
                <textarea
                  placeholder="PMC target, legal deeds summary, land clearances requirements..."
                  value={newProjDesc}
                  onChange={e => setNewProjDesc(e.target.value)}
                  className="w-full p-2 border border-slate-205 rounded-lg focus:outline-none h-16"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg cursor-pointer shadow-3xs"
              >
                Launch Secure Property Pipeline
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
