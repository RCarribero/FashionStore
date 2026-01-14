/**
 * Run user_profiles migration
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('Running user_profiles migration...');

    // Check if user_profiles table exists and has the columns we need
    const { data: testQuery, error: testError } = await supabase
        .from('user_profiles')
        .select('id, has_made_purchase, first_name, last_name, phone')
        .limit(1);

    if (testError) {
        console.log('Table check error:', testError.message);

        if (testError.code === 'PGRST204' || testError.message.includes('does not exist')) {
            console.log('Table user_profiles does not exist. Please run the SQL migration manually in Supabase Dashboard.');
            console.log('\n--- Copy this SQL to Supabase SQL Editor ---\n');
            console.log(`
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  has_made_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            `);
        }
    } else {
        console.log('Table user_profiles exists and has required columns');
        console.log('Sample data:', testQuery);

        // Check if current user has a profile
        const { data: users } = await supabase.auth.admin.listUsers();
        console.log('\nRegistered users:', users?.users?.length || 0);

        if (users?.users?.length) {
            for (const user of users.users) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                console.log(`User ${user.email}: has profile = ${!!profile}, has_made_purchase = ${profile?.has_made_purchase ?? 'N/A'}`);
            }
        }
    }
}

runMigration().catch(console.error);
