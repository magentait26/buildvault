import { 
  ORGANIZATIONS, 
  INITIAL_USERS, 
  INITIAL_PROJECTS, 
  INITIAL_DOCUMENTS, 
  INITIAL_VERSIONS, 
  INITIAL_COMPLIANCE, 
  INITIAL_APPROVALS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ACTIVITY_LOGS 
} from '../data';

const STORAGE_KEY = 'buildvault_v1_store_v2';
const AUTH_KEY = 'buildvault_auth_v3';
const ORGS_KEY = 'buildvault_orgs_v3';

export function initializeDatabase() {
  // 1. Core tables seeding
  const existingStore = localStorage.getItem(STORAGE_KEY);
  if (!existingStore) {
    const defaultStore = {
      projects: INITIAL_PROJECTS,
      documents: INITIAL_DOCUMENTS,
      versions: INITIAL_VERSIONS,
      compliance: INITIAL_COMPLIANCE,
      approvals: INITIAL_APPROVALS,
      notifications: INITIAL_NOTIFICATIONS,
      logs: INITIAL_ACTIVITY_LOGS,
      users: INITIAL_USERS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStore));
    console.log('[Database] Seeded core tables to localStorage.');
  } else {
    try {
      const parsedStore = JSON.parse(existingStore);
      if (parsedStore && Array.isArray(parsedStore.users)) {
        let dirty = false;
        parsedStore.users = parsedStore.users.map((u: any) => {
          if (u.id === 'u-101' && u.role !== 'Director') {
            u.role = 'Director';
            dirty = true;
          }
          if (u.id === 'u-101b' && u.role !== 'Super Admin') {
            u.role = 'Super Admin';
            dirty = true;
          }
          return u;
        });
        if (dirty) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedStore));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Organizations seeding
  const existingOrgs = localStorage.getItem(ORGS_KEY);
  if (!existingOrgs) {
    localStorage.setItem(ORGS_KEY, JSON.stringify(ORGANIZATIONS));
    console.log('[Database] Seeded organizations list.');
  }

  // 3. Sync existing auth session with Zustand AuthStore if active
  try {
    const cachedUserRaw = localStorage.getItem(AUTH_KEY);
    let cachedUser = cachedUserRaw ? JSON.parse(cachedUserRaw) : null;
    if (cachedUser && cachedUser.name === 'Arjun Rao') {
      cachedUser.role = 'Director';
      localStorage.setItem(AUTH_KEY, JSON.stringify(cachedUser));
    }
    const orgsList = JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');
    
    // Import store dynamically or handle inside App.tsx mount
    return {
      cachedUser: cachedUser,
      organizations: orgsList.length ? orgsList : ORGANIZATIONS,
      users: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').users || INITIAL_USERS
    };
  } catch (e) {
    console.error('[Database] Sync error', e);
    return {
      cachedUser: null,
      organizations: ORGANIZATIONS,
      users: INITIAL_USERS
    };
  }
}

export function forceResetToPristine() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ORGS_KEY);
  localStorage.removeItem(AUTH_KEY);
  console.log('[Database] Storage caches purged.');
  return initializeDatabase();
}
