import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'scans';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB - DICOM files typically 2-5MB

/**
 * Create admin client that bypasses RLS for demo mode
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

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
  // Use admin client to bypass RLS for demo mode
  const supabase = createAdminClient();

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
    console.error('Supabase storage upload error:', error);
    throw new Error(`Storage upload failed: ${error.message}. Check if the '${BUCKET_NAME}' bucket exists in Supabase.`);
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
  const supabase = createAdminClient();

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
  const supabase = createAdminClient();

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
