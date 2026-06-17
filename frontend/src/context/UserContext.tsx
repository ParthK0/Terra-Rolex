import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile } from '../hooks/useAuth';

interface UserContextValue {
  user: UserProfile | null;
  updateUsername: (name: string) => void;
  joinTeam: (teamName: string) => Promise<void>;
  saveOnboarding: (data: {
    transportKm: number;
    transportType: string;
    dietType: string;
    acHours: number;
    flightsCount: number;
    shoppingFreq: string;
  }) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProfileProvider({
  children,
  value
}: {
  children: ReactNode;
  value: UserContextValue;
}) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Access the current user profile and auth actions from anywhere in the tree.
 * Must be used inside a <UserProfileProvider>.
 */
export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUserContext must be used within a UserProfileProvider');
  }
  return ctx;
}
