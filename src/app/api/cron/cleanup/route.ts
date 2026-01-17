/**
 * Cron job for automatic deletion of expired data
 * Scheduled to run daily at 2 AM UTC
 * 
 * To test locally:
 * curl http://localhost:3000/api/cron/cleanup
 * 
 * Requires CRON_SECRET environment variable for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteExpiredData } from '@/lib/retention/manager';

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    // Also accept requests from Vercel's cron service
    const vercelToken = request.headers.get('x-vercel-cron-secret');
    if (!vercelToken || vercelToken !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    console.log('[Cron] Starting data retention cleanup job');
    const startTime = Date.now();

    // Run the deletion of expired data
    const report = deleteExpiredData();

    const duration = Date.now() - startTime;

    // Log the report
    console.log('[Cron] Retention cleanup completed', {
      duration: `${duration}ms`,
      deletedScans: (await report).deletedScans,
      deletedAnalyses: (await report).deletedAnalyses,
      deletedFiles: (await report).deletedFiles,
      errors: (await report).errors,
    });

    return NextResponse.json({
      success: true,
      message: 'Retention cleanup completed',
      duration: `${duration}ms`,
      report: await report,
    });
  } catch (error) {
    console.error('[Cron] Error during retention cleanup:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Also support POST requests
  return GET(request);
}

// Configure the route as a cron job
export const runtime = 'nodejs';
