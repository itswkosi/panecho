'use server';

import { getUser } from '@/app/actions/auth';
import { getAnalysis, getScan, getAnalysesByUserId } from '@/lib/supabase/db';
import { generatePDFReport } from '@/lib/pdf/generator';
import { Analysis } from '@/lib/types/database';
import { handleError, createErrorResponse } from '@/lib/errors/handler';
import { ErrorCode, ServerActionResponse } from '@/lib/types/errors';

export interface PDFResult extends ServerActionResponse<{
  blob: Blob;
  filename: string;
}> {}

/**
 * Server action to generate PDF report for a scan
 * @param scanId - The scan ID to generate report for
 * @returns Promise with PDF blob or error response
 */
export async function generatePDF(scanId: string): Promise<PDFResult> {
  try {
    // Validate input
    if (!scanId || typeof scanId !== 'string') {
      return createErrorResponse({
        code: ErrorCode.INVALID_API_RESPONSE,
        message: 'Invalid scan ID',
        userMessage: 'We received an invalid scan ID. Please try again.',
        recoverable: true,
      }, 0);
    }

    // Get current user
    const user = await getUser();
    if (!user) {
      return createErrorResponse({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not authenticated',
        userMessage: 'You must be logged in to generate reports.',
        recoverable: true,
      }, 0);
    }

    // Fetch scan and analysis data
    let scan, analysis;
    try {
      [scan, analysis] = await Promise.all([
        getScan(scanId),
        getAnalysis(scanId),
      ]);
    } catch (fetchError) {
      const appError = handleError(fetchError, 'generatePDF_fetch');
      return createErrorResponse({
        code: ErrorCode.DATABASE_ERROR,
        message: appError.message,
        userMessage: 'We had trouble retrieving your scan data. Please try again.',
        recoverable: true,
      }, 0);
    }

    if (!scan) {
      return createErrorResponse({
        code: ErrorCode.NOT_FOUND,
        message: 'Scan not found',
        userMessage: 'We couldn\'t find the scan you\'re looking for.',
        recoverable: false,
      }, 0);
    }

    if (!analysis) {
      return createErrorResponse({
        code: ErrorCode.INVALID_API_RESPONSE,
        message: 'Analysis not available',
        userMessage: 'This scan hasn\'t been analyzed yet. Please wait for the analysis to complete.',
        recoverable: true,
      }, 0);
    }

    // Verify user owns this scan
    if (scan.user_id !== user.id) {
      return createErrorResponse({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User does not own this scan',
        userMessage: 'You do not have permission to view this scan.',
        recoverable: false,
      }, 0);
    }

    // If longitudinal analysis, fetch previous analyses
    let previousAnalyses: Analysis[] = [];
    if (analysis.analysis_type === 'longitudinal' && analysis.compared_scan_ids) {
      try {
        const prevAnalyses: Analysis[] = [];
        for (const comparedScanId of analysis.compared_scan_ids) {
          try {
            const prevAnalysis = await getAnalysis(comparedScanId);
            if (prevAnalysis) {
              prevAnalyses.push(prevAnalysis);
            }
          } catch (err) {
            console.error(`Failed to fetch previous analysis for scan ${comparedScanId}:`, err);
            // Continue if individual previous analysis fails
          }
        }
        previousAnalyses = prevAnalyses.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      } catch (longError) {
        console.warn('Could not fetch all previous analyses, continuing with available data');
        // Don't fail if we can't get all previous analyses
      }
    }

    // Generate PDF
    let blob: Blob;
    try {
      blob = await generatePDFReport(
        analysis,
        scan,
        previousAnalyses,
        user.user_metadata?.full_name || 'Patient',
      );
    } catch (generateError) {
      const appError = handleError(generateError, 'generatePDF_generate');
      return createErrorResponse({
        code: ErrorCode.API_ERROR,
        message: appError.message,
        userMessage: 'We had trouble generating your PDF report. Please try again.',
        recoverable: true,
      }, 0);
    }

    // Generate filename
    try {
      const dateStr = new Date(scan.scan_date).toISOString().split('T')[0]; // YYYY-MM-DD
      const cleanName = (user.user_metadata?.full_name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `PanEcho_Report_${cleanName}_${dateStr}.pdf`;

      return {
        success: true,
        data: {
          blob,
          filename,
        },
      };
    } catch (filenameError) {
      const appError = handleError(filenameError, 'generatePDF_filename');
      return {
        success: true,
        data: {
          blob,
          filename: 'PanEcho_Report.pdf', // Fallback filename
        },
      };
    }
  } catch (error) {
    const appError = handleError(error, 'generatePDF_general');
    return createErrorResponse({
      code: ErrorCode.API_ERROR,
      message: appError.message,
      userMessage: appError.userMessage,
      recoverable: true,
    }, 0);
  }
}
