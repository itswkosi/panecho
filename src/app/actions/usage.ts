'use server';

import { checkUsageLimit as checkUsageLimitServer } from '@/lib/usage/tracker';
import type { UsageLimitResult } from '@/lib/usage/tracker';
import { getUser } from './auth';

/**
 * Server action wrapper for checking usage limit
 * Can be called from client components safely
 */
export async function checkUsageLimit(): Promise<UsageLimitResult | null> {
  try {
    const user = await getUser();
    if (!user) {
      return null;
    }

    return await checkUsageLimitServer(user.id);
  } catch (error) {
    console.error('Error checking usage limit:', error);
    // Return null on error - component will handle with fallback
    return null;
  }
}
