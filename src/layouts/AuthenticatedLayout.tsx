import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUiStore } from '../store/useUiStore';
import { Role } from '../types';
import { 
  Building2, FileText, CheckSquare, ShieldCheck, UserCheck, 
  Bell, Database, Layers, BarChart3, Settings, LogOut, Menu, X, Plug,
  ChevronDown, Users, LayoutGrid, Sun, Moon, Search, PanelLeftClose, PanelLeft, ArrowLeftRight
} from 'lucide-react';
import { useApprovalsQuery } from '../services/queries';
import CommandPalette from '../components/common/CommandPalette';
import { settingsService } from '../services/settingsService';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

export default function AuthenticatedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    authenticatedUser, 
    selectedOrgId, 
    selectedRole, 
    organizations, 
    isImpersonating, 
    setSelectedOrgId, 
    setSelectedRole, 
    stopImpersonation, 
    logout 
  } = useAuthStore();

  const { 
    isSidebarOpen, 
    toggleSidebar, 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    setMobileMenuOpen 
  } = useUiStore();

  // Dark/Light Mode state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  // Search Everywhere State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.title = 'BuildVault | Magenta IT Solutions';
  }, []);

  // Command palette keybinds (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Load live counts via TanStack Query to replace hardcoded values
  const { data: approvals } = useApprovalsQuery();
  const pendingApprovalsCount = approvals?.filter(a => a.status === 'Pending').length || 0;

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const getGroupedNavigationItems = (role: Role): { workspace: NavItem[]; manage: NavItem[] } => {
    // Retrieve dynamic client-specific settings configurations from storage
    const settings = settingsService.getTenantSettings(selectedOrgId || 'org-1');
    const enabledModules = settings?.subscription?.enabledModules || ['dashboard', 'projects', 'documents', 'settings'];
    
    // Find matching role authorization boundaries
    const rolePermissionDef = settings?.rolePermissions?.find(rp => rp.roleName === role);
    const isModuleAllowed = (moduleId: string) => {
      const isConfigEnabled = enabledModules.includes(moduleId);
      if (role === 'Super Admin') return isConfigEnabled;
      const isRoleGranted = rolePermissionDef ? rolePermissionDef.modulesEnabled.includes(moduleId) : true;
      return isConfigEnabled && isRoleGranted;
    };

    const approval_module_enabled = settings?.subscription?.enabledModules?.includes('approvals') ?? false;
    const compliance_module_enabled = settings?.subscription?.enabledModules?.includes('compliance') ?? false;

    const workspace: NavItem[] = [];
    if (isModuleAllowed('dashboard')) {
      workspace.push({ id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutGrid });
    }
    if (isModuleAllowed('projects')) {
      workspace.push({ id: 'projects', label: 'Projects', path: '/projects', icon: Layers });
    }
    if (isModuleAllowed('documents')) {
      workspace.push({ id: 'documents', label: 'Documents', path: '/documents', icon: FileText });
    }
    if (compliance_module_enabled === true && isModuleAllowed('compliance') && role !== 'Site Engineer') {
      workspace.push({ id: 'compliance', label: 'Compliance', path: '/compliance', icon: ShieldCheck });
    }
    if (approval_module_enabled === true && isModuleAllowed('approvals') && role !== 'Site Engineer') {
      workspace.push({ id: 'approvals', label: 'Approvals', path: '/approvals', icon: CheckSquare, badge: pendingApprovalsCount });
    }
    if ((isModuleAllowed('dashboard') || isModuleAllowed('projects')) && role !== 'Site Engineer') {
      workspace.push({ id: 'reports', label: 'Document Analytics', path: '/reports', icon: BarChart3 });
    }

    const manage: NavItem[] = [];
    if (isModuleAllowed('integrations') && (role === 'Super Admin' || role === 'Director' || role === 'Project Manager')) {
      manage.push({ id: 'integrations', label: 'Integrations', path: '/integrations', icon: Plug });
    }
    if (isModuleAllowed('alerts')) {
      manage.push({ id: 'alerts', label: 'Notifications', path: '/alerts', icon: Bell });
    }
    if (isModuleAllowed('users') && (role === 'Super Admin' || role === 'Director' || role === 'Project Manager')) {
      manage.push({ id: 'users', label: 'Users', path: '/users', icon: Users });
    }
    if (isModuleAllowed('settings')) {
      manage.push({ id: 'settings', label: 'Settings', path: '/settings', icon: Settings });
    } else {
      // Super Admin and high profiles can always change settings as fallback
      if (role === 'Super Admin' || role === 'Director') {
        manage.push({ id: 'settings', label: 'Settings', path: '/settings', icon: Settings });
      }
    }

    return { workspace, manage };
  };

  const activeRole = selectedRole || 'Auditor';
  const { workspace, manage } = getGroupedNavigationItems(activeRole);

  const activeOrg = organizations.find(o => o.id === selectedOrgId);

  return (
    <div id="auth-layout-root" className="min-h-screen bg-[#f3f7f6] dark:bg-[#051a17] flex flex-col justify-between selection:bg-teal-100 selection:text-teal-900 antialiased text-slate-800 dark:text-slate-105 font-sans transition-colors duration-150">
      
      {/* Corporate Top Navigation Header */}
      <header id="app-header" className="bg-white dark:bg-[#092622] border-b border-slate-200/90 dark:border-emerald-950/60 sticky top-0 z-20 shrink-0 shadow-xs transition-colors duration-150">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          
          {/* Left panel: Brand and active workspace indicator */}
          <div className="flex items-center gap-4 lg:gap-6">
            <button 
              id="mobile-menu-trigger" 
              onClick={toggleMobileMenu} 
              className="lg:hidden p-2 text-slate-500 dark:text-slate-450 hover:text-[#115e59] dark:hover:text-emerald-400 hover:bg-[#eef5f3] dark:hover:bg-[#113f37] rounded-lg"
            >
              <Menu className="w-6 h-6 stroke-[1.8]" />
            </button>

            {/* Desktop Side Bar collapse button trigger (Material Design 3 style) */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100 hover:bg-[#eef5f3] dark:hover:bg-[#113f37] rounded-lg border border-slate-200 dark:border-[#113f37] shadow-3xs cursor-pointer transition-all"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeft className="w-4.5 h-4.5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="bg-[#115e59] dark:bg-emerald-500 text-white dark:text-slate-950 p-2 rounded-xl flex items-center justify-center shadow-xs">
                <Layers className="w-4.5 h-4.5 stroke-[1.8]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-slate-900 dark:text-white font-sans tracking-tight leading-none">
                  BuildVault
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-emerald-400 mt-0.5 uppercase tracking-widest font-sans">
                  Enterprise Platform
                </span>
              </div>
            </div>

            <span className="text-slate-250 dark:text-slate-700 text-lg hidden md:block select-none">/</span>

            <div id="org-badge" className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 dark:bg-sky-950/20 text-blue-800 dark:text-sky-400 border border-blue-100/50 dark:border-sky-900/30 rounded-lg text-xs font-semibold">
              <span>🏢 {activeOrg?.name || 'BuildVault'} Organization</span>
            </div>
          </div>

          {/* Center Column: Search trigger Button (Notion & Linear design style) */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#051a17]/60 hover:bg-slate-100 dark:hover:bg-[#051a17] hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200/95 dark:border-emerald-950/60 rounded-lg shadow-3xs transition-all pointer-events-auto cursor-pointer"
            >
              <span className="flex items-center gap-2 font-medium">
                <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                <span>Search everywhere...</span>
              </span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#092622] border border-slate-200 dark:border-emerald-950/40 text-[10px] font-mono rounded shadow-3xs text-slate-400 dark:text-slate-550 shrink-0 font-bold">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right panel: Persona overrider dropdown, Theme layout, and profile action */}
          <div className="flex items-center gap-3">
            {/* Dark & Light Theme Switcher with Micro Animations */}
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#115e59] dark:hover:text-emerald-400 bg-slate-50 dark:bg-[#051a17] hover:bg-[#eef5f3] dark:hover:bg-[#113f37] rounded-lg border border-slate-200 dark:border-emerald-950/60 cursor-pointer transition-all duration-150 shadow-3xs"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <div id="persona-swapper" className="flex items-center gap-2.5 bg-slate-50 dark:bg-[#051a17] border border-slate-200 dark:border-emerald-950/60 rounded-lg px-2.5 py-1 sm:py-1.5 shadow-3xs">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-extrabold text-[10px] shrink-0">
                {authenticatedUser?.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[100px]">{authenticatedUser?.name}</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-emerald-450 mt-0.5 uppercase tracking-wide truncate max-w-[100px]">{selectedRole}</span>
              </div>
              
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
              
              <select
                id="role-impersonator-select"
                value={selectedRole || ''}
                onChange={e => setSelectedRole(e.target.value as Role)}
                className="text-[10px] text-slate-550 dark:text-slate-300 hover:text-[#115e59] dark:hover:text-emerald-400 bg-transparent focus:outline-none cursor-pointer font-bold font-sans uppercase tracking-widest text-right py-0.5 pr-4 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'></path></svg>")`, backgroundPosition: 'right 0 center', backgroundSize: '8px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="Super Admin" className="dark:bg-[#092622] text-slate-800 dark:text-slate-200">Super Admin</option>
                <option value="Director" className="dark:bg-[#092622] text-slate-800 dark:text-slate-200">Director</option>
                <option value="Project Manager" className="dark:bg-[#092622] text-slate-800 dark:text-slate-200">Project Manager</option>
                <option value="Site Engineer" className="dark:bg-[#092622] text-slate-800 dark:text-slate-200">Site Engineer</option>
                <option value="Legal Team" className="dark:bg-[#092622] text-slate-800 dark:text-slate-200">Legal Team</option>
                <option value="Compliance Officer" className="dark:bg-[#092622] text-slate-800 dark:text-slate-200">Compliance Officer</option>
                <option value="Finance Team" className="dark:bg-[#092622] text-slate-800 dark:text-slate-200">Finance Team</option>
                <option value="Auditor" className="dark:bg-[#092622] text-slate-800 dark:text-slate-200">Auditor</option>
              </select>
            </div>

            <button 
              id="logout-btn" 
              onClick={handleLogoutClick} 
              title="Logout session"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#092622] transition-all duration-150 shadow-3xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

        </div>
      </header>

      {/* Primary Shell Container */}
      <div id="shell-container" className="grow flex max-w-[1400px] w-full mx-auto px-0 sm:px-4 lg:px-6 py-4 gap-4 lg:gap-6">
        
        {/* Desktop Sidebar Panel */}
        <aside 
          id="desktop-sidebar" 
          className={`hidden lg:flex flex-col bg-[#113f37] border border-[#0d2e29]/20 rounded-2xl transition-all duration-300 shadow-sm shrink-0 h-[calc(100vh-6rem)] sticky top-24 ${
            isSidebarOpen ? 'w-64 p-5' : 'w-16 p-3 items-center'
          }`}
        >
          {/* Top Brand Logo section inside Sidebar (just like requested image) */}
          {isSidebarOpen && (
            <div className="flex items-center gap-3 pb-5 border-b border-[#1c4d44] mb-4 select-none">
              <div className="bg-[#1a4e45] text-emerald-350 p-2 h-10 w-10 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <Building2 className="w-5 h-5 text-emerald-350 stroke-[2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white font-sans tracking-tight leading-none text-[16px]">
                  BuildVault
                </span>
                <span className="text-[10px] font-semibold text-emerald-305 mt-1.5 uppercase tracking-wide font-sans leading-none">
                  Project Information Hub
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links Area */}
          <div className="flex flex-col gap-1 w-full grow overflow-y-auto pr-1">
            {/* Category: Workspace */}
            {isSidebarOpen && (
              <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-widest mt-2 mb-2 px-3">
                Workspace
              </div>
            )}
            <div className="flex flex-col gap-1 w-full">
              {workspace.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    id={`nav-item-${item.id}`}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm font-semibold transition-all group relative ${
                      isActive 
                        ? 'bg-[#1a4e45] text-white font-bold' 
                        : 'text-emerald-100/90 hover:text-white hover:bg-[#15463f]'
                    }`}
                    title={!isSidebarOpen ? item.label : ''}
                  >
                    <Icon className={`w-4.5 h-4.5 stroke-[2] shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-450 group-hover:text-emerald-200'}`} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`static ml-auto text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-[#1a4e45] text-amber-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {!isSidebarOpen && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-[#113f37] text-white text-xs font-semibold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-55 shadow-md">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Category: Manage */}
            {isSidebarOpen && manage.length > 0 && (
              <div className="text-[10px] font-bold text-emerald-300/70 uppercase tracking-widest mt-6 mb-2 px-3">
                Manage
              </div>
            )}
            <div className="flex flex-col gap-1 w-full">
              {manage.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    id={`nav-item-${item.id}`}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm font-semibold transition-all group relative ${
                      isActive 
                        ? 'bg-[#1a4e45] text-white font-bold' 
                        : 'text-emerald-100/90 hover:text-white hover:bg-[#15463f]'
                    }`}
                    title={!isSidebarOpen ? item.label : ''}
                  >
                    <Icon className={`w-4.5 h-4.5 stroke-[2] shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-450 group-hover:text-emerald-200'}`} />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`static ml-auto text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-[#1a4e45] text-amber-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {!isSidebarOpen && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-[#113f37] text-white text-xs font-semibold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-55 shadow-md">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
               })}
            </div>
          </div>

          {/* Profile Card at very bottom of Sidebar (Matching image precisely) */}
          {isSidebarOpen && (
            <div className="mt-auto border-t border-[#1c4d44] pt-4 flex items-center gap-3 w-full bg-[#113f37] select-none">
              <div className="w-10 h-10 rounded-full bg-[#1a4e45] text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 select-none border border-[#225c52]">
                {authenticatedUser?.name.split(' ').map(n=>n[0]).join('') || 'AR'}
              </div>
              <div className="flex flex-col text-left min-w-0 font-sans">
                <span className="text-xs font-bold text-white truncate leading-tight">
                  {authenticatedUser?.name || 'Arjun Rao'}
                </span>
                <span className="text-[10px] font-medium text-emerald-305 uppercase leading-none mt-1">
                  {selectedRole || 'Director'}
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Flyout Sidebar Menu */}
        {isMobileMenuOpen && (
          <div id="mobile-sidebar-overlay" className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 lg:hidden">
            <div id="mobile-sidebar-panel" className="absolute top-0 bottom-0 left-0 w-72 bg-white max-w-[85%] flex flex-col p-4 shadow-xl border-r border-slate-200 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-slate-900 select-none">Navigation Menu</span>
                <button 
                  id="mobile-close-trigger" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-1 px-2 hover:bg-slate-50 rounded"
                >
                  <X className="w-5 h-5 text-slate-500 hover:text-slate-800" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 grow overflow-y-auto pr-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-2 px-3">
                  Workspace
                </div>
                {workspace.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      id={`mobile-nav-item-${item.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-800'}`} />
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto text-[10px] font-bold h-5 w-5 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {manage.length > 0 && (
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 mb-2 px-3">
                    Manage
                  </div>
                )}
                {manage.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      id={`mobile-nav-item-${item.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-800'}`} />
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto text-[10px] font-bold h-5 w-5 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Major Content Wrapper stage */}
        <main id="main-outlet" className="grow overflow-hidden flex flex-col min-w-0">
          <Outlet />
        </main>

      </div>

      {/* Micro system status footer */}
      <footer id="system-footer" className="bg-white border-t border-slate-100 py-3 px-4 sm:px-6 relative shrink-0">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          <p className="text-[10px] text-slate-400 font-medium">
            BuildVault Real Estate Document Management System • Dual S3 Immutability Checked • <a href="https://www.magentait.com" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-[#115e59] dark:text-emerald-400">Powered by Magenta IT Solutions Pvt Ltd.</a>
          </p>
          <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400">
            <span>TLS 1.3 Encryption Active</span>
            <span className="h-3 w-[1px] bg-slate-205"></span>
            <span>W3C Accessible Layout Ready</span>
          </div>
        </div>
      </footer>

      {/* Command Palette Search everywhere system modal */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

    </div>
  );
}
