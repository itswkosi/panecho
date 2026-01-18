/**
 * Usage tracking service for rate limiting
 * Enforces 5 scans per 30-day rolling period
 * 
 * @module server-only
 */

import 'server-only';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { ErrorCode } from '@/lib/types/errors';

const SCANS_LIMIT = 5;
const PERIOD_DAYS = 30;

export interface UsageLimitResult {
  canUpload: boolean;
  scansUsed: number;
  scansRemaining: number;
  resetDate: Date;
  isAdmin?: boolean;
}

/**
 * Check if user can upload a scan
 * Returns usage information and whether upload is allowed
 */
export async function checkUsageLimit(userId: string): Promise<UsageLimitResult> {
  try {
    const supabase = await createServerClient();

    // Get user to check if admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      throw new Error('Failed to fetch user data');
    }

    const isAdmin = userData?.is_admin || false;

    // Admins bypass rate limits
    if (isAdmin) {
      const resetDate = new Date();
      return {
        canUpload: true,
        scansUsed: 0,
        scansRemaining: SCANS_LIMIT,
        resetDate,
        isAdmin: true,
      };
    }

    // Get or create usage record for current period
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - PERIOD_DAYS);

    // Find active period record
    const { data: usageData, error: usageError } = await supabase
      .from('usage_tracking')
      .select('id, scan_count, period_start, period_end')
      .eq('user_id', userId)
      .gte('period_end', now.toISOString())
      .lte('period_start', now.toISOString())
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      // PGRST116 is "no rows" which is expected
      console.error('Error fetching usage data:', usageError);
      throw new Error('Failed to fetch usage data');
    }

    let scanCount = 0;
    let resetDate = new Date(now);
    resetDate.setDate(resetDate.getDate() + PERIOD_DAYS);

    if (usageData) {
      // Active period exists
      scanCount = usageData.scan_count || 0;
      resetDate = new Date(usageData.period_end);
    } else {
      // No active period - will be created on first upload
      resetDate = new Date(now);
      resetDate.setDate(resetDate.getDate() + PERIOD_DAYS);
    }

    const scansRemaining = Math.max(0, SCANS_LIMIT - scanCount);
    const canUpload = scanCount < SCANS_LIMIT;

    return {
      canUpload,
      scansUsed: scanCount,
      scansRemaining,
      resetDate,
      isAdmin: false,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    // On error, allow upload (don't block user)
    return {
      canUpload: true,
      scansUsed: 0,
      scansRemaining: SCANS_LIMIT,
      resetDate: new Date(Date.now() + PERIOD_DAYS * 24 * 60 * 60 * 1000),
    };
  }
}

/**
 * Track a successful scan upload
 * Increments scan count for current period or creates new period
 */
export async function trackScanUsage(userId: string): Promise<void> {
  try {
    const supabase = await createServerClient();

    // Get current period
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - PERIOD_DAYS);

    // Find active period record
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('id, scan_count, period_start, period_end')
      .eq('user_id', userId)
      .gte('period_end', now.toISOString())
      .lte('period_start', now.toISOString())
      .single();

    if (usageData) {
      // Increment existing period
      const { error: updateError } = await supabase
        .from('usage_tracking')
        .update({
          scan_count: (usageData.scan_count || 0) + 1,
          updated_at: now.toISOString(),
        })
        .eq('id', usageData.id);

      if (updateError) {
        console.error('Error updating usage:', updateError);
        throw new Error('Failed to update usage');
      }
    } else {
      // Create new period
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + PERIOD_DAYS);

      const { error: insertError } = await supabase.from('usage_tracking').insert({
        user_id: userId,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        scan_count: 1,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

      if (insertError) {
        console.error('Error creating usage record:', insertError);
        throw new Error('Failed to create usage record');
      }
    }
  } catch (error) {
    console.error('Error tracking scan usage:', error);
    // Don't throw - usage tracking failure shouldn't block upload
  }
}

/**
 * Get the reset date for a user's current period
 * Returns date when 30-day period expires
 */
export async function getResetDate(userId: string): Promise<Date> {
  try {
    const supabase = await createServerClient();

    const now = new Date();

    // Find active period record
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('period_end')
      .eq('user_id', userId)
      .gte('period_end', now.toISOString())
      .single();

    if (usageData?.period_end) {
      return new Date(usageData.period_end);
    }

    // No active period - return 30 days from now
    const resetDate = new Date(now);
    resetDate.setDate(resetDate.getDate() + PERIOD_DAYS);
    return resetDate;
  } catch (error) {
    console.error('Error getting reset date:', error);
    // Default to 30 days from now
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() + PERIOD_DAYS);
    return resetDate;
  }
}

/**
 * Check if user has exceeded usage limit
 * Used by server actions to enforce limits
 */
export async function hasExceededLimit(userId: string): Promise<boolean> {
  const result = await checkUsageLimit(userId);
  return !result.canUpload;
}

/**
 * Format reset date for user display
 */
export function formatResetDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
