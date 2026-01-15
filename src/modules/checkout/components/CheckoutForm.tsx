import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $cart, $coupon, getCartSessionId } from '../../store/stores/cart.store';
import { getCurrentUser, supabase } from '../../auth/services/auth-client.service';

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

interface Address {
    id: string;
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
    is_default: boolean;
}

export default function CheckoutForm() {
    const cart = useStore($cart);
    const appliedCoupon = useStore($coupon);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Address management state
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
    const [saveNewAddress, setSaveNewAddress] = useState(false);
    const [newAddressName, setNewAddressName] = useState('Casa');
    const [user, setUser] = useState<any>(null);

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
        loadUserAndAddresses();
    }, []);

    const loadUserAndAddresses = async () => {
        const currentUser = await getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            // Pre-fill email if available
            if (currentUser.email) {
                setFormData(prev => ({ ...prev, email: currentUser.email! }));
            }

            // Load saved addresses
            const { data } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('is_default', { ascending: false }); // Default first

            if (data && data.length > 0) {
                setSavedAddresses(data);
                // Select default address if exists, otherwise the first one
                const defaultAddr = data.find(a => a.is_default) || data[0];
                setSelectedAddressId(defaultAddr.id);
                fillFormWithAddress(defaultAddr);
            }
        }
    };

    const fillFormWithAddress = (addr: Address) => {
        setFormData(prev => ({
            ...prev,
            address: addr.line1 + (addr.line2 ? `, ${addr.line2}` : ''),
            city: addr.city,
            state: '', // We don't store state specifically in user_addresses currently, user might need to fill or we infer? simpler to let user fill or leave empty if not strictly required
            zip: addr.postal_code,
            country: addr.country
        }));
    };

    const handleAddressSelection = (addressId: string) => {
        setSelectedAddressId(addressId);
        if (addressId === 'new') {
            // Clear address fields but keep contact info
            setFormData(prev => ({
                ...prev,
                address: '',
                city: '',
                state: '',
                zip: '',
                country: 'ES'
            }));
            setSaveNewAddress(false);
        } else {
            const addr = savedAddresses.find(a => a.id === addressId);
            if (addr) fillFormWithAddress(addr);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // If user manually edits fields while a saved address is selected, switch to 'new' (custom) 
        // OR just keep editing. Switching to 'new' is safer to avoid confusion about updating the saved one.
        // But maybe too aggressive. Let's just track edits. 
        // For simplicity, if they edit critical address fields, we can consider it "new" or just let it be overrides for this order.
        // If user is editing, we probably shouldn't be in a "saved address" mode effectively. 
        // However, the prompt says "if new address, offer to save". 
        // So if they edit, we can enable the "Save address" checkbox again perhaps?
        // Let's keep it simple: if select "new", form is blankable. If select "saved", form is filled. 
        // If they edit a saved filled form, it's just a one-off edit for this order.
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            // Check if we need to save this new address
            if (user && selectedAddressId === 'new' && saveNewAddress) {
                const { error: saveError } = await supabase
                    .from('user_addresses')
                    .insert([{
                        user_id: user.id,
                        name: newAddressName,
                        line1: formData.address, // Simplifying split logic for now, or just storing full string
                        // Start: naive split for line1/line2 if user typed commas? 
                        // Better: just store line1.
                        city: formData.city,
                        postal_code: formData.zip,
                        country: formData.country,
                        is_default: savedAddresses.length === 0 // Make default if it's the first one
                    }]);

                if (saveError) console.error("Error saving address:", saveError);
                // We don't block checkout on save error, just log it
            }

            const response = await fetch('/api/checkout/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.items,
                    customer: formData,
                    userId: user?.id,
                    couponCode: appliedCoupon?.code,
                    cartSessionId: getCartSessionId()
                }),
            });

            const data = await response.json();
            console.log('Checkout API Response:', data);

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Checkout API Error:', data.error);
                setErrorMessage('Error al iniciar pago: ' + (data.error || 'Respuesta inesperada del servidor'));
                setLoading(false);
            }
        } catch (error) {
            console.error('Checkout Network/Client Error:', error);
            setErrorMessage('Error de conexion: ' + (error instanceof Error ? error.message : String(error)));
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
            {errorMessage && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded flex items-center justify-between">
                    <span>{errorMessage}</span>
                    <button type="button" onClick={() => setErrorMessage(null)} className="text-red-200 hover:text-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Address Selection Section */}
            {user && savedAddresses.length > 0 && (
                <div className="mb-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <h3 className="text-white font-medium mb-3">Dirección de Envío</h3>
                    <div className="space-y-2">
                        {savedAddresses.map(addr => (
                            <label key={addr.id} className={`flex items-start gap-3 p-3 rounded cursor-pointer border transition-colors ${selectedAddressId === addr.id ? 'border-accent bg-accent/10' : 'border-slate-700 hover:bg-slate-700/50'}`}>
                                <input
                                    type="radio"
                                    name="addressSelection"
                                    value={addr.id}
                                    checked={selectedAddressId === addr.id}
                                    onChange={() => handleAddressSelection(addr.id)}
                                    className="mt-1 text-accent focus:ring-accent bg-slate-900 border-slate-600"
                                />
                                <div className="text-sm">
                                    <span className="font-bold text-white block">
                                        {addr.name}
                                        {addr.is_default && <span className="ml-2 text-[10px] bg-slate-600 text-white px-1.5 py-0.5 rounded">Predeterminada</span>}
                                    </span>
                                    <span className="text-slate-400 block">{addr.line1}, {addr.postal_code} {addr.city}</span>
                                </div>
                            </label>
                        ))}
                        <label className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-colors ${selectedAddressId === 'new' ? 'border-accent bg-accent/10' : 'border-slate-700 hover:bg-slate-700/50'}`}>
                            <input
                                type="radio"
                                name="addressSelection"
                                value="new"
                                checked={selectedAddressId === 'new'}
                                onChange={() => handleAddressSelection('new')}
                                className="text-accent focus:ring-accent bg-slate-900 border-slate-600"
                            />
                            <span className="text-white font-medium text-sm">Usar una nueva dirección</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Contact Info - Always visible */}
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

            {/* Address Fields - Only visible for new address or if no saved addresses */}
            {(selectedAddressId === 'new' || !user || savedAddresses.length === 0) && (
                <div className="space-y-6 animate-fade-in">
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
                </div>
            )}

            {/* Save New Address Option */}
            {user && selectedAddressId === 'new' && (formData.address || formData.city) && (
                <div className="p-4 bg-slate-800/50 rounded border border-slate-700/50">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                            type="checkbox"
                            checked={saveNewAddress}
                            onChange={(e) => setSaveNewAddress(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-accent focus:ring-accent"
                        />
                        <span className="text-white text-sm">Guardar esta dirección para futuros pedidos</span>
                    </label>

                    {saveNewAddress && (
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Nombre de la dirección (ej. Casa, Trabajo)</label>
                            <input
                                type="text"
                                value={newAddressName}
                                onChange={(e) => setNewAddressName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-accent focus:outline-none"
                                placeholder="Nombre corto"
                            />
                        </div>
                    )}
                </div>
            )}

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
