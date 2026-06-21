import React, { useState } from 'react';
import { ApprovalTask, Role, User, Project } from '../types';
import { 
  CheckCircle2, AlertTriangle, MessageSquare, History, UserCheck, 
  Calendar, FileText, ArrowRight, ShieldCheck, CornerDownRight, Check, X,
  LayoutGrid, List, CheckSquare, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';

interface ApprovalsProps {
  projects: Project[];
  approvals: ApprovalTask[];
  currentRole: Role;
  currentUser: User;
  onApproveWorkflow: (taskId: string, comment: string) => void;
  onRejectWorkflow: (taskId: string, comment: string) => void;
  onRequestChangesWorkflow: (taskId: string, comment: string) => void;
  onAddLog: (action: string, details: string) => void;
}

export default function ApprovalsView({
  projects,
  approvals,
  currentRole,
  currentUser,
  onApproveWorkflow,
  onRejectWorkflow,
  onRequestChangesWorkflow,
  onAddLog
}: ApprovalsProps) {
  // Navigation
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Can review? Directors, Compliance Officers, Legal Teams, Super Admins
  const canReview = currentRole === 'Super Admin' || currentRole === 'Director' || currentRole === 'Compliance Officer' || currentRole === 'Legal Team';

  const activeTask = approvals.find(a => a.id === selectedTaskId);
  const activeTaskProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : null;

  const handleAction = (taskId: string, actionType: 'Approve' | 'Reject' | 'RequestChanges', commentText: string) => {
    if (!commentText.trim()) {
      alert('Please provide comment/rationale for this audit ledger action.');
      return;
    }

    const task = approvals.find(a => a.id === taskId);
    if (!task) return;

    if (actionType === 'Approve') {
      onApproveWorkflow(taskId, commentText);
      onAddLog('Approval', `Approved documentation workflow for: ${task.documentName}`);
    } else if (actionType === 'Reject') {
      onRejectWorkflow(taskId, commentText);
      onAddLog('Rejection', `Rejected document verification for: ${task.documentName}`);
    } else {
      onRequestChangesWorkflow(taskId, commentText);
      onAddLog('Requested Changes', `Demanded revisions on: ${task.documentName}`);
    }

    alert(`Successfully registered action: ${actionType}`);
    setFeedbackComment('');
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  // Groups for Kanban lanes
  const pendingTasks = approvals.filter(a => a.status === 'Pending');
  const approvedTasks = approvals.filter(a => a.status === 'Approved');
  const revisionTasks = approvals.filter(a => a.status === 'Revision Required');
  const rejectedTasks = approvals.filter(a => a.status === 'Rejected');

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans select-none dark:text-slate-100">
      
      {/* Title Header with Switch */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl transition-colors duration-150 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-widest font-mono">SIGN-OFF PORTAL</span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">Statutory Sign-off Center</h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5 font-medium">Provide legal validation, structural certificate endorsements, and executive approvals</p>
        </div>

        {/* View Mode Switcher tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xs self-stretch sm:self-auto select-none border border-slate-200/40 dark:border-slate-700/40">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-3xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-3xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List Queue</span>
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start select-none">
          
          {/* COLUMN 1: Pending */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 min-h-[450px]">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-amber-700 dark:text-[#f59e0b] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></span>
                Awaiting Signatures ({pendingTasks.length})
              </span>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-605 text-xxs font-medium font-sans">
                  No critical sign-offs pending.
                </div>
              ) : (
                pendingTasks.map(apr => {
                  const proj = projects.find(p => p.id === apr.projectId);
                  return (
                    <div 
                      key={apr.id}
                      className="bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-3xs space-y-3"
                    >
                      <div className="space-y-1 font-sans">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[8px] font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-1.5 py-0.5 rounded">
                            {apr.category}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block shrink-0">{proj?.code}</span>
                        </div>
                        <h4 className="font-extrabold text-[#0F172A] dark:text-white text-xs leading-normal">
                          {apr.documentName}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          By: <strong className="font-semibold text-slate-550 dark:text-slate-350">{apr.requestedBy}</strong> ({apr.requestedRole})
                        </p>
                      </div>

                      {/* Direct Kanban Actions if User can review */}
                      {canReview ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <input 
                            id={`kanban-comments-${apr.id}`}
                            type="text" 
                            placeholder="Add sign-off notes..."
                            className="w-full text-[10.5px] p-1.5 border border-slate-200 dark:border-slate-800 rounded-md bg-transparent focus:outline-none placeholder-slate-400 text-slate-900 dark:text-slate-100 dark:bg-slate-900"
                          />
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => {
                                const commentEl = document.getElementById(`kanban-comments-${apr.id}`) as HTMLInputElement;
                                const val = commentEl?.value || 'Endorsed in Kanban board';
                                handleAction(apr.id, 'Approve', val);
                              }}
                              className="px-1 py-1 text-[9px] font-bold uppercase transition-all bg-emerald-600 dark:bg-emerald-900/40 text-white dark:text-emerald-400 rounded hover:bg-emerald-700 cursor-pointer text-center"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const commentEl = document.getElementById(`kanban-comments-${apr.id}`) as HTMLInputElement;
                                const val = commentEl?.value || 'Requested correction step';
                                handleAction(apr.id, 'RequestChanges', val);
                              }}
                              className="px-1 py-1 text-[9px] font-bold uppercase transition-all bg-slate-900 dark:bg-slate-800 text-slate-100 dark:text-slate-300 rounded hover:bg-slate-800 cursor-pointer text-center"
                            >
                              Revise
                            </button>
                            <button
                              onClick={() => {
                                const commentEl = document.getElementById(`kanban-comments-${apr.id}`) as HTMLInputElement;
                                const val = commentEl?.value || 'Rejected filing validation';
                                handleAction(apr.id, 'Reject', val);
                              }}
                              className="px-1 py-1 text-[9px] font-bold uppercase transition-all bg-rose-600 dark:bg-rose-950/20 text-white dark:text-rose-400 rounded hover:bg-rose-700 cursor-pointer text-center"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-[#F59E0B] italic pt-1 border-t border-slate-50 dark:border-slate-800/60 font-sans">
                          Switch role to corporate "Director" to sign.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: Approved / Signed */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 min-h-[450px]">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-405 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved & Off-loaded ({approvedTasks.length})
              </span>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {approvedTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-605 text-xxs font-sans font-medium">
                  No files signed-off yet.
                </div>
              ) : (
                approvedTasks.map(apr => {
                  const proj = projects.find(p => p.id === apr.projectId);
                  return (
                    <div 
                      key={apr.id}
                      className="bg-white dark:bg-slate-900 p-3 bg-white border border-slate-200 dark:border-slate-850 rounded-xl shadow-3xs space-y-2 opacity-85 hover:opacity-100 transition-opacity"
                    >
                      <div className="space-y-0.5 min-w-0 font-sans text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold uppercase text-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                            SIGNED
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400">{proj?.code}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate leading-snug">
                          {apr.documentName}
                        </h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Verified: {apr.requestedDate}</p>
                      </div>

                      {apr.comments && (
                        <div className="p-2 bg-slate-50 dark:bg-slate-805 rounded border border-slate-100 dark:border-slate-700 text-[10px] italic text-slate-500 dark:text-slate-400 leading-tight">
                          "{apr.comments}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: Revision Required */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 min-h-[450px]">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-purple-700 dark:text-[#7C3AED] flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" />
                Under Revision ({revisionTasks.length})
              </span>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {revisionTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-605 text-xxs font-sans font-medium">
                  All clean bounds.
                </div>
              ) : (
                revisionTasks.map(apr => {
                  const proj = projects.find(p => p.id === apr.projectId);
                  return (
                    <div 
                      key={apr.id}
                      className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-850 rounded-xl shadow-3xs space-y-2"
                    >
                      <div className="space-y-0.5 min-w-0 font-sans text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold uppercase text-purple-800 bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded">
                            REVISE
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400">{proj?.code}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs truncate">
                          {apr.documentName}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">By {apr.requestedBy}</p>
                      </div>

                      {apr.comments && (
                        <div className="p-2 bg-purple-50/40 dark:bg-purple-955/20 rounded border border-purple-100/50 dark:border-purple-900/30 text-[10px] italic text-[#7C3AED] leading-snug">
                          Remarks: "{apr.comments}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 4: Rejected */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 min-h-[450px]">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-405 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Rejected / Hazards ({rejectedTasks.length})
              </span>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {rejectedTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-605 text-xxs font-sans font-medium">
                  No records rejected.
                </div>
              ) : (
                rejectedTasks.map(apr => {
                  const proj = projects.find(p => p.id === apr.projectId);
                  return (
                    <div 
                      key={apr.id}
                      className="bg-white dark:bg-slate-900 p-3 bg-white border border-slate-200 dark:border-slate-850 rounded-xl shadow-3xs space-y-2 opacity-80"
                    >
                      <div className="space-y-0.5 min-w-0 font-sans text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold uppercase text-white bg-rose-600 px-1.5 py-0.5 rounded">
                            REJECTED
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400">{proj?.code}</span>
                        </div>
                        <h4 className="font-extrabold text-[#DC2626] text-xs truncate leading-snug">
                          {apr.documentName}
                        </h4>
                      </div>

                      {apr.comments && (
                        <div className="p-2 bg-rose-50/30 dark:bg-rose-950/20 rounded border border-rose-100/50 dark:border-[#DC2626]/20 text-[10px] italic text-[#DC2626] leading-snug">
                          Reason: "{apr.comments}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ================= ORIGINAL LIST VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: List Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl lg:col-span-2 space-y-4 p-5 shadow-xs transition-colors duration-150">
            <div className="pb-2.5 border-b border-slate-105 dark:border-slate-800 flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                Workflow Verification Queue ({approvals.length} files)
              </h4>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {approvals.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <p className="font-sans">All desks are clear. No pending sign-off validation requests at this level.</p>
                </div>
              ) : (
                approvals.map(apr => {
                  const isSelected = apr.id === selectedTaskId;
                  return (
                    <div
                      key={apr.id}
                      onClick={() => { setSelectedTaskId(apr.id); setFeedbackComment(''); }}
                      className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                        isSelected 
                          ? 'border-slate-805 bg-slate-50/50 dark:bg-slate-800/50 dark:border-[#0EA5E9]' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-705'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 min-w-0 font-sans text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded tracking-wide border border-slate-200/50 dark:border-slate-700">
                              {apr.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono inline-flex items-center gap-1 font-bold">
                              <Calendar className="w-3.5 h-3.5" /> {apr.requestedDate}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-100 truncate">
                            {apr.documentName}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Requested by: <strong className="text-slate-700 dark:text-slate-305 font-bold">{apr.requestedBy}</strong> ({apr.requestedRole})
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full shrink-0 ${
                          apr.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400' :
                          apr.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#f59e0b]' :
                          apr.status === 'Revision Required' ? 'bg-purple-50 dark:bg-purple-950/20 text-[#7C3AED]' :
                          'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400'
                        }`}>
                          {apr.status}
                        </span>
                      </div>

                      {apr.comments && (
                        <div className="bg-slate-55 dark:bg-slate-805 p-2.5 rounded-lg border border-slate-100 dark:border-slate-705 text-xxs leading-relaxed italic text-slate-500 dark:text-slate-450 font-sans">
                          "{apr.comments}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detail Pane view */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 min-h-[300px] transition-colors duration-150">
              {activeTask ? (
                <div className="space-y-4 font-sans text-xs">
                  
                  {/* Header */}
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-bold uppercase text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/20 px-2.5 py-1 rounded tracking-wide font-sans mt-0.5 inline-block">
                      Active Verification Sheet
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2 leading-snug">{activeTask.documentName}</h4>
                    <p className="text-[9px] text-slate-400 font-mono font-bold mt-1">Ref UUID: {activeTask.id}</p>
                  </div>

                  {/* Meta details */}
                  <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div className="bg-slate-50 dark:bg-slate-805 p-3 rounded-xl border border-slate-100 dark:border-slate-705">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Authorized Property</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono block mt-0.5">{activeTaskProject?.name || 'Global Property'}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-805 p-3 rounded-xl border border-slate-100 dark:border-slate-705">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Initiation Date</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono block mt-0.5">{activeTask.requestedDate}</span>
                    </div>
                  </div>

                  {/* History remarks thread */}
                  {activeTask.history && activeTask.history.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-405 uppercase tracking-widest block font-mono">Filing Remarks Thread</span>
                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 font-sans">
                        {activeTask.history.map((entry, index) => (
                          <div key={entry.id || index} className="py-2 first:pt-0 last:pb-0 text-[10.5px] space-y-1 font-sans text-left">
                            <p className={`font-bold ${
                              entry.action === 'Approved' ? 'text-emerald-700' :
                              entry.action === 'Rejected' ? 'text-[#DC2626]' :
                              'text-slate-705 dark:text-slate-300'
                            }`}>
                              [{entry.action}] {entry.comment ? `"${entry.comment}"` : 'Status transition logged.'}
                            </p>
                            <div className="flex justify-between text-slate-400 text-[9.5px] font-bold">
                              <span>{entry.user} ({entry.role})</span>
                              <span>{entry.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decision form input */}
                  {activeTask.status === 'Pending' ? (
                    canReview ? (
                      <div className="space-y-4 pt-2 border-t border-slate-105 dark:border-slate-800">
                        
                        <div className="space-y-1.5 text-left">
                          <label className="font-extrabold text-slate-655 dark:text-slate-300 block">Review remarks rationale</label>
                          <textarea
                            placeholder="Provide structural and regulatory rationale for endorsing this statutory clearance certificate..."
                            value={feedbackComment}
                            onChange={e => setFeedbackComment(e.target.value)}
                            className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:outline-none h-18 text-slate-900 dark:text-slate-100 dark:bg-slate-900 placeholder-slate-400"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleAction(activeTask.id, 'Approve', feedbackComment)}
                            className="px-2.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-center cursor-pointer text-[10px] uppercase tracking-wider block"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(activeTask.id, 'RequestChanges', feedbackComment)}
                            className="px-2.5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-lg text-center cursor-pointer text-[10px] uppercase tracking-wider block"
                          >
                            Revise
                          </button>
                          <button
                            onClick={() => handleAction(activeTask.id, 'Reject', feedbackComment)}
                            className="px-2.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-center cursor-pointer text-[10px] uppercase tracking-wider block"
                          >
                            Reject
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-[#F59E0B] text-xxs leading-relaxed italic">
                        Locked. Your simulated profile does not authorize signatures. Swap role to "Director" or "Compliance Officer" to authorize endorsements.
                      </div>
                    )
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-805 rounded-xl border border-slate-100 dark:border-slate-700 text-center text-slate-500 font-bold font-sans">
                      Clearance completed and logged as <strong className="text-slate-850 dark:text-white uppercase">{activeTask.status}</strong>.
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 text-xs flex flex-col justify-center items-center h-full select-none">
                  <FileText className="w-10 h-10 mb-3 text-slate-150 dark:text-slate-800" strokeWidth="1" />
                  <p className="font-sans">Select a clearance file to inspect structural deeds and log signatures.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
