/**
 * Stripe Checkout API
 */
import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51Snb87CFzYRW6R0mDBbMEZRsdMg3damRDQ4a0h4whl5OPZM0YO9NRdntcOw3GuPKPcdaPRQwT8OTw03zwYbgdU1200ivNMMn3i');

export const prerender = false;

interface CartItem {
    productId: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    size: string;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const { items } = await request.json() as { items: CartItem[] };

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: 'No items' }), { status: 400 });
        }

        const lineItems = items.map((item) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.productName,
                    description: `Talla: ${item.size}`,
                    images: item.productImage ? [item.productImage] : [],
                },
                unit_amount: item.price,
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${new URL(request.url).origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${new URL(request.url).origin}/productos`,
        });

        return new Response(JSON.stringify({ url: session.url }), { status: 200 });
    } catch (error) {
        console.error('Stripe error:', error);
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};
