import React, { useState } from 'react';
import { 
  Building2, FileText, CheckSquare, ShieldCheck, 
  Mail, Key, Lock, ArrowRight, ShieldAlert, Layers,
  Cloud, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { User, Organization } from '../types';
import { ApiClient } from '../services/apiClient';

interface LoginViewProps {
  onLogin: (user: User, organizationId: string) => void;
  allUsers: User[];
  allOrgs: Organization[];
}

export default function LoginView({ onLogin, allUsers, allOrgs }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [manualError, setManualError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setManualError('Please provide an email address.');
      return;
    }
    if (!password) {
      setManualError('Please provide a password.');
      return;
    }
    
    setIsLoggingIn(true);
    setManualError('');
    try {
      const res = await ApiClient.login(email.trim(), password);
      if (res.success && res.user) {
        onLogin(res.user, res.user.organizationId);
      }
    } catch (err: any) {
      setManualError(err.message || 'Credentials unrecognized or inactive.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7f6] dark:bg-[#040f0d] flex items-center justify-center p-4 sm:p-6 md:p-8 select-none transition-colors duration-150">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#bfe0d8_2px,transparent_1px)] [background-size:24px_24px] opacity-45 dark:opacity-10"></div>
      
      <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
        
        {/* Left column: Login Screen */}
        <div className="p-6 sm:p-10 md:col-span-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-8 bg-white dark:bg-slate-900">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#115e59] dark:bg-[#113f37] text-white p-2.5 rounded-2xl shadow-3xs flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-300 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-sans font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">BuildVault</h1>
                <span className="text-[9px] font-mono font-bold text-[#115e59] dark:text-emerald-400 uppercase tracking-wider block mt-1">
                  Real Estate Document Management System
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-sans font-extrabold text-slate-800 dark:text-slate-100">
                BuildVault
              </h2>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-sans">
                Secure Project Documents, Approvals & Compliance Management Platform
              </p>
            </div>

            <form onSubmit={handleManualLogin} id="manual-login-form" className="space-y-4 pt-2">
              {manualError && (
                <div id="login-error-alert" className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30 text-[10.5px] font-sans rounded-lg font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    id="login-email-input"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:border-[#115e59] focus:ring-1 focus:ring-[#115e59]/30 rounded-xl focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Password</label>
                  <span className="text-[9px] text-[#115e59] dark:text-emerald-400 font-bold underline cursor-pointer hover:text-[#0b423e]">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password-input"
                    placeholder="••••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 focus:border-[#115e59] focus:ring-1 focus:ring-[#115e59]/30 rounded-xl focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#115e59] dark:hover:text-emerald-400 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 dark:border-slate-705 text-[#115e59] focus:ring-[#115e59]/30" 
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <span className="text-slate-400 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Encrypted SSL
                </span>
              </div>

              <button
                type="submit"
                id="login-submit-button"
                disabled={isLoggingIn}
                className="w-full bg-[#115e59] hover:bg-[#0e4d49] dark:bg-emerald-600 dark:hover:bg-emerald-700 active:scale-95 text-white font-sans font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 mt-4 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-wait"
              >
                <span>{isLoggingIn ? 'Verifying Credentials...' : 'Login'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </form>

            {/* Safe Developer Mode Quick-Fill (Only visible in Local Development) */}
            {(import.meta as any).env?.DEV && (
              <details className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xxs font-mono text-slate-650 dark:text-slate-300">
                <summary className="cursor-pointer font-bold select-none text-amber-700 dark:text-amber-400 hover:underline">
                  [DEV ONLY] Quick-Fill Credentials
                </summary>
                <div className="grid grid-cols-1 gap-1.5 mt-2 max-h-40 overflow-y-auto">
                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setEmail(user.email);
                        setPassword(user.email === 'riyaz26@gmail.com' ? 'Magenta@#921' : 'secret123');
                      }}
                      className="text-left p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{user.name} ({user.role})</div>
                        <div className="text-[10px] text-slate-500">{user.email}</div>
                      </div>
                      <span className="text-emerald-500 font-bold shrink-0 ml-1">Fill →</span>
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xxs text-slate-400 font-mono flex items-center justify-between">
            <span>PLATFORM VER: 3.12.0</span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
              Secure Standalone Active
            </span>
          </div>
        </div>

        {/* Right column: High-Fidelity Custom Real Estate Workspace Visual Illustration */}
        <div className="bg-[#ebf5f3] dark:bg-[#071f1a] text-slate-800 dark:text-slate-200 p-6 sm:p-10 md:col-span-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#115e59_1px,transparent_1px),linear-gradient(to_bottom,#115e59_1px,transparent_1px)] [background-size:4rem_4rem] opacity-5"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-widest text-[#115e59] dark:text-emerald-300 bg-[#d1e7e2] dark:bg-[#113f37] border border-[#a2d4c9] dark:border-emerald-800 uppercase">
                Secure Cloud Storage
              </span>
              <h2 className="text-lg font-sans font-extrabold text-[#113f37] dark:text-emerald-400">
                Enterprise Real Estate Records Vault
              </h2>
              <p className="text-xs leading-normal text-slate-600 dark:text-slate-350 font-sans max-w-lg">
                Consolidated and encrypted real estate archives holding project deeds, site blueprints, and high-compliance clearances under RERA guidelines.
              </p>
            </div>

            {/* Layout representation: Building project, vaults, checkmarks and files cards */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-2">
              
              {/* Project & Blueprint Information Card */}
              <div className="sm:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#e3efec] dark:bg-[#0b2924] text-[#115e59] dark:text-emerald-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold font-sans text-slate-800 dark:text-slate-200">Bhoomi Gardenia I</div>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">RERA P51700001041</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold font-mono tracking-wider text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30">
                    Compliant
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-sans">Clearance Score</span>
                    <span className="font-bold text-[#115e59] dark:text-emerald-400">100% Verified</span>
                  </div>
                  <div className="w-full bg-[#ebf5f3] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#115e59] dark:bg-emerald-500 h-full w-full rounded-full transition-all duration-350"></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-350">
                    <FileText className="w-3.5 h-3.5 text-[#115e59] dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Approval_Architectural_Plan_v3.pdf</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-350">
                    <FileText className="w-3.5 h-3.5 text-[#115e59] dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Structural_Form_A_Final.dwg</span>
                  </div>
                </div>
              </div>

              {/* Status Compliance Shield Card */}
              <div className="sm:col-span-5 bg-gradient-to-br from-[#115e59] to-[#0d4d49] text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between border border-[#0d4c48]">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-emerald-305 bg-white/15">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <Cloud className="w-4 h-4 opacity-50" />
                </div>

                <div className="space-y-1 mt-4">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[#a8ffd2] block uppercase">Vault Status</span>
                  <div className="text-sm font-sans font-extrabold tracking-tight">Active Shield</div>
                  <p className="text-[9px] text-[#bfe0d8] leading-relaxed font-sans opacity-95">
                    Encryption standards meet strict military-grade security matrices.
                  </p>
                </div>
              </div>

              {/* Clearance Steps / Checkmarks checklist */}
              <div className="sm:col-span-12 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Clearance Verification Progress</span>
                  <span className="text-[9px] font-mono font-semibold text-[#115e59] dark:text-emerald-400">4 / 4 Completed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-sans font-medium">Valid Title Deed Cleared</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-sans font-medium">RERA Registration Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-sans font-medium">Fire NOC Certificate uploaded</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-sans font-medium">Structural Stability Certified</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 leading-relaxed text-center sm:text-left flex flex-col sm:flex-row justify-between items-center border-t border-slate-200/50 dark:border-slate-800/40 pt-3 gap-2 relative z-10">
            <span>🛡️ SOC2 Certified Cloud Workspace • <a href="https://www.magentait.com" target="_blank" rel="noopener noreferrer" className="hover:underline font-extrabold text-[#115e59] dark:text-emerald-400">Powered by Magenta IT Solutions Pvt Ltd.</a></span>
            <span className="flex items-center gap-1.5 text-[#115e59] dark:text-emerald-450 font-bold">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AES-256 Encryption Active
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
