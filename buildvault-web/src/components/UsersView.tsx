import React, { useState } from 'react';
import { User, Role, Project } from '../types';
import { Users, UserPlus, Shield, Power, Edit3, Trash2, CheckCircle2, Mail, Briefcase, MapPin } from 'lucide-react';

interface UsersViewProps {
  users: User[];
  projects: Project[];
  currentRole: Role;
  onCreateUser: (user: Omit<User, 'id' | 'organizationId'>) => void;
  onEditUser: (userId: string, updatedFields: Partial<User>) => void;
  onAddLog: (action: string, details: string) => void;
}

const ROLES: Role[] = ['Super Admin', 'Director', 'Project Manager', 'Site Engineer', 'Legal Team', 'Compliance Officer', 'Finance Team', 'Auditor'];

export default function UsersView({
  users,
  projects,
  currentRole,
  onCreateUser,
  onEditUser,
  onAddLog
}: UsersViewProps) {
  // Navigation & create state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('Site Engineer');
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);

  // Only Admin-related roles can add/disable organization users
  const canModifyUsers = currentRole === 'Super Admin' || currentRole === 'Director';

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewRole('Site Engineer');
    setAssignedProjectIds([]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    onCreateUser({
      name: newName,
      email: newEmail,
      role: newRole,
      status: 'Active',
      assignedProjectIds
    });

    onAddLog('User Creation', `Registered user account for ${newName} under role ${newRole}`);
    resetForm();
    setShowCreateModal(false);
  };

  const toggleStatus = (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    onEditUser(user.id, { status: nextStatus });
    onAddLog(user.status === 'Active' ? 'User Disabled' : 'User Re-enabled', `Toggled account of ${user.name} to ${nextStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-sans font-medium text-slate-950">Organization Directory & Identity (RBAC)</h2>
          <p className="text-xs text-slate-500">Enable project isolation, govern database policies, and configure access tokens</p>
        </div>

        {canModifyUsers && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 px-4 py-2 rounded-lg text-xs font-mono font-medium shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Provision Representative
          </button>
        )}
      </div>

      {/* Profile directory card structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => {
          const userProjects = projects.filter(p => u.assignedProjectIds.includes(p.id));
          return (
            <div 
              key={u.id}
              className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                u.status === 'Inactive' ? 'border-dashed border-red-100 bg-red-50/5 opacity-70' : 'border-slate-150 hover:border-slate-350'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 truncate">
                    <h3 className="font-sans font-semibold text-slate-900 text-sm truncate">{u.name}</h3>
                    <p className="text-xxs text-slate-400 font-mono truncate">{u.email}</p>
                  </div>

                  <span className={`px-2 py-0.5 text-xxs font-mono font-bold uppercase rounded-full ${
                    u.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : u.status === 'Invited'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {u.status}
                  </span>
                </div>

                {/* Role badge */}
                <span className="inline-flex items-center gap-1.5 text-xxs font-mono uppercase bg-slate-50 border px-2.5 py-0.5 rounded tracking-wide text-slate-500 font-bold">
                  <Shield className="w-3.5 h-3.5" /> {u.role}
                </span>

                {/* Assigned project locations list */}
                <div className="pt-2.5 border-t border-slate-50 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Assigned scopes ({userProjects.length})</span>
                  <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto">
                    {userProjects.length === 0 ? (
                      <span className="text-slate-400 text-xxs italic">No property scopes binded</span>
                    ) : (
                      userProjects.map(p => (
                        <span key={p.id} className="bg-slate-100 text-slate-600 border px-1.5 rounded text-[10px] truncate max-w-[120px]" title={p.name}>
                          🏢 {p.code}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {canModifyUsers && (
                <div className="pt-3 border-t border-slate-50 flex justify-end gap-2 text-xxs font-mono">
                  <button
                    onClick={() => toggleStatus(u)}
                    className={`px-3 py-1.5 border rounded-lg flex items-center gap-1.5 font-semibold ${
                      u.status === 'Active' 
                        ? 'text-rose-700 border-red-100 bg-red-50/10 hover:bg-rose-100/30' 
                        : 'text-emerald-700 border-emerald-100 bg-emerald-50/10 hover:bg-emerald-100/30'
                    }`}
                  >
                    <Power className="w-3 h-3" /> {u.status === 'Active' ? 'Deactivate' : 'Enable Account'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CREATE USER DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-150 max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 block">
              <h3 className="text-base font-sans font-semibold text-slate-950">Provision Representative</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-mono text-sm"
              >
                ✕ close
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wide text-[10px] block font-semibold">Full Representative Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fiona Williams"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wide text-[10px] block font-semibold">Corporate Email (Supabase Auth)*</label>
                <input
                  type="email"
                  required
                  placeholder="fiona@abcbuilders.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wide text-[10px] block font-semibold font-bold">Assign Corporate RBAC Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as Role)}
                  className="w-full text-xs border border-slate-200 rounded p-2.5 focus:outline-none bg-white font-mono"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Multi-project assign */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wide text-[10px] block font-semibold">Project assignments Scope</label>
                <div className="border border-slate-200 rounded p-2.5 bg-slate-50 max-h-[120px] overflow-y-auto space-y-1.5">
                  {projects.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-0.5 text-slate-700 hover:bg-white rounded cursor-pointer transition-colors block text-xxs">
                      <input
                        type="checkbox"
                        checked={assignedProjectIds.includes(p.id)}
                        onChange={() => {
                          if (assignedProjectIds.includes(p.id)) {
                            setAssignedProjectIds(assignedProjectIds.filter(id => id !== p.id));
                          } else {
                            setAssignedProjectIds([...assignedProjectIds, p.id]);
                          }
                        }}
                        className="rounded"
                      />
                      <span className="truncate">{p.code} - {p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded bg-white"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-white bg-slate-900 border border-slate-950 hover:bg-slate-800 rounded font-semibold flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
