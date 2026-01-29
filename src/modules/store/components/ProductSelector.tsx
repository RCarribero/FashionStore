import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $isCartOpen, addToCart, openCart } from '../stores/cart.store';
import type { Product } from '../../../shared/types';

interface Variant {
    id: string;
    product_id: string;
    size: string;
    stock: number;
}

interface ProductSelectorProps {
    product: Product;
    variants: Variant[];
}

export default function ProductSelector({ product, variants }: ProductSelectorProps) {
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const selectedVariant = variants.find(v => v.id === selectedVariantId);

    // Sort sizes logically: XS, S, M, L, XL, XXL
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const sortedVariants = [...variants].sort((a, b) => {
        return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
    });

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        setIsAdding(true);
        try {
            // Construct product object with variants for cart stock validation
            const productForCart = {
                ...product,
                variants: variants.map(v => ({ size: v.size, stock: v.stock }))
            };

            const success = addToCart(productForCart, selectedVariant.size, 1);

            if (success) {
                openCart();
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Size Selector */}
            <div>
                <h3 className="text-sm font-medium text-slate-200 mb-3">Selecciona tu talla</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {sortedVariants.map((variant) => (
                        <button
                            key={variant.id}
                            onClick={() => setSelectedVariantId(variant.id)}
                            disabled={variant.stock === 0}
                            className={`
                            py-3 px-2 text-sm font-bold rounded-md border transition-all duration-200
                                ${selectedVariantId === variant.id
                                    ? 'bg-white text-black border-white ring-2 ring-offset-2 ring-offset-slate-950 ring-white'
                                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                                }
                                ${variant.stock === 0 ? 'opacity-40 cursor-not-allowed decoration-slice' : ''}
                            `}
                        >
                            {/* Heuristic: If size is numeric (2 digits), treat as shoe size (e.g. 39 -> Talla 39) */}
                            {/^\d{2}$/.test(variant.size) || product?.category?.slug?.includes('zapatillas') || product?.category?.slug?.includes('calzado')
                                ? `Talla ${variant.size}`
                                : variant.size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price and Stock Status */}
            <div className="flex items-end justify-between border-t border-slate-800 pt-6">
                <div>
                    {selectedVariant ? (
                        <div className="space-y-1">
                            {selectedVariant.stock > 0 ? (
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-sm font-medium">
                                        {selectedVariant.stock} disponibles
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-400">
                                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                    <span className="text-sm font-medium">Agotado en esta talla</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">Selecciona una talla para ver stock</p>
                    )}
                </div>
            </div>

            {/* Add to Cart Button */}
            <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0 || isAdding}
                className={`
                    w-full py-4 px-8 flex items-center justify-center gap-2 text-base font-bold uppercase tracking-wide rounded-lg transition-all
                    ${!selectedVariant || selectedVariant.stock === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-slate-200 active:scale-[0.98]'
                    }
                `}
            >
                {isAdding ? (
                    'Añadiendo...'
                ) : !selectedVariant ? (
                    'Selecciona Talla'
                ) : selectedVariant.stock === 0 ? (
                    'Sin Stock'
                ) : (
                    <>
                        <span>Añadir al Carrito</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </>
                )}
            </button>
        </div>
    );
}
