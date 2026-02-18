import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dixaynqqloclazirzgik.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  // Legacy anon key (not secret)
  'JWT_REDACTED';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ok(msg) {
  console.log(`✅ ${msg}`);
}
function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}. Add it to FashionStore/.env and re-run.`);
  }
}

async function main() {
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE_KEY);

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = `smoke_admin_${Date.now()}@example.com`;
  const password = crypto.randomBytes(18).toString('base64url');

  let userId = null;
  try {
    // 1) Create temp user (confirmed)
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) throw createErr;
    userId = created.user?.id;
    if (!userId) throw new Error('createUser returned no user id');
    ok('Created temp user');

    // 2) Mark as admin in user_profiles
    const { error: upsertErr } = await adminClient
      .from('user_profiles')
      .upsert({ id: userId, is_admin: true }, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    ok('Upserted user_profiles.is_admin=true');

    // 3) Sign in using anon client (so RLS applies)
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: signInData, error: signInErr } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) throw signInErr;
    if (!signInData.session) throw new Error('No session returned from sign in');
    ok('Signed in temp admin user');

    // 4) Fetch one coupon + product for coupon_products insert/delete
    const { data: couponRows, error: couponSelErr } = await authClient
      .from('coupons')
      .select('id')
      .limit(1);
    if (couponSelErr) throw couponSelErr;
    const couponId = couponRows?.[0]?.id;
    if (!couponId) throw new Error('No coupons rows found to test coupon_products');

    const { data: productRows, error: prodSelErr } = await authClient
      .from('products')
      .select('id')
      .limit(1);
    if (prodSelErr) throw prodSelErr;
    const productId = productRows?.[0]?.id;
    if (!productId) throw new Error('No products rows found to test coupon_products');

    // 5) coupon_products write test (RLS admin)
    const { data: cpIns, error: cpInsErr } = await authClient
      .from('coupon_products')
      .insert({ coupon_id: couponId, product_id: productId })
      .select('id')
      .limit(1);
    if (cpInsErr) throw cpInsErr;
    const cpId = cpIns?.[0]?.id;
    if (!cpId) throw new Error('coupon_products insert returned no id');
    ok('Inserted coupon_products (admin RLS)');

    const { error: cpDelErr } = await authClient.from('coupon_products').delete().eq('id', cpId);
    if (cpDelErr) throw cpDelErr;
    ok('Deleted coupon_products (cleanup)');

    // 6) coupons write test (insert/delete)
    const code = `SMOKE_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const { data: cIns, error: cInsErr } = await authClient
      .from('coupons')
      .insert({
        code,
        discount_value: 1,
        discount_type: 'percentage',
        is_active: false,
        applies_to: 'all',
        is_automatic: false,
        public_title: 'Smoke test',
      })
      .select('id')
      .single();
    if (cInsErr) throw cInsErr;
    const newCouponId = cIns?.id;
    if (!newCouponId) throw new Error('coupons insert returned no id');
    ok('Inserted coupon (admin RLS)');

    const { error: cDelErr } = await authClient.from('coupons').delete().eq('id', newCouponId);
    if (cDelErr) throw cDelErr;
    ok('Deleted coupon (cleanup)');

    // 7) stock_reservations (authenticated path, no x-session-id)
    const { data: vRows, error: vErr } = await authClient
      .from('product_variants')
      .select('id,product_id,size')
      .limit(1);
    if (vErr) throw vErr;
    const v = vRows?.[0];
    if (!v?.id || !v?.product_id || !v?.size) throw new Error('No product_variants row for stock test');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { data: srIns, error: srInsErr } = await authClient
      .from('stock_reservations')
      .insert({
        session_id: userId,
        product_id: v.product_id,
        variant_id: v.id,
        size: v.size,
        quantity: 1,
        expires_at: expiresAt,
      })
      .select('id')
      .single();
    if (srInsErr) throw srInsErr;
    const srId = srIns?.id;
    if (!srId) throw new Error('stock_reservations insert returned no id');
    ok('Inserted stock_reservations (auth.uid path)');

    const { error: srDelErr } = await authClient.from('stock_reservations').delete().eq('id', srId);
    if (srDelErr) throw srDelErr;
    ok('Deleted stock_reservations (cleanup)');

    ok('All admin/auth RLS smoke tests passed');
  } catch (e) {
    fail(e?.message || String(e));
  } finally {
    if (userId) {
      const { error: delUserErr } = await adminClient.auth.admin.deleteUser(userId);
      if (delUserErr) {
        fail(`Failed to delete temp user: ${delUserErr.message || delUserErr}`);
      } else {
        ok('Deleted temp user (cleanup)');
      }
    }
  }
}

await main();
