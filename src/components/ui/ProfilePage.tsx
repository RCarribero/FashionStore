import React, { useEffect, useState } from 'react';
import { getCurrentUser, logout, supabase } from '../../auth/services/auth-client.service';
import { ReturnModal } from './ReturnModal';

interface User {
    id: string;
    email?: string;
    created_at?: string;
}

interface UserProfile {
    first_name?: string;
    last_name?: string;
    phone?: string;
}

interface OrderItem {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    price: number;
    image?: string;
}

interface Order {
    id: string;
    created_at: string;
    status: string;
    shipping_status: string;
    tracking_number: string;
    estimated_delivery: string;
    total_amount: number;
    discount_amount: number;
    order_number: number;
    items: OrderItem[];
}

interface Address {
    id: string;
    user_id: string;
    name: string; // e.g. "Casa", "Trabajo"
    full_name: string;
    street: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
    phone: string;
    is_default: boolean;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile>({});
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'addresses'>('info');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({});

    // Return Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<{ id: string, number: number } | null>(null);

    const openReturnModal = (orderId: string, orderNumber: number) => {
        setSelectedOrderForReturn({ id: orderId, number: orderNumber });
        setIsReturnModalOpen(true);
    };

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                window.location.href = '/auth/login';
                return;
            }
            setUser(currentUser as User);

            // Load profile data
            const { data } = await supabase
                .from('user_profiles')
                .select('first_name, last_name, phone')
                .eq('id', currentUser.id)
                .single();

            if (data) {
                setProfile(data);
            }

            // Load orders
            const { data: ordersData } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (ordersData) {
                // Get all unique product IDs from orders
                const productIds = new Set<string>();
                ordersData.forEach(order => {
                    order.items?.forEach((item: OrderItem) => {
                        if (!item.image && item.productId) {
                            productIds.add(item.productId);
                        }
                    });
                });

                // Fetch product images if needed
                let productImages: Record<string, string> = {};
                if (productIds.size > 0) {
                    const { data: products } = await supabase
                        .from('products')
                        .select('id, images')
                        .in('id', Array.from(productIds));

                    if (products) {
                        products.forEach(p => {
                            if (p.images && p.images.length > 0) {
                                productImages[p.id] = p.images[0];
                            }
                        });
                    }
                }

                // Enrich orders with product images
                const enrichedOrders = ordersData.map(order => ({
                    ...order,
                    items: order.items?.map((item: OrderItem) => ({
                        ...item,
                        image: item.image || productImages[item.productId] || ''
                    }))
                }));

                setOrders(enrichedOrders);
            }

            // Load addresses
            const { data: addressesData } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('is_default', { ascending: false });

            if (addressesData) {
                setAddresses(addressesData);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            window.location.href = '/auth/login';
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    first_name: profile.first_name || null,
                    last_name: profile.last_name || null,
                    phone: profile.phone || null
                })
                .eq('id', user.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
            setIsEditing(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al guardar cambios' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error al cerrar sesión');
        }
    };

    const formatPrice = (cents: number) => {
        return (cents / 100).toFixed(2) + ' €';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white">Cargando...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-display text-white mb-2">
                        Mi Perfil
                    </h1>
                    <p className="text-slate-400">
                        Gestiona tu información personal y pedidos
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 border border-slate-800 p-6">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 border-2 border-accent rounded-full mb-4">
                                    <svg className="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <p className="text-white font-medium text-lg break-all">
                                    {user.email}
                                </p>
                            </div>

                            <nav className="space-y-2">
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`w-full text-left px-4 py-2 font-medium transition-colors ${activeTab === 'info'
                                        ? 'bg-accent text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    Información Personal
                                </button>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`w-full text-left px-4 py-2 font-medium transition-colors flex justify-between items-center ${activeTab === 'orders'
                                        ? 'bg-accent text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <span>Mis Pedidos</span>
                                    {orders.length > 0 && (
                                        <span className="bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full">
                                            {orders.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('addresses')}
                                    className={`w-full text-left px-4 py-2 font-medium transition-colors ${activeTab === 'addresses'
                                        ? 'bg-accent text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    Direcciones
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cerrar Sesion
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {activeTab === 'info' && (
                            <div className="bg-slate-900 border border-slate-800 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-display text-white">
                                        Información Personal
                                    </h2>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-white transition-colors font-medium text-sm"
                                        >
                                            Editar Perfil
                                        </button>
                                    )}
                                </div>

                                {message && (
                                    <div className={`mb-6 p-4 border ${message.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/50 text-green-400'
                                        : 'bg-red-500/10 border-red-500/50 text-red-400'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Nombre</label>
                                        <input
                                            type="text"
                                            value={profile.first_name || ''}
                                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent disabled:text-slate-500 disabled:cursor-not-allowed"
                                            placeholder="Tu nombre"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Apellidos</label>
                                        <input
                                            type="text"
                                            value={profile.last_name || ''}
                                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent disabled:text-slate-500 disabled:cursor-not-allowed"
                                            placeholder="Tus apellidos"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono</label>
                                        <input
                                            type="tel"
                                            value={profile.phone || ''}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent disabled:text-slate-500 disabled:cursor-not-allowed"
                                            placeholder="+34 600 000 000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={user.email || ''}
                                            disabled
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">El email no se puede modificar</p>
                                    </div>

                                    {isEditing && (
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="px-6 py-3 bg-accent hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50"
                                            >
                                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    loadUser();
                                                    setMessage(null);
                                                }}
                                                disabled={saving}
                                                className="px-6 py-3 border border-slate-700 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="bg-slate-900 border border-slate-800 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-display text-white">
                                        Mis Pedidos
                                    </h2>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                                        >
                                            <option value="desc">Mas recientes</option>
                                            <option value="asc">Mas antiguos</option>
                                        </select>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Buscar # pedido..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-accent w-40"
                                            />
                                            <svg
                                                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <p className="text-slate-400 mb-4">No tienes pedidos todavia</p>
                                        <a
                                            href="/productos"
                                            className="inline-block px-6 py-2 bg-accent hover:bg-red-700 text-white font-medium transition-colors"
                                        >
                                            Explorar Productos
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders
                                            .filter(order => {
                                                if (!searchTerm) return true;
                                                const term = searchTerm.trim();
                                                if (/^\d+$/.test(term)) {
                                                    return String(order.order_number) === term;
                                                }
                                                const searchString = [
                                                    order.tracking_number || '',
                                                    ...order.items.map(i => i.name + ' ' + i.size)
                                                ].join(' ').toLowerCase();
                                                return searchString.includes(term.toLowerCase());
                                            })
                                            .sort((a, b) => {
                                                if (sortOrder === 'desc') {
                                                    return (b.order_number || 0) - (a.order_number || 0);
                                                }
                                                return (a.order_number || 0) - (b.order_number || 0);
                                            })
                                            .map((order) => {
                                                const statusLabels: Record<string, string> = {
                                                    'processing': 'En Preparacion',
                                                    'shipped': 'Enviado',
                                                    'in_transit': 'En Transito',
                                                    'out_for_delivery': 'En Reparto',
                                                    'delivered': 'Entregado'
                                                };
                                                const statusColors: Record<string, string> = {
                                                    'processing': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                                                    'shipped': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                                                    'in_transit': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                                                    'out_for_delivery': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                                                    'delivered': 'bg-green-500/10 text-green-400 border-green-500/30'
                                                };
                                                return (
                                                    <div key={order.id} className="border border-slate-700 p-4">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <p className="text-sm text-slate-400">
                                                                    {formatDate(order.created_at)}
                                                                </p>
                                                                <p className="text-white font-bold text-lg">
                                                                    Pedido #{order.order_number}
                                                                </p>
                                                                {order.tracking_number && (
                                                                    <p className="text-xs text-slate-500 font-mono">
                                                                        Tracking: {order.tracking_number}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`inline-block px-2 py-1 text-xs font-medium border ${statusColors[order.shipping_status] || statusColors['processing']}`}>
                                                                    {statusLabels[order.shipping_status] || 'Procesando'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3 mb-4">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="flex gap-3 items-center">
                                                                    {/* Product Image */}
                                                                    <div className="w-14 h-14 flex-shrink-0 bg-slate-800 rounded overflow-hidden">
                                                                        {item.image ? (
                                                                            <img
                                                                                src={item.image}
                                                                                alt={item.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {/* Product Details */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-slate-300 text-sm font-medium truncate">
                                                                            {item.name}
                                                                        </p>
                                                                        <p className="text-slate-500 text-xs">
                                                                            Talla {item.size} x{item.quantity}
                                                                        </p>
                                                                    </div>
                                                                    {/* Price */}
                                                                    <span className="text-white text-sm font-medium">
                                                                        {formatPrice(item.price)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="border-t border-slate-700 pt-3 space-y-1">
                                                            {order.discount_amount > 0 && (
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-green-400">Descuento</span>
                                                                    <span className="text-green-400">-{formatPrice(order.discount_amount)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between font-bold">
                                                                <span className="text-white">Total</span>
                                                                <span className="text-white">{formatPrice(order.total_amount)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex gap-2">
                                                            <a
                                                                href={`/pedidos/${order.id}`}
                                                                className="flex-1 text-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                                                            >
                                                                Ver Seguimiento
                                                            </a>

                                                            {/* Return Button - Only for Delivered Orders */}
                                                            {order.shipping_status === 'delivered' && (
                                                                <button
                                                                    onClick={() => openReturnModal(order.id, order.order_number)}
                                                                    className="px-4 py-2 bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-500/50 text-white hover:text-red-400 text-sm font-medium transition-colors"
                                                                >
                                                                    Devolver
                                                                </button>
                                                            )}

                                                            <a
                                                                href={`/api/invoices/generate?orderId=${order.id}`}
                                                                download
                                                                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-white text-sm font-medium transition-colors flex items-center gap-2"
                                                                title="Descargar Factura"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                Factura
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'addresses' && (
                            <div className="bg-slate-900 border border-slate-800 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-display text-white">
                                        Mis Direcciones
                                    </h2>
                                    {!isEditingAddress && (
                                        <button
                                            onClick={() => {
                                                setCurrentAddress({});
                                                setIsEditingAddress(true);
                                            }}
                                            className="px-4 py-2 bg-accent hover:bg-red-700 text-white font-medium text-sm transition-colors"
                                        >
                                            + Nueva Direccion
                                        </button>
                                    )}
                                </div>

                                {isEditingAddress ? (
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        setSaving(true);
                                        try {
                                            if (currentAddress.id) {
                                                await supabase
                                                    .from('user_addresses')
                                                    .update(currentAddress)
                                                    .eq('id', currentAddress.id);
                                            } else {
                                                await supabase
                                                    .from('user_addresses')
                                                    .insert({ ...currentAddress, user_id: user?.id });
                                            }
                                            setMessage({ type: 'success', text: 'Direccion guardada' });
                                            setIsEditingAddress(false);
                                            loadUser();
                                        } catch {
                                            setMessage({ type: 'error', text: 'Error al guardar' });
                                        }
                                        setSaving(false);
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Nombre completo"
                                                value={currentAddress.full_name || ''}
                                                onChange={(e) => setCurrentAddress({ ...currentAddress, full_name: e.target.value })}
                                                className="px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent"
                                                required
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Telefono"
                                                value={currentAddress.phone || ''}
                                                onChange={(e) => setCurrentAddress({ ...currentAddress, phone: e.target.value })}
                                                className="px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent"
                                                required
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Nombre de la direccion (ej. Casa, Trabajo)"
                                            value={currentAddress.name || ''}
                                            onChange={(e) => setCurrentAddress({ ...currentAddress, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Direccion (calle, numero, piso)"
                                            value={currentAddress.street || ''}
                                            onChange={(e) => setCurrentAddress({ ...currentAddress, street: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent"
                                            required
                                        />
                                        <div className="grid grid-cols-3 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Ciudad"
                                                value={currentAddress.city || ''}
                                                onChange={(e) => setCurrentAddress({ ...currentAddress, city: e.target.value })}
                                                className="px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Provincia"
                                                value={currentAddress.province || ''}
                                                onChange={(e) => setCurrentAddress({ ...currentAddress, province: e.target.value })}
                                                className="px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="CP"
                                                value={currentAddress.postal_code || ''}
                                                onChange={(e) => setCurrentAddress({ ...currentAddress, postal_code: e.target.value })}
                                                className="px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-6 py-3 bg-accent hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
                                            >
                                                {saving ? 'Guardando...' : 'Guardar'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setIsEditingAddress(false); setCurrentAddress({}); }}
                                                className="px-6 py-3 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                ) : addresses.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-slate-400">No tienes direcciones guardadas</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {addresses.map((addr) => (
                                            <div key={addr.id} className="border border-slate-700 p-4">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-white font-bold text-lg">
                                                                {addr.name || 'Direccion'}
                                                            </span>
                                                            {addr.is_default && (
                                                                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded">Predeterminada</span>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-300 font-medium">{addr.full_name}</p>
                                                        <p className="text-slate-400 text-sm">{addr.street}</p>
                                                        <p className="text-slate-400 text-sm">{addr.postal_code} {addr.city}, {addr.province}</p>
                                                        <p className="text-slate-500 text-sm mt-1">{addr.phone}</p>
                                                        <p className="text-slate-500 text-sm mt-1">{addr.phone}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-2 items-end">
                                                        {!addr.is_default && (
                                                            <button
                                                                onClick={async () => {
                                                                    // Clear all defaults first
                                                                    await supabase
                                                                        .from('user_addresses')
                                                                        .update({ is_default: false })
                                                                        .eq('user_id', user?.id);
                                                                    // Set this one as default
                                                                    await supabase
                                                                        .from('user_addresses')
                                                                        .update({ is_default: true })
                                                                        .eq('id', addr.id);
                                                                    loadUser();
                                                                }}
                                                                className="text-accent hover:text-red-300 text-sm"
                                                            >
                                                                Hacer predeterminada
                                                            </button>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => { setCurrentAddress(addr); setIsEditingAddress(true); }}
                                                                className="text-slate-400 hover:text-white text-sm"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    await supabase.from('user_addresses').delete().eq('id', addr.id);
                                                                    loadUser();
                                                                }}
                                                                className="text-red-400 hover:text-red-300 text-sm"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Return Modal */}
            {selectedOrderForReturn && (
                <ReturnModal
                    isOpen={isReturnModalOpen}
                    onClose={() => setIsReturnModalOpen(false)}
                    orderId={selectedOrderForReturn.id}
                    orderNumber={selectedOrderForReturn.number}
                    onSuccess={() => {
                        // Optional: Refresh orders or show global success message
                    }}
                />
            )}
        </div>
    );
}
