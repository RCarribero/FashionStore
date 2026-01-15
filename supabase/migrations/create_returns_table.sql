-- Create returns table
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    images TEXT[], -- Array of image URLs
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own returns"
ON public.returns FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own returns"
ON public.returns FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all returns"
ON public.returns FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Admins can update returns"
ON public.returns FOR UPDATE
TO service_role
USING (true);

-- Create Storage Bucket for Return Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('returns-evidence', 'returns-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access to Returns Evidence"
ON storage.objects FOR SELECT
USING ( bucket_id = 'returns-evidence' );

CREATE POLICY "Users can upload return evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'returns-evidence' AND auth.uid() = owner );
