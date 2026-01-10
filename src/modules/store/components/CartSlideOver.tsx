/**
 * CartSlideOver - React Island Component
 * Slide-over panel showing cart contents
 */

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
    $cart,
    $cartCount,
    $cartTotal,
    $isCartEmpty,
    $isCartOpen,
    openCart,
    closeCart,
    removeFromCart,
    updateQuantity,
} from '../stores/cart.store';
import { formatPrice } from '../../../shared/utils';
import type { CartItem } from '../../../shared/types';
import { ROUTES } from '../../../config';

interface CartSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartSlideOver({ isOpen, onClose }: CartSlideOverProps) {
    const cart = useStore($cart);
    const cartCount = useStore($cartCount);
    const cartTotal = useStore($cartTotal);
    const isEmpty = useStore($isCartEmpty);

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

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{ height: '100vh', zIndex: 100 }} // Increased z-index
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-navy-950/40 backdrop-blur-sm transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`absolute top-0 right-0 w-full max-w-md bg-white shadow-xl transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-charcoal-100" style={{ flexShrink: 0 }}>
                    <h2 className="font-display text-xl text-navy-900">
                        Tu Carrito
                        {cartCount > 0 && (
                            <span className="ml-2 text-charcoal-500 font-body text-sm font-normal">
                                ({cartCount})
                            </span>
                        )}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 -m-2 text-charcoal-400 hover:text-charcoal-600"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Scrollable area for cart items */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {isEmpty ? (
                        <EmptyCart onClose={onClose} />
                    ) : (
                        <ul className="divide-y divide-charcoal-100">
                            {cart.items.map((item) => (
                                <CartItemRow key={`${item.productId}-${item.size}`} item={item} />
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer - Fixed at bottom */}
                {!isEmpty && (
                    <CartFooter cart={cart} cartTotal={cartTotal} onClose={onClose} />
                )}
            </div>
        </div>
    );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <svg className="h-16 w-16 text-charcoal-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="font-display text-lg text-navy-900 mb-2">Tu carrito esta vacio</h3>
            <p className="text-charcoal-500 mb-8">Explora nuestra coleccion</p>
            <button type="button" onClick={onClose} className="btn-primary">
                Ver productos
            </button>
        </div>
    );
}

function CartItemRow({ item }: { item: CartItem }) {
    const handleQuantityChange = useCallback((qty: number) => {
        updateQuantity(item.productId, item.size, qty);
    }, [item.productId, item.size]);

    const handleRemove = useCallback(() => {
        removeFromCart(item.productId, item.size);
    }, [item.productId, item.size]);

    return (
        <li className="flex px-6 py-6">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden bg-charcoal-100">
                {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-charcoal-300">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="ml-4 flex flex-1 flex-col">
                <div className="flex justify-between">
                    <div>
                        <h4 className="text-sm font-medium text-navy-900">{item.productName}</h4>
                        <p className="mt-1 text-sm text-charcoal-500">Talla: {item.size}</p>
                    </div>
                    <p className="text-sm font-medium text-navy-900">
                        {formatPrice(item.price * item.quantity)}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-charcoal-200">
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(item.quantity - 1)}
                            className="px-3 py-1 text-charcoal-600 hover:text-navy-900"
                        >
                            -
                        </button>
                        <span className="px-4 py-1 text-sm text-navy-900">{item.quantity}</span>
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(item.quantity + 1)}
                            className="px-3 py-1 text-charcoal-600 hover:text-navy-900"
                        >
                            +
                        </button>
                    </div>
                    <button type="button" onClick={handleRemove} className="text-sm text-charcoal-500 hover:text-red-600">
                        Eliminar
                    </button>
                </div>
            </div>
        </li>
    );
}

/**
 * Cart Footer with checkout button
 */
function CartFooter({ cart, cartTotal, onClose }: { cart: { items: CartItem[] }; cartTotal: number; onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart.items }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Error al procesar el pago');
                setLoading(false);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error al procesar el pago');
            setLoading(false);
        }
    };

    return (
        <div className="border-t border-charcoal-100 px-6 py-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-charcoal-600">Subtotal</span>
                <span className="text-lg font-medium text-navy-900">
                    {formatPrice(cartTotal)}
                </span>
            </div>
            <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className={`btn-primary w-full text-center ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
                {loading ? 'Procesando...' : 'Pagar con Stripe'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost w-full mt-3">
                Continuar comprando
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

    return (
        <>
            <button
                type="button"
                onClick={() => openCart()}
                className="relative p-2 text-charcoal-600 hover:text-navy-900"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-medium text-white bg-navy-900 rounded-full">
                        {cartCount > 9 ? '9+' : cartCount}
                    </span>
                )}
            </button>
            <CartSlideOver isOpen={isCartOpen} onClose={() => closeCart()} />
        </>
    );
}

