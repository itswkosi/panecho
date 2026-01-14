'use server';

import { analyzeInitialScan as runAnalysis, AnalysisResult } from '@/lib/ai/analyzer';
import { analyzeLongitudinal, getPreviousScansForComparison } from '@/lib/ai/longitudinal';
import { getUser } from './auth';
import {
  getScan,
  updateScan,
  createAnalysis,
  getAnalysesByUserId,
} from '@/lib/supabase/db';

export interface AnalyzeResult {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
  analysis_type?: 'initial' | 'longitudinal';
  compared_scan_ids?: string[];
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

/**
 * Server action to perform longitudinal analysis if previous scans exist
 * Automatically detects previous scans and performs 4-step comparison
 */
export async function analyzeScanWithLongitudinal(scanId: string): Promise<AnalyzeResult> {
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

    // Run initial analysis
    console.log(`Starting analysis for scan ${scanId} with ${scan.key_slices.length} slices...`);
    const analysisResult = await runAnalysis(scan.key_slices, scan.clinical_context);

    // Save initial analysis to database
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
      slices_analyzed: scan.key_slices.map((_, idx) => idx),
    });

    // Check if previous scans exist for longitudinal analysis
    const scanDate = scan.scan_date ? new Date(scan.scan_date) : new Date();
    const sevenDaysAgo = new Date(scanDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all analyses for this user with their scan dates
    const userAnalyses = await getAnalysesByUserId(user.id);
    
    // Filter for previous scans (older than 7 days) and get up to 3 most recent
    const previousAnalyses = userAnalyses
      .filter((analysis) => {
        const analysisScan = analysis.scan; // Assuming analysis has scan relation
        return analysisScan && analysisScan.scan_date && new Date(analysisScan.scan_date) < sevenDaysAgo;
      })
      .sort((a, b) => {
        const dateA = a.scan?.scan_date ? new Date(a.scan.scan_date).getTime() : 0;
        const dateB = b.scan?.scan_date ? new Date(b.scan.scan_date).getTime() : 0;
        return dateB - dateA; // Most recent first
      })
      .slice(0, 3);

    // If previous scans exist, perform longitudinal analysis
    if (previousAnalyses.length > 0) {
      console.log(`Found ${previousAnalyses.length} previous scans for longitudinal analysis`);

      try {
        const longitudinalResult = await analyzeLongitudinal(
          {
            classification: analysisResult.classification,
            risk_score: analysisResult.risk_score,
            summary: analysisResult.summary,
            detailed_findings: analysisResult.detailed_findings,
          },
          previousAnalyses.map((analysis) => ({
            id: analysis.scan_id || '',
            scan_date:
              typeof analysis.scan?.scan_date === 'string'
                ? analysis.scan.scan_date
                : analysis.scan?.scan_date?.toISOString() || new Date().toISOString(),
            classification: analysis.classification as string,
            risk_score: analysis.risk_score || 0,
            summary: analysis.ai_summary || '',
            detailed_findings: analysis.detailed_findings || {},
          }))
        );

        // Save longitudinal analysis to database
        const longitudinalAnalysis = await createAnalysis({
          scan_id: scanId,
          user_id: user.id,
          analysis_type: 'longitudinal',
          classification: (longitudinalResult.current_analysis.classification || 'normal') as
            | 'normal'
            | 'suspicious',
          risk_score: longitudinalResult.current_analysis.risk_score,
          ai_summary: longitudinalResult.synthesis_report.executive_summary,
          detailed_findings: {
            ...longitudinalResult.current_analysis.detailed_findings,
            longitudinal_changes: longitudinalResult.longitudinal_changes,
            comparison_results: longitudinalResult.comparison_results,
            trajectory_results: longitudinalResult.trajectory_results,
          },
          compared_scan_ids: longitudinalResult.compared_scan_ids,
          gpt_model_used: 'gpt-4o',
          tokens_used: longitudinalResult.tokens_used,
          processing_time_seconds: longitudinalResult.processing_time_seconds,
          slices_analyzed: scan.key_slices.map((_, idx) => idx),
        });

        // Update scan status to completed
        await updateScan(scanId, {
          processing_status: 'completed',
        });

        console.log(`Longitudinal analysis completed for scan ${scanId}`);

        return {
          success: true,
          analysis: analysisResult,
          analysis_type: 'longitudinal',
          compared_scan_ids: longitudinalResult.compared_scan_ids,
        };
      } catch (longitudinalError) {
        console.error('Longitudinal analysis failed, falling back to initial analysis:', longitudinalError);
        // If longitudinal analysis fails, fall back to initial analysis
        await updateScan(scanId, {
          processing_status: 'completed',
        });

        return {
          success: true,
          analysis: analysisResult,
          analysis_type: 'initial',
        };
      }
    } else {
      // No previous scans, just save initial analysis
      await updateScan(scanId, {
        processing_status: 'completed',
      });

      console.log(`No previous scans found for longitudinal analysis. Analysis saved as initial.`);

      return {
        success: true,
        analysis: analysisResult,
        analysis_type: 'initial',
      };
    }
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
