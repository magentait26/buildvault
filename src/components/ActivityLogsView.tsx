import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { Activity, ShieldCheck, Search, Filter, Calendar, ShieldAlert } from 'lucide-react';

interface ActivityLogsViewProps {
  logs: ActivityLog[];
}

export default function ActivityLogsView({ logs }: ActivityLogsViewProps) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Filtering logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) || 
                          log.userName.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === '' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-sans font-medium text-slate-950">Immutable Cryptographic Audit Ledger</h2>
          <p className="text-xs text-slate-500">Un-alterable log stream monitoring every system session, clearance and file commit</p>
        </div>

        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-lg text-xxs font-mono flex items-center gap-1.5 self-start">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>SHA-256 Ledger Sealed</span>
        </div>
      </div>

      {/* Control filters matrix bar */}
      <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-xxs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search logs by action detail strings, username, metadata hashes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-1.8 w-full text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50/50 hover:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="text-slate-400 w-4 h-4 shrink-0" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="py-2 pl-2 pr-8 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none w-full sm:w-44"
          >
            <option value="">All Action Types</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Immutable ledger trail list */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-xxs overflow-hidden divide-y divide-slate-100">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-xs font-mono font-medium text-slate-700">
          <span>Ledger index trail ({filteredLogs.length} events logged)</span>
          <span className="text-xxs text-amber-600 uppercase">Write Only • Zero-Override</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No system log streams mapped to selected criteria.
          </div>
        ) : (
          filteredLogs.map(log => {
            const isApproval = log.action === 'Approval' || log.action === 'Rejection';
            const isUpload = log.action === 'Upload';
            const isCreation = log.action.endsWith('Creation');

            return (
              <div key={log.id} className="p-4 hover:bg-slate-50/20 transition-colors flex flex-col sm:flex-row sm:items-start gap-4 text-xs">
                {/* ID badge */}
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border p-0.5 px-2 rounded shrink-0 h-max w-20 text-center font-bold">
                  #{log.id}
                </span>

                <div className="flex-1 space-y-1">
                  <div className="font-sans font-medium text-slate-800 leading-normal">
                    {log.details}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xxs font-mono text-slate-402 text-slate-450 text-slate-500">
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                      isApproval ? 'bg-emerald-50 text-emerald-800' :
                      isUpload ? 'bg-indigo-50 text-indigo-800' :
                      isCreation ? 'bg-purple-50 text-purple-800' :
                      'bg-slate-50 text-slate-800'
                    }`}>
                      {log.action}
                    </span>
                    <span>•</span>
                    <span>Operator: <strong className="text-slate-700">{log.userName}</strong> ({log.userRole})</span>
                    <span>•</span>
                    <span>Time: {log.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
