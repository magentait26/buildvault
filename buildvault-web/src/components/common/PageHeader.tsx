import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useProjectsQuery } from '../../services/queries';
import { Project } from '../../types';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  showProjectSelector?: boolean;
}

export default function PageHeader({ 
  title, 
  description, 
  actions, 
  showProjectSelector = false 
}: PageHeaderProps) {
  const { selectedProjectId, setSelectedProjectId } = useUiStore();
  const { data: projects } = useProjectsQuery();

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProjectId(val === 'all' ? null : val);
  };

  return (
    <div id="page-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 px-1 border-b border-slate-200 bg-white shadow-3xs rounded-xl mb-4 sm:mb-6 pr-6 pl-4 select-none">
      <div className="space-y-1.5 flex-1">
        <h1 id="page-header-title" className="title-heavy tracking-normal text-slate-800 text-2xl font-extrabold flex items-center gap-2">
          {title}
        </h1>
        {description && (
          <p id="page-header-desc" className="text-xs text-slate-500 font-medium">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
        {showProjectSelector && projects && projects.length > 0 && (
          <div className="relative flex items-center">
            <select
              id="header-project-selector"
              value={selectedProjectId || 'all'}
              onChange={handleProjectChange}
              className="text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/95 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors appearance-none min-w-[180px]"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'></path></svg>")`, backgroundPosition: 'right 10px center', backgroundSize: '12px', backgroundRepeat: 'no-repeat' }}
            >
              <option value="all">📁 All Active Portfolios</option>
              {projects.map((proj: Project) => (
                <option key={proj.id} value={proj.id}>
                  🟢 [{proj.code}] {proj.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {actions && (
          <div id="page-header-actions" className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
