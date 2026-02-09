import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://dixaynqqloclazirzgik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGF5bnFxbG9jbGF6aXJ6Z2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg3MDAzNSwiZXhwIjoyMDgzNDQ2MDM1fQ.Z-PYZ2z6uji0pKz8ocSYqqehIJHlTLNrpkpBrtf9vRQ';

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
