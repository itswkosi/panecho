'use server';

import { analyzeInitialScan as runAnalysis, AnalysisResult } from '@/lib/ai/analyzer';
import { getUser } from './auth';
import {
  getScan,
  updateScan,
  createAnalysis,
} from '@/lib/supabase/db';

export interface AnalyzeResult {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
}

/**
 * Server action to analyze a scan using GPT-4o
 * Orchestrates: fetch scan, validate, run analysis, save to DB
 */
export async function analyzeInitialScan(scanId: string): Promise<AnalyzeResult> {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to analyze scans',
      };
    }

    // Fetch scan from database
    const scan = await getScan(scanId);
    if (!scan) {
      return {
        success: false,
        error: 'Scan not found',
      };
    }

    // Verify user owns this scan
    if (scan.user_id !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to analyze this scan',
      };
    }

    // Check if scan has key slices (required for analysis)
    if (!scan.key_slices || scan.key_slices.length === 0) {
      return {
        success: false,
        error: 'Scan does not have processed slices. Please wait for processing to complete.',
      };
    }

    // Update status to processing
    await updateScan(scanId, {
      processing_status: 'processing',
    });

    // Run analysis
    console.log(`Starting analysis for scan ${scanId} with ${scan.key_slices.length} slices...`);
    const analysisResult = await runAnalysis(scan.key_slices, scan.clinical_context);

    // Save analysis to database
    const savedAnalysis = await createAnalysis({
      scan_id: scanId,
      user_id: user.id,
      analysis_type: 'initial',
      classification: analysisResult.classification,
      risk_score: analysisResult.risk_score,
      ai_summary: analysisResult.summary,
      detailed_findings: analysisResult.detailed_findings,
      gpt_model_used: 'gpt-4o',
      tokens_used: analysisResult.tokens_used,
      processing_time_seconds: analysisResult.processing_time_seconds,
      slices_analyzed: scan.key_slices.map((_, idx) => idx), // Slice indices
    });

    // Update scan status to completed
    await updateScan(scanId, {
      processing_status: 'completed',
    });

    console.log(`Analysis saved for scan ${scanId}: ${analysisResult.classification} (risk: ${analysisResult.risk_score}%)`);

    return {
      success: true,
      analysis: analysisResult,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Try to update scan with error status
    try {
      await updateScan(scanId, {
        processing_status: 'failed',
        error_message: errorMessage,
      });
    } catch (updateError) {
      console.error('Failed to update scan error status:', updateError);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
