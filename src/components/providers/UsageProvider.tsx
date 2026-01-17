'use client';

import { ReactNode, createContext, useContext, useEffect } from 'react';
import { useUsageStore } from '@/lib/hooks/useUsageStore';
import type { UsageLimitResult } from '@/lib/usage/tracker';

interface UsageContextType {
  usageData: UsageLimitResult | null;
  loading: boolean;
  error: string | null;
  fetchUsageData: () => Promise<void>;
  clearError: () => void;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

interface UsageProviderProps {
  children: ReactNode;
}

/**
 * Provider for usage data context
 * Wraps the app to provide usage data to all child components
 */
export function UsageProvider({ children }: UsageProviderProps) {
  const { usageData, loading, error, fetchUsageData, clearError } = useUsageStore();

  // Fetch usage data on mount
  useEffect(() => {
    if (!usageData && !loading) {
      fetchUsageData();
    }
  }, [usageData, loading, fetchUsageData]);

  return (
    <UsageContext.Provider value={{ usageData, loading, error, fetchUsageData, clearError }}>
      {children}
    </UsageContext.Provider>
  );
}

/**
 * Hook to access usage context
 * Use this instead of useUsageStore for components within the provider
 */
export function useUsageContext() {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsageContext must be used within UsageProvider');
  }
  return context;
}
