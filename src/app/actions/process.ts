'use server';

import dcmjs from 'dcmjs';
import { parseDICOM, extractKeySlices, getPixelData, getImageDimensions, DICOMMetadata } from '@/lib/dicom/processor';
import { convertSliceToPNG, optimizeImage } from '@/lib/dicom/converter';
import { uploadFile, deleteFile } from '@/lib/supabase/storage';
import { getUser } from './auth';
import { handleError, createErrorResponse } from '@/lib/errors/handler';
import { ErrorCode, ServerActionResponse } from '@/lib/types/errors';

export interface ProcessingResult extends ServerActionResponse<{
  scanId: string;
  metadata: DICOMMetadata;
  sliceUrls: string[];
}> {}

/**
 * Process DICOM file and extract/convert slices
 * Handles both DICOM and standard image formats
 * Comprehensive error handling with user-friendly messages
 */
export async function processDICOM(
  fileUrl: string,
  scanId: string
): Promise<ProcessingResult> {
  let uploadedSlices: string[] = [];

  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return createErrorResponse({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not authenticated',
        userMessage: 'You must be logged in to process files.',
        recoverable: true,
      }, 0);
    }

    // Fetch file from Supabase Storage
    let response: Response;
    try {
      response = await fetch(fileUrl);
      if (!response.ok) {
        return createErrorResponse({
          code: ErrorCode.STORAGE_UPLOAD_ERROR,
          message: `Failed to download file: ${response.statusText}`,
          userMessage: 'We had trouble downloading your file. Please check your connection and try again.',
          recoverable: true,
        }, 0);
      }
    } catch (fetchError) {
      const appError = handleError(fetchError, 'processDICOM_fetch');
      return createErrorResponse({
        code: ErrorCode.STORAGE_UPLOAD_ERROR,
        message: appError.message,
        userMessage: 'We had trouble downloading your file. Please check your connection and try again.',
        recoverable: true,
      }, 0);
    }

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await response.arrayBuffer();
    } catch (bufferError) {
      const appError = handleError(bufferError, 'processDICOM_buffer');
      return createErrorResponse({
        code: ErrorCode.DICOM_CONVERSION_ERROR,
        message: appError.message,
        userMessage: 'We had trouble reading your file. The file may be corrupted.',
        recoverable: true,
      }, 0);
    }

    // Check if this is a DICOM file (by magic number)
    const isDICOM = checkDICOMSignature(new Uint8Array(arrayBuffer));

    if (!isDICOM) {
      // Handle non-DICOM files (PNG, JPEG)
      return await processNonDICOMImage(
        Buffer.from(arrayBuffer),
        user.id,
        scanId
      );
    }

    // Parse DICOM file
    const { DicomMessage } = (dcmjs as any).data;
    let dicomDict: any;
    try {
      dicomDict = DicomMessage.readFile(new Uint8Array(arrayBuffer));
    } catch (parseError) {
      const appError = handleError(parseError, 'processDICOM_parse');
      return createErrorResponse({
        code: ErrorCode.DICOM_PARSE_ERROR,
        message: appError.message,
        userMessage: appError.userMessage,
        recoverable: true,
      }, 0);
    }

    // Extract metadata
    let metadata: DICOMMetadata;
    try {
      metadata = await parseDICOM(arrayBuffer);
    } catch (metadataError) {
      const appError = handleError(metadataError, 'processDICOM_metadata');
      return createErrorResponse({
        code: ErrorCode.DICOM_PARSE_ERROR,
        message: appError.message,
        userMessage: 'We couldn\'t read the metadata from this DICOM file. The file may be corrupted.',
        recoverable: true,
      }, 0);
    }

    // Extract key slices
    let sliceIndices: number[];
    try {
      sliceIndices = extractKeySlices(metadata, 8);
    } catch (sliceError) {
      const appError = handleError(sliceError, 'processDICOM_extractSlices');
      return createErrorResponse({
        code: ErrorCode.DICOM_CONVERSION_ERROR,
        message: appError.message,
        userMessage: 'We had trouble extracting slices from this DICOM file. The file format may not be supported.',
        recoverable: true,
      }, 0);
    }

    if (sliceIndices.length === 0) {
      return createErrorResponse({
        code: ErrorCode.INVALID_FILE_TYPE,
        message: 'No valid slices found in DICOM file',
        userMessage: 'No readable slices found in this DICOM file. Please ensure it\'s a valid CT or medical imaging file.',
        recoverable: true,
      }, 0);
    }

    // Get image dimensions
    let width: number;
    let height: number;
    try {
      const dimensions = getImageDimensions(dicomDict);
      width = dimensions.width;
      height = dimensions.height;
    } catch (dimensionError) {
      const appError = handleError(dimensionError, 'processDICOM_dimensions');
      return createErrorResponse({
        code: ErrorCode.DICOM_CONVERSION_ERROR,
        message: appError.message,
        userMessage: 'We had trouble reading the image dimensions. The file may be in an unsupported format.',
        recoverable: true,
      }, 0);
    }

    // Get pixel data
    let pixelData: Uint16Array | Uint8Array;
    try {
      const data = getPixelData(dicomDict);
      if (!data) {
        return createErrorResponse({
          code: ErrorCode.DICOM_PARSE_ERROR,
          message: 'No pixel data found in DICOM file',
          userMessage: 'No image data found in this DICOM file. Please ensure it\'s a valid medical imaging file.',
          recoverable: true,
        }, 0);
      }
      pixelData = data;
    } catch (pixelError) {
      const appError = handleError(pixelError, 'processDICOM_pixelData');
      return createErrorResponse({
        code: ErrorCode.DICOM_CONVERSION_ERROR,
        message: appError.message,
        userMessage: appError.userMessage,
        recoverable: true,
      }, 0);
    }

    // Process each slice
    const sliceUrls: string[] = [];
    const bytesPerPixel = pixelData.length / (width * height);

    for (const sliceIndex of sliceIndices) {
      try {
        // Extract slice pixel data
        const sliceStart = sliceIndex * width * height * bytesPerPixel;
        const sliceEnd = sliceStart + width * height * bytesPerPixel;
        const slicePixelData = new Uint8Array(
          pixelData.slice(sliceStart, sliceEnd)
        );

        // Convert to PNG
        let pngBuffer: Buffer;
        try {
          pngBuffer = await convertSliceToPNG(
            slicePixelData,
            width,
            height
          );
        } catch (convertError) {
          const appError = handleError(convertError, 'processDICOM_convert');
          console.error(`Failed to convert slice ${sliceIndex}:`, appError.message);
          // Continue processing other slices
          continue;
        }

        // Upload to Supabase Storage
        try {
          const sliceBlob = new Blob([Buffer.from(pngBuffer)], {
            type: 'image/png',
          });
          const sliceFile = new File(
            [sliceBlob],
            `slice_${sliceIndex}.png`,
            { type: 'image/png' }
          );

          const fileName = `slices/slice_${sliceIndex}.png`;
          const sliceUrl = await uploadSliceToStorage(
            user.id,
            scanId,
            sliceFile,
            fileName
          );

          uploadedSlices.push(sliceUrl);
          sliceUrls.push(sliceUrl);
        } catch (uploadError) {
          const appError = handleError(uploadError, 'processDICOM_uploadSlice');
          console.error(`Failed to upload slice ${sliceIndex}:`, appError.message);
          // Continue processing other slices
          continue;
        }
      } catch (sliceProcessError) {
        console.error(`Failed to process slice ${sliceIndex}:`, sliceProcessError);
        // Continue processing other slices
      }
    }

    if (sliceUrls.length === 0) {
      // Clean up all uploaded slices
      for (const sliceUrl of uploadedSlices) {
        try {
          const filePath = new URL(sliceUrl).pathname.split('/').slice(-3).join('/');
          await deleteFile(filePath);
        } catch {
          // Ignore cleanup errors
        }
      }

      return createErrorResponse({
        code: ErrorCode.DICOM_CONVERSION_ERROR,
        message: 'Failed to process any slices from DICOM file',
        userMessage: 'We couldn\'t process any slices from this file. The file format may not be supported. Please try another file.',
        recoverable: true,
      }, 0);
    }

    return {
      success: true,
      data: {
        scanId,
        metadata,
        sliceUrls,
      },
    };
  } catch (error) {
    // Clean up any uploaded slices on error
    for (const sliceUrl of uploadedSlices) {
      try {
        const filePath = new URL(sliceUrl).pathname.split('/').slice(-3).join('/');
        await deleteFile(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }

    const appError = handleError(error, 'processDICOM_general');
    return createErrorResponse({
      code: ErrorCode.DICOM_CONVERSION_ERROR,
      message: appError.message,
      userMessage: appError.userMessage,
      recoverable: true,
    }, 0);
  }
}

/**
 * Process non-DICOM image files (PNG, JPEG)
 */
async function processNonDICOMImage(
  imageBuffer: Buffer,
  userId: string,
  scanId: string
): Promise<ProcessingResult> {
  try {
    // Optimize image
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await optimizeImage(imageBuffer);
    } catch (optimizeError) {
      const appError = handleError(optimizeError, 'processNonDICOMImage_optimize');
      return createErrorResponse({
        code: ErrorCode.DICOM_CONVERSION_ERROR,
        message: appError.message,
        userMessage: 'We had trouble processing your image. The file format may not be supported.',
        recoverable: true,
      }, 0);
    }

    // Upload as single slice
    try {
      const fileBlob = new Blob([Buffer.from(optimizedBuffer)], {
        type: 'image/png',
      });
      const file = new File([fileBlob], 'image.png', {
        type: 'image/png',
      });

      const sliceUrl = await uploadSliceToStorage(
        userId,
        scanId,
        file,
        'slices/slice_0.png'
      );

      // Return minimal metadata for non-DICOM
      const metadata: DICOMMetadata = {
        numSlices: 1,
        seriesDescription: 'Imported Image',
        modality: 'US', // Unknown modality
      };

      return {
        success: true,
        data: {
          scanId,
          metadata,
          sliceUrls: [sliceUrl],
        },
      };
    } catch (uploadError) {
      const appError = handleError(uploadError, 'processNonDICOMImage_upload');
      return createErrorResponse({
        code: ErrorCode.STORAGE_UPLOAD_ERROR,
        message: appError.message,
        userMessage: appError.userMessage,
        recoverable: true,
      }, 0);
    }
  } catch (error) {
    const appError = handleError(error, 'processNonDICOMImage_general');
    return createErrorResponse({
      code: ErrorCode.DICOM_CONVERSION_ERROR,
      message: appError.message,
      userMessage: appError.userMessage,
      recoverable: true,
    }, 0);
  }
}

/**
 * Upload slice file to Supabase Storage
 */
async function uploadSliceToStorage(
  userId: string,
  scanId: string,
  file: File,
  filePath: string
): Promise<string> {
  try {
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient());

    const fullPath = `${userId}/${scanId}/${filePath}`;

    const { data, error } = await supabase.storage
      .from('scans')
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload slice: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('scans')
      .getPublicUrl(fullPath);

    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to generate slice URL');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    const appError = handleError(error, 'uploadSliceToStorage');
    throw new Error(`Storage upload error: ${appError.message}`);
  }
}

/**
 * Check if file has DICOM signature (magic bytes: 128 bytes offset + "DICM")
 */
function checkDICOMSignature(data: Uint8Array): boolean {
  if (data.length < 132) {
    return false;
  }

  // DICOM files have "DICM" at bytes 128-131
  const signature = String.fromCharCode(
    data[128],
    data[129],
    data[130],
    data[131]
  );

  return signature === 'DICM';
}
