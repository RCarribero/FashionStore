/**
 * Low Stock Alert Service
 */
import { sendEmail } from './email';

export async function checkLowStock(
    productName: string,
    size: string,
    currentStock: number,
    threshold = 5
) {
    if (currentStock <= threshold) {
        console.log(`[Alert] Low stock for ${productName} (Size: ${size}). Quantity: ${currentStock}`);

        const adminEmail = import.meta.env.ADMIN_EMAIL || import.meta.env.SMTP_USER;

        if (!adminEmail) {
            console.warn('No ADMIN_EMAIL configured for stock alerts');
            return;
        }

        await sendEmail({
            to: adminEmail,
            subject: `⚠️ ALERTA DE STOCK: ${productName} (${size})`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #ef4444;">Nivel de Stock Bajo</h2>
                    <p>El siguiente producto se está agotando:</p>
                    <ul style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
                        <li><strong>Producto:</strong> ${productName}</li>
                        <li><strong>Talla:</strong> ${size}</li>
                        <li><strong>Stock Restante:</strong> <span style="color: #ef4444; font-weight: bold;">${currentStock}</span></li>
                    </ul>
                    <p>Por favor, revisa el inventario o contacta con el proveedor.</p>
                </div>
            `
        });
    }
}
