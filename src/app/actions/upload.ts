'use server';

import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '@/lib/supabase/storage';
import { validateFileType, validateFileSize, getFileError } from '@/lib/validation/files';
import { getUser } from './auth';

export interface UploadResult {
  success: boolean;
  scanId?: string;
  fileUrl?: string;
  error?: string;
}

const MAX_FILE_SIZE_MB = 100;

/**
 * Server action to handle file uploads
 * Validates file and uploads to Supabase Storage
 */
export async function uploadScan(formData: FormData): Promise<UploadResult> {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to upload files',
      };
    }

    // Get file from form data
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file type
    const fileTypeError = getFileError(file, MAX_FILE_SIZE_MB);
    if (fileTypeError) {
      return {
        success: false,
        error: fileTypeError,
      };
    }

    // Additional validation
    if (!validateFileType(file)) {
      return {
        success: false,
        error: 'Invalid file type. Only DICOM, PNG, and JPEG files are allowed.',
      };
    }

    if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
      return {
        success: false,
        error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit`,
      };
    }

    // Generate unique scan ID
    const scanId = uuidv4();

    // Upload file to Supabase Storage
    const fileUrl = await uploadFile(user.id, scanId, file);

    return {
      success: true,
      scanId,
      fileUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during upload',
    };
  }
}
