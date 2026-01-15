/**
 * Script to create the BIENVENIDO welcome coupon
 * Run with: npx tsx scripts/create-welcome-coupon.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createWelcomeCoupon() {
    console.log('Creating BIENVENIDO coupon...');

    // Check if coupon already exists
    const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', 'BIENVENIDO')
        .single();

    if (existing) {
        console.log('Coupon BIENVENIDO already exists');
        return;
    }

    const { error } = await supabase
        .from('coupons')
        .insert({
            code: 'BIENVENIDO',
            description: 'Cupon de bienvenida - 20% descuento en primera compra',
            discount_type: 'percentage',
            discount_value: 20,
            is_active: true,
            is_automatic: false,
            min_purchase: 0,
            max_uses: null,
            uses_count: 0,
            valid_from: new Date().toISOString(),
            valid_until: null,
            applies_to: 'all'
        });

    if (error) {
        console.error('Error creating coupon:', error.message);
    } else {
        console.log('Coupon BIENVENIDO created successfully!');
    }
}

createWelcomeCoupon();
