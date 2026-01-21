import { NextRequest, NextResponse } from 'next/server';
import { analyzeInitialScan } from '@/app/actions/analyze';

/**
 * API endpoint to trigger scan processing asynchronously
 * Called immediately after upload to process scans in the background
 */
export async function POST(request: NextRequest) {
  try {
    const { scanId } = await request.json();

    if (!scanId) {
      return NextResponse.json(
        { error: 'scanId is required' },
        { status: 400 }
      );
    }

    // Trigger analysis asynchronously - don't wait for completion
    analyzeInitialScan(scanId).catch(error => {
      console.error(`Background analysis failed for scan ${scanId}:`, error);
    });

    return NextResponse.json({ success: true, message: 'Processing started' });
  } catch (error) {
    console.error('Process scan API error:', error);
    return NextResponse.json(
      { error: 'Failed to start processing' },
      { status: 500 }
    );
  }
}
