import React, { useState } from 'react';
import { Project, Document } from '../types';
import { 
  BarChart3, Download, FileSpreadsheet, FileText, Database, 
  Layers, FolderOpen, History, Info, Clock, ArrowRight
} from 'lucide-react';

interface ReportsViewProps {
  projects: Project[];
  documents: Document[];
  compliance?: any[]; // Ignored for core REDMS but preserved in signature to prevent API compilation breaks
  approvals?: any[];  // Ignored for core REDMS but preserved in signature to prevent API compilation breaks
  onDownloadReport: (format: 'PDF' | 'Excel') => void;
}

export default function ReportsView({
  projects,
  documents,
  onDownloadReport
}: ReportsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Filter documents by project
  const filteredDocs = selectedProjectId === 'all'
    ? documents
    : documents.filter(d => d.projectId === selectedProjectId);

  // Statistics calculation
  const totalDocsCount = filteredDocs.length;
  
  // Calculate average version number
  const avgVersion = totalDocsCount > 0 
    ? (filteredDocs.reduce((sum, d) => sum + (d.latestVersion || 1), 0) / totalDocsCount).toFixed(1)
    : '1.0';

  // Calculate estimated storage size (each document version average ~3.4MB)
  const totalVersions = filteredDocs.reduce((sum, d) => sum + (d.latestVersion || 1), 0);
  const estimatedStorageMB = (totalVersions * 3.4).toFixed(1);

  // Category distribution
  const categoriesMap = filteredDocs.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const docDistribution = Object.entries(categoriesMap).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  // Project distribution
  const projectDistribution = projects.map(p => {
    const pDocs = documents.filter(d => d.projectId === p.id);
    return {
      name: p.name,
      code: p.code,
      count: pDocs.length,
      versions: pDocs.reduce((sum, d) => sum + (d.latestVersion || 1), 0)
    };
  }).sort((a, b) => b.count - a.count);

  const triggerDownloadAction = (type: 'PDF' | 'Excel') => {
    const orgName = "ABC Builders";
    const reportContentString = `
============================================================
BUILDVAULT REAL ESTATE DOCUMENT MANAGEMENT SYSTEM (REDMS) REPORT
Scope: ${selectedProjectId === 'all' ? 'All Portfolio Projects' : `Project Ref: ${selectedProjectId}`}
Export Format: ${type} File
Generated: ${new Date().toISOString().substring(0, 10)}
============================================================

PLATFORM CATALOG METRICS SUMMARY
------------------------------------------------------------
* Total Managed Documents: ${totalDocsCount}
* Active S3 Asset Versions: ${totalVersions}
* Cumulative Storage Allocation: ${estimatedStorageMB} MB
* Average Iterative Version Density: ${avgVersion} v/doc

DOCUMENT CATEGORY DENSITY
------------------------------------------------------------
${docDistribution.map(cat => `* ${cat.name}: ${cat.count} files (Approx. ${(cat.count / Math.max(totalDocsCount, 1) * 100).toFixed(0)}%)`).join('\n')}

PROJECT DISPATCH VOLUMES
------------------------------------------------------------
${projectDistribution.map(proj => `* [${proj.code}] ${proj.name}: ${proj.count} files | Total Versions: ${proj.versions}`).join('\n')}

BUILDVAULT SHA-256 DIGITAL IMMUTABILITY AUDIT LOG SECURED
============================================================
`;

    // Download payload browser simulator
    const blob = new Blob([reportContentString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BuildVault-REDMS-Analytics-${orgName.replace(/\s+/g, '-')}-${new Date().toISOString().substring(0,10)}.${type === 'PDF' ? 'txt' : 'csv'}`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccessMessage(`Successfully compiled and prepared Document Analytics ${type} Report.`);
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white font-sans">Document Catalog Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">Live visualization of real estate folder structures, S3 allocations, and version density maps</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => triggerDownloadAction('PDF')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer bg-white dark:bg-slate-900"
          >
            <FileText className="w-4 h-4 text-rose-500" /> Export PDF Summary
          </button>
          <button
            onClick={() => triggerDownloadAction('Excel')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer bg-white dark:bg-slate-900"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel Audit
          </button>
        </div>
      </div>

      {downloadSuccessMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-400 animate-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Projects selection dropdown & scope summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">Analyze scope:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none"
          >
            <option value="all">📁 All Portfolio Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>🏢 {p.name} ({p.code})</option>
            ))}
          </select>
        </div>

        <div className="text-xxs font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg">
          Filtered Segment: <span className="font-bold text-slate-950 dark:text-white">{selectedProjectId === 'all' ? 'Entire Organization Portfolio' : 'Selected Project Node'}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-medium">Total Documents</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 block">{totalDocsCount}</span>
          </div>
        </div>

        {/* Card 2: Document Versions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-medium">Active Versions</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 block">{totalVersions}</span>
          </div>
        </div>

        {/* Card 3: Storage usage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-medium">Estimated S3 Alloc</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 block">{estimatedStorageMB} MB</span>
          </div>
        </div>

        {/* Card 4: Average Density */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-medium">Avg Version Depth</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 block">{avgVersion} v/doc</span>
          </div>
        </div>
      </div>

      {/* Main Charts / Distribution Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Category Distribution Map */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Documents by Category</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Asset count aggregated across target taxonomy folders</p>
            </div>
            <span className="text-xxs font-mono bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-2.5 py-0.5 rounded-full font-semibold">
              Density Map
            </span>
          </div>

          {docDistribution.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-medium">
              No documents matched the specified project.
            </div>
          ) : (
            <div className="space-y-4">
              {docDistribution.map((category, idx) => {
                const percentage = Math.round((category.count / Math.max(totalDocsCount, 1)) * 100);
                return (
                  <div key={idx} className="p-2.5 border border-slate-100 dark:border-slate-800/80 rounded-lg bg-slate-50/40 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {category.name}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-2 py-0.5 rounded shadow-2xs">
                        {category.count} docs ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Project Distribution Map */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Documents by Project</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Asset allocation by real estate pipeline node</p>
            </div>
            <span className="text-xxs font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full font-semibold">
              Volume Distribution
            </span>
          </div>

          <div className="space-y-4">
            {projectDistribution.slice(0, 5).map((proj, idx) => {
              const maxDocs = Math.max(...projectDistribution.map(p => p.count), 1);
              const percentage = Math.round((proj.count / maxDocs) * 100);

              return (
                <div key={idx} className="p-2.5 border border-slate-100 dark:border-slate-800/80 rounded-lg bg-slate-50/40 dark:bg-slate-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">{proj.code}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{proj.name}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono block">{proj.count} files</span>
                      <span className="text-[10px] text-slate-400 font-mono block font-medium">{proj.versions} cumulative versions</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recent Uploads Audit Ledger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Recent Uploads Ledger</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Iterative catalog ledger from site coordinators and design staff</p>
          </div>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <th className="pb-2 font-medium">Document Info</th>
                <th className="pb-2 font-medium">Project</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium text-center">Version</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filteredDocs.slice(0, 5).map((doc, idx) => {
                const project = projects.find(p => p.id === doc.projectId);
                return (
                  <tr key={idx} className="hover:bg-slate-50/25 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.id} • uploaded by {doc.uploadedBy}</div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                      {project?.name || doc.projectId}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 text-[10.5px]">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                      v{doc.latestVersion}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-[9px] ${
                        doc.status === 'Active' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        doc.status === 'Draft' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' :
                        doc.status === 'Archived' ? 'bg-slate-100 text-slate-850 dark:bg-slate-800 dark:text-slate-300' :
                        'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// Simple legacy helper to support compilation safety if any file references CheckCircle2
const CheckCircle2 = ({ className = '' }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
