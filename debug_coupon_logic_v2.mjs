import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://dixaynqqloclazirzgik.supabase.co';
const supabaseKey = 'JWT_REDACTED';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching all coupons...');

    const { data: coupons, error } = await supabase
        .from('coupons')
        .select('*');

    if (error) {
        console.error('Error fetching coupons:', error);
        return;
    }

    console.log(`Found ${coupons?.length || 0} coupons.`);

    fs.writeFileSync('coupons_dump.json', JSON.stringify(coupons, null, 2));
    console.log('Dumped to coupons_dump.json');
}

run();
