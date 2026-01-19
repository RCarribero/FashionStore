import PDFDocument from 'pdfkit';

interface Address {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
}

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    order_number?: number;
    created_at: string;
    total_amount: number;
    items: OrderItem[];
    shipping_address: Address;
}

interface UserProfile {
    first_name: string;
    last_name: string;
    email?: string;
}

export async function generateInvoice(order: Order, user: UserProfile): Promise<Buffer> {
    return createPDF(order, user, 'FACTURA', false);
}

export async function generateCreditNote(order: Order, user: UserProfile): Promise<Buffer> {
    return createPDF(order, user, 'FACTURA DE ABONO', true);
}

function createPDF(order: Order, user: UserProfile, title: string, isCreditNote: boolean): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('FASHION MARKET', { align: 'center' });
        doc.fontSize(10).text('Calle de la Moda 123, Madrid', { align: 'center' });
        doc.moveDown();

        // Title
        doc.fontSize(16).text(title, { align: 'right' });
        const invoiceNum = isCreditNote ? `TN-${order.order_number}` : `INV-${order.order_number}`;
        doc.fontSize(10).text(`Numero: ${invoiceNum}`, { align: 'right' });
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });
        if (isCreditNote) {
            doc.text(`Referencia Pedido: #${order.order_number}`, { align: 'right' });
        }
        doc.moveDown();

        // Customer Info
        doc.text('FACTURAR A:', { underline: true });
        doc.text(`${user.first_name} ${user.last_name}`);
        if (order.shipping_address) {
            doc.text(order.shipping_address.line1);
            if (order.shipping_address.line2) doc.text(order.shipping_address.line2);
            doc.text(`${order.shipping_address.postal_code} ${order.shipping_address.city}`);
            doc.text(order.shipping_address.country);
        }
        doc.moveDown();

        // Table Header
        const tableTop = 250;
        doc.font('Helvetica-Bold');
        doc.text('Descripcion', 50, tableTop);
        doc.text('Cant.', 300, tableTop);
        doc.text('Precio Unit.', 370, tableTop);
        doc.text('Total', 470, tableTop);
        doc.font('Helvetica');

        let y = tableTop + 25;
        const multiplier = isCreditNote ? -1 : 1;

        // Items
        if (Array.isArray(order.items)) {
            order.items.forEach(item => {
                const total = (item.price * item.quantity * multiplier) / 100;
                const unit = (item.price * multiplier) / 100;

                doc.text(item.name.substring(0, 40), 50, y);
                doc.text(item.quantity.toString(), 300, y);
                doc.text(`${unit.toFixed(2)}`, 370, y);
                doc.text(`${total.toFixed(2)}`, 470, y);
                y += 20;
            });
        }

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        // Total
        const total = (order.total_amount * multiplier) / 100;
        doc.font('Helvetica-Bold');
        doc.text('TOTAL EUR', 370, y);
        doc.text(total.toFixed(2), 470, y);

        if (isCreditNote) {
            y += 40;
            doc.fontSize(10).font('Helvetica').text('Devolucion del dinero procesada a metodo de pago original.', 50, y);
        }

        doc.end();
    });
}
