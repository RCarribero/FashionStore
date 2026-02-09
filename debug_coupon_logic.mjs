import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dixaynqqloclazirzgik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGF5bnFxbG9jbGF6aXJ6Z2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg3MDAzNSwiZXhwIjoyMDgzNDQ2MDM1fQ.Z-PYZ2z6uji0pKz8ocSYqqehIJHlTLNrpkpBrtf9vRQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const code = 'REBAJAS DE INVIERNO';
    const purchaseAmount = 2799; // 27.99 EUR

    console.log(`Checking coupon: ${code}`);

    const { data: coupons, error } = await supabase
        .from('coupons')
        .select('*');

    if (error) {
        console.error('Error fetching coupons:', error);
        return;
    }

    console.log(`Found ${coupons?.length || 0} total coupons.`);
    coupons?.forEach(c => console.log(`- "${c.code}" (ID: ${c.id})`));

    // Check specific match again manually
    const match = coupons?.find(c => c.code === code);
    if (!match) {
        console.log(`No exact match for "${code}"`);
        return;
    } else {
        console.log(`Found match:`, JSON.stringify(match, null, 2));
    }

    const coupon = match;

    let eligibleAmount = purchaseAmount;
    // Simplified check for specific products (assuming applies to all or ignoring for this base test)
    if (coupon.applies_to === 'specific') {
        console.log('Coupon applies to specific products. Assuming test product is eligible.');
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round(eligibleAmount * coupon.discount_value / 100);
        console.log(`Calculating percentage: ${eligibleAmount} * ${coupon.discount_value} / 100 = ${discountAmount}`);
    } else {
        discountAmount = coupon.discount_value;
        console.log(`Fixed discount: ${discountAmount}`);
    }

    console.log(`Final Discount Amount (cents): ${discountAmount}`);
    console.log(`Final Discount Amount (EUR): ${(discountAmount / 100).toFixed(2)}`);
}

run();
