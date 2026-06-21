import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../store/useUiStore';
import { 
  Search, Folder, FileText, ShieldCheck, User, X, Command,
  ArrowRight, ShieldAlert, Tag
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  type: 'project' | 'document' | 'compliance' | 'user';
  title: string;
  subtitle: string;
  path: string;
  metadata?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);
  
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'project' | 'document' | 'compliance' | 'user'>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all searchable data from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    // Focus search input
    setTimeout(() => inputRef.current?.focus(), 50);

    try {
      const storeRaw = localStorage.getItem('buildvault_v1_store_v2');
      if (!storeRaw) return;
      const store = JSON.parse(storeRaw);
      
      const allItems: SearchResultItem[] = [];

      // 1. Add projects
      if (Array.isArray(store.projects)) {
        store.projects.forEach((p: any) => {
          allItems.push({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: `Project • ${p.code} • ${p.location}`,
            path: `/projects`,
            metadata: p.status
          });
        });
      }

      // 2. Add documents
      if (Array.isArray(store.documents)) {
        store.documents.forEach((d: any) => {
          allItems.push({
            id: d.id,
            type: 'document',
            title: d.name,
            subtitle: `Document • ${d.category} • Ver ${d.latestVersion}`,
            path: `/documents`,
            metadata: d.status
          });
        });
      }

      // 3. Add compliance items
      if (Array.isArray(store.compliance)) {
        store.compliance.forEach((c: any) => {
          // find project title
          const proj = store.projects?.find((p: any) => p.id === c.projectId);
          allItems.push({
            id: c.id,
            type: 'compliance',
            title: `${c.complianceType} Clearance`,
            subtitle: `Compliance • Asset: ${proj ? proj.name : 'All Projects'}`,
            path: `/compliance`,
            metadata: c.status
          });
        });
      }

      // 4. Add users
      if (Array.isArray(store.users)) {
        store.users.forEach((u: any) => {
          allItems.push({
            id: u.id,
            type: 'user',
            title: u.name,
            subtitle: `User • ${u.role} (${u.email})`,
            path: `/users`,
            metadata: u.status
          });
        });
      }

      // Filter and set results
      let filtered = allItems;
      if (query.trim() !== '') {
        const lowerVal = query.toLowerCase();
        filtered = allItems.filter(item => 
          item.title.toLowerCase().includes(lowerVal) || 
          item.subtitle.toLowerCase().includes(lowerVal) ||
          (item.metadata && item.metadata.toLowerCase().includes(lowerVal))
        );
      }

      if (filterType !== 'all') {
        filtered = filtered.filter(item => item.type === filterType);
      }

      setResults(filtered.slice(0, 15)); // limit 15 results

    } catch (e) {
      console.error('Error fetching command palette data', e);
    }
  }, [query, filterType, isOpen]);

  // Handle outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleItemSelect = (item: SearchResultItem) => {
    // If it is project related, let's select it in UI state
    if (item.type === 'project') {
      setSelectedProjectId(item.id);
    }
    navigate(item.path);
    onClose();
  };

  const getIcon = (type: 'project' | 'document' | 'compliance' | 'user') => {
    switch (type) {
      case 'project': return <Folder className="w-4 h-4 text-blue-500" />;
      case 'document': return <FileText className="w-4 h-4 text-amber-500" />;
      case 'compliance': return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      case 'user': return <User className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs z-100 flex items-start justify-center pt-24 px-4 select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[480px] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar search section */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type anywhere cmd to search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter categories tabs block (Stripe / Linear-like density) */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto select-none font-sans scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
              filterType === 'all' 
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterType('project')}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
              filterType === 'project' 
                ? 'bg-blue-600 text-white border-transparent' 
                : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-705'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setFilterType('document')}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
              filterType === 'document' 
                ? 'bg-amber-600 text-white border-transparent' 
                : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setFilterType('compliance')}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
              filterType === 'compliance' 
                ? 'bg-indigo-600 text-white border-transparent' 
                : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
            }`}
          >
            Compliance Checklist
          </button>
          <button
            onClick={() => setFilterType('user')}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
              filterType === 'user' 
                ? 'bg-emerald-600 text-white border-transparent' 
                : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50'
            }`}
          >
            Users
          </button>
        </div>

        {/* Results view area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar bg-white dark:bg-slate-900">
          {results.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-sans text-xs">
              <Command className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p>No matches found for <strong className="font-semibold text-slate-600 dark:text-slate-400">"{query}"</strong></p>
              <p className="text-[10px] text-slate-400 mt-1">Try another search keyword or portfolio segment</p>
            </div>
          ) : (
            results.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 font-sans text-left">
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.metadata && (
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full font-sans tracking-wide shrink-0 ${
                      item.metadata === 'Active' || item.metadata === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                      item.metadata === 'Pending' || item.metadata === 'Submitted' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                      item.metadata === 'Expired' || item.metadata === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                      'bg-slate-50 text-slate-600 dark:bg-slate-850 dark:text-slate-400'
                    }`}>
                      {item.metadata}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts helper (Notion / Linear style) */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] font-mono font-semibold text-slate-400 select-none">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-3xs text-slate-500 dark:text-slate-300">ESC</kbd> 
            <span>to exit</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-3xs text-slate-500 dark:text-slate-300">↑↓</kbd> 
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-3xs text-slate-500 dark:text-slate-300">Enter</kbd> 
              <span>select</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
