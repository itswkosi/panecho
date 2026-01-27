'use server';

import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '@/lib/supabase/storage';
import { validateFileType, validateFileSize, getFileError } from '@/lib/validation/files';
import { getUser } from './auth';
import { createScan, trackUsage } from '@/lib/supabase/db';
import { ClinicalContext } from '@/lib/types/database';
import { handleError, createErrorResponse } from '@/lib/errors/handler';
import { ErrorCode, ServerActionResponse } from '@/lib/types/errors';
import { checkUsageLimit, trackScanUsage } from '@/lib/usage/tracker';
import { trackScanUploaded, trackError, trackUsageLimitReached } from '@/lib/analytics/tracker';

export interface UploadResult extends ServerActionResponse<{ scanId: string; fileUrl: string }> {}

const MAX_FILE_SIZE_MB = 5; // DICOM files typically 2-5MB

/**
 * Server action to handle file uploads
 * Validates file, uploads to Supabase Storage, and creates database record
 * Returns comprehensive error information for client display
 */
export async function uploadScan(formData: FormData): Promise<UploadResult> {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return createErrorResponse(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: 'User not authenticated',
          userMessage: 'You must be logged in to upload scans.',
          recoverable: true,
        },
        0
      );
    }

    // Check usage limit - TEMPORARILY DISABLED due to schema mismatch
    // const usageLimit = await checkUsageLimit(user.id);
    // if (!usageLimit.canUpload) {
    //   trackUsageLimitReached();
    //   return createErrorResponse(
    //     {
    //       code: ErrorCode.API_RATE_LIMIT,
    //       message: `User ${user.id} has exceeded upload limit`,
    //       userMessage: `You've reached your limit of 5 scans this month. Your limit resets on ${usageLimit.resetDate.toLocaleDateString()}.`,
    //       recoverable: false,
    //     },
    //     0
    //   );
    // }

    // Get file from form data
    const file = formData.get('file') as File;
    if (!file) {
      return createErrorResponse(
        {
          code: ErrorCode.INVALID_FILE_TYPE,
          message: 'No file provided',
          userMessage: 'Please select a file to upload.',
          recoverable: true,
        },
        0
      );
    }

    // Validate file type
    const fileTypeError = getFileError(file, MAX_FILE_SIZE_MB);
    if (fileTypeError) {
      const errorCode = fileTypeError.includes('larger')
        ? ErrorCode.FILE_TOO_LARGE
        : ErrorCode.INVALID_FILE_TYPE;
      const appError = handleError(new Error(fileTypeError), 'uploadScan');
      return createErrorResponse(
        {
          code: errorCode,
          message: appError.message,
          userMessage: appError.userMessage,
          recoverable: true,
        },
        0
      );
    }

    // Additional validation
    if (!validateFileType(file)) {
      return createErrorResponse(
        {
          code: ErrorCode.INVALID_FILE_TYPE,
          message: 'Invalid file type',
          userMessage:
            "We couldn't read this file format. Please ensure it's a DICOM file (.dcm) or a standard medical image (PNG, JPEG).",
          recoverable: true,
        },
        0
      );
    }

    if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
      return createErrorResponse(
        {
          code: ErrorCode.FILE_TOO_LARGE,
          message: `File exceeds ${MAX_FILE_SIZE_MB}MB limit`,
          userMessage: `Your file is larger than ${MAX_FILE_SIZE_MB}MB. Please contact support or compress the file.`,
          recoverable: true,
        },
        0
      );
    }

    // Generate unique scan ID for storage path
    const tempScanId = uuidv4();

    // Upload file to Supabase Storage
    let fileUrl: string;
    try {
      fileUrl = await uploadFile(user.id, tempScanId, file);
    } catch (uploadError) {
      console.error('Upload error details:', uploadError);
      const appError = handleError(uploadError, 'uploadScan_storage');
      return createErrorResponse(
        {
          code: ErrorCode.STORAGE_UPLOAD_ERROR,
          message: appError.message,
          userMessage: uploadError instanceof Error ? uploadError.message : appError.userMessage,
          recoverable: true,
        },
        0
      );
    }

    // Create scan record in database with clinical context
    const clinicalContext: ClinicalContext = {
      age: 0, // Will be populated from DICOM metadata or user input later
      smoking_status: 'never',
    };

    // Mock key_slices for immediate analysis (real DICOM processing would extract actual slices)
    // Using uploaded file URL as placeholder - in production, would convert DICOM to PNG slices
    const mockKeySlices = [fileUrl]; // Use the uploaded file itself

    console.log('[uploadScan] Creating scan in database...', { userId: user.id, fileUrl, fileName: file.name });

    try {
      const createdScan = await createScan({
        user_id: user.id,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.name.toLowerCase().endsWith('.dcm') ? 'dicom' : 'image',
        scan_date: new Date(),
        clinical_context: clinicalContext,
        key_slices: mockKeySlices,
      });

      console.log('[uploadScan] Scan created successfully. Full scan object:', {
        id: createdScan.id,
        user_id: createdScan.user_id,
        file_name: createdScan.file_name,
        processing_status: createdScan.processing_status
      });

      // Use the actual scanId from the database
      const actualScanId = createdScan.id;
      
      if (!actualScanId) {
        console.error('[uploadScan] CRITICAL: createdScan.id is null/undefined!');
        throw new Error('Database returned scan without ID');
      }
      
      console.log('[uploadScan] Validated scanId:', actualScanId, 'Type:', typeof actualScanId);

      // Track analytics
      const fileSizeMb = file.size / (1024 * 1024);
      const fileType = file.name.toLowerCase().endsWith('.dcm') ? 'dicom' : 'image';
      trackScanUploaded(fileType, fileSizeMb, false);

      console.log('[uploadScan] Upload complete, returning scanId:', actualScanId);

      return {
        success: true,
        data: { scanId: actualScanId, fileUrl },
      };
    } catch (dbError) {
      // File uploaded but database record failed - this is a critical error
      console.error('[uploadScan] Failed to create scan record:', dbError);
      const appError = handleError(dbError, 'uploadScan_database');
      trackError('uploadScan_db', true);
      
      // Return error since we can't proceed without a valid database record
      return createErrorResponse(
        {
          code: ErrorCode.DATABASE_ERROR,
          message: appError.message,
          userMessage: 'Failed to save scan information. Please try again.',
          recoverable: true,
        },
        0
      );
    }
  } catch (error) {
    const appError = handleError(error, 'uploadScan_general');
    trackError('uploadScan', true);
    return createErrorResponse(appError, 0);
  }
}
