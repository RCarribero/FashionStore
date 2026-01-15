import React from 'react';
import { motion } from 'framer-motion';

interface Category {
    slug: string;
    name: string;
    image?: string;
}

interface FeaturedCategoriesProps {
    categories: Category[];
}

// Fallback images for categories that don't have an image set in DB
const fallbackImages: Record<string, string> = {
    'zapatillas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292616/fashionstore/categories/zapatillas.webp',
    'sudaderas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292618/fashionstore/categories/sudaderas.webp',
    'pantalones': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292619/fashionstore/categories/pantalones.webp',
    'camisetas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292621/fashionstore/categories/camisetas.webp',
    'chaquetas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292621/fashionstore/categories/chaquetas.webp'
};

export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ categories }) => {
    return (
        <section className="py-16 lg:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12 lg:mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="font-display text-4xl lg:text-5xl font-bold text-black mb-4"
                    >
                        CATEGORIAS
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-slate-600 text-lg max-w-2xl mx-auto"
                    >
                        Explora nuestra seleccion de ropa premium por categoria
                    </motion.p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {categories?.map((category, index) => {
                        const isLarge = index === 0;
                        // Use DB image first, then fallback
                        const categoryImage = category.image || fallbackImages[category.slug];

                        return (
                            <motion.a
                                key={category.slug}
                                href={`/categoria/${category.slug}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative overflow-hidden ${isLarge ? 'md:row-span-2' : ''}`}
                                style={{ minHeight: isLarge ? '600px' : '290px' }}
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0 bg-slate-200">
                                    {categoryImage ? (
                                        <img
                                            src={categoryImage}
                                            alt={category.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400"></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                </div>

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                                    <h3 className="font-display text-2xl lg:text-3xl font-bold text-white group-hover:text-accent transition-colors duration-300">
                                        {category.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-3 text-white/80 group-hover:text-white transition-colors">
                                        <span className="text-sm font-medium uppercase tracking-wider">Ver productos</span>
                                        <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
