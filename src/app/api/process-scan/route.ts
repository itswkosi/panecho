import { NextRequest, NextResponse } from 'next/server';
import { analyzeInitialScan } from '@/app/actions/analyze';

// Set max execution duration for Vercel (60 seconds)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * API endpoint to trigger scan processing
 * Runs the full analysis and returns when complete
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] /api/process-scan called');
    const body = await request.json();
    console.log('[API] Request body:', body);
    const { scanId } = body;

    if (!scanId) {
      console.error('[API] Missing scanId in request');
      return NextResponse.json(
        { error: 'scanId is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Starting analysis for scan ${scanId}`);

    // Run analysis and wait for completion
    const result = await analyzeInitialScan(scanId);
    console.log(`[API] analyzeInitialScan returned:`, { success: result.success, hasError: !!result.error });

    if (result.success) {
      console.log(`[API] Analysis completed successfully for scan ${scanId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Processing completed',
        data: result.data
      });
    } else {
      console.error(`[API] Analysis failed for scan ${scanId}:`, result.error);
      return NextResponse.json(
        { error: result.error?.message || 'Analysis failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Process scan error:', error);
    return NextResponse.json(
      { error: 'Failed to process scan' },
      { status: 500 }
    );
  }
}
