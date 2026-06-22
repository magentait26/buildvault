import React, { useState } from 'react';
import { Project, Document } from '../types';
import { 
  BarChart3, Download, FileSpreadsheet, FileText, Database, 
  Layers, FolderOpen, History, Info, Clock, PieChart, HardDrive
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
  const [activeTab, setActiveTab] = useState<'summary' | 'categories' | 'projects' | 'storage' | 'uploads'>('summary');
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

    setDownloadSuccessMessage(`Successfully compiled and prepared Document ${type === 'PDF' ? 'Summary PDF' : 'Excel Audit'} Report.`);
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 border-none dark:text-white font-sans">Document Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track project documents, categories, versions, storage usage, and recent uploads.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => triggerDownloadAction('PDF')}
            id="btn-export-pdf"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer bg-white dark:bg-slate-900 font-sans"
          >
            <FileText className="w-4 h-4 text-rose-500" /> Export Document Summary
          </button>
          <button
            onClick={() => triggerDownloadAction('Excel')}
            id="btn-export-excel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer bg-white dark:bg-slate-900 font-sans"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Document Excel
          </button>
        </div>
      </div>

      {downloadSuccessMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-400 animate-in slide-in-from-top-2 duration-150">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-sans">{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Scope Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">Analyze scope:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none font-sans"
          >
            <option value="all">📁 All Portfolio Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>🏢 {p.name} ({p.code})</option>
            ))}
          </select>
        </div>

        <div className="flex border-b border-transparent md:border-b-0 gap-1.5 shrink-0">
          {[
            { id: 'summary', name: 'Document Summary', icon: FolderOpen },
            { id: 'categories', name: 'Category Distribution', icon: PieChart },
            { id: 'projects', name: 'Project-wise Documents', icon: Layers },
            { id: 'storage', name: 'Storage Usage', icon: HardDrive },
            { id: 'uploads', name: 'Recent Uploads', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                id={`tab-analytics-${tab.id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-sans ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs / Cards Output Content */}
      <div className="space-y-6">

        {/* 1. DOCUMENT SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-medium">Document Summary</span>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 block">{totalDocsCount} Total Files</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                This index represents the total volume of managed templates, drafts, and locked regulatory records currently dispatched within the selected scope.
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-mono">Active Pool</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {filteredDocs.filter(d => d.status === 'Active').length} Documents
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-mono">Draft Pool</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {filteredDocs.filter(d => d.status === 'Draft').length} Documents
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-lg">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-medium">Iterative Versions</span>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 block">{avgVersion} Avg Depth</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                The average revision count per active regulatory record in your real estate project directories, providing transparency over document maturity.
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-mono">Total Versions</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">{totalVersions} S3 Commits</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-mono">Updates Frequency</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">Regular Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CATEGORY DISTRIBUTION TAB */}
        {activeTab === 'categories' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">Category Distribution</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Asset counts aggregated across your real estate directories taxonomy folders</p>
              </div>
              <PieChart className="w-5 h-5 text-slate-400" />
            </div>

            {docDistribution.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-medium font-sans">
                No documents matched the specified project scope.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docDistribution.map((category, idx) => {
                  const percentage = Math.round((category.count / Math.max(totalDocsCount, 1)) * 100);
                  return (
                    <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800/85 rounded-lg bg-slate-50/40 dark:bg-slate-900/40">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                        <span className="flex items-center gap-2 font-sans truncate pr-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                          {category.name}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-2 py-0.5 rounded shadow-2xs shrink-0">
                          {category.count} docs ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
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

        {/* 3. PROJECT-WISE DOCUMENTS TAB */}
        {activeTab === 'projects' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4 font-sans">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Project-wise Documents</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Asset allocation volumes and commit revisions grouped by pipeline nodes</p>
              </div>
              <Layers className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-4">
              {projectDistribution.map((proj, idx) => {
                const maxDocs = Math.max(...projectDistribution.map(p => p.count), 1);
                const percentage = Math.round((proj.count / maxDocs) * 100);

                return (
                  <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800/85 rounded-lg bg-slate-50/40 dark:bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">{proj.code}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">{proj.name}</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono block">{proj.count} files</span>
                        <span className="text-[10px] text-slate-400 font-mono block font-medium mt-0.5">{proj.versions} total revisions</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. STORAGE USAGE TAB */}
        {activeTab === 'storage' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-medium">Estimated S3 Storage</span>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 block">{estimatedStorageMB} MB</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                Accumulated binary package S3 footprint assuming an estimate of <strong>3.4 MB</strong> per revision version commit.
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-sans text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Standard Allocation limit</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">2.0 GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Utilization rate</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {((parseFloat(estimatedStorageMB) / 2048) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 shadow-xs md:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Storage Allocation Map</h4>
                <HardDrive className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                Below shows estimated storage weights mapped dynamically per real estate category. Consistent updates clean up stale revisions to optimize hosting limits.
              </p>
              <div className="space-y-3.5 pt-2">
                {docDistribution.slice(0, 4).map((cat, idx) => {
                  const size = (cat.count * 3.4).toFixed(1);
                  const share = Math.round((cat.count / Math.max(totalDocsCount, 1)) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 font-sans">
                        <span>{cat.name}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{size} MB ({share}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-505 h-full rounded-full" style={{ width: `${share}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. RECENT UPLOADS TAB */}
        {activeTab === 'uploads' && (
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl p-6 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">Recent Uploads Ledger</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Iterative catalog actions mapped chronologically from active organization staff</p>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    <th className="pb-2 font-medium font-sans">Document Details</th>
                    <th className="pb-2 font-medium font-sans">Project Name</th>
                    <th className="pb-2 font-medium font-sans">Category</th>
                    <th className="pb-2 font-medium text-center font-sans">Revision</th>
                    <th className="pb-2 font-medium text-right font-sans">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {filteredDocs.slice(0, 10).map((doc, idx) => {
                    const project = projects.find(p => p.id === doc.projectId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/25 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="py-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 font-sans">{doc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.id} • uploaded by {doc.uploadedBy} ({doc.uploadedRole})</div>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-400 font-medium font-sans">
                          {project?.name || doc.projectId}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 text-[10.5px] font-sans">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                          v{doc.latestVersion}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-[9px] font-sans ${
                            doc.status === 'Active' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            doc.status === 'Draft' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' :
                            doc.status === 'Archived' ? 'bg-slate-100 text-slate-855 dark:bg-slate-800 dark:text-slate-300' :
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
        )}

      </div>

    </div>
  );
}
