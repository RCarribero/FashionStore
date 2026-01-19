
import { useEffect, useState } from 'react';
import { ROUTES } from "../../../../../config";
import { getCatalogCategories } from "../../../services/catalog.service";

// Fallback images for categories that don't have an image set in DB
const fallbackImages: Record<string, string> = {
    'zapatillas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292616/fashionstore/categories/zapatillas.webp',
    'sudaderas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292618/fashionstore/categories/sudaderas.webp',
    'pantalones': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292619/fashionstore/categories/pantalones.webp',
    'camisetas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292621/fashionstore/categories/camisetas.webp',
    'chaquetas': 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292621/fashionstore/categories/chaquetas.webp'
};

export const PreviewCategoriesGrid = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCatalogCategories().then(({ data }) => {
            setCategories(data || []);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="h-96 flex items-center justify-center bg-slate-100">Cargando categorias...</div>;

    return (
        <section className="py-16 lg:py-24 bg-white pointer-events-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12 lg:mb-16">
                    <h2 className="font-display text-4xl lg:text-5xl font-bold text-black mb-4">
                        CATEGORIAS
                    </h2>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Explora nuestra seleccion de ropa premium por categoria
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {categories.map((category, index) => {
                        const categoryImage = category.image || fallbackImages[category.slug];

                        return (
                            <div
                                key={category.id}
                                className={`group relative overflow-hidden ${index === 0 ? 'md:row-span-2' : ''}`}
                                style={{ minHeight: index === 0 ? '600px' : '290px' }}
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0 bg-slate-200">
                                    {categoryImage ? (
                                        <img
                                            src={categoryImage}
                                            alt={category.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400"></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                </div>

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                                    <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-2">
                                        {category.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-white/80">
                                        <span className="text-sm font-medium uppercase tracking-wider">Ver productos</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
