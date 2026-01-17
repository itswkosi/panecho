import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePDF } from '@/app/actions/pdf';
import * as authActions from '@/app/actions/auth';
import * as db from '@/lib/supabase/db';
import * as pdfGenerator from '@/lib/pdf/generator';

vi.mock('@/app/actions/auth');
vi.mock('@/lib/supabase/db');
vi.mock('@/lib/pdf/generator');

describe('PDF Server Action', () => {
  const mockScan = {
    id: 'scan-123',
    user_id: 'user-123',
    file_url: 'https://example.com/scan.dcm',
    file_name: 'scan.dcm',
    file_size: 50000,
    file_type: 'dicom' as const,
    upload_date: new Date(),
    scan_date: new Date('2024-01-15'),
    clinical_context: {
      age: 55,
      smoking_status: 'never' as const,
    },
    processing_status: 'completed' as const,
    key_slices: [],
    retention_expires_at: new Date(),
    retention_extended_count: 0,
  };

  const mockAnalysis = {
    id: 'analysis-123',
    scan_id: 'scan-123',
    user_id: 'user-123',
    classification: 'suspicious',
    risk_score: 75,
    ai_summary: 'Test analysis',
    detailed_findings: {},
    gpt_model_used: 'gpt-4-vision',
    tokens_used: 1000,
    processing_time_seconds: 10,
    slices_analyzed: [],
    analysis_type: 'initial',
    created_at: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'John Doe',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePDF', () => {
    it('should generate PDF successfully', async () => {
      vi.mocked(authActions.getUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(db.getScan).mockResolvedValueOnce(mockScan as any);
      vi.mocked(db.getAnalysis).mockResolvedValueOnce(mockAnalysis as any);
      vi.mocked(pdfGenerator.generatePDFReport).mockResolvedValueOnce(
        new Blob(['pdf content'], { type: 'application/pdf' }),
      );

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.blob).toBeDefined();
      expect(result.data?.filename).toMatch(/PanEcho_Report_John_Doe_/);
      expect(result.error).toBeUndefined();
    });

    it('should return error if user not authenticated', async () => {
      vi.mocked(authActions.getUser).mockResolvedValueOnce(null);

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNAUTHORIZED');
      expect(result.data).toBeUndefined();
    });

    it('should return error if scan not found', async () => {
      vi.mocked(authActions.getUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(db.getScan).mockResolvedValueOnce(null);

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.data).toBeUndefined();
    });

    it('should return error if analysis not available', async () => {
      vi.mocked(authActions.getUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(db.getScan).mockResolvedValueOnce(mockScan as any);
      vi.mocked(db.getAnalysis).mockResolvedValueOnce(null);

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INVALID_API_RESPONSE');
      expect(result.data).toBeUndefined();
    });

    it('should fetch previous analyses for longitudinal', async () => {
      const longitudinalAnalysis = {
        ...mockAnalysis,
        analysis_type: 'longitudinal',
        compared_scan_ids: ['scan-prev-1', 'scan-prev-2'],
      };

      const previousAnalysis = {
        ...mockAnalysis,
        id: 'analysis-prev-1',
        scan_id: 'scan-prev-1',
      };

      vi.mocked(authActions.getUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(db.getScan).mockResolvedValueOnce(mockScan as any);
      vi.mocked(db.getAnalysis)
        .mockResolvedValueOnce(longitudinalAnalysis as any)
        .mockResolvedValueOnce(previousAnalysis as any)
        .mockResolvedValueOnce(previousAnalysis as any);
      vi.mocked(pdfGenerator.generatePDFReport).mockResolvedValueOnce(
        new Blob(['pdf'], { type: 'application/pdf' }),
      );

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(true);
      expect(pdfGenerator.generatePDFReport).toHaveBeenCalledWith(
        expect.objectContaining({ analysis_type: 'longitudinal' }),
        mockScan,
        expect.arrayContaining([previousAnalysis]),
        'John Doe',
      );
    });

    it('should generate correct filename with user name', async () => {
      const userWithDifferentName = {
        ...mockUser,
        user_metadata: { full_name: 'Jane Smith' },
      };

      vi.mocked(authActions.getUser).mockResolvedValueOnce(userWithDifferentName as any);
      vi.mocked(db.getScan).mockResolvedValueOnce(mockScan as any);
      vi.mocked(db.getAnalysis).mockResolvedValueOnce(mockAnalysis as any);
      vi.mocked(pdfGenerator.generatePDFReport).mockResolvedValueOnce(
        new Blob(['pdf'], { type: 'application/pdf' }),
      );

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(true);
      expect(result.data?.filename).toContain('Jane_Smith');
      expect(result.data?.filename).toContain('2024-01-15');
    });

    it('should use default name if user metadata missing', async () => {
      const userWithoutName = {
        ...mockUser,
        user_metadata: {},
      };

      vi.mocked(authActions.getUser).mockResolvedValueOnce(userWithoutName as any);
      vi.mocked(db.getScan).mockResolvedValueOnce(mockScan as any);
      vi.mocked(db.getAnalysis).mockResolvedValueOnce(mockAnalysis as any);
      vi.mocked(pdfGenerator.generatePDFReport).mockResolvedValueOnce(
        new Blob(['pdf'], { type: 'application/pdf' }),
      );

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(true);
      expect(result.data?.filename).toContain('Patient');
    });

    it('should handle PDF generation errors', async () => {
      vi.mocked(authActions.getUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(db.getScan).mockResolvedValueOnce(mockScan as any);
      vi.mocked(db.getAnalysis).mockResolvedValueOnce(mockAnalysis as any);
      vi.mocked(pdfGenerator.generatePDFReport).mockRejectedValueOnce(
        new Error('PDF generation failed'),
      );

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('API_ERROR');
      expect(result.data).toBeUndefined();
    });

    it('should gracefully handle missing previous analysis', async () => {
      const longitudinalAnalysis = {
        ...mockAnalysis,
        analysis_type: 'longitudinal',
        compared_scan_ids: ['scan-prev-1'],
      };

      vi.mocked(authActions.getUser).mockResolvedValueOnce(mockUser as any);
      vi.mocked(db.getScan).mockResolvedValueOnce(mockScan as any);
      vi.mocked(db.getAnalysis)
        .mockResolvedValueOnce(longitudinalAnalysis as any)
        .mockResolvedValueOnce(null); // Previous analysis not found
      vi.mocked(pdfGenerator.generatePDFReport).mockResolvedValueOnce(
        new Blob(['pdf'], { type: 'application/pdf' }),
      );

      const result = await generatePDF('scan-123');

      expect(result.success).toBe(true);
      expect(pdfGenerator.generatePDFReport).toHaveBeenCalledWith(
        longitudinalAnalysis,
        mockScan,
        [], // Empty array when previous analysis not found
        'John Doe',
      );
    });
  });
});
