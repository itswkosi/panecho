import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadScan } from '@/app/actions/upload';
import * as storage from '@/lib/supabase/storage';
import * as auth from '@/app/actions/auth';
import { ErrorCode } from '@/lib/types/errors';

vi.mock('@/lib/supabase/storage');
vi.mock('@/app/actions/auth');

describe('Upload Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getUser to return a user
    vi.mocked(auth.getUser).mockResolvedValue({
      id: 'test-user-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
      },
    } as any);
  });

  it('successfully uploads valid DICOM file', async () => {
    const mockUploadFile = vi.mocked(storage.uploadFile);
    mockUploadFile.mockResolvedValue('https://storage.url/file.dcm');

    const formData = new FormData();
    const file = new File(['dummy'], 'scan.dcm', { type: 'application/dicom' });
    formData.append('file', file);

    const result = await uploadScan(formData);

    expect(result.success).toBe(true);
    expect(result.data?.scanId).toBeDefined();
    expect(mockUploadFile).toHaveBeenCalled();
  });

  it('successfully uploads valid PNG file', async () => {
    const mockUploadFile = vi.mocked(storage.uploadFile);
    mockUploadFile.mockResolvedValue('https://storage.url/scan.png');

    const formData = new FormData();
    const file = new File(['dummy'], 'scan.png', { type: 'image/png' });
    formData.append('file', file);

    const result = await uploadScan(formData);

    expect(result.success).toBe(true);
    expect(result.data?.scanId).toBeDefined();
    expect(mockUploadFile).toHaveBeenCalled();
  });

  it('returns error for invalid file type', async () => {
    const formData = new FormData();
    const file = new File(['dummy'], 'file.txt', { type: 'text/plain' });
    formData.append('file', file);

    const result = await uploadScan(formData);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.INVALID_FILE_TYPE);
  });

  it.skip('returns error for oversized file', async () => {
    const formData = new FormData();
    // Mock getFileError to return size error
    const largeFile = new File(['x'], 'large.dcm', {
      type: 'application/dicom',
    });
    // Manually set size via Object.defineProperty since File size is readonly
    Object.defineProperty(largeFile, 'size', {
      value: 101 * 1024 * 1024, // 101 MB
    });
    formData.append('file', largeFile);

    const result = await uploadScan(formData);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.FILE_TOO_LARGE);
  });

  it('returns error when user is not authenticated', async () => {
    vi.mocked(auth.getUser).mockResolvedValue(null);

    const formData = new FormData();
    const file = new File(['dummy'], 'scan.dcm', { type: 'application/dicom' });
    formData.append('file', file);

    const result = await uploadScan(formData);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('returns error when no file is provided', async () => {
    const formData = new FormData();

    const result = await uploadScan(formData);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.INVALID_FILE_TYPE);
  });

  it('returns error when upload fails', async () => {
    const mockUploadFile = vi.mocked(storage.uploadFile);
    mockUploadFile.mockRejectedValue(new Error('Upload service error'));

    const formData = new FormData();
    const file = new File(['dummy'], 'scan.dcm', { type: 'application/dicom' });
    formData.append('file', file);

    const result = await uploadScan(formData);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.STORAGE_UPLOAD_ERROR);
  });

  it('generates unique scanId for each upload', async () => {
    const mockUploadFile = vi.mocked(storage.uploadFile);
    mockUploadFile.mockResolvedValue('https://storage.url/file.dcm');

    const formData1 = new FormData();
    formData1.append('file', new File(['dummy1'], 'scan1.dcm', { type: 'application/dicom' }));

    const formData2 = new FormData();
    formData2.append('file', new File(['dummy2'], 'scan2.dcm', { type: 'application/dicom' }));

    const result1 = await uploadScan(formData1);
    const result2 = await uploadScan(formData2);

    expect(result1.data?.scanId).not.toBe(result2.data?.scanId);
  });
});

