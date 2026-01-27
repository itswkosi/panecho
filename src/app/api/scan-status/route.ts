import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/supabase/db';

/**
 * API endpoint to fetch scan status
 * Uses service role key to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');

    if (!scanId) {
      return NextResponse.json(
        { error: 'scanId is required' },
        { status: 400 }
      );
    }

    const scan = await getScan(scanId);

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      processing_status: scan.processing_status,
      error_message: scan.error_message,
    });
  } catch (error) {
    console.error('[API] Scan status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan status' },
      { status: 500 }
    );
  }
}
