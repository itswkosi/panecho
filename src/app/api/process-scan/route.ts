import { NextRequest, NextResponse } from 'next/server';
import { analyzeInitialScan } from '@/app/actions/analyze';
import { processDICOM } from '@/app/actions/process';
import { getScan, updateScan } from '@/lib/supabase/db';
// TODO: Re-enable when radiomics implementation is ready
// import { 
//   segmentPancreas, 
//   extractRadiomicFeatures,
//   storeSegmentationResult,
//   storeRadiomicFeatures,
//   checkPythonServiceHealth 
// } from '@/app/actions/radiomics';

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
      console.error('[API] Full request body:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        { error: 'scanId is required', receivedBody: body },
        { status: 400 }
      );
    }

    // Validate scanId is not empty string
    if (typeof scanId !== 'string' || scanId.trim() === '') {
      console.error('[API] Invalid scanId (empty or not a string):', scanId);
      return NextResponse.json(
        { error: 'scanId must be a non-empty string', receivedScanId: scanId },
        { status: 400 }
      );
    }

    console.log(`[API] Starting processing pipeline for scan ${scanId}`);

    // Step 1: Fetch scan details
    const scan = await getScan(scanId);
    if (!scan) {
      console.error(`[API] Scan ${scanId} not found`);
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Step 2: Process DICOM file (extract slices)
    if (scan.file_type === 'dicom' && (!scan.key_slices || scan.key_slices.length === 0)) {
      console.log(`[API] Processing DICOM for scan ${scanId}`);
      
      await updateScan(scanId, { processing_status: 'processing' });
      
      const processingResult = await processDICOM(scan.file_url, scanId);
      
      if (!processingResult.success) {
        console.error(`[API] DICOM processing failed for scan ${scanId}:`, processingResult.error);
        await updateScan(scanId, {
          processing_status: 'failed',
          error_message: processingResult.error?.message || 'DICOM processing failed',
        });
        return NextResponse.json(
          { error: processingResult.error?.message || 'DICOM processing failed' },
          { status: 500 }
        );
      }

      console.log(`[API] DICOM processing successful: ${processingResult.data?.sliceUrls.length} slices extracted`);
    }

    // TODO: Re-enable when radiomics implementation is ready
    // Step 3: Check Python service health and run segmentation
    // Python service integration commented out until radiomics actions are implemented
    console.log(`[API] Skipping segmentation (radiomics not yet implemented) for scan ${scanId}`);

    // Step 5: Run Gemini analysis (with or without radiomics)
    console.log(`[API] Starting AI analysis for scan ${scanId}`);

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
