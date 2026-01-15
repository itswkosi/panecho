import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePDFReport, generatePDFFilename } from '@/lib/pdf/generator';
import { Analysis, Scan } from '@/lib/types/database';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  Document: vi.fn(),
  Page: vi.fn(),
  Text: vi.fn(),
  View: vi.fn(),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  Font: {
    register: vi.fn(),
  },
  pdf: vi.fn(() => ({
    toBlob: vi.fn(async () => new Blob(['mock pdf content'], { type: 'application/pdf' })),
  })),
}));

describe('PDF Generator', () => {
  const mockScan: Scan = {
    id: 'scan-123',
    user_id: 'user-123',
    file_url: 'https://example.com/scan.dcm',
    file_name: 'scan.dcm',
    file_size: 50000,
    file_type: 'dicom',
    upload_date: new Date('2024-01-15T10:00:00'),
    scan_date: new Date('2024-01-15'),
    clinical_context: {
      age: 55,
      smoking_status: 'never',
    },
    processing_status: 'completed',
    key_slices: ['15', '16', '17'],
    retention_expires_at: new Date('2025-01-15'),
    retention_extended_count: 0,
  };

  const mockAnalysis: Analysis = {
    id: 'analysis-123',
    scan_id: 'scan-123',
    user_id: 'user-123',
    classification: 'suspicious',
    risk_score: 75,
    ai_summary: 'Suspicious pancreatic lesion detected',
    detailed_findings: {
      age: 55,
      symptoms: 'Abdominal pain',
      family_history: 'Family history of pancreatic cancer',
      previous_conditions: ['diabetes'],
      radiomic_features: [
        'High density lesion',
        'Irregular margins',
        'Size 3cm',
      ],
      areas_of_concern: [
        {
          location: 'Pancreatic head',
          description: 'Hypoattenuating lesion',
          slice_numbers: [15, 16, 17],
        },
      ],
      measurements: {
        'Lesion Size': '3.0 cm',
        'Attenuation': '45 HU',
      },
      recommendations: [
        'Follow-up imaging in 3 months',
        'Consult with oncology',
      ],
      longitudinal_changes: {
        change_detected: true,
        change_description: 'Lesion has increased in size',
        progression_rate: 'moderate',
        clinical_significance: 'Significant change warrants clinical attention',
      },
      comparison_results: {
        size_changes: [
          {
            finding: 'Pancreatic lesion',
            direction: 'increased',
            magnitude: '0.5 cm',
          },
        ],
        new_findings: [],
        resolved_findings: [],
        progression_pattern: 'Steady growth',
      },
      trajectory_results: {
        direction: 'increasing',
        rate: 'moderate',
        clinical_significance: 'Significant progression detected',
        follow_up_recommendation: 'Recommend follow-up imaging in 6-8 weeks',
      },
    },
    gpt_model_used: 'gpt-4-vision',
    tokens_used: 2500,
    processing_time_seconds: 12,
    slices_analyzed: Array.from({ length: 40 }, (_, i) => i),
    analysis_type: 'initial',
    created_at: new Date('2024-01-15T10:30:00'),
  };

  describe('generatePDFReport', () => {
    it('should generate PDF with initial analysis', async () => {
      const blob = await generatePDFReport(mockAnalysis, mockScan, [], 'John Doe');
      expect(blob).toBeDefined();
      expect(blob instanceof Blob).toBe(true);
    });

    it('should generate PDF with longitudinal analysis', async () => {
      const previousAnalysis: Analysis = {
        ...mockAnalysis,
        id: 'analysis-previous',
        risk_score: 60,
        classification: 'normal',
        created_at: new Date('2024-01-01'),
      };

      const longitudinalAnalysis: Analysis = {
        ...mockAnalysis,
        analysis_type: 'longitudinal',
        compared_scan_ids: ['scan-previous'],
      };

      const blob = await generatePDFReport(
        longitudinalAnalysis,
        mockScan,
        [previousAnalysis],
        'Jane Smith',
      );
      expect(blob).toBeDefined();
      expect(blob instanceof Blob).toBe(true);
    });

    it('should handle missing detailed findings gracefully', async () => {
      const analysisWithoutDetails: Analysis = {
        ...mockAnalysis,
        detailed_findings: {
          pancreatic_observations: [],
          recommendations: [],
        },
      };

      const blob = await generatePDFReport(analysisWithoutDetails, mockScan, [], 'Patient');
      expect(blob).toBeDefined();
      expect(blob instanceof Blob).toBe(true);
    });

    it('should throw error on invalid input', async () => {
      const invalidAnalysis: any = null;
      await expect(
        generatePDFReport(invalidAnalysis, mockScan, [], 'Patient'),
      ).rejects.toThrow();
    });

    it('should include all required sections in PDF', async () => {
      const blob = await generatePDFReport(mockAnalysis, mockScan, [], 'John Doe');
      expect(blob).toBeDefined();
      // Note: Full content validation would require parsing the PDF
      // For this test, we just verify the blob is created
      expect(blob.type).toBe('application/pdf');
    });

    it('should handle multiple previous analyses', async () => {
      const previousAnalyses: Analysis[] = [
        {
          ...mockAnalysis,
          id: 'analysis-prev-1',
          risk_score: 40,
          created_at: new Date('2023-12-01'),
        },
        {
          ...mockAnalysis,
          id: 'analysis-prev-2',
          risk_score: 50,
          created_at: new Date('2024-01-01'),
        },
      ];

      const longitudinalAnalysis: Analysis = {
        ...mockAnalysis,
        analysis_type: 'longitudinal',
        compared_scan_ids: ['scan-prev-1', 'scan-prev-2'],
      };

      const blob = await generatePDFReport(
        longitudinalAnalysis,
        mockScan,
        previousAnalyses,
        'Patient',
      );
      expect(blob).toBeDefined();
      expect(blob instanceof Blob).toBe(true);
    });
  });

  describe('generatePDFFilename', () => {
    it('should generate proper filename format', () => {
      const filename = generatePDFFilename('John Doe', new Date('2024-01-15'));
      expect(filename).toBe('PanEcho_Report_John_Doe_2024-01-15.pdf');
    });

    it('should sanitize special characters in name', () => {
      const filename = generatePDFFilename('John O\'Brien-Smith', new Date('2024-01-15'));
      expect(filename).toMatch(/PanEcho_Report_John_.*_2024-01-15\.pdf/);
      expect(filename).not.toContain("'");
      expect(filename).toContain('2024-01-15'); // Date uses dashes which are allowed
    });

    it('should format date correctly', () => {
      const filename = generatePDFFilename('Patient', new Date('2024-12-25'));
      expect(filename).toContain('2024-12-25');
    });

    it('should handle names with numbers', () => {
      const filename = generatePDFFilename('Patient123', new Date('2024-01-15'));
      expect(filename).toContain('Patient123');
    });

    it('should handle empty name', () => {
      const filename = generatePDFFilename('', new Date('2024-01-15'));
      expect(filename).toBe('PanEcho_Report__2024-01-15.pdf');
    });
  });
});
