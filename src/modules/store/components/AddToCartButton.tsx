/**
 * AddToCartButton - React Island Component
 * Button for adding products to cart - Nike/JD/Adidas Style
 */

import { useState, useCallback } from 'react';
import { addToCart, openCart, closeCart } from '../stores/cart.store';
import type { Product } from '../../../shared/types';
import { STORE_CONFIG } from '../config';

interface ProductWithVariants extends Pick<Product, 'id' | 'name' | 'price' | 'images' | 'stock'> {
    variants?: { size: string; stock: number }[];
}

interface AddToCartButtonProps {
    product: ProductWithVariants;
    selectedSize?: string;
    quantity?: number;
    className?: string;
}

type ButtonState = 'idle' | 'adding' | 'added' | 'error';

export default function AddToCartButton({
    product,
    selectedSize,
    quantity = 1,
    className = '',
}: AddToCartButtonProps) {
    const [state, setState] = useState<ButtonState>('idle');
    const [size, setSize] = useState(selectedSize || '');
    const [stockWarning, setStockWarning] = useState<string | null>(null);

    // Get available sizes and stock from variants if available
    const availableSizes = product.variants?.length
        ? product.variants.map(v => v.size)
        : STORE_CONFIG.products.sizes;

    const getStockForSize = (s: string) => {
        if (!product.variants?.length) return product.stock;
        const variant = product.variants.find(v => v.size === s);
        return variant ? variant.stock : 0;
    };

    const currentStock = size ? getStockForSize(size) : (product.variants?.length ? 0 : product.stock);

    const handleAddToCart = useCallback(() => {
        if (!size) {
            setState('error');
            setTimeout(() => setState('idle'), 2000);
            return;
        }

        // Check specific stock
        if (getStockForSize(size) < quantity) {
            setStockWarning(`Solo quedan ${getStockForSize(size)} unidades de la talla ${size}`);
            setTimeout(() => setStockWarning(null), 3000);
            return;
        }

        setState('adding');

        try {
            const success = addToCart(product, size, quantity);

            if (success) {
                setState('added');
                // Open cart slide-over automatically
                openCart();
                // Auto-close after 2 seconds
                setTimeout(() => {
                    closeCart();
                }, 2000);
                setTimeout(() => setState('idle'), 2000);
            } else {
                setState('error');
                setTimeout(() => setState('idle'), 2000);
            }
        } catch {
            setState('error');
            setTimeout(() => setState('idle'), 2000);
        }
    }, [product, size, quantity]);

    // Check if we have stock (either generic or specific variant)
    const hasAnyStock = product.variants?.length
        ? product.variants.some(v => v.stock > 0)
        : product.stock > 0;

    const isDisabled = !hasAnyStock || (size && getStockForSize(size) === 0) || state === 'adding';

    const buttonText = {
        idle: 'Anadir al Carrito',
        adding: 'Anadiendo...',
        added: 'Anadido al Carrito',
        error: size ? 'Error' : 'Selecciona una Talla',
    }[state];

    return (
        <div className={className}>
            {/* Stock warning */}
            {stockWarning && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded text-sm">
                    {stockWarning}
                </div>
            )}
            {/* Size selector if not provided */}
            {!selectedSize && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-black uppercase tracking-wider">
                            Selecciona Talla
                        </label>
                        {size && product.variants?.length && (
                            <span className={`text-xs font-semibold ${getStockForSize(size) < 5 ? 'text-accent' : 'text-green-600'}`}>
                                {getStockForSize(size) < 5 ? `Solo quedan ${getStockForSize(size)}` : 'En stock'}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {availableSizes.map((s) => {
                            const stock = getStockForSize(s);
                            const isOutOfStock = stock === 0;
                            const isSelected = size === s;
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSize(s)}
                                    disabled={isOutOfStock}
                                    className={`
                                        relative py-3 text-sm font-semibold border-2 transition-all duration-200
                                        ${isSelected
                                            ? 'border-black bg-black text-white'
                                            : isOutOfStock
                                                ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                                                : 'border-slate-200 text-black hover:border-black'
                                        }
                                    `}
                                >
                                    {s}
                                    {isOutOfStock && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <span className="w-full h-px bg-slate-300 rotate-45 transform origin-center"></span>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Size Guide Link */}
                    <button
                        type="button"
                        className="mt-3 text-sm text-slate-500 hover:text-black underline underline-offset-2"
                    >
                        Guia de tallas
                    </button>
                </div>
            )}

            {/* Add to Cart Button */}
            <button
                type="button"
                onClick={handleAddToCart}
                disabled={isDisabled}
                className={`
                    w-full py-4 font-bold text-sm uppercase tracking-wider transition-all duration-300
                    flex items-center justify-center gap-3
                    ${!hasAnyStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : state === 'added'
                            ? 'bg-green-600 text-white'
                            : state === 'error'
                                ? 'bg-accent text-white'
                                : isDisabled
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-black hover:bg-accent text-white'
                    }
                `}
            >
                {state === 'adding' ? (
                    <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Anadiendo...
                    </>
                ) : state === 'added' ? (
                    <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Anadido al Carrito
                    </>
                ) : !hasAnyStock ? (
                    'Agotado'
                ) : (
                    <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {buttonText}
                    </>
                )}
            </button>

            {/* Wishlist Button */}
            <button
                type="button"
                className="w-full mt-3 py-3 border-2 border-slate-200 text-black font-semibold text-sm uppercase tracking-wider hover:border-black transition-colors flex items-center justify-center gap-2"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                Guardar
            </button>
        </div>
    );
}
