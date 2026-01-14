import { createClient } from './server';

const BUCKET_NAME = 'scans';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Upload a file to Supabase Storage
 * @param userId - User ID for organizing files
 * @param scanId - Unique scan identifier
 * @param file - File to upload
 * @returns Promise resolving to the file URL
 */
export async function uploadFile(
  userId: string,
  scanId: string,
  file: File
): Promise<string> {
  const supabase = await createClient();

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds maximum size of 100MB');
  }

  // Generate path: user_id/scan_id/filename
  const filePath = `${userId}/${scanId}/${file.name}`;

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!publicUrlData.publicUrl) {
    throw new Error('Failed to generate file URL');
  }

  return publicUrlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - Path to file in storage (user_id/scan_id/filename)
 */
export async function deleteFile(filePath: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get file URL from storage path
 * @param filePath - Path to file in storage
 * @returns Promise resolving to signed URL
 */
export async function getFileUrl(filePath: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to get file URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Get all scans for a user
 * @param userId - User ID
 * @returns Promise resolving to list of files
 */
export async function getUserScans(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`Failed to list scans: ${error.message}`);
  }

  return data;
}
