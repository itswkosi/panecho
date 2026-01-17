'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  extendRetention,
  deleteUserData,
  checkRetentionStatus,
  getScanRetentionInfo,
} from '@/lib/retention/manager';
import { trackRetentionExtended, trackDataDeleted, trackError } from '@/lib/analytics/tracker';

/**
 * Server action: Extend scan retention
 */
export async function extendScanRetention(scanId: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify user owns the scan
    const { data: scan, error: fetchError } = await supabase
      .from('scans')
      .select('id, user_id')
      .eq('id', scanId)
      .single();

    if (fetchError || !scan || scan.user_id !== user.id) {
      return { success: false, error: 'Scan not found or access denied' };
    }

    const result = await extendRetention(scanId);

    // Track analytics
    trackRetentionExtended(result.extensionsRemaining);

    // Revalidate relevant pages
    revalidatePath('/(protected)/data');
    revalidatePath('/(protected)/results');

    return {
      success: true,
      data: {
        newExpirationDate: result.newExpirationDate.toISOString(),
        extensionsRemaining: result.extensionsRemaining,
      },
    };
  } catch (error) {
    console.error('Error extending retention:', error);
    trackError('extendRetention', true);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extend retention',
    };
  }
}

/**
 * Server action: Delete specific scan
 */
export async function deleteScan(scanId: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify user owns the scan
    const { data: scan, error: fetchError } = await supabase
      .from('scans')
      .select('id, user_id')
      .eq('id', scanId)
      .single();

    if (fetchError || !scan || scan.user_id !== user.id) {
      return { success: false, error: 'Scan not found or access denied' };
    }

    await deleteUserData(user.id, scanId);

    // Track analytics
    trackDataDeleted(false);

    // Revalidate relevant pages
    revalidatePath('/(protected)/data');
    revalidatePath('/(protected)/results');

    return { success: true };
  } catch (error) {
    console.error('Error deleting scan:', error);
    trackError('deleteScan', true);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete scan',
    };
  }
}

/**
 * Server action: Delete all user scans
 */
export async function deleteAllUserScans() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    await deleteUserData(user.id);

    // Track analytics
    trackDataDeleted(true);

    // Revalidate relevant pages
    revalidatePath('/(protected)/data');
    revalidatePath('/(protected)/results');

    return { success: true };
  } catch (error) {
    console.error('Error deleting all scans:', error);
    trackError('deleteAllUserScans', true);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete scans',
    };
  }
}

/**
 * Server action: Get retention status for user's scans
 */
export async function getRetentionStatus() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const statuses = await checkRetentionStatus(user.id);

    return {
      success: true,
      data: statuses.map((s) => ({
        ...s,
        scanDate: s.scanDate.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error getting retention status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get retention status',
    };
  }
}

/**
 * Server action: Get retention info for specific scan
 */
export async function getScanRetention(scanId: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify user owns the scan
    const { data: scan, error: fetchError } = await supabase
      .from('scans')
      .select('id, user_id')
      .eq('id', scanId)
      .single();

    if (fetchError || !scan || scan.user_id !== user.id) {
      return { success: false, error: 'Scan not found or access denied' };
    }

    const info = await getScanRetentionInfo(scanId);

    return {
      success: true,
      data: {
        expiresAt: info.expiresAt.toISOString(),
        daysRemaining: info.daysRemaining,
        canExtend: info.canExtend,
        extensionCount: info.extensionCount,
      },
    };
  } catch (error) {
    console.error('Error getting scan retention:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scan retention',
    };
  }
}
