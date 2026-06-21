import React from 'react';
import { Layers } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ 
  title, 
  description, 
  icon, 
  action 
}: EmptyStateProps) {
  return (
    <div id="empty-state-card" className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-3xs max-w-lg mx-auto my-6 select-none animate-in fade-in-50 duration-200">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-full mb-4 text-slate-400">
        {icon || <Layers className="w-8 h-8 stroke-[1.5]" />}
      </div>
      <h3 id="empty-state-title" className="text-base font-bold text-slate-800 tracking-tight leading-tight mb-2">
        {title}
      </h3>
      <p id="empty-state-desc" className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div id="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
}
