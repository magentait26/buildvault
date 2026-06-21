import React, { useState, useRef } from 'react';
import { 
  Project, Document, DocumentVersion, DocumentCategory, 
  ApprovalTask, Role, User
} from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { settingsService } from '../services/settingsService';
import { 
  Folder, FileText, Search, Tag, Filter, UploadCloud, Download, CheckSquare, 
  ArrowUpRight, AlertCircle, History, RotateCcw, Clock, MoreVertical, 
  Maximize2, Plus, Check, Trash2, Eye, ShieldAlert, CloudLightning, ChevronDown, X
} from 'lucide-react';

interface DocumentsViewProps {
  projects: Project[];
  documents: Document[];
  versions: DocumentVersion[];
  approvals: ApprovalTask[];
  currentRole: Role;
  currentUser: User;
  onUploadDocument: (
    projectId: string,
    name: string,
    category: DocumentCategory,
    tags: string[],
    desc: string,
    fileSize: string,
    comment?: string,
    file?: File
  ) => void;
  onRestoreVersion: (documentId: string, versionNumber: number) => void;
  onInitiateApprovalWorkflow: (documentId: string, rationale: string) => void;
  onAddLog: (action: string, details: string) => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Land Records', 'Legal', 'RERA', 'Approvals', 'Construction', 
  'Environmental', 'Finance', 'Contracts', 'Sales', 'Customer Handover', 'Litigation'
];

