import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { initializeDatabase } from './services/dbInit';
import AppRouter from './routes';
import LoadingSpinner from './components/common/LoadingSpinner';

// Initialize the master TanStack QueryClient with optimal defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive background re-fetches inside iframe focus shifts
      retry: 1, // Minimize retry delay for snappier offline simulator responses
    },
  },
});

export default function App() {
  const [isBooted, setIsBooted] = useState(false);
  const { login, setOrganizations } = useAuthStore();

  useEffect(() => {
    // Sync localStorage seed tables before booting hooks
    const bootData = initializeDatabase();
    
    if (bootData.cachedUser) {
      // Restore dynamic authentication session
      login(bootData.cachedUser, bootData.cachedUser.organizationId);
      // Ensure the store keeps track of the restored role as well
      useAuthStore.setState({ selectedRole: bootData.cachedUser.role });
    }
    
    // Set active tenants
    setOrganizations(bootData.organizations);
    
    setIsBooted(true);
  }, [login, setOrganizations]);

  if (!isBooted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner fullscreen label="Initializing BuildVault secure workspace sandbox..." />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </QueryClientProvider>
  );
}
