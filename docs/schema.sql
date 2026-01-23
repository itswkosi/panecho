-- PanEcho Database Schema
-- Run this SQL in Supabase SQL Editor

-- ============================================================================
-- 1. SCANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('dicom', 'image')),
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL,
  clinical_context JSONB NOT NULL,
  dicom_metadata JSONB,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  key_slices TEXT[],
  retention_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  retention_extended_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS scans_user_id_idx ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS scans_processing_status_idx ON public.scans(processing_status);
CREATE INDEX IF NOT EXISTS scans_upload_date_idx ON public.scans(upload_date DESC);

-- Enable RLS on scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own scans
CREATE POLICY IF NOT EXISTS scans_select_own
  ON public.scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own scans
CREATE POLICY IF NOT EXISTS scans_insert_own
  ON public.scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own scans
CREATE POLICY IF NOT EXISTS scans_update_own
  ON public.scans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own scans
CREATE POLICY IF NOT EXISTS scans_delete_own
  ON public.scans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can access all scans (needed for backend operations)
CREATE POLICY IF NOT EXISTS scans_service_role_all
  ON public.scans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. ANALYSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('initial', 'longitudinal')),
  classification TEXT NOT NULL CHECK (classification IN ('normal', 'suspicious')),
  risk_score NUMERIC(5,2) NOT NULL,
  ai_summary TEXT NOT NULL,
  detailed_findings JSONB NOT NULL,
  compared_scan_ids UUID[],
  longitudinal_changes JSONB,
  gpt_model_used TEXT NOT NULL,
  tokens_used INTEGER,
  processing_time_seconds INTEGER,
  slices_analyzed INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS analyses_scan_id_idx ON public.analyses(scan_id);
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON public.analyses(created_at DESC);

-- Enable RLS on analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own analyses
CREATE POLICY IF NOT EXISTS analyses_select_own
  ON public.analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own analyses
CREATE POLICY IF NOT EXISTS analyses_insert_own
  ON public.analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own analyses
CREATE POLICY IF NOT EXISTS analyses_update_own
  ON public.analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own analyses
CREATE POLICY IF NOT EXISTS analyses_delete_own
  ON public.analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can access all analyses (needed for backend operations)
CREATE POLICY IF NOT EXISTS analyses_service_role_all
  ON public.analyses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. USAGE_TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_count INTEGER NOT NULL DEFAULT 0,
  scans_this_month INTEGER NOT NULL DEFAULT 0,
  total_analyses INTEGER NOT NULL DEFAULT 0,
  analyses_this_month INTEGER NOT NULL DEFAULT 0,
  last_scan_date TIMESTAMP WITH TIME ZONE,
  last_analysis_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS usage_tracking_user_id_idx ON public.usage_tracking(user_id);

-- Enable RLS on usage_tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own usage tracking
CREATE POLICY IF NOT EXISTS usage_tracking_select_own
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own usage tracking
CREATE POLICY IF NOT EXISTS usage_tracking_insert_own
  ON public.usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own usage tracking
CREATE POLICY IF NOT EXISTS usage_tracking_update_own
  ON public.usage_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role can access all usage tracking (needed for backend operations)
CREATE POLICY IF NOT EXISTS usage_tracking_service_role_all
  ON public.usage_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. DATABASE FUNCTIONS
-- ============================================================================

-- Function: Reset monthly scan counts (run via cron job on 1st of each month)
CREATE OR REPLACE FUNCTION public.reset_monthly_scan_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.usage_tracking
  SET scans_this_month = 0, analyses_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup expired scans (run via cron job daily)
CREATE OR REPLACE FUNCTION public.cleanup_expired_scans()
RETURNS void AS $$
DECLARE
  scan_record RECORD;
BEGIN
  FOR scan_record IN
    SELECT id, user_id FROM public.scans
    WHERE retention_expires_at < now() AND retention_extended_count = 0
  LOOP
    -- Delete from storage
    DELETE FROM storage.objects
    WHERE bucket_id = 'scans' AND name LIKE scan_record.user_id || '/' || scan_record.id || '%';
    
    -- Delete from database
    DELETE FROM public.scans WHERE id = scan_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Extend scan retention (adds 90 days, max 2 extensions)
CREATE OR REPLACE FUNCTION public.extend_scan_retention(scan_id UUID)
RETURNS boolean AS $$
DECLARE
  current_scan RECORD;
BEGIN
  SELECT * INTO current_scan FROM public.scans WHERE id = scan_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF current_scan.retention_extended_count >= 2 THEN
    RETURN false;
  END IF;
  
  UPDATE public.scans
  SET 
    retention_expires_at = retention_expires_at + INTERVAL '90 days',
    retention_extended_count = retention_extended_count + 1,
    updated_at = now()
  WHERE id = scan_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;
