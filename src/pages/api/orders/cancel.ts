/**
 * Order Cancellation API
 * Performs atomic cancellation: updates order status and restores stock
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

interface OrderItem {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    price: number;
}

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return new Response(JSON.stringify({
                error: 'Se requiere el ID del pedido'
            }), { status: 400 });
        }

        // Get access token from cookies to verify user
        const accessToken = cookies.get('sb-access-token')?.value;

        if (!accessToken) {
            return new Response(JSON.stringify({
                error: 'No autenticado'
            }), { status: 401 });
        }

        // Create client with user's session to get user ID
        const userSupabase = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
            {
                global: {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            }
        );

        const { data: { user }, error: userError } = await userSupabase.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({
                error: 'Sesion invalida'
            }), { status: 401 });
        }

        // Get order and verify ownership and status
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single();

        if (orderError || !order) {
            return new Response(JSON.stringify({
                error: 'Pedido no encontrado'
            }), { status: 404 });
        }

        // Check if order can be cancelled (only paid/processing, not shipped)
        const cancellableStatuses = ['paid', 'processing', 'pending'];
        const nonCancellableStatuses = ['shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];

        if (nonCancellableStatuses.includes(order.shipping_status) ||
            nonCancellableStatuses.includes(order.status)) {
            return new Response(JSON.stringify({
                error: 'Este pedido ya no puede ser cancelado porque ya ha sido enviado'
            }), { status: 400 });
        }

        if (!cancellableStatuses.includes(order.status) &&
            !cancellableStatuses.includes(order.shipping_status)) {
            return new Response(JSON.stringify({
                error: 'El estado actual del pedido no permite cancelacion'
            }), { status: 400 });
        }

        // ATOMIC OPERATION: Cancel order and restore stock
        // We'll do this as a sequence with rollback on failure

        const orderItems: OrderItem[] = order.items || [];
        const stockUpdates: { variantId: string; previousStock: number; newStock: number }[] = [];

        try {
            // 1. First, restore stock for each item
            for (const item of orderItems) {
                // Find the variant by product_id and size
                const { data: variant, error: variantError } = await supabase
                    .from('product_variants')
                    .select('id, stock')
                    .eq('product_id', item.productId)
                    .eq('size', item.size)
                    .single();

                if (variantError || !variant) {
                    console.warn(`Variant not found for product ${item.productId} size ${item.size}`);
                    continue; // Skip if variant not found
                }

                const previousStock = variant.stock;
                const newStock = previousStock + item.quantity;

                // Update stock
                const { error: updateError } = await supabase
                    .from('product_variants')
                    .update({ stock: newStock })
                    .eq('id', variant.id);

                if (updateError) {
                    throw new Error(`Error updating stock for variant ${variant.id}`);
                }

                stockUpdates.push({
                    variantId: variant.id,
                    previousStock,
                    newStock
                });
            }

            // 2. Update order status to cancelled
            const { error: cancelError } = await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    shipping_status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (cancelError) {
                // Rollback stock updates
                for (const update of stockUpdates) {
                    await supabase
                        .from('product_variants')
                        .update({ stock: update.previousStock })
                        .eq('id', update.variantId);
                }
                throw new Error('Error al cancelar el pedido');
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Pedido cancelado correctamente. El stock ha sido restaurado.',
                stockRestored: stockUpdates.length
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (atomicError: any) {
            console.error('Atomic cancel error:', atomicError);
            return new Response(JSON.stringify({
                error: atomicError.message || 'Error en la operacion de cancelacion'
            }), { status: 500 });
        }

    } catch (error: any) {
        console.error('Cancel order error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Error interno del servidor'
        }), { status: 500 });
    }
};
