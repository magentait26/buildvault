import React, { useState } from 'react';
import { Project, Document, ComplianceRecord, ApprovalTask } from '../types';
import { 
  BarChart3, Download, FileSpreadsheet, FileText, Calendar, 
  CheckCircle2, AlertCircle, Clock, ChevronRight, TrendingUp, Info
} from 'lucide-react';

interface ReportsViewProps {
  projects: Project[];
  documents: Document[];
  compliance: ComplianceRecord[];
  approvals: ApprovalTask[];
  onDownloadReport: (format: 'PDF' | 'Excel') => void;
}

export default function ReportsView({
  projects,
  documents,
  compliance,
  approvals,
  onDownloadReport
}: ReportsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [reportType, setReportType] = useState<'compliance' | 'activity' | 'audit'>('compliance');
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Filter compliance records by project
  const filteredCompliance = selectedProjectId === 'all'
    ? compliance
    : compliance.filter(c => c.projectId === selectedProjectId);

  const filteredDocs = selectedProjectId === 'all'
    ? documents
    : documents.filter(d => d.projectId === selectedProjectId);

  // Stats calculation
  const totalClearances = filteredCompliance.length;
  const approvedClearances = filteredCompliance.filter(c => c.status === 'Approved').length;
  const submittedClearances = filteredCompliance.filter(c => c.status === 'Submitted').length;
  const expiredClearances = filteredCompliance.filter(c => c.status === 'Expired').length;
  const pendingClearances = filteredCompliance.filter(c => c.status === 'Pending').length;

  // Score computation
  const totalWeight = filteredCompliance.reduce((sum, c) => sum + c.scoreImpact, 0);
  const approvedWeight = filteredCompliance
    .filter(c => c.status === 'Approved')
    .reduce((sum, c) => sum + c.scoreImpact, 0);
  const submittedWeight = filteredCompliance
    .filter(c => c.status === 'Submitted')
    .reduce((sum, c) => sum + (c.scoreImpact * 0.5), 0);
  const score = totalWeight > 0 
    ? Math.round((approvedWeight + submittedWeight) / totalWeight * 100) 
    : 100;

  // Category distribution
  const categoriesMap = filteredDocs.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const docDistribution = Object.entries(categoriesMap).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  const triggerDownloadAction = (type: 'PDF' | 'Excel') => {
    onDownloadReport(type);
    setDownloadSuccessMessage(`Successfully compiled and prepared Executive-level ${type} Report.`);
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 font-sans">Executive Reports & Audits</h2>
          <p className="text-sm text-slate-500 mt-0.5">High-fidelity statutory metrics and workspace compliance summaries</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => triggerDownloadAction('PDF')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer bg-white"
          >
            <FileText className="w-4 h-4 text-rose-500" /> Export PDF Summary
          </button>
          <button
            onClick={() => triggerDownloadAction('Excel')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer bg-white"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel Audit
          </button>
        </div>
      </div>

      {downloadSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800 animate-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Projects selection dropdown & Report type tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-lg shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500 font-medium font-sans">Analyze scope:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">📁 All Portfolio Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>🏢 {p.name} ({p.code})</option>
            ))}
          </select>
        </div>

        <div className="flex border-b border-transparent md:border-b-0 gap-1.5">
          <button
            onClick={() => setReportType('compliance')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              reportType === 'compliance' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Compliance Audits
          </button>
          <button
            onClick={() => setReportType('activity')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              reportType === 'activity' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Document Indexes
          </button>
          <button
            onClick={() => setReportType('audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              reportType === 'audit' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Sign-offs Metrics
          </button>
        </div>
      </div>

      {reportType === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main metric summary card */}
          <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs space-y-4 lg:col-span-1">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Compliance Scorecard</h4>
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl font-extrabold text-slate-900 leading-none">{score}%</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                score >= 80 ? 'bg-emerald-50 text-emerald-800' : score >= 60 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
              }`}>
                {score >= 80 ? 'Excellent' : score >= 60 ? 'Stated Risks' : 'Immediate Redesign'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Weighted index derived from official structural approvals, legal titles, labor clearance certificates, and environmental NOC mandates.
            </p>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Approved Filing Target</span>
                <span className="font-semibold text-slate-800">{approvedClearances} NOCs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Submitted Clearances</span>
                <span className="font-semibold text-slate-800">{submittedClearances} filings</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Expiry Critical Checklist</span>
                <span className="font-semibold text-slate-800">{expiredClearances} records</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Pending Submission</span>
                <span className="font-semibold text-slate-800">{pendingClearances} outstanding</span>
              </div>
            </div>
          </div>

          {/* Visual SVG Timeline Bar Chart */}
          <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clearance Status Weight Distribution</h4>
                <div className="text-[11px] text-slate-400 font-mono">Normalized Percentages</div>
              </div>

              {/* Pure SVG graphical chart */}
              <div className="pt-6 pb-2">
                <div className="flex items-end justify-between gap-4 h-36 border-b border-slate-150 px-2">
                  {[
                    { label: 'Approved NOCs', count: approvedClearances, percent: totalClearances > 0 ? (approvedClearances / totalClearances) * 100 : 0, color: '#10b981' },
                    { label: 'Submitted (Awaiting)', count: submittedClearances, percent: totalClearances > 0 ? (submittedClearances / totalClearances) * 100 : 0, color: '#3b82f6' },
                    { label: 'Expired Expiries', count: expiredClearances, percent: totalClearances > 0 ? (expiredClearances / totalClearances) * 100 : 0, color: '#f59e0b' },
                    { label: 'Unfiled/Pending', count: pendingClearances, percent: totalClearances > 0 ? (pendingClearances / totalClearances) * 100 : 0, color: '#94a3b8' }
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="relative w-full flex items-end justify-center h-full">
                        {/* Hover utility tooltip popover */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-0.5 px-2 rounded font-mono shadow-xs whitespace-nowrap z-10 pointer-events-none">
                          {bar.count} items ({Math.round(bar.percent)}%)
                        </div>
                        
                        {/* Interactive columns bars */}
                        <div 
                          className="w-12 md:w-16 rounded-t-sm transition-all duration-500 hover:opacity-90"
                          style={{ 
                            height: `${Math.max(bar.percent, 8)}%`, 
                            backgroundColor: bar.color 
                          }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xxs text-slate-400 bg-slate-50/55 p-2 rounded-lg mt-3">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Clicking export summaries compiles individual structural details, audit ledger and histories in printable PDF files.</span>
            </div>
          </div>
        </div>
      )}

      {reportType === 'activity' && (
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Density Matrix</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Files categorized in the secure S3 directory nodes</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold font-mono">
              Total {filteredDocs.length} Cataloged Docs
            </span>
          </div>

          {docDistribution.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No files cataloged under the specified project filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docDistribution.map((category, idx) => {
                const percentage = Math.round((category.count / filteredDocs.length) * 100);
                return (
                  <div key={idx} className="p-3 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors bg-slate-50/30">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-800 mb-1.5">
                      <span className="flex items-center gap-1.5 font-sans">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        {category.name}
                      </span>
                      <span className="text-slate-500 font-mono bg-white border border-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {category.count} files ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {reportType === 'audit' && (
        <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects sign-off velocities</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Approval rates and pending milestones timeline logs</p>
            </div>
            <span className="text-xxs font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-2 py-0.5">
              Active ledger
            </span>
          </div>

          <div className="space-y-3">
            {projects.map(proj => {
              const projApprovals = approvals.filter(a => a.projectId === proj.id);
              const pendingCount = projApprovals.filter(a => a.status === 'Pending').length;
              const approvedCount = projApprovals.filter(a => a.status === 'Approved').length;
              const rejectedCount = projApprovals.filter(a => a.status === 'Rejected' || a.status === 'Revision Required').length;

              return (
                <div key={proj.id} className="p-3.5 border border-slate-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">{proj.code}</span>
                    <h5 className="text-xs font-semibold text-slate-900">{proj.name}</h5>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center px-2 py-1 border border-slate-100 bg-white rounded-md">
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">PENDING</span>
                        <span className={`text-xs font-bold ${pendingCount > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{pendingCount}</span>
                      </div>
                      <div className="text-center px-2 py-1 border border-slate-100 bg-white rounded-md">
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">APPROVED</span>
                        <span className={`text-xs font-bold ${approvedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{approvedCount}</span>
                      </div>
                      <div className="text-center px-2 py-1 border border-slate-100 bg-white rounded-md">
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">REVISION</span>
                        <span className={`text-xs font-bold ${rejectedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{rejectedCount}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">SIGNVelocrate</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {projApprovals.length > 0 
                          ? `${Math.round((approvedCount / projApprovals.length) * 100)}%` 
                          : '100%'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
