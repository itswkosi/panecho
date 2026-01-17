/**
 * Data retention management service
 * Handles retention status checking, extensions, and scheduled deletion
 */

import { createClient } from '@/lib/supabase/server';
import { ErrorCode } from '@/lib/types/errors';

const RETENTION_DAYS = 90;
const MAX_EXTENSIONS = 3;
const EXTENSION_DAYS = 90;
const WARNING_THRESHOLD_DAYS = 10;

export interface RetentionStatus {
  scanId: string;
  scanDate: Date;
  daysRemaining: number;
  expiresAt: Date;
  canExtend: boolean;
  extensionCount: number;
}

export interface ExtensionResult {
  scanId: string;
  newExpirationDate: Date;
  extensionsRemaining: number;
}

export interface DeletionReport {
  deletedScans: number;
  deletedAnalyses: number;
  deletedFiles: number;
  errors: string[];
}

/**
 * Check retention status for user's scans
 * Returns scans expiring within 10 days
 */
export async function checkRetentionStatus(userId: string): Promise<RetentionStatus[]> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const { data: scans, error } = await supabase
      .from('scans')
      .select('id, scan_date, retention_expires_at, retention_extended_count')
      .eq('user_id', userId)
      .lte('retention_expires_at', tenDaysFromNow.toISOString())
      .gt('retention_expires_at', now.toISOString())
      .order('retention_expires_at', { ascending: true });

    if (error) {
      console.error('Error checking retention status:', error);
      throw new Error(`Failed to check retention status: ${error.message}`);
    }

    if (!scans) {
      return [];
    }

    return scans.map((scan: any) => {
      const expiresAt = new Date(scan.retention_expires_at);
      const daysRemaining = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      return {
        scanId: scan.id,
        scanDate: new Date(scan.scan_date),
        daysRemaining: Math.max(0, daysRemaining),
        expiresAt,
        canExtend: scan.retention_extended_count < MAX_EXTENSIONS,
        extensionCount: scan.retention_extended_count,
      };
    });
  } catch (error) {
    console.error('Error in checkRetentionStatus:', error);
    throw error;
  }
}

/**
 * Extend retention for a scan by 90 days
 * Maximum 3 extensions (270 days total extension)
 */
export async function extendRetention(scanId: string): Promise<ExtensionResult> {
  try {
    const supabase = await createClient();

    // Get current retention data
    const { data: scan, error: fetchError } = await supabase
      .from('scans')
      .select('retention_expires_at, retention_extended_count')
      .eq('id', scanId)
      .single();

    if (fetchError || !scan) {
      throw new Error(`Failed to fetch scan: ${fetchError?.message || 'Scan not found'}`);
    }

    // Check if max extensions reached
    if (scan.retention_extended_count >= MAX_EXTENSIONS) {
      throw new Error(
        `Maximum extensions (${MAX_EXTENSIONS}) reached for this scan`
      );
    }

    // Calculate new expiration date
    const currentExpiration = new Date(scan.retention_expires_at);
    const newExpiration = new Date(
      currentExpiration.getTime() + EXTENSION_DAYS * 24 * 60 * 60 * 1000
    );

    // Update scan with new expiration and increment extension count
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        retention_expires_at: newExpiration.toISOString(),
        retention_extended_count: scan.retention_extended_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    if (updateError) {
      throw new Error(`Failed to extend retention: ${updateError.message}`);
    }

    return {
      scanId,
      newExpirationDate: newExpiration,
      extensionsRemaining: MAX_EXTENSIONS - (scan.retention_extended_count + 1),
    };
  } catch (error) {
    console.error('Error extending retention:', error);
    throw error;
  }
}

/**
 * Delete expired scan data
 * Queries scans where retention_expires_at < NOW()
 * Deletes files from Storage and records from Database
 */
