-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (anyone can subscribe)
CREATE POLICY "Enable insert for everyone" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- Create policy for service role (admin) to manage
CREATE POLICY "Enable all access for service role" ON public.newsletter_subscribers
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
