-- Create home_sections table
CREATE TABLE IF NOT EXISTS public.home_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE, -- 'video', 'offer_banner', 'categories', 'featured', 'values'
    label TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    component_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read (for the homepage)
CREATE POLICY "Enable read access for all users" ON public.home_sections
    FOR SELECT USING (true);

-- Only admins/service_role can update
CREATE POLICY "Enable write access for service role" ON public.home_sections
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
    
-- Insert default sections
INSERT INTO public.home_sections (key, label, order_index, is_visible)
VALUES 
    ('hero', 'Hero Banner', 0, true),
    ('offer_banner', 'Banner Oferta', 1, true),
    ('categories', 'Grid Categorías', 2, true),
    ('featured', 'Productos Destacados', 3, true),
    ('values', 'Propuestas de Valor', 4, true)
ON CONFLICT (key) DO NOTHING;
