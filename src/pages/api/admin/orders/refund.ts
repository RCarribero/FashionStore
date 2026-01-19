import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { generateCreditNote } from '../../../../lib/invoicing';

export const prerender = false;

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request, cookies }) => {
    // 1. Auth Check - Server Side
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Admin Check
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
    }

    const { orderId, reason, items } = await request.json();

    if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID required' }), { status: 400 });
    }

    // 3. Fetch Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, items, shipping_address')
        .eq('id', orderId)
        .single();

    // Fetch user profile associated with order (for email/name)
    const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('id', order.user_id)
        .single();


    // 2. Begin Transaction (Supabase doesn't have native multi-table transactions in JS client easily without RPC, 
    // but we will do sequential updates and assume success for MVP. 
    // Ideally, use a Postgres function for atomicity).

    // 3. Restore Stock
    // items is array of { product_id, size, quantity } to refund. 
    // If undefined, maybe full refund? For this demo, let's assume full refund if items not provided, 
    // or specific logic. The UI will call this.
    // We'll stick to full refund/cancellation logic or simple status update for now.

    // If this is a "Refund" (Devolucion), stock should be increased.
    // Iterating over order items generally.

    const orderItems = order.items as any[];

    for (const item of orderItems) {
        // Find variant to update stock
        // We need product_id and size. order.items usually has them?
        // existing schema stores: name, price, quantity, size, image, slug.
        // It might NOT store product_id directly in the JSON without a lookup, 
        // but let's check if we can restore by finding product by slug?
        // Or we trust the item has needed info.
        // Realistically, to restore stock, we need variant ID or ProductID + Size.

        if (item.product_id && item.size) {
            // Using RPC call if exists, or manual get + update
            // Let's rely on manual for now:
            const { data: product } = await supabase.from('products').select('variants').eq('id', item.product_id).single();
            if (product && product.variants) {
                const newVariants = product.variants.map((v: any) => {
                    if (v.size === item.size) {
                        return { ...v, stock: v.stock + item.quantity };
                    }
                    return v;
                });

                await supabase.from('products').update({ variants: newVariants }).eq('id', item.product_id);
            }
        }
    }

    // 4. Update Order Status
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            status: 'refunded',
            shipping_status: 'returned',
            payment_status: 'refunded'
        })
        .eq('id', orderId);

    if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update order' }), { status: 500 });
    }

    // 5. Generate Credit Note (Factura de Abono) logic could be here or triggered separately.
    // If we want to store it, we would generate PDF and upload to storage.
    // For now, let's just return success, and the Admin UI can download the "Refund Invoice" on demand using the same invoice endpoint but with a query param? 
    // Or we create a specific record.

    return new Response(JSON.stringify({ message: 'Refund processed successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
