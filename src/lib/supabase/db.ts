'use server';

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  Scan,
  InsertScan,
  Analysis,
  InsertAnalysis,
  UsageLimit,
} from '@/lib/types/database';

/**
 * Creates a new Supabase server client with authentication context
 */
function getServerClient() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  return supabase;
}

/**
 * Creates a new scan record in the database
 * @param data - Scan data to insert
 * @returns Created scan object with generated ID
 */
export async function createScan(data: InsertScan): Promise<Scan> {
  const supabase = getServerClient();
  const scanId = uuidv4();
  const now = new Date();
  const retentionExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  console.log('[createScan] Generating new scan ID:', scanId);
  console.log('[createScan] User ID:', data.user_id);
  console.log('[createScan] File name:', data.file_name);

  const { data: scan, error } = await supabase
    .from('scans')
    .insert({
      id: scanId,
      user_id: data.user_id,
      file_url: data.file_url,
      file_name: data.file_name,
      file_size: data.file_size,
      file_type: data.file_type,
      upload_date: now.toISOString(),
      scan_date: data.scan_date.toISOString(),
      clinical_context: data.clinical_context,
      dicom_metadata: data.dicom_metadata || null,
      processing_status: 'pending',
      error_message: null,
      key_slices: data.key_slices || null,
      retention_expires_at: retentionExpiresAt.toISOString(),
      retention_extended_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[createScan] Database insert failed:', error);
    throw new Error(`Failed to create scan: ${error.message}`);
  }

  if (!scan) {
    console.error('[createScan] No scan data returned from database');
    throw new Error('Database returned no scan data');
  }

  console.log('[createScan] Database insert successful, scan ID:', scan.id);
  const formattedScan = formatScanFromDB(scan);
  console.log('[createScan] Formatted scan ID:', formattedScan.id);
  
  return formattedScan;
}

/**
 * Retrieves a scan by ID
 * @param scanId - Scan ID to retrieve
 * @returns Scan object or null if not found
 */
export async function getScan(scanId: string): Promise<Scan | null> {
  const supabase = getServerClient();

  console.log(`[getScan] Attempting to fetch scan: ${scanId}`);

  const { data: scan, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows found"
    console.error(`[getScan] Error fetching scan ${scanId}:`, error);
    throw new Error(`Failed to retrieve scan: ${error.message}`);
  }

  if (!scan) {
    console.log(`[getScan] Scan ${scanId} not found in database`);
  } else {
    console.log(`[getScan] Scan ${scanId} found, status: ${scan.processing_status}, has key_slices: ${!!scan.key_slices}`);
  }

  return scan ? formatScanFromDB(scan) : null;
}

/**
 * Retrieves all scans for a specific user
 * @param userId - User ID to retrieve scans for
 * @returns Array of scan objects
 */
export async function getUserScans(userId: string): Promise<Scan[]> {
  const supabase = getServerClient();

  const { data: scans, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('upload_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to retrieve user scans: ${error.message}`);
  }

  return (scans || []).map(formatScanFromDB);
}

/**
 * Updates a scan record
 * @param scanId - Scan ID to update
 * @param updates - Partial scan data to update
 * @returns Updated scan object
 */
export async function updateScan(
  scanId: string,
  updates: Partial<Scan>
): Promise<Scan> {
  const supabase = getServerClient();

  // Convert dates to ISO strings for database storage
  const dbUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value instanceof Date) {
      dbUpdates[key] = value.toISOString();
    } else {
      dbUpdates[key] = value;
    }
  }

  const { data: scan, error } = await supabase
    .from('scans')
    .update(dbUpdates)
    .eq('id', scanId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update scan: ${error.message}`);
  }

  return formatScanFromDB(scan);
}

/**
 * Deletes a scan record and its associated slices from storage
 * @param scanId - Scan ID to delete
 */
export async function deleteScan(scanId: string): Promise<void> {
  const supabase = getServerClient();

  // First, get the scan to retrieve user_id and storage path
  const scan = await getScan(scanId);
  if (!scan) {
    throw new Error('Scan not found');
  }

  // Delete from storage
  await supabase.storage
    .from('scans')
    .remove([`${scan.user_id}/${scanId}`]);

  // Delete from database
  const { error } = await supabase.from('scans').delete().eq('id', scanId);

  if (error) {
    throw new Error(`Failed to delete scan: ${error.message}`);
  }
}

/**
 * Creates a new analysis record
 * @param data - Analysis data to insert
 * @returns Created analysis object with generated ID
 */
export async function createAnalysis(data: InsertAnalysis): Promise<Analysis> {
  const supabase = getServerClient();
  const analysisId = uuidv4();
  const now = new Date();

  const { data: analysis, error } = await supabase
    .from('analyses')
    .insert({
      id: analysisId,
      scan_id: data.scan_id,
      user_id: data.user_id,
      analysis_type: data.analysis_type,
      classification: data.classification,
      risk_score: data.risk_score,
      ai_summary: data.ai_summary,
      detailed_findings: data.detailed_findings,
      compared_scan_ids: data.compared_scan_ids || null,
      longitudinal_changes: data.longitudinal_changes || null,
      gpt_model_used: data.gpt_model_used,
      tokens_used: data.tokens_used || null,
      processing_time_seconds: data.processing_time_seconds || null,
      slices_analyzed: data.slices_analyzed,
      created_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create analysis: ${error.message}`);
  }

  return formatAnalysisFromDB(analysis);
}

