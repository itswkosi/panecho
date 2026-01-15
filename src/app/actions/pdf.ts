'use server';

import { getUser } from '@/app/actions/auth';
import { getAnalysis, getScan, getAnalysesByUserId } from '@/lib/supabase/db';
import { generatePDFReport } from '@/lib/pdf/generator';
import { Analysis } from '@/lib/types/database';

/**
 * Server action to generate PDF report for a scan
 * @param scanId - The scan ID to generate report for
 * @returns Promise<{ success: boolean; blob?: Blob; filename?: string; error?: string }>
 */
export async function generatePDF(scanId: string): Promise<{
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}> {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Fetch scan and analysis data
    const [scan, analysis] = await Promise.all([
      getScan(scanId),
      getAnalysis(scanId),
    ]);

    if (!scan) {
      return {
        success: false,
        error: 'Scan not found',
      };
    }

    if (!analysis) {
      return {
        success: false,
        error: 'Analysis not available',
      };
    }

    // If longitudinal analysis, fetch previous analyses
    let previousAnalyses: Analysis[] = [];
    if (analysis.analysis_type === 'longitudinal' && analysis.compared_scan_ids) {
      const prevAnalyses: Analysis[] = [];
      for (const scanId of analysis.compared_scan_ids) {
        try {
          const prevAnalysis = await getAnalysis(scanId);
          if (prevAnalysis) {
            prevAnalyses.push(prevAnalysis);
          }
        } catch (err) {
          console.error(`Failed to fetch previous analysis for scan ${scanId}:`, err);
        }
      }
      previousAnalyses = prevAnalyses.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    }

    // Generate PDF
    const blob = await generatePDFReport(
      analysis,
      scan,
      previousAnalyses,
      user.user_metadata?.full_name || 'Patient',
    );

    // Generate filename
    const dateStr = new Date(scan.scan_date).toISOString().split('T')[0]; // YYYY-MM-DD
    const cleanName = (user.user_metadata?.full_name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `PanEcho_Report_${cleanName}_${dateStr}.pdf`;

    return {
      success: true,
      blob,
      filename,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}
