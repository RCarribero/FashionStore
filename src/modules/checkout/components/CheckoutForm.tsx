import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $cart, $coupon } from '../../store/stores/cart.store';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export default function CheckoutForm() {
    const cart = useStore($cart);
    const appliedCoupon = useStore($coupon);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'ES', // Default to Spain
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get user ID for first purchase detection
            const { getCurrentUser } = await import('../../auth/services/auth-client.service');
            const user = await getCurrentUser();

            const response = await fetch('/api/checkout/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.items,
                    customer: formData,
                    userId: user?.id,
                    couponCode: appliedCoupon?.code
                }),
            });

            const data = await response.json();
            console.log('Checkout API Response:', data);

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Checkout API Error:', data.error);
                alert('Error al iniciar pago: ' + (data.error || 'Respuesta inesperada del servidor'));
                setLoading(false);
            }
        } catch (error) {
            console.error('Checkout Network/Client Error:', error);
            alert('Error de conexión: ' + (error instanceof Error ? error.message : String(error)));
            setLoading(false);
        }
    };

    const inputClasses = "w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-white transition-colors duration-200";
    const labelClasses = "block text-sm font-medium text-slate-400 mb-1";

    if (!isMounted) {
        return <div className="p-8 text-center text-slate-500">Cargando formulario...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="firstName" className={labelClasses}>Nombre</label>
                    <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        required
                        className={inputClasses}
                        value={formData.firstName}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="lastName" className={labelClasses}>Apellidos</label>
                    <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        required
                        className={inputClasses}
                        value={formData.lastName}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="email" className={labelClasses}>Email</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className={inputClasses}
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="phone" className={labelClasses}>Teléfono</label>
                    <input
                        type="tel"
                        name="phone"
                        id="phone"
                        required
                        className={inputClasses}
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="address" className={labelClasses}>Dirección</label>
                <input
                    type="text"
                    name="address"
                    id="address"
                    required
                    className={inputClasses}
                    value={formData.address}
                    onChange={handleChange}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="col-span-2 md:col-span-1">
                    <label htmlFor="zip" className={labelClasses}>Código Postal</label>
                    <input
                        type="text"
                        name="zip"
                        id="zip"
                        required
                        className={inputClasses}
                        value={formData.zip}
                        onChange={handleChange}
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label htmlFor="city" className={labelClasses}>Ciudad</label>
                    <input
                        type="text"
                        name="city"
                        id="city"
                        required
                        className={inputClasses}
                        value={formData.city}
                        onChange={handleChange}
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label htmlFor="state" className={labelClasses}>Provincia</label>
                    <input
                        type="text"
                        name="state"
                        id="state"
                        required
                        className={inputClasses}
                        value={formData.state}
                        onChange={handleChange}
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label htmlFor="country" className={labelClasses}>País</label>
                    <select
                        name="country"
                        id="country"
                        required
                        className={inputClasses}
                        value={formData.country}
                        onChange={handleChange}
                    >
                        <option value="ES">España</option>
                        {/* Add more countries if needed */}
                    </select>
                </div>
            </div>

            <div className="pt-6">
                <button
                    type="submit"
                    disabled={loading || cart.items.length === 0}
                    className={`w-full py-4 bg-white hover:bg-slate-200 text-black font-bold uppercase tracking-wider rounded-lg transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {loading ? 'Procesando...' : 'Pagar con Tarjeta (Stripe)'}
                </button>
            </div>
        </form>
    );
}
