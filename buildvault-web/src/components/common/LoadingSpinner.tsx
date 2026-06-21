import React from 'react';
import { RefreshCcw } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  fullscreen?: boolean;
}

export default function LoadingSpinner({ 
  label = 'Accessing portfolio ledger state...', 
  fullscreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3.5 select-none text-center">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <RefreshCcw className="h-6 w-6 text-blue-600 animate-spin stroke-[2]" />
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-10 animate-ping"></span>
      </div>
      {label && (
        <p className="text-xs font-semibold text-slate-500 font-mono tracking-tight animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-[220px] bg-white border border-slate-200/95 rounded-2xl p-6">
      {content}
    </div>
  );
}
