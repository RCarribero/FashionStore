/**
 * Cron Job: Send Review Requests
 * Intended to be called daily via a cron service (e.g. GitHub Actions, specialized cron service)
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/services/email';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        // 1. Find orders that are:
        // - Completed
        // - Created more than 7 days ago
        // - Haven't had a review email sent yet
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, user_id, items, created_at, user_profiles(email)') // Assume user_profiles link or we store email in orders? Stripe webhook stores user_id. Guest emails are not easily accessible unless stored in metadata or specific column. 
            // In stripe.ts we store user_id but don't seem to store guest email in orders table explicitly? 
            // Let's check stripe.ts: 
            // .insert({ user_id: userId || null, ... })
            // Wait, we might need customer_email in orders table if we want to email guests later. 
            // For now, let's target registered users (user_id is not null) or relying on a potential 'customer_email' column if it existed.
            // Looking at previous files, 'orders' schema isn't fully visible.
            // I'll assume for now we only target users with profiles for the Review request as we can get their email.
            .eq('status', 'completed')
            .is('review_email_sent_at', null)
            .lt('created_at', sevenDaysAgo.toISOString())
            .not('user_id', 'is', null) // Only registered users for now to be safe
            .limit(10); // Batch size limit

        if (error) throw error;

        if (!orders || orders.length === 0) {
            return new Response(JSON.stringify({ message: 'No orders pending review request' }), { status: 200 });
        }

        console.log(`Processing ${orders.length} orders for review requests`);
        const results = [];

        for (const order of orders) {
            // Get user email
            let email = order.user_profiles?.email;

            // If we fetched explicit email from join, great. 
            // If not joined, we might need second query.
            if (!email && order.user_id) {
                const { data: user } = await supabase.auth.admin.getUserById(order.user_id); // This requires service role key which we have
                email = user.user?.email;
            }

            if (email) {
                const result = await sendEmail({
                    to: email,
                    subject: '¿Qué te pareció tu pedido? - FashionMarket',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #0f172a;">¡Hola!</h2>
                            <p>Hace una semana recibiste tu pedido de FashionMarket. Esperamos que lo estés disfrutando.</p>
                            <p>Nos encantaría saber tu opinión sobre tus productos:</p>
                            
                            <ul style="padding-left: 20px; color: #475569;">
                                ${order.items.map((item: any) => `<li>${item.name} (${item.size})</li>`).join('')}
                            </ul>

                            <div style="margin-top: 30px; text-align: center;">
                                <a href="${import.meta.env.PUBLIC_SITE_URL}/pedidos/${order.id}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Escribir Reseña</a>
                            </div>

                            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">Si ya has dejado una reseña, puedes ignorar este mensaje.</p>
                        </div>
                    `
                });

                if (result.success) {
                    // Mark as sent
                    await supabase
                        .from('orders')
                        .update({ review_email_sent_at: new Date().toISOString() })
                        .eq('id', order.id);

                    results.push({ orderId: order.id, status: 'sent', email });
                } else {
                    results.push({ orderId: order.id, status: 'failed', error: result.error });
                }
            } else {
                results.push({ orderId: order.id, status: 'skipped', reason: 'No email found' });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: results.length,
            results
        }), { status: 200 });

    } catch (error: any) {
        console.error('Review cron error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
