/**
 * Stripe Checkout API Endpoint
 * Creates a Stripe Checkout session for cart items
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
const stripe = new Stripe(stripeSecretKey);

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
        const body = await request.json();
        const { items } = body as { items: CartItem[] };

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: 'No items in cart' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Create line items for Stripe
        const lineItems = items.map((item) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.productName,
                    description: `Talla: ${item.size}`,
                    images: item.productImage ? [item.productImage] : [],
                },
                unit_amount: item.price, // Price is already in cents
            },
            quantity: item.quantity,
        }));

        // Create Stripe Checkout session
        // Uses Automatic Payment Methods (configured in Stripe Dashboard)
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            // automatic_payment_methods: { enabled: true }, // Optional: forces automatic methods
            success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/productos`,
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
            // Shipping address for physical products
            shipping_address_collection: {
                allowed_countries: ['ES', 'FR', 'PT', 'DE', 'IT', 'GB', 'BE', 'NL', 'AT', 'IE', 'PL'],
            },
            metadata: {
                order_items: JSON.stringify(items.map(i => ({
                    id: i.productId,
                    qty: i.quantity,
                    size: i.size
                }))),
            },
        });

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