export default function DocumentsView({
  projects,
  documents,
  versions,
  approvals,
  currentRole,
  currentUser,
  onUploadDocument,
  onRestoreVersion,
  onInitiateApprovalWorkflow,
  onAddLog
}: DocumentsViewProps) {
  const { selectedOrgId } = useAuthStore();
  const settings = settingsService.getTenantSettings(selectedOrgId || 'org-1');
  const categories = (settings?.projects?.documentCategories as DocumentCategory[]) || CATEGORIES;

  // Navigation & list controls
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Create / Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProject, setUploadProject] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(categories[0] || 'Approvals');
  const [uploadTagsString, setUploadTagsString] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadComment, setUploadComment] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [realFile, setRealFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Mock files simulation trigger
  const [bulkCount, setBulkCount] = useState(1);

  // Focus document (drawer/modal/preview)
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [approvalRationaleString, setApprovalRationaleString] = useState('');

  // S3 path builder helper
  const getS3Path = (doc: Document) => {
    const proj = projects.find(p => p.id === doc.projectId);
    const orgId = currentUser.organizationId;
    const projCode = proj ? proj.code : doc.projectId;
    return `s3://${orgId}/${projCode}/${doc.category.toLowerCase().replace(/\s+/g, '-')}/${doc.name.toLowerCase()}_v${doc.latestVersion}.pdf`;
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const settings = settingsService.getTenantSettings(selectedOrgId || 'org-1');
    const allowedExtensions = settings?.storage?.allowedFileTypes || ['.pdf', '.dwg', '.dwf', '.xlsx', '.docx', '.png', '.jpg'];
    const maxMB = settings?.storage?.fileSizeLimit ?? 50;

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.map(ext => ext.toLowerCase()).includes(fileExt)) {
      return { 
        valid: false, 
        error: `File type "${fileExt}" is not authorized. Allowed extensions: ${allowedExtensions.join(', ')}` 
      };
    }

    const fileMB = file.size / (1024 * 1024);
    if (fileMB > maxMB) {
      return { 
        valid: false, 
        error: `File size (${fileMB.toFixed(2)} MB) exceeds authorized upload limit of ${maxMB} MB.` 
      };
    }

    return { valid: true };
  };

  const resetUploadForm = () => {
    setUploadProject(projects[0]?.id || '');
    setUploadName('');
    setUploadCategory('Approvals');
    setUploadTagsString('');
    setUploadDesc('');
    setUploadComment('');
    setAttachedFile(null);
    setRealFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadProject) return;

    // Build tags array
    const tags = uploadTagsString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const randomSizes = ['1.8 MB', '2.4 MB', '4.1 MB', '7.8 MB', '12.2 MB'];
    const sizeStr = attachedFile ? attachedFile.size : randomSizes[Math.floor(Math.random() * randomSizes.length)];

    onUploadDocument(
      uploadProject,
      uploadName.replace(/\.[^/.]+$/, ""), // remove ext if added
      uploadCategory,
      tags,
      uploadDesc,
      sizeStr,
      uploadComment || 'Initial draft versioning created',
      realFile || undefined
    );

    setShowUploadModal(false);
    resetUploadForm();
  };

  const handleDesktopFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setValidationError(null);

      const validation = validateFile(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'File validation failed');
        setAttachedFile({ name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB` });
        setShowUploadModal(true);
        return;
      }

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = `${sizeMB} MB`;
      setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      setAttachedFile({ name: file.name, size: sizeStr });
      setRealFile(file);
      if (!uploadProject && projects[0]) {
        setUploadProject(projects[0].id);
      }
      if (!showUploadModal) {
        setShowUploadModal(true);
      }
    }
  };

  // Drag and drop mock triggers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setValidationError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validation = validateFile(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'File validation failed');
        setAttachedFile({ name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB` });
        setShowUploadModal(true);
        return;
      }

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = `${sizeMB} MB`;
      setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      setAttachedFile({ name: file.name, size: sizeStr });
      setRealFile(file);
      if (projects[0]) {
        setUploadProject(projects[0].id);
      }
      setShowUploadModal(true);
    }
  };

  // Bulk simulated uploads
  const triggerBulkSample = () => {
    if (!projects[0]) return;
    const samples = [
      { name: 'Environmental_Air_Quality_EIA', category: 'Environmental' as DocumentCategory, tags: ['EIA', 'CleanAir'] },
      { name: 'State_RERA_Clearance_Authority', category: 'RERA' as DocumentCategory, tags: ['RERA', 'Registrar'] },
      { name: 'Airport_Aviation_Survey_Grade', category: 'Approvals' as DocumentCategory, tags: ['NOC', 'GridHeight'] },
      { name: 'Site_Soil_Hydrology_Foundation', category: 'Construction' as DocumentCategory, tags: ['CoreDrill', 'SiltTest'] },
      { name: 'Master_Builder_SLA_Contracts', category: 'Contracts' as DocumentCategory, tags: ['Legal', 'PM'] }
    ];

    const countToUpload = Math.min(bulkCount, samples.length);
    for (let i = 0; i < countToUpload; i++) {
      const s = samples[i];
      const randomSizes = ['2.8 MB', '5.4 MB', '8.1 MB'];
      const sizeStr = randomSizes[Math.floor(Math.random() * randomSizes.length)];
      onUploadDocument(
        projects[0].id,
        s.name,
        s.category,
        s.tags,
        `Automated bulk ingest simulation of ${s.name} for validation.`,
        sizeStr,
        `Ingested via rapid batch processing systems.`
      );
    }
    
    onAddLog('Upload', `Batch uploaded ${countToUpload} documents for central cataloging.`);
    alert(`Successfully processed and registered ${countToUpload} mock S3 secure asset documents.`);
  };

  const handleRequestApproval = (docId: string) => {
    if (!approvalRationaleString) return;
    onInitiateApprovalWorkflow(docId, approvalRationaleString);
    setApprovalRationaleString('');
  };

  // Filter Logic
  const filteredDocs = documents.filter(doc => {
    const matchesProject = selectedProjectId === 'all' || doc.projectId === selectedProjectId;
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                          doc.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'pending' && doc.status === 'Pending') ||
      (activeTab === 'approved' && doc.status === 'Approved') ||
      (activeTab === 'rejected' && (doc.status === 'Rejected' || doc.status === 'Revision Required'));

    return matchesProject && matchesCategory && matchesSearch && matchesTab;
  });

  // Preview target data
  const previewDoc = documents.find(d => d.id === previewDocId);
  const previewDocVersions = versions.filter(v => v.documentId === previewDocId).sort((a,b) => b.versionNumber - a.versionNumber);
  const previewDocProject = previewDoc ? projects.find(p => p.id === previewDoc.projectId) : null;
  const isDocUnderActiveApproval = previewDoc ? approvals.some(a => a.documentId === previewDoc.id && a.status === 'Pending') : false;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Module Title Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block font-sans tracking-wider">DOCUMENTS VAULT</span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-0.5">Secure Portfolio Document Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Meticulous cloud directories with cryptographically signed revision states</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          
          {/* Create Button with icon */}
          <button
            onClick={() => { resetUploadForm(); setShowUploadModal(true); }}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-colors flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <UploadCloud className="w-4 h-4 text-slate-100" /> 
            <span>Secure Upload</span>
          </button>
          
          {/* Bulk Simulation tools */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-250 shadow-3xs">
            <select
              value={bulkCount}
              onChange={e => setBulkCount(Number(e.target.value))}
              className="text-[11px] font-medium bg-transparent focus:outline-none border-r pr-1.5 border-slate-200 cursor-pointer text-slate-600"
            >
              <option value="1">1 page</option>
              <option value="3">3 files</option>
              <option value="5">5 pack</option>
            </select>
            <button
              onClick={triggerBulkSample}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 uppercase tracking-wider cursor-pointer font-sans"
              title="Upload sample files instantly"
            >
              <CloudLightning className="w-3.5 h-3.5 text-blue-600" />
              <span>Bulk Seed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column Folder List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-3xs">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <Folder className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">Document Folders</h4>
          </div>

          <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                selectedCategory === 'all' 
                  ? 'bg-slate-950 text-white font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>📂 All Categories</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                {documents.length}
              </span>
            </button>

            {categories.map(cat => {
              const countCat = documents.filter(d => d.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-slate-950 text-white font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">📁 {cat}</span>
                  {countCat > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                      {countCat}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Columns Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Main Filter & Selections Row (Including Project Dropdown) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-3xs">
            <div className="flex flex-col sm:flex-row gap-3">
              
              {/* Premium Project Selector Dropdown (as requested) */}
              <div className="relative w-full sm:w-72 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className="w-full py-2 px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-xs text-slate-750 rounded-lg font-semibold flex items-center justify-between hover:border-slate-305 transition-all cursor-pointer"
                >
                  <span className="truncate">
                    {selectedProjectId === 'all' 
                      ? '📂 Filter: All Active Properties' 
                      : `🏢 ${projects.find(p => p.id === selectedProjectId)?.name || 'Unknown Project'}`
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProjectDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProjectDropdownOpen(false)}></div>
                    <div className="absolute top-9 left-0 right-0 z-20 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto text-xs p-1 animate-in fade-in slide-in-from-top-1">
                      <button
                        type="button"
                        onClick={() => { setSelectedProjectId('all'); setIsProjectDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between rounded-md ${
                          selectedProjectId === 'all' ? 'bg-slate-50 font-semibold text-slate-900 border-l-2 border-slate-900' : 'text-slate-655'
                        }`}
                      >
                        <span>📁 All Active Projects</span>
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 text-[9px] font-bold rounded">{documents.length}</span>
                      </button>
                      
                      {projects.map(p => {
                        const count = documents.filter(d => d.projectId === p.id).length;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedProjectId(p.id); setIsProjectDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between rounded-md ${
                              selectedProjectId === p.id ? 'bg-slate-50 font-semibold text-slate-900 border-l-2 border-slate-900' : 'text-slate-655'
                            }`}
                          >
                            <span className="truncate pr-2">🏢 {p.name} ({p.code})</span>
                            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 text-[9px] font-bold rounded shrink-0">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Dynamic Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search file catalog by title or metadata tags..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs border border-slate-225 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white placeholder:text-slate-400 text-slate-805"
                />
              </div>
            </div>

            {/* Document Approval States Tabs */}
            <div className="flex border-t border-slate-100 pt-3 gap-1 overflow-x-auto text-[11px]">
              {[
                { id: 'all', label: 'All Cataloged Records' },
                { id: 'pending', label: 'Awaiting Verification' },
                { id: 'approved', label: 'Approved & Active' },
                { id: 'rejected', label: 'Revisions & Queries' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-1 px-3 rounded-md font-medium tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop simulated upload zone */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-5 text-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/20 scale-[1.005]' 
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleDesktopFileSelect} 
              className="hidden" 
              id="desktop-file-upload-input"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg"
            />
            <div 
              className="flex gap-4 items-center justify-center cursor-pointer" 
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                  resetUploadForm(); 
                  setShowUploadModal(true);
                }
              }}
            >
              <UploadCloud className="w-8 h-8 text-slate-400 shrink-0" />
              <div className="text-left font-sans">
                <p className="text-xs font-semibold text-slate-750">Drag & drop files here or <span className="text-blue-600 underline">click to upload from desktop</span>...</p>
                <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-sans tracking-wide">Secure S3 Proxy Transfer Protocol</p>
              </div>
            </div>
          </div>

          {/* Documents Grid / Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-200" />
                <p className="text-xs">No cataloged files matches current active selections.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-405 uppercase tracking-wider">
                      <th className="py-3 px-4">Document Title / ID</th>
                      <th className="py-3 px-4">Origin Project</th>
                      <th className="py-3 px-4">Metadata Slices</th>
                      <th className="py-3 px-4">Clearance Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map(doc => {
                      const proj = projects.find(p => p.id === doc.projectId);
                      
                      return (
                        <tr 
                          key={doc.id} 
                          className={`hover:bg-slate-50/50 transition-all ${previewDocId === doc.id ? 'bg-slate-50' : ''}`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-2.5">
                              <div className="bg-slate-100 p-2 rounded-lg text-slate-500 mt-0.5 shrink-0">
                                <FileText className="w-4 h-4 text-slate-600" />
                              </div>
                              <div className="space-y-0.5">
                                <button 
                                  onClick={() => setPreviewDocId(doc.id)}
                                  className="text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors text-left font-sans block leading-snug"
                                >
                                  {doc.name}
                                </button>
                                <span className="text-[10px] font-mono text-slate-400 block tracking-tight">
                                  {doc.id} • latest v{doc.latestVersion}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 vertical-align-top">
                            {proj ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-semibold text-slate-705 block">{proj.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 block">{proj.code}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5 max-w-[200px]">
                              <span className="inline-block bg-slate-100 text-slate-700 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                                {doc.category}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {doc.tags.map(t => (
                                  <span key={t} className="text-[9px] bg-slate-50 border border-slate-150 text-slate-505 px-1 py-0.2 rounded font-sans">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                              doc.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                              'bg-rose-50 text-rose-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                doc.status === 'Approved' ? 'bg-emerald-500' :
                                doc.status === 'Pending' ? 'bg-amber-500' :
                                'bg-rose-500'
                              }`}></span>
                              {doc.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => setPreviewDocId(doc.id)}
                                className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer transition-all bg-white"
                                title="Inspect Versions and Audits"
                              >
                                <Eye className="w-3.5 h-3.5" /> inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Slide out Document Version Ledger Box Drawers on Side */}
      {previewDoc && (
        <div className="fixed inset-0 z-35 flex justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xs" onClick={() => setPreviewDocId(null)}></div>
          
          <div className="relative w-full max-w-lg bg-white h-full z-45 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-right duration-250">
            <div className="space-y-6">
              
              {/* Header Box */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">DOCUMENT COMPLIANCE PROFILE</span>
                  <h3 className="font-bold text-sm text-slate-900 font-sans leading-normal">{previewDoc.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400 bg-slate-50/50 px-1.5 p-0.5 rounded border border-slate-100">{getS3Path(previewDoc)}</p>
                </div>
                <button 
                  onClick={() => setPreviewDocId(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-808 rounded-lg border border-slate-150 cursor-pointer bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Active Clearances</span>
                  <span className="font-semibold text-slate-700">{previewDoc.status}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Project Code</span>
                  <span className="font-semibold text-slate-755">{previewDocProject?.name || 'Global'}</span>
                </div>
              </div>

              {/* Version History lists */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-705 uppercase tracking-wide">Version Ledger Audits</h4>
                
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden font-sans">
                  {previewDocVersions.map((v, idx) => (
                    <div key={v.id} className="p-3 bg-white text-xs flex justify-between items-start hover:bg-slate-50/20">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-sans tracking-wide ${idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            v{v.versionNumber}
                          </span>
                          <span className="font-semibold text-slate-700">{v.fileSize} • S3 Storage node</span>
                        </div>
                        <p className="text-[11px] text-slate-505 italic">"{v.comment || 'Checkin state modification file content'}"</p>
                        <p className="text-[10px] text-slate-400 font-sans">{v.uploadedBy} on {v.uploadDate}</p>
                      </div>

                      {v.versionNumber !== previewDoc.latestVersion && (
                        <button
                          onClick={() => {
                            onRestoreVersion(previewDoc.id, v.versionNumber);
                            onAddLog('Rollback', `Restored document ${previewDoc.name} to version number ${v.versionNumber}`);
                            alert(`Rolled back secure document revision to version v${v.versionNumber}`);
                          }}
                          className="px-2 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> restore
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Validation Workflow trigger */}
              {previewDoc.status !== 'Approved' && !isDocUnderActiveApproval && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-880">Dispatch Statutory Validation Workflow</h4>
                  <p className="text-[11px] text-slate-505">Initiates formal workspace reviews from the Legal Team and Compliance Officers.</p>
                  
                  <div className="space-y-2.5 pt-1.5">
                    <textarea
                      placeholder="Specify rationale for clearance (e.g. 'Satisfies municipal fire NOC statutory parameters draft state...')"
                      value={approvalRationaleString}
                      onChange={e => setApprovalRationaleString(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none h-18 text-slate-800"
                    />
                    <button
                      onClick={() => handleRequestApproval(previewDoc.id)}
                      className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      Dispatch Approvals Order
                    </button>
                  </div>
                </div>
              )}

              {isDocUnderActiveApproval && (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800 font-sans">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-semibold">Workflow Status: Awaiting Review</p>
                    <p className="text-[11px] text-amber-700/80 mt-0.5">This document audit clearance sequence has been logged and is awaiting executive partner validations.</p>
                  </div>
                </div>
              )}

            </div>
            
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <a 
                href="#"
                onClick={e => { e.preventDefault(); alert('Routing encrypted PDF payload to local browser environment...'); }}
                className="flex-1 text-center border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-semibold transition-all"
              >
                Download PDF
              </a>
              <button 
                onClick={() => setPreviewDocId(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Upload Create Document Modal Sheet */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowUploadModal(false)}></div>
          
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans uppercase tracking-wide">Register Cloud Property Asset</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-sans">
              
              {validationError && (
                <div className="bg-rose-50 border border-rose-250 text-rose-700 p-3 rounded-lg flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-[11px] uppercase tracking-wide">Validation Error</h4>
                    <p className="text-[10px] text-rose-600 mt-0.5 leading-normal">{validationError}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Property Project</label>
                <select
                  value={uploadProject}
                  onChange={e => setUploadProject(e.target.value)}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                  required
                >
                  <option value="" disabled>Choose Property location</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>🏢 {p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              {/* Local Desktop File Attachment block */}
              <div className="border border-slate-200 bg-slate-50/60 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center text-slate-550 font-semibold uppercase tracking-wider text-[10px]">
                  <span>Local Desktop Attachment</span>
                  <span className="text-[9px] text-blue-600 font-mono font-bold">DRAG & DROP SUPPORTED</span>
                </div>
                {attachedFile ? (
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-md p-2.5 shadow-3xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="bg-blue-50 text-blue-650 p-1.5 rounded">
                        <FileText className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="truncate text-[11px] leading-snug">
                        <p className="font-bold text-slate-800 truncate">{attachedFile.name}</p>
                        <p className="text-slate-400 font-medium">{attachedFile.size} • Verified</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xxs text-rose-605 hover:text-rose-800 font-bold ml-2 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border border-dashed border-slate-300 bg-white hover:bg-slate-50 rounded-md py-4.5 cursor-pointer transition-all group"
                  >
                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-blue-500 mb-1 transition-colors" />
                    <p className="font-bold text-slate-700 text-[10.5px]">Click to select file from desktop...</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Supports PDF, DWG, BIM, XLSX up to 100MB</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Fire_NOC_Building_B_Approved"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-60 block">Filing Category</label>
                  <select
                     value={uploadCategory}
                     onChange={e => setUploadCategory(e.target.value as DocumentCategory)}
                     className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-60 block">Tags (comma split)</label>
                  <input
                    type="text"
                    placeholder="e.g. Fire, NOC, B-Block"
                    value={uploadTagsString}
                    onChange={e => setUploadTagsString(e.target.value)}
                    className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-60 block">Brief Description</label>
                <textarea
                  placeholder="Summarize the core legal, financial, or structural targets..."
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none h-16"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-60 block">Initial Commit Comment</label>
                <input
                  type="text"
                  placeholder="e.g. Draft parameters compiled by site legal desk..."
                  value={uploadComment}
                  onChange={e => setUploadComment(e.target.value)}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!!validationError}
                className={`w-full font-semibold py-2.5 rounded-lg shadow-3xs transition-all ${
                  validationError
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 cursor-pointer'
                }`}
              >
                Commit & Upload Secure Cloud node
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
