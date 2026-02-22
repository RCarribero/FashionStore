/**
 * Checkout Session Cancellation API
 * Handles the redirect from Stripe when a user clicks 'Back' or 'Cancel'.
 * Expires the session immediately in Stripe and restores the stock.
 */
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover' as any,
});

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
    try {
        const sessionId = url.searchParams.get('session_id');

        if (!sessionId) {
            console.log('No session_id provided for cancellation redirect.');
            return redirect('/checkout');
        }

        // 1. Fetch the session from Stripe to check status
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // 2. If it is open, we can forcefully expire it so it releases everything
        if (session.status === 'open') {
            console.log(`Manually expiring Stripe session ${sessionId}...`);
            await stripe.checkout.sessions.expire(sessionId);
        }

        // 3. Just to be completely safe and immediate, let's also manually release stock 
        // in our DB right now, rather than waiting for the webhook event to fire.
        const cartSessionId = session.metadata?.cartSessionId;

        if (cartSessionId) {
            console.log(`[Cancel Route] Releasing stock for cart session: ${cartSessionId}`);
            const { data: reservations, error: fetchError } = await supabase
                .from('stock_reservations')
                .select('*')
                .eq('session_id', cartSessionId);

            if (!fetchError && reservations && reservations.length > 0) {
                // Restore stock for each reserved item
                for (const res of reservations) {
                    if (res.variant_id) {
                        const { data: variant } = await supabase
                            .from('product_variants')
                            .select('stock')
                            .eq('id', res.variant_id)
                            .single();

                        if (variant) {
                            await supabase
                                .from('product_variants')
                                .update({ stock: variant.stock + res.quantity })
                                .eq('id', res.variant_id);
                        }
                    } else if (res.product_id) { // Fallback for products without variants
                        const { data: product } = await supabase
                            .from('products')
                            .select('stock')
                            .eq('id', res.product_id)
                            .single();

                        if (product) {
                            await supabase
                                .from('products')
                                .update({ stock: product.stock + res.quantity })
                                .eq('id', res.product_id);
                        }
                    }
                }

                // Delete reservations so they don't get processed again by webhook
                await supabase
                    .from('stock_reservations')
                    .delete()
                    .eq('session_id', cartSessionId);

                console.log(`[Cancel Route] Successfully restored stock for ${reservations.length} reservations.`);
            }
        }

        // Redirect back to checkout
        return redirect('/checkout');

    } catch (error: any) {
        console.error('Cancel session error:', error);
        // Even if it fails, send them back to checkout so they aren't stuck on a blank page
        return redirect('/checkout');
    }
};
