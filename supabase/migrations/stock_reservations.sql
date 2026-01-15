-- Stock Reservations Table for 15-minute product holds
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_reservations_session ON stock_reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON stock_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_variant ON stock_reservations(variant_id);

-- Function to get available stock (actual stock - active reservations)
CREATE OR REPLACE FUNCTION get_available_stock(p_variant_id UUID)
RETURNS INTEGER AS $$
DECLARE
    actual_stock INTEGER;
    reserved_qty INTEGER;
BEGIN
    -- Get actual stock
    SELECT stock INTO actual_stock FROM product_variants WHERE id = p_variant_id;
    
    -- Get sum of active reservations
    SELECT COALESCE(SUM(quantity), 0) INTO reserved_qty 
    FROM stock_reservations 
    WHERE variant_id = p_variant_id AND expires_at > NOW();
    
    RETURN GREATEST(0, actual_stock - reserved_qty);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (reservations are managed by session_id, not user auth)
CREATE POLICY "Allow all operations on stock_reservations" ON stock_reservations
    FOR ALL USING (true) WITH CHECK (true);
