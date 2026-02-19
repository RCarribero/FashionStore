/**
 * CartSlideOver - React Island Component
 * Slide-over panel showing cart contents - Nike/JD/Adidas Style
 */

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
    $cart,
    $cartCount,
    $cartTotal,
    $isCartEmpty,
    $isCartOpen,
    $coupon,
    $cartExpiresAt,
    setCoupon,
    clearCoupon,
    openCart,
    closeCart,
    removeFromCart,
    updateQuantity,
    checkAutomaticPromotions,
    checkCartExpiration
} from '../stores/cart.store';
import { formatPrice } from '../../../shared/utils';
import type { CartItem } from '../../../shared/types';
import { ROUTES } from '../../../config';

interface CartSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Hook that returns a formatted mm:ss countdown string until expiresAt timestamp.
 * Returns null if no active reservation.
 */
function useReservationCountdown(): string | null {
    const expiresAt = useStore($cartExpiresAt);
    const isEmpty = useStore($isCartEmpty);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    useEffect(() => {
        if (!expiresAt || isEmpty) {
            setTimeLeft(null);
            return;
        }

        function compute() {
            const remaining = expiresAt - Date.now();
            if (remaining <= 0) {
                setTimeLeft(null);
                return;
            }
            const totalSeconds = Math.floor(remaining / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }

        compute();
        const interval = setInterval(compute, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, isEmpty]);

    return timeLeft;
}

export default function CartSlideOver({ isOpen, onClose }: CartSlideOverProps) {
    const cart = useStore($cart);
    const cartCount = useStore($cartCount);
    const cartTotal = useStore($cartTotal);
    const isEmpty = useStore($isCartEmpty);
    const [isMounted, setIsMounted] = useState(false);
    const countdown = useReservationCountdown();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Check for automatic promotions when cart opens or total changes
    useEffect(() => {
        if (isOpen && isMounted) {
            checkAutomaticPromotions();
        }
    }, [isOpen, cartTotal, isMounted]);

    // Check for cart expiration periodically (hidden from user)
    useEffect(() => {
        if (!isMounted) return;

        const interval = setInterval(() => {
            const expired = checkCartExpiration();
            if (expired) {
                // Cart was cleared due to expiration
                console.log('Cart expired - items cleared');
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [isMounted]);

    // Derived state that matches server (empty) until mounted
    const effectiveCartCount = isMounted ? cartCount : 0;
    const effectiveIsEmpty = isMounted ? isEmpty : true;
    const effectiveCartTotal = isMounted ? cartTotal : 0;
    const effectiveItems = isMounted ? cart.items : [];

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{ height: '100vh', zIndex: 100 }}
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`absolute top-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-black text-white" style={{ flexShrink: 0 }}>
                    <h2 className="font-bold text-lg uppercase tracking-wider">
                        Tu Carrito
                        {effectiveCartCount > 0 && (
                            <span className="ml-2 text-accent">
                                ({effectiveCartCount})
                            </span>
                        )}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 -m-2 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Reservation Countdown Timer */}
                {!effectiveIsEmpty && isMounted && countdown && (
                    <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-amber-800 font-medium">
                            Reserva expira en{' '}
                            <span className="font-bold tabular-nums">{countdown}</span>
                            {' '}&mdash; completa tu pedido antes de que otro lo tome
                        </p>
                    </div>
                )}

                {/* Free Shipping Banner */}
                {!effectiveIsEmpty && effectiveCartTotal < 10000 && (
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-sm">
                            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25" />
                            </svg>
                            <span className="text-slate-600">
                                Te faltan <span className="font-bold text-black">{formatPrice(10000 - effectiveCartTotal)}</span> para envio gratis
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent transition-all duration-500"
                                style={{ width: `${Math.min((effectiveCartTotal / 10000) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Content - Scrollable area for cart items */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {effectiveIsEmpty ? (
                        <EmptyCart onClose={onClose} />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {effectiveItems.map((item) => (
                                <CartItemRow key={`${item.productId}-${item.size}`} item={item} />
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer - Fixed at bottom */}
                {!effectiveIsEmpty && (
                    <CartFooter cart={{ items: effectiveItems }} cartTotal={effectiveCartTotal} onClose={onClose} />
                )}
            </div>
        </div>
    );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            </div>
            <h3 className="font-bold text-xl text-black mb-2 uppercase tracking-wider">Carrito Vacio</h3>
            <p className="text-slate-500 mb-8">Anade productos para empezar</p>
            <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 bg-black hover:bg-accent text-white font-bold text-sm uppercase tracking-wider transition-colors"
            >
                Ver Productos
            </button>
        </div>
    );
}

function CartItemRow({ item }: { item: CartItem }) {
    const isAtStockLimit = item.quantity >= item.availableStock;

    const handleQuantityChange = useCallback((qty: number) => {
        const success = updateQuantity(item.productId, item.size, qty);
        if (success) {
            checkAutomaticPromotions();
        }
    }, [item.productId, item.size]);

    const handleRemove = useCallback(() => {
        removeFromCart(item.productId, item.size);
    }, [item.productId, item.size]);

    return (
        <li className="flex px-6 py-5 gap-4 hover:bg-slate-50 transition-colors">
            <div className="h-24 w-20 flex-shrink-0 overflow-hidden bg-slate-100">
                {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col">
                <div className="flex justify-between">
                    <div>
                        <h4 className="text-sm font-semibold text-black uppercase tracking-wide line-clamp-1">{item.productName}</h4>
                        <p className="mt-1 text-sm text-slate-500">Talla: <span className="text-black font-medium">{item.size}</span></p>
                    </div>
                    <p className="text-sm font-bold text-black">
                        {formatPrice(item.price * item.quantity)}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-slate-200">
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-sm font-semibold text-black">{item.quantity}</span>
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(item.quantity + 1)}
                            disabled={isAtStockLimit}
                            className={`w-8 h-8 flex items-center justify-center transition-colors ${isAtStockLimit
                                ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            title={isAtStockLimit ? 'Stock maximo alcanzado' : ''}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAtStockLimit && (
                            <span className="text-xs text-amber-600 font-medium">Max stock</span>
                        )}
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="text-sm text-slate-400 hover:text-accent transition-colors uppercase tracking-wide font-medium"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </li>
    );
}

/**
 * Cart Footer with checkout button and coupon input
 */
function CartFooter({ cart, cartTotal, onClose }: { cart: { items: CartItem[] }; cartTotal: number; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCodeLocal] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    const appliedCoupon = useStore($coupon);

    // Revalidate coupon when cart items change
    useEffect(() => {
        if (appliedCoupon && !appliedCoupon.is_automatic) {
            revalidateCoupon();
        }
    }, [cart.items.length, cartTotal]);

    const revalidateCoupon = async () => {
        const currentCoupon = $coupon.get();
        if (!currentCoupon || currentCoupon.is_automatic) return;

        try {
            const cartItems = cart.items.map(item => ({
                productId: item.productId,
                price: item.price,
                quantity: item.quantity
            }));

            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: currentCoupon.code,
                    purchaseAmount: cartTotal,
                    cartItems
                })
            });

            const data = await res.json();

            if (data.valid) {
                setCoupon({
                    code: data.coupon.code,
                    discount_type: data.coupon.discount_type,
                    discount_value: data.coupon.discount_value,
                    discountAmount: data.discountAmount,
                    id: data.coupon.id
                });
            } else {
                clearCoupon();
            }
        } catch (error) {
            console.error('Coupon revalidation failed:', error);
            // If validation fails (e.g. network error, server error), better to clear potential invalid coupon
            clearCoupon();
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError('');

        try {
            const cartItems = cart.items.map(item => ({
                productId: item.productId,
                price: item.price,
                quantity: item.quantity
            }));

            // Get userId - REQUIRED for coupon application
            let userId;
            try {
                const { getCurrentUser } = await import('../../auth/services/auth-client.service');
                const user = await getCurrentUser();
                userId = user?.id;
            } catch (e) {
                // User not logged in
            }

            // Require authentication for coupon usage
            if (!userId) {
                setCouponError('Debes iniciar sesion para usar cupones');
                setCouponLoading(false);
                return;
            }

            // Parse multiple codes (comma or space separated)
            const codes = couponCode
                .split(/[,\s]+/)
                .map(c => c.trim())
                .filter(c => c.length > 0);

            // Use validate-best if multiple codes, otherwise use regular validate
            const endpoint = codes.length > 1 ? '/api/coupons/validate-best' : '/api/coupons/validate';
            const bodyData = codes.length > 1
                ? { codes, purchaseAmount: cartTotal, cartItems, userId }
                : { code: codes[0], purchaseAmount: cartTotal, cartItems, userId };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const data = await res.json();

            if (data.valid) {
                setCoupon({
                    code: data.coupon.code,
                    discount_type: data.coupon.discount_type,
                    discount_value: data.coupon.discount_value,
                    discountAmount: data.discountAmount,
                    id: data.coupon.id
                });
                setCouponCodeLocal('');
                // If multiple codes were entered, show which one was applied
                if (codes.length > 1) {
                    setCouponError(`Aplicado el mejor cupon: ${data.coupon.code}`);
                    setTimeout(() => setCouponError(''), 3000);
                }
            } else {
                setCouponError(data.error || 'Cupon no valido');
                clearCoupon();
            }
        } catch (error) {
            setCouponError('Error al validar cupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        clearCoupon();
        setCouponCodeLocal('');
        setCouponError('');
    };

    const handleCheckout = () => {
        setLoading(true);
        window.location.href = '/checkout';
    };

    const discountAmount = appliedCoupon?.discountAmount || 0;
    const shippingCost = cartTotal >= 10000 ? 0 : 599;
    const finalTotal = cartTotal - discountAmount + shippingCost;

    return (
        <div className="border-t border-slate-200 px-6 py-6 bg-white" style={{ flexShrink: 0 }}>
            {/* Coupon Input */}
            <div className="mb-4">
                {!appliedCoupon ? (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCodeLocal(e.target.value.toUpperCase())}
                                placeholder="Codigo(s) de cupon"
                                className="flex-1 px-3 py-2 border border-slate-200 text-sm font-mono uppercase text-black"
                            />
                            <button
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={couponLoading || !couponCode.trim()}
                                className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {couponLoading ? '...' : 'Aplicar'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">Puedes introducir varios codigos separados por coma</p>
                    </div>
                ) : (
                    <div className={`flex items-center justify-between border px-3 py-2 rounded ${appliedCoupon.is_automatic ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-center gap-2">
                            <svg className={`w-4 h-4 ${appliedCoupon.is_automatic ? 'text-blue-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${appliedCoupon.is_automatic ? 'text-blue-800' : 'text-green-800 font-mono'}`}>
                                    {appliedCoupon.is_automatic ? (appliedCoupon.public_title || 'Oferta Especial') : appliedCoupon.code}
                                </span>
                                <span className={`text-xs ${appliedCoupon.is_automatic ? 'text-blue-600' : 'text-green-600'}`}>
                                    -{appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : formatPrice(appliedCoupon.discount_value)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-slate-400 hover:text-red-500 text-sm"
                            title={appliedCoupon.is_automatic ? "Quitar oferta" : "Quitar cupon"}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                {couponError && (
                    <p className="text-red-500 text-xs mt-1">{couponError}</p>
                )}
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-black">{formatPrice(cartTotal)}</span>
                </div>
                {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Descuento</span>
                        <span className="font-semibold text-green-600">-{formatPrice(discountAmount)}</span>
                    </div>
                )}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Envio</span>
                    <span className={`font-semibold ${shippingCost === 0 ? 'text-green-600' : 'text-black'}`}>
                        {shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost)}
                    </span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-black uppercase tracking-wider">Total</span>
                    <span className="text-xl font-bold text-black">
                        {formatPrice(finalTotal)}
                    </span>
                </div>
            </div>
            <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full py-4 bg-accent hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-all ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                    </span>
                ) : (
                    'Finalizar Compra'
                )}
            </button>
            <button
                type="button"
                onClick={onClose}
                className="w-full mt-3 py-3 border-2 border-black text-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
            >
                Seguir Comprando
            </button>
        </div>
    );
}

/**
 * Cart trigger button for header
 */
export function CartTrigger() {
    const cartCount = useStore($cartCount);
    const isCartOpen = useStore($isCartOpen);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const displayCount = isMounted ? cartCount : 0;

    return (
        <>
            <button
                type="button"
                onClick={() => openCart()}
                className="relative p-2 lg:p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all duration-200"
            >
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {displayCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-accent rounded-full">
                        {displayCount > 9 ? '9+' : displayCount}
                    </span>
                )}
            </button>
            <CartSlideOver isOpen={isCartOpen} onClose={() => closeCart()} />
        </>
    );
}
