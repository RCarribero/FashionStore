import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $cart, $cartTotal, $coupon } from '../../store/stores/cart.store';
import { formatPrice } from '../../../shared/utils';
import { getCurrentUser, supabase } from '../../auth/services/auth-client.service';

export default function OrderSummary() {
    const cart = useStore($cart);
    const cartTotal = useStore($cartTotal);
    const appliedCoupon = useStore($coupon);
    const [isMounted, setIsMounted] = useState(false);
    const [isFirstPurchase, setIsFirstPurchase] = useState(false);
    const [checkingDiscount, setCheckingDiscount] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        checkFirstPurchase();
    }, []);

    const checkFirstPurchase = async () => {
        try {
            const user = await getCurrentUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('has_made_purchase')
                    .eq('id', user.id)
                    .single();

                // If profile exists and has_made_purchase is false, it's first purchase
                if (profile && profile.has_made_purchase === false) {
                    setIsFirstPurchase(true);
                }
                // If no profile found (new user), treat as first purchase
                if (!profile) {
                    setIsFirstPurchase(true);
                }
            }
        } catch (error) {
            console.error('Error checking first purchase:', error);
        } finally {
            setCheckingDiscount(false);
        }
    };

    // Logic duplicated from CartSlideOver (could be shared, but simple enough to repeat for now)
    const FREE_SHIPPING_THRESHOLD = 10000;
    const SHIPPING_COST = 599;
    const shipping = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    // Calculate discount on TOTAL (subtotal + shipping)
    const subtotalWithShipping = cartTotal + shipping;

    // Determine effective discount
    let discountAmount = 0;
    let discountLabel = '';

    if (appliedCoupon) {
        discountAmount = appliedCoupon.discountAmount;
        discountLabel = appliedCoupon.is_automatic
            ? `Promocion (${appliedCoupon.public_title})`
            : `Cupon (${appliedCoupon.code})`;
    } else if (isFirstPurchase) {
        discountAmount = Math.round(subtotalWithShipping * 0.20);
        discountLabel = '20% OFF - Primera Compra';
    }

    const total = subtotalWithShipping - discountAmount;

    if (!isMounted) {
        return <div className="bg-slate-900 rounded-lg p-6 border border-slate-800 animate-pulse h-64"></div>;
    }

    return (
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Resumen del Pedido</h2>

            {/* First Purchase Banner - Only show if using first purchase discount */}
            {isFirstPurchase && !appliedCoupon && !checkingDiscount && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        <span className="font-medium">20% OFF - Primera Compra</span>
                    </div>
                </div>
            )}

            {/* Coupon Banner */}
            {appliedCoupon && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Cupon Aplicado: {appliedCoupon.code}</span>
                    </div>
                    <p className="text-xs text-green-500/80 mt-1 pl-7">
                        Ahorras {formatPrice(appliedCoupon.discountAmount)}
                    </p>
                </div>
            )}

            <div className="space-y-4 mb-6">
                <ul className="divide-y divide-slate-800">
                    {cart.items.map((item) => (
                        <li key={`${item.productId}-${item.size}`} className="flex py-4 gap-4">
                            <div className="h-16 w-16 bg-slate-800 rounded overflow-hidden flex-shrink-0">
                                {item.productImage && (
                                    <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-white line-clamp-1">{item.productName}</h3>
                                <p className="text-sm text-slate-400">Talla: {item.size}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-slate-500">Cant: {item.quantity}</p>
                                    <p className="text-sm font-medium text-white">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-slate-400 text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                </div>

                <div className="flex justify-between text-slate-400 text-sm">
                    <span>Envío</span>
                    <span className={shipping === 0 ? 'text-emerald-400' : ''}>
                        {shipping === 0 ? 'GRATIS' : formatPrice(shipping)}
                    </span>
                </div>

                {/* Discount Line */}
                {(discountAmount > 0) && (
                    <div className="flex justify-between text-green-400 text-sm">
                        <span>{discountLabel}</span>
                        <span>-{formatPrice(discountAmount)}</span>
                    </div>
                )}

                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-800 mt-2">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                </div>
            </div>
        </div>
    );
}
