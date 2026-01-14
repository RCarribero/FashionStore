/**
 * Run orders table migration directly
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('Creating orders table...');

    // Check if orders table exists
    const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);

    if (!testError) {
        console.log('Orders table already exists!');
        return;
    }

    // Table doesn't exist - need to create via SQL
    // Since we can't run raw SQL via JS client, output instructions
    console.log('\n=== IMPORTANT ===');
    console.log('The orders table does not exist. Please run this SQL in Supabase Dashboard:');
    console.log('\n--- SQL Editor > New Query > Paste this ---\n');
    console.log(`
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'completed',
  total_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  shipping_amount INTEGER DEFAULT 0,
  items JSONB NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert orders" ON orders FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    `);
    console.log('\n=================\n');
}

runMigration().catch(console.error);
