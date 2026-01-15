/**
 * Email Service using Gmail SMTP via Nodemailer
 */
import nodemailer from 'nodemailer';

// Create transporter using Gmail SMTP
const createTransporter = () => {
    const user = import.meta.env.SMTP_USER || process.env.SMTP_USER;
    const pass = import.meta.env.SMTP_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn('SMTP credentials not configured. Emails will not be sent.');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass  // Use App Password, not regular password
        }
    });
};

export interface EmailAttachment {
    filename: string;
    content: Buffer;
    contentType?: string;
}

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
    attachments?: EmailAttachment[];
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    const transporter = createTransporter();

    if (!transporter) {
        console.log('Email would be sent to:', options.to);
        console.log('Subject:', options.subject);
        return { success: false, error: 'SMTP not configured' };
    }

    try {
        const mailOptions: nodemailer.SendMailOptions = {
            from: options.from || `FashionMarket <${import.meta.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html
        };

        // Add attachments if provided
        if (options.attachments && options.attachments.length > 0) {
            mailOptions.attachments = options.attachments.map(att => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType || 'application/pdf'
            }));
        }

        const result = await transporter.sendMail(mailOptions);

        console.log('Email sent:', result.messageId);
        return { success: true };

    } catch (error: any) {
        console.error('Email send error:', error.message);
        return { success: false, error: error.message };
    }
}

// Email template helpers
export const formatPrice = (cents: number) => (cents / 100).toFixed(2) + ' EUR';

export const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});
