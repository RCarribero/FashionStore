-- Orders Table
-- Stores user orders after successful Stripe payment

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'completed',
  total_amount INTEGER NOT NULL, -- in cents
  discount_amount INTEGER DEFAULT 0, -- in cents
  shipping_amount INTEGER DEFAULT 0, -- in cents
  items JSONB NOT NULL, -- Array of order items
  shipping_address JSONB, -- Shipping address details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" 
  ON orders 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Service role can insert orders (from webhook)
CREATE POLICY "Service role can insert orders" 
  ON orders 
  FOR INSERT 
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

COMMENT ON TABLE orders IS 'User orders from successful Stripe payments';
COMMENT ON COLUMN orders.items IS 'JSON array of ordered items with productId, name, size, quantity, price';
