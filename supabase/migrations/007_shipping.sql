-- Shipping Tracking Schema
-- Adds shipping status, tracking number, and shipment events

-- Add shipping columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'processing';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Create shipment events table for tracking history
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;

-- Users can view events for their own orders
CREATE POLICY "Users can view own shipment events" 
  ON shipment_events 
  FOR SELECT 
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- Service role can insert events
CREATE POLICY "Service role can manage shipment events" 
  ON shipment_events 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipment_events_order_id ON shipment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);

-- Function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE shipment_events IS 'Tracking history for order shipments';
COMMENT ON COLUMN orders.shipping_status IS 'Current shipping status: processing, shipped, in_transit, out_for_delivery, delivered';
