-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB DEFAULT '[]'::jsonb,
  cover_image TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view published articles
CREATE POLICY "Public articles are viewable by everyone" 
ON articles FOR SELECT 
USING (published_at IS NOT NULL AND published_at <= NOW());

-- Policy: Admins can view/edit/delete all articles
CREATE POLICY "Admins can do everything with articles" 
ON articles FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles WHERE is_admin = true
  )
);