export async function deleteExpiredData(): Promise<DeletionReport> {
  const report: DeletionReport = {
    deletedScans: 0,
    deletedAnalyses: 0,
    deletedFiles: 0,
    errors: [],
  };

  try {
    const supabase = await createClient();
    const now = new Date();

    // Get all expired scans
    const { data: expiredScans, error: fetchError } = await supabase
      .from('scans')
      .select('id, file_url')
      .lt('retention_expires_at', now.toISOString());

    if (fetchError) {
      report.errors.push(`Failed to fetch expired scans: ${fetchError.message}`);
      return report;
    }

    if (!expiredScans || expiredScans.length === 0) {
      return report; // No expired scans
    }

    // Delete each scan and its associated data
    for (const scan of expiredScans) {
      try {
        await deleteUserData(scan.file_url.split('/')[0], scan.id);
        report.deletedScans++;
      } catch (error) {
        report.errors.push(
          `Failed to delete scan ${scan.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return report;
  } catch (error) {
    report.errors.push(
      `Error in deleteExpiredData: ${error instanceof Error ? error.message : String(error)}`
    );
    return report;
  }
}

/**
 * Manual deletion of user data
 * If scanId provided: delete specific scan
 * If not: delete all user's scans
 * Includes Storage files + DB records
 */
export async function deleteUserData(
  userId: string,
  scanId?: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get scans to delete
    let query = supabase
      .from('scans')
      .select('id, file_url');

    query = query.eq('user_id', userId);

    if (scanId) {
      query = query.eq('id', scanId);
    }

    const { data: scans, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch scans for deletion: ${fetchError.message}`);
    }

    if (!scans || scans.length === 0) {
      throw new Error('No scans found to delete');
    }

    const scanIds = scans.map((scan: any) => scan.id);

    // Delete files from storage
    for (const scan of scans) {
      try {
        const filePath = scan.file_url.replace(
          /^.*\/storage\/v1\/object\/public\/scans\//,
          ''
        );
        // Delete file from storage using supabase client
        await supabase.storage.from('scans').remove([filePath]);
      } catch (error) {
        console.error(`Failed to delete file for scan ${scan.id}:`, error);
        // Continue deleting other files even if one fails
      }
    }

    // Delete analyses (cascade from RLS policy)
    const { error: analysesError } = await supabase
      .from('analyses')
      .delete()
      .in('scan_id', scanIds);

    if (analysesError) {
      console.error('Error deleting analyses:', analysesError);
      // Don't throw - continue to delete scans
    }

    // Delete scans
    const { error: scansError } = await supabase
      .from('scans')
      .delete()
      .in('id', scanIds);

    if (scansError) {
      throw new Error(`Failed to delete scans: ${scansError.message}`);
    }
  } catch (error) {
    console.error('Error in deleteUserData:', error);
    throw error;
  }
}

/**
 * Get retention expiration date for a specific scan
 */
export async function getScanRetentionInfo(scanId: string): Promise<{
  expiresAt: Date;
  daysRemaining: number;
  canExtend: boolean;
  extensionCount: number;
}> {
  try {
    const supabase = await createClient();

    const { data: scan, error } = await supabase
      .from('scans')
      .select('retention_expires_at, retention_extended_count')
      .eq('id', scanId)
      .single();

    if (error || !scan) {
      throw new Error(`Failed to fetch scan retention info: ${error?.message}`);
    }

    const expiresAt = new Date(scan.retention_expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    return {
      expiresAt,
      daysRemaining: Math.max(0, daysRemaining),
      canExtend: scan.retention_extended_count < MAX_EXTENSIONS,
      extensionCount: scan.retention_extended_count,
    };
  } catch (error) {
    console.error('Error getting scan retention info:', error);
    throw error;
  }
}

/**
 * Initialize retention expiration for a new scan
 * Called after upload, sets expiration to 90 days from now
 */
export async function initializeRetention(scanId: string): Promise<Date> {
  try {
    const supabase = await createClient();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);

    const { error } = await supabase
      .from('scans')
      .update({
        retention_expires_at: expiresAt.toISOString(),
        retention_extended_count: 0,
      })
      .eq('id', scanId);

    if (error) {
      throw new Error(`Failed to initialize retention: ${error.message}`);
    }

    return expiresAt;
  } catch (error) {
    console.error('Error initializing retention:', error);
    throw error;
  }
}
