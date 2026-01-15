import React from 'react';
import { motion } from 'framer-motion';

// Helper to format price inline since we can't easily import from Astro utils in React without some setup
const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

interface Product {
    slug: string;
    name: string;
    price: number;
    discountedPrice?: number | null;
    images: string[];
}

interface TrendingProductsProps {
    products: Product[];
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({ products }) => {
    if (!products || products.length === 0) return null;

    return (
        <section className="py-16 lg:py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="font-display text-4xl lg:text-5xl font-bold text-black mb-4"
                        >
                            DESTACADOS
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-600 text-lg max-w-xl"
                        >
                            Los más vendidos de la temporada
                        </motion.p>
                    </div>
                    <motion.a
                        href="/productos"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 mt-6 lg:mt-0 text-black font-semibold uppercase tracking-wider hover:text-accent transition-colors group"
                    >
                        Ver Todo
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                    </motion.a>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {products.map((product, index) => (
                        <motion.a
                            key={product.slug}
                            href={`/productos/${product.slug}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            {/* Image */}
                            <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                                {product.images[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Quick View Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                    <span className="px-6 py-3 bg-white text-black font-bold text-sm uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 text-center">
                                        Ver Producto
                                    </span>
                                </div>

                                {/* New Badge */}
                                {index < 2 && (
                                    <span className="absolute top-3 left-3 px-3 py-1 bg-accent text-white text-xs font-bold uppercase tracking-wider">
                                        Nuevo
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-black group-hover:text-accent transition-colors duration-200 line-clamp-1">
                                    {product.name}
                                </h3>
                                <div className="mt-2">
                                    {product.discountedPrice ? (
                                        <>
                                            <p className="text-slate-400 line-through text-sm">
                                                {formatPrice(product.price)}
                                            </p>
                                            <p className="font-bold text-lg text-accent">
                                                {formatPrice(product.discountedPrice)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-bold text-lg text-black">
                                            {formatPrice(product.price)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
};
