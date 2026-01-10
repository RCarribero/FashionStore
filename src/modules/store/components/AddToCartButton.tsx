/**
 * AddToCartButton - React Island Component
 * Button for adding products to cart with state feedback
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
            alert(`Solo quedan ${getStockForSize(size)} unidades de la talla ${size}`);
            return;
        }

        setState('adding');

        try {
            const success = addToCart(product, size, quantity);

            if (success) {
                setState('added');
                // Open cart slide-over automatically
                openCart();
                // Auto-close after 1 second + transition time
                setTimeout(() => {
                    closeCart();
                }, 2000); // 1s wait + time for user to see it
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
        idle: 'Anadir al carrito',
        adding: 'Anadiendo...',
        added: 'Anadido',
        error: size ? 'Error' : 'Selecciona talla',
    }[state];

    return (
        <div className={className}>
            {/* Size selector if not provided */}
            {!selectedSize && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                        Talla
                        {size && product.variants?.length && (
                            <span className={`ml-2 text-xs ${getStockForSize(size) < 5 ? 'text-red-500' : 'text-green-600'}`}>
                                {getStockForSize(size)} disponibles
                            </span>
                        )}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {availableSizes.map((s) => {
                            const stock = getStockForSize(s);
                            const isOutOfStock = stock === 0;
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSize(s)}
                                    disabled={isOutOfStock}
                                    className={`px-4 py-2 text-sm font-medium border transition-colors ${size === s
                                        ? 'border-navy-900 bg-navy-900 text-cream-50'
                                        : isOutOfStock
                                            ? 'border-charcoal-100 text-charcoal-300 cursor-not-allowed bg-charcoal-50 decoration-slate-400 line-through'
                                            : 'border-charcoal-200 text-charcoal-700 hover:border-charcoal-400'
                                        }`}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={handleAddToCart}
                disabled={isDisabled}
                className={`btn-primary w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${state === 'added' ? 'bg-green-600' : ''
                    } ${state === 'error' ? 'bg-red-600' : ''}`}
            >
                {!hasAnyStock ? 'Agotado' : buttonText}
            </button>
        </div>
    );
}
