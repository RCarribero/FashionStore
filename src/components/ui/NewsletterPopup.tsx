import React, { useState, useEffect } from 'react';

interface NewsletterPopupProps {
    delay?: number; // Delay in ms before showing popup
}

export default function NewsletterPopup({ delay = 5000 }: NewsletterPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [discountCode, setDiscountCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if user already dismissed or subscribed
        const dismissed = localStorage.getItem('newsletter_dismissed');
        const subscribed = localStorage.getItem('newsletter_subscribed');

        if (dismissed || subscribed) return;

        // Show popup after delay
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('newsletter_dismissed', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, generateCoupon: true })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error al suscribirse');
            }

            // Store subscription status
            localStorage.setItem('newsletter_subscribed', 'true');

            // Show discount code
            if (data.couponCode) {
                setDiscountCode(data.couponCode);
            } else {
                setDiscountCode('BIENVENIDO10');
            }
        } catch (err: any) {
            setError(err.message || 'Error al suscribirse');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {discountCode ? (
                    // Success State - Show Coupon
                    <div className="text-center py-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-display text-white mb-2">Gracias por suscribirte</h3>
                        <p className="text-slate-400 mb-6">Usa este codigo en tu primera compra:</p>

                        <div className="bg-slate-800 border-2 border-dashed border-accent rounded-lg p-4 mb-6">
                            <p className="text-3xl font-mono font-bold text-accent tracking-wider">
                                {discountCode}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">10% de descuento</p>
                        </div>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(discountCode);
                                handleClose();
                            }}
                            className="w-full py-3 bg-accent hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-colors rounded"
                        >
                            Copiar Codigo
                        </button>
                    </div>
                ) : (
                    // Subscribe Form
                    <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-display text-white mb-2">
                                Obtén un 10% de descuento
                            </h3>
                            <p className="text-slate-400">
                                Suscribete a nuestra newsletter y recibe un codigo exclusivo para tu primera compra.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Tu email"
                                required
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent rounded"
                            />
                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full py-3 bg-accent hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50 rounded"
                            >
                                {loading ? 'Suscribiendo...' : 'Obtener Mi Codigo'}
                            </button>
                        </form>

                        <p className="text-center text-slate-500 text-xs mt-4">
                            Al suscribirte, aceptas recibir emails promocionales. Puedes darte de baja en cualquier momento.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
