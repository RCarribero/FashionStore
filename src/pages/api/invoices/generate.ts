/**
 * Invoice Generation API
 * Generates PDF invoice for an order
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

const formatPrice = (cents: number) => (cents / 100).toFixed(2) + ' EUR';
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

export const GET: APIRoute = async ({ params, request }) => {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID required' }), { status: 400 });
    }

    try {
        // Fetch order details
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        // Generate PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('FASHIONMARKET', 50, 50);
        doc.fontSize(10).font('Helvetica').fillColor('#666666').text('Factura Simplificada', 50, 80);

        // Invoice details box
        doc.rect(400, 50, 145, 60).fill('#f8f8f8');
        doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold');
        doc.text('FACTURA', 410, 60);
        doc.font('Helvetica').fontSize(9).fillColor('#666666');
        doc.text(`N: ${order.order_number || order.id.slice(0, 8).toUpperCase()}`, 410, 75);
        doc.text(`Fecha: ${formatDate(order.created_at)}`, 410, 90);

        // Separator
        doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#eeeeee').stroke();

        // Business info
        doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold');
        doc.text('FashionMarket', 50, 150);
        doc.font('Helvetica').fillColor('#666666');
        doc.text('CIF: B12345678', 50, 165);
        doc.text('Calle Ejemplo 123', 50, 180);
        doc.text('28001 Madrid, Espana', 50, 195);

        // Items table header
        const tableTop = 240;
        doc.rect(50, tableTop, 495, 25).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        doc.text('PRODUCTO', 60, tableTop + 8);
        doc.text('TALLA', 280, tableTop + 8);
        doc.text('CANT.', 340, tableTop + 8);
        doc.text('PRECIO', 400, tableTop + 8);
        doc.text('TOTAL', 480, tableTop + 8);

        // Items
        let y = tableTop + 30;
        const items = order.items || [];
        items.forEach((item: any, i: number) => {
            const bgColor = i % 2 === 0 ? '#ffffff' : '#f8f8f8';
            doc.rect(50, y, 495, 25).fill(bgColor);
            doc.fillColor('#333333').font('Helvetica').fontSize(9);
            doc.text(item.name, 60, y + 8, { width: 210 });
            doc.text(item.size, 280, y + 8);
            doc.text(String(item.quantity), 340, y + 8);
            doc.text(formatPrice(item.price / item.quantity), 400, y + 8);
            doc.text(formatPrice(item.price), 480, y + 8);
            y += 25;
        });

        // Totals section
        y += 20;
        doc.rect(350, y, 195, 80).fill('#f8f8f8');

        // Subtotal
        const subtotal = order.total_amount - (order.shipping_amount || 0) + (order.discount_amount || 0);
        doc.fillColor('#666666').fontSize(9);
        doc.text('Subtotal:', 360, y + 10);
        doc.text(formatPrice(subtotal), 480, y + 10);

        // Discount if any
        if (order.discount_amount > 0) {
            doc.fillColor('#22c55e');
            doc.text('Descuento:', 360, y + 25);
            doc.text('-' + formatPrice(order.discount_amount), 480, y + 25);
        }

        // Shipping
        const shippingY = order.discount_amount > 0 ? y + 40 : y + 25;
        doc.fillColor('#666666');
        doc.text('Envio:', 360, shippingY);
        doc.text(order.shipping_amount > 0 ? formatPrice(order.shipping_amount) : 'GRATIS', 480, shippingY);

        // Total
        doc.rect(350, shippingY + 20, 195, 25).fill('#1e293b');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
        doc.text('TOTAL:', 360, shippingY + 27);
        doc.text(formatPrice(order.total_amount), 475, shippingY + 27);

        // Footer
        doc.fillColor('#999999').font('Helvetica').fontSize(8);
        doc.text('Gracias por tu compra en FashionMarket', 50, 750, { align: 'center', width: 495 });
        doc.text('www.fashionmarket.com', 50, 765, { align: 'center', width: 495 });

        doc.end();

        // Wait for PDF to complete
        const pdfBuffer = await new Promise<Buffer>((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });

        return new Response(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="factura-${order.order_number || order.id.slice(0, 8)}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('Invoice generation error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
