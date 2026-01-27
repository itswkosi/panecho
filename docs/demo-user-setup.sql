-- Create Demo User for Development
-- Run this SQL in Supabase SQL Editor to enable demo mode

-- Insert demo user into auth.users table
-- This bypasses the auth system for development/demo purposes
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'demo@panecho.local',
  crypt('demo-password-not-used', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT id, email, created_at FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
