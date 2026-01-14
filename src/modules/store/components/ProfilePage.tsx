import React, { useEffect, useState } from 'react';
import { getCurrentUser, logout, supabase } from '../../auth/services/auth-client.service';

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
    items: OrderItem[];
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile>({});
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                window.location.href = '/login';
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
                setOrders(ordersData);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            window.location.href = '/login';
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
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cerrar Sesión
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
                                <h2 className="text-xl font-display text-white mb-6">
                                    Mis Pedidos
                                </h2>

                                {orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <p className="text-slate-400 mb-4">No tienes pedidos todavía</p>
                                        <a
                                            href="/productos"
                                            className="inline-block px-6 py-2 bg-accent hover:bg-red-700 text-white font-medium transition-colors"
                                        >
                                            Explorar Productos
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => {
                                            const statusLabels: Record<string, string> = {
                                                'processing': 'En Preparación',
                                                'shipped': 'Enviado',
                                                'in_transit': 'En Tránsito',
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
                                                            {order.tracking_number && (
                                                                <p className="text-xs text-slate-500 font-mono mt-1">
                                                                    {order.tracking_number}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`inline-block px-2 py-1 text-xs font-medium border ${statusColors[order.shipping_status] || statusColors['processing']}`}>
                                                                {statusLabels[order.shipping_status] || 'Procesando'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span className="text-slate-300">
                                                                    {item.name} <span className="text-slate-500">(Talla {item.size})</span> x{item.quantity}
                                                                </span>
                                                                <span className="text-white">
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

                                                    <a
                                                        href={`/pedidos/${order.id}`}
                                                        className="mt-4 block w-full text-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                                                    >
                                                        Ver Seguimiento
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
