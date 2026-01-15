
import { useState } from 'react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setMessage('¡Gracias por unirte! Revisa tu email.');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.error || 'Error al suscribirse');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Error de conexión. Inténtalo de nuevo.');
        }
    };

    if (status === 'success') {
        return (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded text-green-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">¡Te has unido al club correctamente!</span>
            </div>
        );
    }

    return (
        <div className="w-full lg:w-auto">
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-md w-full lg:w-auto">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu email"
                    disabled={status === 'loading'}
                    required
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-3 bg-accent hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
                >
                    {status === 'loading' ? 'Uniéndome...' : 'Unirme'}
                </button>
            </form>
            {status === 'error' && (
                <p className="mt-2 text-sm text-red-400">{message}</p>
            )}
        </div>
    );
}
