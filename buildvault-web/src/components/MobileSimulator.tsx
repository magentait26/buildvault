import React, { useState, useRef, useEffect } from 'react';
import { 
  Project, Document, DocumentVersion, ComplianceRecord, 
  User, Role, DocumentCategory 
} from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { settingsService } from '../services/settingsService';
import { 
  Smartphone, Bell, User as UserIcon, LogOut, Camera, Crop, Tag, 
  Upload, Search, FileText, Download, ChevronRight, CheckCircle2, 
  MapPin, AlertTriangle, Play, HelpCircle, Check, Image
} from 'lucide-react';

interface MobileSimulatorProps {
  projects: Project[];
  documents: Document[];
  versions: DocumentVersion[];
  compliance: ComplianceRecord[];
  allUsers: User[];
  onUploadDocument: (
    projectId: string,
    name: string,
    category: DocumentCategory,
    tags: string[],
    desc: string,
    fileSize: string,
    comment?: string
  ) => void;
  onAddLog: (action: string, details: string) => void;
  onNavigateGlobal: (tab: string) => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Land Records',
  'Sale Deeds',
  'Mother Deeds',
  'RTC / Mutation',
  'Khata / Property Tax',
  'RERA',
  'Layout Approval',
  'Building Plan Approval',
  'NOCs',
  'Agreements',
  'Finance',
  'Project Drawings',
  'Site Photos',
  'Customer Handover',
  'Legal Cases',
  'Other Documents'
];

