import React from 'react';
import { Notification } from '../types';
import { Bell, BellOff, CheckCheck, Trash2, Calendar, FilePlus2, CheckCircle2, AlertTriangle, CloudUpload } from 'lucide-react';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export default function NotificationsView({
  notifications,
  onMarkAllAsRead,
  onClearAll
}: NotificationsViewProps) {

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-sans font-medium text-slate-950">In-App Notification Dispatch</h2>
          <p className="text-xs text-slate-500">Track real-time system uploads, clearance expiries, and approval states</p>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-xs font-mono text-slate-705 border border-slate-200 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 flex items-center gap-1 shadow-xxs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> Read All
            </button>
            <button
              onClick={onClearAll}
              className="text-xs font-mono text-rose-700 border border-red-100 px-3 py-1.5 rounded-lg bg-red-50/20 hover:bg-red-50/50 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-150 rounded-xl divide-y divide-slate-100 shadow-xxs overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <BellOff className="w-12 h-12 text-slate-250 mx-auto stroke-[1.5]" />
            <h4 className="text-sm font-sans font-semibold text-slate-700">All alerts processed</h4>
            <p className="text-xs max-w-xs mx-auto">Nice job! All operations have been acknowledged and cleared in the system.</p>
          </div>
        ) : (
          notifications.map(notif => {
            // Pick icon
            const isUpload = notif.type === 'Upload';
            const isApproval = notif.type === 'ApprovalApproved' || notif.type === 'ApprovalRejected';
            const isWarning = notif.type === 'ExpiryWarning' || notif.type === 'ExpiryAlert';

            return (
              <div 
                key={notif.id} 
                className={`p-4 flex gap-4 transition-colors relative ${
                  notif.isRead ? 'bg-white opacity-80' : 'bg-slate-50/50'
                }`}
              >
                {!notif.isRead && (
                  <span className="absolute left-1.5 top-5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                )}

                <div className={`p-2 rounded-lg shrink-0 h-max border ${
                  isUpload ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                  isApproval ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {isUpload && <CloudUpload className="w-4 h-4" />}
                  {isApproval && <CheckCircle2 className="w-4 h-4" />}
                  {isWarning && <AlertTriangle className="w-4 h-4" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-4">
                    <h5 className="font-sans font-medium text-xs text-slate-900">{notif.title}</h5>
                    <span className="text-xxs font-mono text-slate-400 shrink-0">{notif.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed">{notif.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