/**
 * Retrieves analysis for a specific scan
 * @param scanId - Scan ID to retrieve analysis for
 * @returns Analysis object or null if not found
 */
export async function getAnalysis(scanId: string): Promise<Analysis | null> {
  const supabase = getServerClient();

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('scan_id', scanId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to retrieve analysis: ${error.message}`);
  }

  return analysis ? formatAnalysisFromDB(analysis) : null;
}

/**
 * Get all analyses for a user with their related scan information
 * @param userId - User ID to retrieve analyses for
 * @returns Array of analyses with scan details
 */
export async function getAnalysesByUserId(
  userId: string
): Promise<
  Array<
    Analysis & {
      scan?: {
        id: string;
        scan_date: Date;
        file_name: string;
      };
    }
  >
> {
  const supabase = getServerClient();

  const { data: analyses, error } = await supabase
    .from('analyses')
    .select(
      `
      *,
      scans:scan_id (
        id,
        scan_date,
        file_name
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to retrieve user analyses: ${error.message}`);
  }

  return (analyses || []).map((analysis: any) => ({
    ...formatAnalysisFromDB(analysis),
    scan: analysis.scans ? (Array.isArray(analysis.scans) ? analysis.scans[0] : analysis.scans) : undefined,
  }));
}

/**
 * Tracks usage for a user (increments scan count)
 * @param userId - User ID to track usage for
 */
export async function trackUsage(userId: string): Promise<void> {
  const supabase = getServerClient();
  const now = new Date();

  // Try to update existing usage record
  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing record
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
    const lastMonth = existing.last_scan_date
      ? new Date(existing.last_scan_date).toISOString().substring(0, 7)
      : null;

    const scansThisMonth =
      currentMonth === lastMonth ? existing.scans_this_month + 1 : 1;

    await supabase
      .from('usage_tracking')
      .update({
        scan_count: existing.scan_count + 1,
        scans_this_month: scansThisMonth,
        last_scan_date: now.toISOString(),
      })
      .eq('user_id', userId);
  } else {
    // Create new usage record
    await supabase.from('usage_tracking').insert({
      id: uuidv4(),
      user_id: userId,
      scan_count: 1,
      scans_this_month: 1,
      total_analyses: 0,
      analyses_this_month: 0,
      last_scan_date: now.toISOString(),
      last_analysis_date: null,
    });
  }
}

/**
 * Checks usage limit for a user (max 5 scans per month)
 * @param userId - User ID to check
 * @returns Usage limit object with canUpload boolean and remaining count
 */
export async function checkUsageLimit(userId: string): Promise<UsageLimit> {
  const supabase = getServerClient();
  const MONTHLY_LIMIT = 5;

  const { data: usage, error } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No usage record yet, user can upload
    return {
      canUpload: true,
      remaining: MONTHLY_LIMIT,
      monthly_limit: MONTHLY_LIMIT,
      scans_this_month: 0,
    };
  }

  if (error) {
    throw new Error(`Failed to check usage limit: ${error.message}`);
  }

  const scansThisMonth = usage.scans_this_month || 0;
  const remaining = Math.max(0, MONTHLY_LIMIT - scansThisMonth);

  return {
    canUpload: remaining > 0,
    remaining,
    monthly_limit: MONTHLY_LIMIT,
    scans_this_month: scansThisMonth,
  };
}

/**
 * Helper: Formats database scan record to TypeScript Scan type
 */
function formatScanFromDB(dbScan: any): Scan {
  return {
    id: dbScan.id,
    user_id: dbScan.user_id,
    file_url: dbScan.file_url,
    file_name: dbScan.file_name,
    file_size: dbScan.file_size,
    file_type: dbScan.file_type,
    upload_date: new Date(dbScan.upload_date),
    scan_date: new Date(dbScan.scan_date),
    clinical_context: dbScan.clinical_context,
    dicom_metadata: dbScan.dicom_metadata,
    processing_status: dbScan.processing_status,
    error_message: dbScan.error_message,
    key_slices: dbScan.key_slices,
    retention_expires_at: new Date(dbScan.retention_expires_at),
    retention_extended_count: dbScan.retention_extended_count,
  };
}

/**
 * Helper: Formats database analysis record to TypeScript Analysis type
 */
function formatAnalysisFromDB(dbAnalysis: any): Analysis {
  return {
    id: dbAnalysis.id,
    scan_id: dbAnalysis.scan_id,
    user_id: dbAnalysis.user_id,
    analysis_type: dbAnalysis.analysis_type,
    classification: dbAnalysis.classification,
    risk_score: dbAnalysis.risk_score,
    ai_summary: dbAnalysis.ai_summary,
    detailed_findings: dbAnalysis.detailed_findings,
    compared_scan_ids: dbAnalysis.compared_scan_ids,
    longitudinal_changes: dbAnalysis.longitudinal_changes,
    gpt_model_used: dbAnalysis.gpt_model_used,
    tokens_used: dbAnalysis.tokens_used,
    processing_time_seconds: dbAnalysis.processing_time_seconds,
    slices_analyzed: dbAnalysis.slices_analyzed,
    created_at: new Date(dbAnalysis.created_at),
  };
}
