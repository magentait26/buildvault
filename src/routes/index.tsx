import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Layouts
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

// Core Business Containers
import { 
  DashboardContainer,
  ProjectsContainer,
  DocumentsContainer,
  ComplianceContainer,
  ApprovalsContainer,
  ReportsContainer,
  IntegrationsContainer,
  NotificationsContainer,
  UsersContainer,
  ActivityLogsContainer,
  SettingsContainer
} from './containers';

import LoginView from '../components/LoginView';

// Reusable Guards
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authenticatedUser } = useAuthStore();
  if (!authenticatedUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { authenticatedUser } = useAuthStore();
  if (authenticatedUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function AppRouter() {
  const { login, organizations } = useAuthStore();
  
  // To avoid passing massive state sets, we reload the database users reactively in the views, 
  // but for Login, we sync back to the stored database tables
  const rawDb = localStorage.getItem('buildvault_v1_store_v2');
  const allUsers = rawDb ? JSON.parse(rawDb).users || [] : [];

  return (
    <Routes>
      {/* Public Guest Routes */}
      <Route 
        path="/login" 
        element={
          <GuestGuard>
            <LoginView 
              onLogin={login} 
              allUsers={allUsers} 
              allOrgs={organizations} 
            />
          </GuestGuard>
        } 
      />

      {/* Authenticated Customer Tenant Routes */}
      <Route 
        path="/" 
        element={
          <AuthGuard>
            <AuthenticatedLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardContainer />} />
        <Route path="projects" element={<ProjectsContainer />} />
        <Route path="documents" element={<DocumentsContainer />} />
        <Route path="compliance" element={<ComplianceContainer />} />
        <Route path="approvals" element={<ApprovalsContainer />} />
        <Route path="reports" element={<ReportsContainer />} />
        <Route path="integrations" element={<IntegrationsContainer />} />
        
        {/* Alerts view route mapped to NotificationsContainer */}
        <Route path="alerts" element={<NotificationsContainer />} />
        {/* We map /notifications path to NotificationsContainer as well to avoid path mismatch */}
        <Route path="notifications" element={<Navigate to="/alerts" replace />} />
        
        <Route path="users" element={<UsersContainer />} />
        <Route path="logs" element={<ActivityLogsContainer />} />
        <Route path="settings" element={<SettingsContainer />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
