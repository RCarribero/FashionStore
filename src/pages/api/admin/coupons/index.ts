/**
 * Coupons CRUD API
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../../lib/email';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

// Create coupon
export const POST: APIRoute = async ({ request }) => {
    try {
        const { product_ids, ...couponData } = await request.json();

        const { data: coupon, error } = await supabase
            .from('coupons')
            .insert(couponData)
            .select()
            .single();

        if (error) {
            console.error('Coupon creation error:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // Add product associations if applies_to is specific
        if (couponData.applies_to === 'specific' && product_ids?.length > 0) {
            const productLinks = product_ids.map((productId: string) => ({
                coupon_id: coupon.id,
                product_id: productId
            }));

            const { error: linkError } = await supabase
                .from('coupon_products')
                .insert(productLinks);

            if (linkError) {
                console.error('Product link error:', linkError);
            }
        }

        // Send email to newsletter subscribers for automatic promotions
        // TEMPORARILY DISABLED
        // if (couponData.is_automatic) {
        //     sendPromotionEmails(coupon).catch(err => {
        //         console.error('Error sending promotion emails:', err);
        //     });
        // }

        return new Response(JSON.stringify(coupon), { status: 201 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

// Send promotion emails to all newsletter subscribers
async function sendPromotionEmails(promotion: any) {
    // Get all newsletter subscribers
    const { data: subscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('email');

    if (error || !subscribers || subscribers.length === 0) {
        console.log('No subscribers to notify');
        return;
    }

    const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://fashionmarket.com';
    const discountText = promotion.discount_type === 'percentage'
        ? `${promotion.discount_value}%`
        : `${(promotion.discount_value / 100).toFixed(2)} EUR`;

    const promoTitle = promotion.public_title || 'Nueva Promocion';
    const promoDescription = promotion.description || 'Descubre nuestra ultima oferta exclusiva';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #000; padding: 30px; text-align: center; }
        .logo { color: #fff; font-size: 24px; font-weight: bold; text-decoration: none; }
        .logo span { color: #e11d48; }
        .hero { background: linear-gradient(135deg, #e11d48 0%, #000 100%); padding: 50px 20px; text-align: center; }
        .discount-badge { display: inline-block; background: #fff; color: #e11d48; font-size: 42px; font-weight: 900; padding: 20px 40px; margin-bottom: 20px; }
        .promo-title { color: #fff; font-size: 28px; font-weight: bold; text-transform: uppercase; margin: 0 0 10px 0; }
        .promo-desc { color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; }
        .content { padding: 40px 20px; text-align: center; background: #f8f8f8; }
        .button { display: inline-block; padding: 18px 40px; background-color: #e11d48; color: #ffffff !important; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .footer { background: #000; padding: 20px; text-align: center; font-size: 12px; color: #999; }
        .footer a { color: #e11d48; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="${siteUrl}" class="logo">FASHION<span>MARKET</span></a>
        </div>
        <div class="hero">
            <div class="discount-badge">-${discountText}</div>
            <h1 class="promo-title">${promoTitle}</h1>
            <p class="promo-desc">${promoDescription}</p>
        </div>
        <div class="content">
            <p style="font-size: 18px; margin-bottom: 30px;">No te pierdas esta oferta exclusiva. Stock limitado.</p>
            <a href="${siteUrl}/ofertas" class="button">Ver Ofertas</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.</p>
            <p><a href="${siteUrl}/unsubscribe">Darse de baja</a></p>
        </div>
    </div>
</body>
</html>
`;

    // Send emails with delays to avoid rate limits
    console.log(`Sending promotion emails to ${subscribers.length} subscribers...`);

    for (const subscriber of subscribers) {
        try {
            await sendEmail({
                to: subscriber.email,
                subject: `${promoTitle} - ${discountText} de descuento`,
                html: emailHtml
            });
        } catch (err) {
            console.error(`Error sending to ${subscriber.email}:`, err);
        }
    }

    console.log('Promotion emails sent successfully');
}
