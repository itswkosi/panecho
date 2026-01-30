import { DICOMMetadata } from '@/lib/dicom/processor';

export interface ClinicalContext {
  age: number;
  symptoms?: string[];
  family_history?: boolean;
  previous_conditions?: string[];
  smoking_status?: 'current' | 'former' | 'never';
}

export interface DetailedFindings {
  pancreatic_observations?: string[];
  risk_factors_identified?: string[];
  recommendations?: string[];
  confidence_metrics?: Record<string, number>;
  // Longitudinal analysis fields
  longitudinal_changes?: LongitudinalChanges;
  comparison_results?: {
    size_changes: Array<{ 
      finding: string;
      finding_id?: string;
      location?: string;
      current_size_mm?: number;
      previous_size_mm?: number;
      size_change_mm?: number;
      direction: string;
      magnitude: string;
    }>;
    new_findings: string[];
    resolved_findings: string[];
    progression_pattern: string;
  };
  trajectory_results?: {
    direction: string;
    rate: string;
    clinical_significance: string;
    follow_up_recommendation: string;
  };
  // Allow additional fields for flexibility
  [key: string]: any;
}

export interface LongitudinalChanges {
  change_detected: boolean;
  change_description?: string;
  progression_rate?: string;
  clinical_significance?: string;
}

export interface Scan {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: 'dicom' | 'image';
  upload_date: Date;
  scan_date: Date;
  clinical_context: ClinicalContext;
  dicom_metadata?: DICOMMetadata;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  segmentation_status?: 'pending' | 'processing' | 'completed' | 'failed';
  radiomics_status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  key_slices?: string[];
  retention_expires_at: Date;
  retention_extended_count: number;
}

export interface InsertScan {
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: 'dicom' | 'image';
  scan_date: Date;
  clinical_context: ClinicalContext;
  dicom_metadata?: DICOMMetadata;
  key_slices?: string[];
}

export interface Analysis {
  id: string;
  scan_id: string;
  user_id: string;
  analysis_type: 'initial' | 'longitudinal';
  classification: 'normal' | 'suspicious';
  risk_score: number;
  risk_score_lower?: number;
  risk_score_upper?: number;
  confidence_level?: number;
  ai_summary: string;
  detailed_findings: DetailedFindings;
  compared_scan_ids?: string[];
  longitudinal_changes?: LongitudinalChanges;
  gpt_model_used: string;
  tokens_used?: number;
  processing_time_seconds?: number;
  slices_analyzed: number[];
  created_at: Date;
  scan?: Scan;
}

export interface InsertAnalysis {
  scan_id: string;
  user_id: string;
  analysis_type: 'initial' | 'longitudinal';
  classification: 'normal' | 'suspicious';
  risk_score: number;
  ai_summary: string;
  detailed_findings: DetailedFindings;
  compared_scan_ids?: string[];
  longitudinal_changes?: LongitudinalChanges;
  gpt_model_used: string;
  tokens_used?: number;
  processing_time_seconds?: number;
  slices_analyzed: number[];
}

export interface UsageTracking {
  id: string;
  user_id: string;
  scan_count: number;
  scans_this_month: number;
  total_analyses: number;
  analyses_this_month: number;
  last_scan_date?: Date;
  last_analysis_date?: Date;
}

export interface UsageLimit {
  canUpload: boolean;
  remaining: number;
  monthly_limit: number;
  scans_this_month: number;
}

export interface SegmentationResult {
  id: string;
  scan_id: string;
  mask_url: string;
  model_version: string;
  confidence_score: number;
  processing_time_ms: number;
  retention_expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RadiomicFeature {
  id: string;
  scan_id: string;
  segmentation_id?: string;
  feature_name: string;
  mean_value: number;
  std_deviation: number;
  category: 'shape' | 'firstorder' | 'glcm' | 'glrlm' | 'glszm' | 'ngtdm' | 'gldm' | 'other';
  shap_importance?: number;
  created_at: Date;
}

export interface ModelPerformance {
  id: string;
  date: Date;
  gemini_rf_mae: number;
  gemini_rf_correlation: number;
  sample_count: number;
  notes?: string;
  created_at: Date;
}
