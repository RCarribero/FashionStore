/**
 * Create missing user profiles for existing users
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createMissingProfiles() {
    console.log('Creating missing user profiles...');

    // Get all auth users
    const { data: users } = await supabase.auth.admin.listUsers();

    if (!users?.users?.length) {
        console.log('No users found');
        return;
    }

    console.log(`Found ${users.users.length} users`);

    for (const user of users.users) {
        // Check if user has profile
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            // No profile found, create one
            console.log(`Creating profile for user ${user.email}...`);

            const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                    id: user.id,
                    has_made_purchase: false
                });

            if (insertError) {
                console.error(`Failed to create profile for ${user.email}:`, insertError.message);
            } else {
                console.log(`Profile created for ${user.email}`);
            }
        } else if (profile) {
            console.log(`User ${user.email} already has profile`);
        } else if (error) {
            console.error(`Error checking profile for ${user.email}:`, error.message);
        }
    }

    console.log('\nDone! All users now have profiles.');
}

createMissingProfiles().catch(console.error);
