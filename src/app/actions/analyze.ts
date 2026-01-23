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
import { handleError, createErrorResponse, shouldRetry, getRetryDelay } from '@/lib/errors/handler';
import { ErrorCode, ServerActionResponse } from '@/lib/types/errors';
import { trackScanAnalyzed, trackError } from '@/lib/analytics/tracker';

export interface AnalyzeResult extends ServerActionResponse<{
  analysis: AnalysisResult;
  analysis_type: 'initial' | 'longitudinal';
  compared_scan_ids?: string[];
}> {}

/**
 * Server action to analyze a scan using Google Gemini 2.0 Flash
 * Orchestrates: fetch scan, validate, run analysis, save to DB
 * Implements error handling with user-friendly messages and retry logic
 */
export async function analyzeInitialScan(scanId: string): Promise<AnalyzeResult> {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount <= maxRetries) {
    try {
      // Get current user
      const user = await getUser();
      if (!user) {
        return createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'User not authenticated',
          userMessage: 'You must be logged in to analyze scans.',
          recoverable: true,
        }, retryCount);
      }

      // Fetch scan from database
      const scan = await getScan(scanId);
      if (!scan) {
        return createErrorResponse({
          code: ErrorCode.NOT_FOUND,
          message: 'Scan not found in database',
          userMessage: 'We couldn\'t find the scan you\'re looking for. It may have been deleted.',
          recoverable: false,
        }, retryCount);
      }

      // Verify user owns this scan
      if (scan.user_id !== user.id) {
        return createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'User does not own this scan',
          userMessage: 'You do not have permission to analyze this scan.',
          recoverable: false,
        }, retryCount);
      }

      // Check if scan has key slices (required for analysis)
      if (!scan.key_slices || scan.key_slices.length === 0) {
        console.error(`[analyzeInitialScan] Scan ${scanId} missing key_slices. Status: ${scan.processing_status}`);
        return createErrorResponse({
          code: ErrorCode.INVALID_API_RESPONSE,
          message: 'No processed slices available',
          userMessage: 'Scan does not have processed slices. Please wait for processing to complete.',
          recoverable: true,
        }, retryCount);
      }

      console.log(`[analyzeInitialScan] Scan ${scanId} validated. Slices: ${scan.key_slices.length}, Status: ${scan.processing_status}`);

      // Update status to processing
      await updateScan(scanId, {
        processing_status: 'processing',
      });

      // Run analysis
      console.log(`Starting analysis for scan ${scanId} with ${scan.key_slices.length} slices...`);
      const analysisResult = await runAnalysis(scan.key_slices, scan.clinical_context);

      // Check for insufficient image quality
      if (analysisResult.risk_score < 0) {
        // API returned error indicator
        const qualityError = handleError(
          new Error('Insufficient image quality detected'),
          'analyzeInitialScan_quality'
        );
        return createErrorResponse(
          {
            code: ErrorCode.INSUFFICIENT_IMAGE_QUALITY,
            message: qualityError.message,
            userMessage: qualityError.userMessage,
            recoverable: false,
            partialData: analysisResult,
          },
          retryCount
        );
      }

      // Save analysis to database
      try {
        const savedAnalysis = await createAnalysis({
          scan_id: scanId,
          user_id: user.id,
          analysis_type: 'initial',
          classification: analysisResult.classification,
          risk_score: analysisResult.risk_score,
          ai_summary: analysisResult.summary,
          detailed_findings: analysisResult.detailed_findings,
          gpt_model_used: 'gemini-2.0-flash-exp',
          tokens_used: analysisResult.tokens_used,
          processing_time_seconds: analysisResult.processing_time_seconds,
          slices_analyzed: scan.key_slices.map((_, idx) => idx),
        });

        // Update scan status to completed
        await updateScan(scanId, {
          processing_status: 'completed',
        });

        console.log(
          `Analysis saved for scan ${scanId}: ${analysisResult.classification} (risk: ${analysisResult.risk_score}%)`
        );

        // Track analytics
        trackScanAnalyzed(
          'initial',
          analysisResult.processing_time_seconds,
          analysisResult.classification as 'normal' | 'suspicious',
          analysisResult.risk_score
        );

        return {
          success: true,
          data: {
            analysis: analysisResult,
            analysis_type: 'initial',
          },
        };
      } catch (dbError) {
        const appError = handleError(dbError, 'analyzeInitialScan_database');
        return createErrorResponse(
          {
            code: ErrorCode.DATABASE_ERROR,
            message: appError.message,
            userMessage:
              'We analyzed your scan but had trouble saving the results. Please screenshot this page and contact support.',
            recoverable: false,
            partialData: analysisResult, // Preserve analysis results
          },
          retryCount
        );
      }
    } catch (error) {
      const appError = handleError(error, 'analyzeInitialScan_general');
      const errorCode =
        appError.code === ErrorCode.API_RATE_LIMIT ? ErrorCode.API_RATE_LIMIT : ErrorCode.API_ERROR;

      // Track error
      trackError('analyzeInitialScan', true);

      // Determine if we should retry
      if (shouldRetry(appError, retryCount, maxRetries)) {
        retryCount++;
        const delay = getRetryDelay(retryCount - 1);
        console.log(`Retrying analysis (attempt ${retryCount}/${maxRetries}) after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Retry the loop
      }

      // Max retries exceeded or non-recoverable error
      try {
        await updateScan(scanId, {
          processing_status: 'failed',
          error_message: appError.message,
        });
      } catch (updateError) {
        console.error('Failed to update scan error status:', updateError);
      }

      return createErrorResponse(
        {
          code: errorCode,
          message: appError.message,
          userMessage: appError.userMessage,
          recoverable: appError.recoverable && retryCount < maxRetries,
        },
        retryCount
      );
    }
  }

  // This should not be reached, but as fallback
  return createErrorResponse({
    code: ErrorCode.API_ERROR,
    message: 'Analysis failed after maximum retries',
    userMessage: 'Our analysis service is temporarily unavailable. Please try again in a few moments.',
    recoverable: true,
  }, maxRetries);
}

/**
 * Server action to perform longitudinal analysis if previous scans exist
 * Automatically detects previous scans and performs 4-step comparison
 * Falls back to initial analysis if no previous scans found
 */
export async function analyzeScanWithLongitudinal(scanId: string): Promise<AnalyzeResult> {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount <= maxRetries) {
    try {
      // Get current user
      const user = await getUser();
      if (!user) {
        return createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'User not authenticated',
          userMessage: 'You must be logged in to analyze scans.',
          recoverable: true,
        }, retryCount);
      }

      // Fetch scan from database
      const scan = await getScan(scanId);
      if (!scan) {
        return createErrorResponse({
          code: ErrorCode.NOT_FOUND,
          message: 'Scan not found in database',
          userMessage: 'We couldn\'t find the scan you\'re looking for.',
          recoverable: false,
        }, retryCount);
      }

      // Verify user owns this scan
      if (scan.user_id !== user.id) {
        return createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'User does not own this scan',
          userMessage: 'You do not have permission to analyze this scan.',
          recoverable: false,
        }, retryCount);
      }

      // Check if scan has key slices (required for analysis)
      if (!scan.key_slices || scan.key_slices.length === 0) {
        console.error(`[analyzeScanWithLongitudinal] Scan ${scanId} missing key_slices. Status: ${scan.processing_status}`);
        return createErrorResponse({
          code: ErrorCode.INVALID_API_RESPONSE,
          message: 'No processed slices available',
          userMessage: 'Scan does not have processed slices. Please wait for processing to complete.',
          recoverable: true,
        }, retryCount);
      }

      console.log(`[analyzeScanWithLongitudinal] Scan ${scanId} validated. Slices: ${scan.key_slices.length}, Status: ${scan.processing_status}`);

      // Update status to processing
      await updateScan(scanId, {
        processing_status: 'processing',
      });

      // Run initial analysis
      console.log(`Starting analysis for scan ${scanId} with ${scan.key_slices.length} slices...`);
      const analysisResult = await runAnalysis(scan.key_slices, scan.clinical_context);

      // Check for insufficient image quality
      if (analysisResult.risk_score < 0) {
        const qualityError = handleError(
          new Error('Insufficient image quality detected'),
          'analyzeScanWithLongitudinal_quality'
        );
        return createErrorResponse(
          {
            code: ErrorCode.INSUFFICIENT_IMAGE_QUALITY,
            message: qualityError.message,
            userMessage: qualityError.userMessage,
            recoverable: false,
            partialData: analysisResult,
          },
          retryCount
        );
      }

      // Save initial analysis to database
      const savedAnalysis = await createAnalysis({
        scan_id: scanId,
        user_id: user.id,
        analysis_type: 'initial',
        classification: analysisResult.classification,
        risk_score: analysisResult.risk_score,
        ai_summary: analysisResult.summary,
        detailed_findings: analysisResult.detailed_findings,
        gpt_model_used: 'gemini-2.0-flash-exp',
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
          const analysisScan = analysis.scan;
          return (
            analysisScan &&
            analysisScan.scan_date &&
            new Date(analysisScan.scan_date) < sevenDaysAgo
          );
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
            gpt_model_used: 'gemini-2.0-flash-exp',
            tokens_used: longitudinalResult.tokens_used,
            processing_time_seconds: longitudinalResult.processing_time_seconds,
            slices_analyzed: scan.key_slices.map((_, idx) => idx),
          });

          // Update scan status to completed
          await updateScan(scanId, {
            processing_status: 'completed',
          });

          console.log(`Longitudinal analysis completed for scan ${scanId}`);

          // Track analytics
          trackScanAnalyzed(
            'longitudinal',
            longitudinalResult.processing_time_seconds,
            (longitudinalResult.current_analysis.classification || 'normal') as 'normal' | 'suspicious',
            longitudinalResult.current_analysis.risk_score
          );

          return {
            success: true,
            data: {
              analysis: analysisResult,
              analysis_type: 'longitudinal',
              compared_scan_ids: longitudinalResult.compared_scan_ids,
            },
          };
        } catch (longitudinalError) {
          const appError = handleError(longitudinalError, 'analyzeScanWithLongitudinal_longitudinal');
          console.error('Longitudinal analysis failed, falling back to initial analysis:', longitudinalError);

          // If longitudinal analysis fails, fall back to initial analysis
          await updateScan(scanId, {
            processing_status: 'completed',
          });

          // Log the error but return success with initial analysis as fallback
          return {
            success: true,
            data: {
              analysis: analysisResult,
              analysis_type: 'initial',
            },
          };
        }
      } else {
        // No previous scans - provide option to analyze independently
        await updateScan(scanId, {
          processing_status: 'completed',
        });

        console.log(`No previous scans found for longitudinal analysis. Analysis saved as initial.`);

        return {
          success: true,
          data: {
            analysis: analysisResult,
            analysis_type: 'initial',
          },
        };
      }
    } catch (error) {
      const appError = handleError(error, 'analyzeScanWithLongitudinal_general');
      const errorCode =
        appError.code === ErrorCode.API_RATE_LIMIT ? ErrorCode.API_RATE_LIMIT : ErrorCode.API_ERROR;

      // Determine if we should retry
      if (shouldRetry(appError, retryCount, maxRetries)) {
        retryCount++;
        const delay = getRetryDelay(retryCount - 1);
        console.log(
          `Retrying longitudinal analysis (attempt ${retryCount}/${maxRetries}) after ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Retry the loop
      }

      // Max retries exceeded or non-recoverable error
      try {
        await updateScan(scanId, {
          processing_status: 'failed',
          error_message: appError.message,
        });
      } catch (updateError) {
        console.error('Failed to update scan error status:', updateError);
      }

      return createErrorResponse(
        {
          code: errorCode,
          message: appError.message,
          userMessage: appError.userMessage,
          recoverable: appError.recoverable && retryCount < maxRetries,
        },
        retryCount
      );
    }
  }

  // Fallback
  return createErrorResponse({
    code: ErrorCode.API_ERROR,
    message: 'Analysis failed after maximum retries',
    userMessage: 'Our analysis service is temporarily unavailable. Please try again in a few moments.',
    recoverable: true,
  }, maxRetries);
}
