import { create } from 'zustand';
import type { UsageLimitResult } from '@/lib/usage/tracker';
import { checkUsageLimit } from '@/app/actions/usage';

interface UsageStore {
  usageData: UsageLimitResult | null;
  loading: boolean;
  error: string | null;
  fetchUsageData: () => Promise<void>;
  setUsageData: (data: UsageLimitResult | null) => void;
  clearError: () => void;
}

/**
 * Global usage data store
 * Manages caching and state for usage limits across the app
 */
export const useUsageStore = create<UsageStore>((set: any) => ({
  usageData: null,
  loading: false,
  error: null,

  fetchUsageData: async () => {
    set({ loading: true, error: null });
    try {
      const data: any = await checkUsageLimit();
      set({ usageData: data, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch usage data';
      set({ error: errorMessage, loading: false, usageData: null });
    }
  },

  setUsageData: (data: UsageLimitResult | null) => {
    set({ usageData: data, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
