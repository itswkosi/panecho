// Allowed MIME types for medical scans
const ALLOWED_MIME_TYPES = new Set([
  'application/dicom',
  'image/png',
  'image/jpeg',
]);

// Map file extensions to MIME types
const EXTENSION_MIME_MAP: Record<string, string> = {
  dcm: 'application/dicom',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

/**
 * Validate file type based on MIME type and extension
 */
export function validateFileType(file: File): boolean {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return false;
  }

  // Also validate extension for extra safety
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !Object.keys(EXTENSION_MIME_MAP).includes(extension)) {
    return false;
  }

  // Verify extension matches declared MIME type
  const expectedMimeType = EXTENSION_MIME_MAP[extension];
  return expectedMimeType === file.type;
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxMB - Maximum file size in megabytes
 */
export function validateFileSize(file: File, maxMB: number): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Get human-readable file size
 */
export function getFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get error message for invalid file
 */
export function getFileError(file: File, maxMB: number = 100): string | null {
  if (!validateFileType(file)) {
    return 'Invalid file type. Please upload DICOM (.dcm), PNG, or JPEG files.';
  }

  if (!validateFileSize(file, maxMB)) {
    return `File exceeds ${maxMB}MB limit. Please upload a smaller file.`;
  }

  return null;
}