export default function MobileSimulator({
  projects,
  documents,
  versions,
  compliance,
  allUsers,
  onUploadDocument,
  onAddLog,
  onNavigateGlobal
}: MobileSimulatorProps) {
  const { selectedOrgId } = useAuthStore();
  const settings = settingsService.getTenantSettings(selectedOrgId || 'org-1');
  const isApprovalsModuleOn = settings?.subscription?.enabledModules?.includes('approvals') ?? false;
  const categories = isApprovalsModuleOn 
    ? [...CATEGORIES, 'Approvals' as DocumentCategory] 
    : CATEGORIES;

  // Simulator State Machine
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedMobileUserId, setSelectedMobileUserId] = useState('');
  const [mobileUser, setMobileUser] = useState<User | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Home Navigation state inside simulator
  const [activeMobileScreen, setActiveMobileScreen] = useState<'home' | 'scanner' | 'documents' | 'docDetail'>('home');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Scanner Workflow states: Capture → Review → Tag → Upload
  const [scannerStep, setScannerStep] = useState<'snap' | 'crop' | 'ocr' | 'tag' | 'uploading' | 'complete'>('snap');
  const [isOcrAnalyzing, setIsOcrAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Bounding box simulated points for auto-crop
  const [cropBox, setCropBox] = useState({ top: 15, left: 15, right: 15, bottom: 15 });
  const [isCropped, setIsCropped] = useState(false);
  
  // Tag fields
  const [scanTitle, setScanTitle] = useState('');
  const [scanCategory, setScanCategory] = useState<DocumentCategory>(categories[0] || 'Approvals');
  const [scanTags, setScanTags] = useState('mobile_scan, site_survey');
  const [scanComment, setScanComment] = useState('Captured using Mobile Scanner Core');

  // Documents navigation state
  const [docSearch, setDocSearch] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Setup initial mobile user (e.g. Marcus Brody)
  useEffect(() => {
    const engineer = allUsers.find(u => u.role === 'Site Engineer' && u.organizationId === projects[0]?.organizationId);
    if (engineer) {
      setSelectedMobileUserId(engineer.id);
    } else if (allUsers[0]) {
      setSelectedMobileUserId(allUsers[0].id);
    }
  }, [allUsers, projects]);

  // Set default project on select
  useEffect(() => {
    if (projects[0] && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleMobileLogin = () => {
    const selected = allUsers.find(u => u.id === selectedUserIdRaw);
    if (selected) {
      setMobileUser(selected);
      setIsLoggedIn(true);
      setActiveMobileScreen('home');
      setScannerStep('snap');
      onAddLog('Login', `Mobile logged in successful as ${selected.name} (${selected.role})`);
    }
  };

  const handleMobileLogout = () => {
    if (mobileUser) {
      onAddLog('Logout', `Mobile logged out successfully as ${mobileUser.name}`);
    }
    setMobileUser(null);
    setIsLoggedIn(false);
  };

  // Raw helper to read selects quickly
  const [selectedUserIdRaw, setSelectedUserIdRaw] = useState('');
  useEffect(() => {
    if (selectedMobileUserId) {
      setSelectedUserIdRaw(selectedMobileUserId);
    }
  }, [selectedMobileUserId]);

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const activeProjectDocs = documents.filter(d => d.projectId === selectedProjectId);
  const activeProjectCompliance = compliance.filter(c => c.projectId === selectedProjectId);

  // Trigger camera snap simulation
  const handleSnap = () => {
    // We construct a mock high-fidelity blueprint document drawing base64 block
    // to simulate standard captures cleanly
    setCapturedImage('https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=1000'); // Simulated paper
    setScannerStep('crop');
    setIsCropped(false);
  };

  const handleAutoCrop = () => {
    // Squeeze bounding box and set cropped state
    setCropBox({ top: 35, left: 35, right: 35, bottom: 35 });
    setIsCropped(true);
    setScannerStep('ocr');
    setIsOcrAnalyzing(true);

    setTimeout(() => {
      setIsOcrAnalyzing(false);
      const randNum = Math.floor(100 + Math.random() * 900);
      setScanTitle(`${activeProject?.code || 'REV'}-STATUTORY-NOC-${randNum}`);
      setScanCategory('Approvals');
      setScanTags('ocr_extracted, fire_noc, municipal_authorized, safe_compliance');
      setScanComment('Edge AI Scanner extracted: compliance stamp detected. Verified by Site Inspector.');
    }, 1500);
  };

  const handleUploadScan = () => {
    if (!scanTitle || !selectedProjectId) return;
    setScannerStep('uploading');

    setTimeout(() => {
      onUploadDocument(
        selectedProjectId,
        scanTitle,
        scanCategory,
        scanTags.split(',').map(t => t.trim()),
        `Captured on site location via BuiltVault v1 mobile camera scanning modules by ${mobileUser?.name}.`,
        '1.9 MB',
        scanComment
      );

      setScannerStep('complete');
      onAddLog('Upload', `Mobile Site Upload: Snapped high-quality blueprint ${scanTitle} committed successfully.`);
      
      // Emit simulated Push notification banner dropdown
      setNotificationBanner(`Push: ${scanTitle} uploaded cleanly to AWS S3 directory!`);
      setTimeout(() => setNotificationBanner(null), 3000);
    }, 1500);
  };

  const resetScanner = () => {
    setScannerStep('snap');
    setCapturedImage(null);
    setScanTitle('');
    setScanTags('mobile_scan, site_survey');
    setScanComment('Captured using Mobile Scanner Core');
  };

  // Find doc previews inside mobile emulator
  const focusedDoc = documents.find(d => d.id === selectedDocId);
  const focusedDocVersions = versions.filter(v => v.documentId === selectedDocId).sort((a,b) => b.versionNumber - a.versionNumber);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-center justify-center p-2">
      
      {/* LEFT COLUMN: GUIDELINES ADVISORY */}
      <div className="flex-1 max-w-md space-y-4">
        <span className="bg-amber-150/40 text-amber-800 border border-amber-200 px-3 py-1 rounded text-xxs font-mono font-medium block w-max uppercase tracking-wider">
          Double Interface Capability
        </span>
        <h3 className="text-lg font-sans font-medium text-slate-800">Flutter Mobile Application Simulator</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The BuildVault operational guidelines (Chapter 8) outline continuous field operations via <strong>Site Engineers</strong> and coordinators. Use this smartphone viewport simulation to capture document drawings, execute edge crop calculations, compile PDFs and synchronize real-time assets seamlessly back to AWS S3.
        </p>

        <div className="bg-slate-50 border p-4 rounded-xl text-xxs font-mono text-slate-600 space-y-2">
          <strong className="text-slate-800 block uppercase">Mobile UX Rules compliant:</strong>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span><strong>Optimized Dropdown Selector:</strong> Displays selected property scope dynamically to support directories with hundreds of layout instances.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span><strong>Camera Edge Tracker:</strong> Processes captures locally with dynamic margin adjustments.</span>
          </div>
        </div>

        {/* Sync trigger warning */}
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2 text-xxs text-indigo-700">
          <Smartphone className="w-5 h-5 text-indigo-505" />
          <span>Try snapping a blueprint document in the mobile scanner below. It will synchronize with your back-office table feeds immediately!</span>
        </div>
      </div>

      {/* RIGHT COLUMN: PRECISE PHONE GRAPHICS CONTAINER VIEW */}
      <div className="relative shrink-0">
        
        {/* Physical hardware bezel wrapper */}
        <div className="relative mx-auto w-[330px] h-[640px] bg-slate-900 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-750">
          
          {/* Hardware notch element */}
          <div className="absolute top-[18px] left-1/2 transform -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-30 flex items-center justify-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-750"></div>
            <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
          </div>

          {/* Internal simulated software layout wrapper */}
          <div className="relative w-full h-full bg-slate-950 rounded-[32px] overflow-hidden flex flex-col justify-between text-white font-sans text-xs select-none shadow-inner border border-slate-850">
            
            {/* IN-APP TRANSITIONAL DROPDOWN ALERT BANNER */}
            {notificationBanner && (
              <div className="absolute top-[45px] left-3 right-3 bg-slate-900/95 border border-amber-500/40 p-2.5 rounded-xl text-[10px] font-mono shadow-xl z-50 text-white flex items-center gap-2 animate-bounce">
                <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="flex-1 text-slate-200">{notificationBanner}</span>
              </div>
            )}

            {/* Simulated System Status Bar */}
            <div className="h-10 shrink-0 bg-slate-950 px-5 flex justify-between items-center text-[10px] font-mono text-slate-400 z-10 pt-1">
              <span>22:37 [HQ]</span>
              <div className="flex items-center gap-1.5">
                <span>📶 5G</span>
                <span>🔋 100%</span>
              </div>
            </div>

            {/* SCREEN SWITCH BOARD */}
            <div className="flex-1 overflow-y-auto px-4 bg-slate-950 relative flex flex-col pt-1">
              
              {!isLoggedIn ? (
                // 1. LOGIN SCREEN STATE
                <div className="flex-1 flex flex-col justify-center space-y-6 py-6 font-mono text-xxs">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-sans font-bold text-white tracking-tight">BuildVault Field</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Mobile Scanner & Sync Portal</p>
                  </div>

                  {!forgotPassword ? (
                    <>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-slate-500 uppercase text-[9px] font-semibold">Switch Identity Representative</label>
                          <select
                            value={selectedUserIdRaw}
                            onChange={e => setSelectedUserIdRaw(e.target.value)}
                            className="w-full text-[11px] p-2 bg-slate-900 border border-slate-750 rounded-lg text-white font-mono focus:outline-none"
                          >
                            <option value="" disabled>Choose Site Operator...</option>
                            {allUsers.map(u => (
                              <option key={u.id} value={u.id}>👤 {u.name} ({u.role})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-500 uppercase text-[9px] font-semibold">Access PIN Code</label>
                          <input
                            type="password"
                            placeholder="••••••"
                            value="112233"
                            disabled
                            className="w-full text-xs p-2 bg-slate-900 border border-slate-750 rounded-lg text-slate-405 text-center tracking-widest text-slate-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          onClick={handleMobileLogin}
                          className="w-full py-2.5 bg-slate-100 hover:bg-white text-slate-950 rounded-lg text-xs font-semibold font-sans transition-all flex items-center justify-center gap-1 shadow-sm"
                        >
                          Unlock Workspace
                        </button>

                        <button
                          type="button"
                          onClick={() => setForgotPassword(true)}
                          className="w-full text-center text-slate-500 hover:text-slate-400 text-[10px] mt-1"
                        >
                          Forgot authentication parameters?
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-slate-400 leading-normal text-[11px]">
                        Please contact ABC system directors to reset your device MFA keys or refresh the workspace credentials.
                      </p>
                      <button
                        onClick={() => setForgotPassword(false)}
                        className="w-full py-2 border border-slate-700 hover:text-white rounded-lg text-slate-450"
                      >
                        Return to login screen
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // LOGGED-IN SCREEN NAVIGATION SWITCH
                <div className="flex-1 flex flex-col justify-between py-1">
                  
                  {/* APP MINI BAR BAR HEADER */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-[10px]">
                        {mobileUser?.name.charAt(0)}
                      </div>
                      <div className="truncate max-w-[120px]">
                        <p className="font-semibold text-white tracking-tight leading-none text-xxs">{mobileUser?.name}</p>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-mono mt-0.5">{mobileUser?.role}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleMobileLogout}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      title="Simulated Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ACTIVE SCREEN BODY */}
                  <div className="flex-1 flex flex-col min-h-0">
                    
                    {/* Screen 1: Mobile Home Dashboard */}
                    {activeMobileScreen === 'home' && (
                      <div className="space-y-4 flex-1">
                        
                        {/* Dropdown Project Selector (No heavy rendering blocks of hundreds of files!) */}
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 shadow-sm">
                          <label className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400 block">Select Worksite Scope</label>
                          <select
                            value={selectedProjectId}
                            onChange={e => setSelectedProjectId(e.target.value)}
                            className="bg-slate-950 border border-slate-750 text-[10px] w-full text-white p-1.5 rounded-lg focus:outline-none"
                          >
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>🏢 {p.code} - {p.name}</option>
                            ))}
                          </select>

                          {activeProject && (
                            <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" /> {activeProject.location}
                            </p>
                          )}
                        </div>

                        {/* Project Statistics Widget Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center" onClick={() => setActiveMobileScreen('documents')}>
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">Files Directory</span>
                            <strong className="text-base text-white font-sans mt-0.5 block">{activeProjectDocs.length}</strong>
                          </div>
                          
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">Compliance score</span>
                            <strong className="text-base text-emerald-400 font-sans mt-0.5 block">
                              {activeProjectCompliance.length > 0
                                ? Math.round(activeProjectCompliance.filter(c => c.status === 'Approved').length / activeProjectCompliance.length * 100)
                                : 100}%
                            </strong>
                          </div>
                        </div>

                        {/* Fast Document Capture triggers */}
                        <button
                          onClick={() => { resetScanner(); setActiveMobileScreen('scanner'); }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" /> Start Document Scanner
                        </button>

                        {/* Alerts inside selected project */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Real-time Site Status</span>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-400 leading-normal space-y-2">
                            {activeProjectCompliance.filter(c => c.status === 'Expired' || c.status === 'Rejected').length === 0 ? (
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>All clearances active. Safe to build.</span>
                              </div>
                            ) : (
                              activeProjectCompliance.filter(c => c.status === 'Expired' || c.status === 'Rejected').map(a => (
                                <div key={a.id} className="flex items-start gap-1.5 text-rose-450 text-rose-400">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{a.complianceType} status is marked {a.status}! Please snap files to override.</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Screen 2: Integrated Scanner (Capture -> Review -> Tag -> Upload) */}
                    {activeMobileScreen === 'scanner' && (
                      <div className="flex-1 flex flex-col justify-between space-y-2 text-xxs font-mono">
                        
                        {/* SCANNER HEAD */}
                        <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 mb-1">
                          <span className="font-semibold text-slate-205 text-slate-300">S3 Camera Scanner</span>
                          <button onClick={() => setActiveMobileScreen('home')} className="text-slate-500 hover:text-white">✕ exit</button>
                        </div>

                        {/* SCANNER MIDDLE: STEPPING RENDERERS */}
                        {scannerStep === 'snap' && (
                          <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden relative flex flex-col justify-center items-center border border-slate-800 py-6">
                            
                            {/* Graphic Viewfinder Overlay */}
                            <div className="absolute inset-4 border border-teal-500/30 rounded flex items-center justify-center">
                              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-teal-400"></span>
                              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-teal-400"></span>
                              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-teal-400"></span>
                              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-teal-400"></span>
                            </div>

                            {/* Simulated blueprint document on disk */}
                            <div className="opacity-45 text-center space-y-2">
                              <FileText className="w-12 h-12 text-slate-400 mx-auto" strokeWidth="1" />
                              <span className="text-[8px] text-slate-500 block uppercase tracking-widest">Guide layout page inside viewfinder</span>
                            </div>

                            <button
                              onClick={handleSnap}
                              className="absolute bottom-4 bg-white hover:bg-slate-100 text-slate-900 font-sans font-semibold p-2.5 rounded-full shadow-lg text-[10px] flex items-center gap-1.5 animate-pulse"
                            >
                              <Camera className="w-4 h-4" /> Trigger Capture
                            </button>
                          </div>
                        )}

                        {scannerStep === 'crop' && (
                          <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden relative flex flex-col justify-between border border-slate-800 p-3">
                            <span className="text-[9px] uppercase font-bold text-teal-400 block tracking-widest text-center">Smart Edge Auto-Crop</span>
                            
                            {/* Paper model with crop handlers */}
                            <div className="my-2 border border-slate-650 bg-slate-850 rounded p-4 relative flex-1 flex flex-col justify-center items-center">
                              <div className="border border-indigo-500/75 rounded flex items-center justify-center p-2 text-center text-indigo-300 relative w-5/6 h-5/6 bg-indigo-950/10">
                                {/* Simulated paper crop handle nodes */}
                                <span className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                                <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                                
                                <span className="text-[8px] block opacity-80 uppercase leading-snug">RERA Registration Document - Level 1 Layout Snapped</span>
                              </div>
                            </div>

                            <button
                              onClick={handleAutoCrop}
                              className="w-full py-1.8 bg-teal-600 hover:bg-teal-700 text-white font-sans font-semibold rounded text-center block text-[10px]"
                            >
                              Confirm Crop & Proceed
                            </button>
                          </div>
                        )}

                        {scannerStep === 'ocr' && (
                          <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden relative flex flex-col justify-between border border-slate-800 p-3 text-xxs font-mono">
                            <span className="text-[9px] uppercase font-bold text-teal-400 block tracking-widest text-center">AI Optical OCR Reader</span>

                            {isOcrAnalyzing ? (
                              <div className="flex-1 flex flex-col justify-center items-center py-10 space-y-3">
                                {/* SCANLINE EFFECT ANIMATION CHUNK */}
                                <div className="relative w-full h-24 border border-teal-500/20 rounded-md bg-black/40 overflow-hidden flex items-center justify-center">
                                  <div className="absolute inset-x-0 h-0.5 bg-emerald-400 opacity-80 shadow-[0_0_8px_#34d399] animate-bounce top-2"></div>
                                  <span className="text-[9px] text-teal-400 font-mono animate-pulse uppercase tracking-wider">Extracting Statutory NOC Stamps...</span>
                                </div>
                                <span className="text-[8px] text-slate-500 uppercase tracking-tight text-center animate-pulse">Reading layout vectors and municipal seal...</span>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col justify-between space-y-3 py-1">
                                <div className="space-y-2">
                                  <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded text-xxs text-emerald-405 text-emerald-400 flex items-center gap-1.5 leading-tight">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth="3" />
                                    <span>OCR EXTRACT: Stamp matches <strong>RERA/Fire Certificate</strong> vectors! (Confidence 99.4%)</span>
                                  </div>

                                  <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1.5 font-mono text-[9px] text-slate-300">
                                    <p>• Document Code: <span className="text-white font-bold">{scanTitle}</span></p>
                                    <p>• Suggested S3 Category: <span className="text-white font-bold">{scanCategory}</span></p>
                                    <p>• Confidence Index: <span className="text-emerald-400 font-bold">Excellent</span></p>
                                    <p>• Matched Site: <span className="text-teal-400 font-bold truncate block">{activeProject?.name}</span></p>
                                  </div>

                                  <p className="text-[8px] text-slate-500 leading-normal">
                                    BuildVault edge models matching national statutory clearance seals. Apply metadata directly to file taxonomy.
                                  </p>
                                </div>

                                <button
                                  onClick={() => setScannerStep('tag')}
                                  className="w-full py-1.8 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold rounded text-center block text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer"
                                >
                                  Apply Parsed OCR & Edit Taxonomy
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {scannerStep === 'tag' && (
                          <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Metadata classifications</span>
                            
                            <div className="space-y-2">
                              <div>
                                <label className="text-[8px] text-slate-500 uppercase">Document Name</label>
                                <input
                                  type="text"
                                  value={scanTitle}
                                  onChange={e => setScanTitle(e.target.value)}
                                  className="w-full text-xxs p-1.5 bg-slate-900 border border-slate-750 text-white rounded focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8px] text-slate-500 uppercase">S3 Category</label>
                                  <select
                                    value={scanCategory}
                                    onChange={e => setScanCategory(e.target.value as DocumentCategory)}
                                    className="w-full text-[9px] p-1.5 bg-slate-900 border border-slate-750 text-white rounded focus:outline-none"
                                  >
                                    {categories.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[8px] text-slate-500 uppercase">Scope Project Code</label>
                                  <input
                                    type="text"
                                    value={activeProject?.code || ''}
                                    disabled
                                    className="w-full text-xxs p-1.5 bg-slate-900 border border-slate-750 text-slate-500 rounded cursor-not-allowed"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[8px] text-slate-500 uppercase">Search Keywords (CSV)</label>
                                <input
                                  type="text"
                                  value={scanTags}
                                  onChange={e => setScanTags(e.target.value)}
                                  className="w-full text-xxs p-1.5 bg-slate-900 border border-slate-750 text-white rounded focus:outline-none"
                                />
                              </div>
                            </div>

                            <button
                              onClick={handleUploadScan}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold rounded text-center block text-xxs mt-2 flex items-center justify-center gap-1"
                            >
                              <Upload className="w-3.5 h-3.5" /> PUSH to secure S3 bucket
                            </button>
                          </div>
                        )}

                        {scannerStep === 'uploading' && (
                          <div className="flex-1 flex flex-col justify-center items-center py-10 space-y-3">
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin"></div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest text-center">Ingesting metadata layers into secure S3 bucket directory...</span>
                          </div>
                        )}

                        {scannerStep === 'complete' && (
                          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-8">
                            <span className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center justify-center text-xl shadow-md">✓</span>
                            <div className="space-y-1">
                              <h4 className="font-sans font-semibold text-white tracking-tight">Synchronized!</h4>
                              <p className="text-[10px] text-slate-400">Your scanned file was parsed, edge-cropped, tagged and uploaded to S3 immediately!</p>
                            </div>
                            <button
                              onClick={() => { resetScanner(); setActiveMobileScreen('home'); }}
                              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-205 text-slate-200 rounded-lg text-xxs"
                            >
                              Return to Dashboard
                            </button>
                          </div>
                        )}

                      </div>
                    )}

                    {/* Screen 3: Mobile Documents explorer */}
                    {activeMobileScreen === 'documents' && (
                      <div className="flex-1 flex flex-col min-h-0 space-y-2 text-xxs">
                        
                        <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 mb-1 text-slate-400">
                          <span className="font-semibold text-slate-300">Vault files catalog</span>
                          <button onClick={() => setActiveMobileScreen('home')} className="text-[9px]">✕ back</button>
                        </div>

                        {/* Search */}
                        <div className="relative py-1 shrink-0">
                          <Search className="absolute left-2 top-2.5 text-slate-500 w-3 h-3" />
                          <input
                            type="text"
                            placeholder="Query document title tags..."
                            value={docSearch}
                            onChange={e => setDocSearch(e.target.value)}
                            className="bg-slate-900 border border-slate-750 text-xxs pl-7 pr-2 py-1 rounded w-full focus:outline-none"
                          />
                        </div>

                        {/* Files catalog */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                          {activeProjectDocs.filter(d => d.name.toLowerCase().includes(docSearch.toLowerCase())).length === 0 ? (
                            <p className="text-slate-500 text-center py-6 text-xxxs">No cataloged project assets found.</p>
                          ) : (
                            activeProjectDocs
                              .filter(d => d.name.toLowerCase().includes(docSearch.toLowerCase()))
                              .map(doc => (
                                <div 
                                  key={doc.id}
                                  onClick={() => { setSelectedDocId(doc.id); setActiveMobileScreen('docDetail'); }}
                                  className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg cursor-pointer flex justify-between items-center gap-2"
                                >
                                  <div className="truncate flex-1 space-y-0.5">
                                    <h5 className="font-sans font-medium text-white text-[11px] truncate leading-tight">{doc.name}</h5>
                                    <div className="flex gap-2 text-[8px] text-slate-500 font-mono">
                                      <span>v{doc.latestVersion}</span>
                                      <span>📂 {doc.category}</span>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                              ))
                          )}
                        </div>

                      </div>
                    )}

                    {/* Screen 4: Mobile Doc Version Detail */}
                    {activeMobileScreen === 'docDetail' && focusedDoc && (
                      <div className="flex-1 flex flex-col justify-between space-y-3 text-xxs font-mono">
                        
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1 text-slate-400">
                          <span className="font-semibold text-slate-300">File overview</span>
                          <button onClick={() => setActiveMobileScreen('documents')} className="text-[10px]">✕ back</button>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto pr-0.5 leading-normal">
                          <div className="space-y-1">
                            <span className="text-[8px] bg-slate-900 border px-1.5 py-0.5 rounded text-orange-400 uppercase tracking-wider">v{focusedDoc.latestVersion} RELEASE</span>
                            <h4 className="text-[11px] font-sans font-bold text-white mt-1 break-words">{focusedDoc.name}</h4>
                            <p className="text-[8px] text-slate-500 break-all bg-black/30 p-1 rounded font-mono">s3://{projects.find(p => p.id === focusedDoc.projectId)?.code}/{focusedDoc.category.toLowerCase().replace(/\s+/g, '-')}/{focusedDoc.name.toLowerCase()}_v{focusedDoc.latestVersion}.pdf</p>
                          </div>

                          <div className="space-y-1 text-slate-400 leading-normal border-t border-slate-850 pt-2 text-[10px]">
                            <p>📁 Folder slice: <strong>{focusedDoc.category}</strong></p>
                            <p>📅 Checked of date: <strong>{focusedDoc.uploadDate}</strong></p>
                            <p>⏳ Sign-off: <strong className="text-white">{focusedDoc.status}</strong></p>
                          </div>

                          {/* Version logs */}
                          <div className="space-y-1.5 border-t border-slate-850 pt-2">
                            <span className="text-[9px] font-bold text-slate-505 text-slate-400 uppercase">Version releases</span>
                            {focusedDocVersions.map(v => (
                              <div key={v.id} className="bg-slate-900/60 p-2 border border-slate-850 rounded text-xxxs space-y-1">
                                <div className="flex justify-between text-white">
                                  <strong>v{v.versionNumber} ({v.fileSize})</strong>
                                  <span className="text-[8px] text-slate-500">{v.uploadDate}</span>
                                </div>
                                {v.comment && <p className="text-slate-400 leading-relaxed italic">&quot;{v.comment}&quot;</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => alert(`Downloading: ${focusedDoc.name}_v${focusedDoc.latestVersion}.pdf\nSecure S3 Path:\n${projects.find(p => p.id === focusedDoc.projectId)?.code}/${focusedDoc.category.toLowerCase().replace(/\s+/g, '-')}/${focusedDoc.name.toLowerCase()}_v${focusedDoc.latestVersion}.pdf`)}
                          className="w-full py-2 bg-slate-100 hover:bg-white text-slate-950 font-sans font-semibold rounded text-center block"
                        >
                          Download Binary PDF
                        </button>

                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* Simulated hardware back / home key row */}
            <div className="h-12 shrink-0 bg-slate-950 flex justify-center items-center z-10">
              <button 
                onClick={() => {
                  if (isLoggedIn) {
                    setActiveMobileScreen('home');
                    setSelectedDocId(null);
                  }
                }}
                className="w-10 h-10 rounded-full border-2 border-slate-750 hover:bg-slate-850 focus:outline-none flex items-center justify-center transition-colors"
                title="System Home"
              >
                <div className="w-3.5 h-3.5 bg-slate-750 rounded-xs"></div>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
