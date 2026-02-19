-- Migration: Create password_recovery_tokens table
-- This table stores custom recovery tokens for password reset flow using Nodemailer

CREATE TABLE IF NOT EXISTS public.password_recovery_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_recovery_token ON public.password_recovery_tokens(token);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_recovery_user ON public.password_recovery_tokens(user_id);

-- Enable RLS
ALTER TABLE public.password_recovery_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no public policies)
-- This ensures tokens are only accessible via server-side API endpoints

COMMENT ON TABLE public.password_recovery_tokens IS 'Stores password recovery tokens for custom email flow';
