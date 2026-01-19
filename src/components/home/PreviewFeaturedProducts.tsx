
import { useEffect, useState } from 'react';
import { ROUTES } from "../../../../../config";
import { getHomepageFeatured } from "../../../services/catalog.service";
import { formatPrice } from "../../../../../shared/utils";

export const PreviewFeaturedProducts = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHomepageFeatured(4).then(({ data }) => {
            setProducts(data || []);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="h-96 flex items-center justify-center bg-slate-50">Cargando destacados...</div>;
    if (!products.length) return null;

    return (
        <section className="py-16 lg:py-24 bg-slate-50 pointer-events-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
                    <div>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-black mb-4">
                            DESTACADOS
                        </h2>
                        <p className="text-slate-600 text-lg max-w-xl">
                            Los mas vendidos de la temporada
                        </p>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {products.map((product, index) => (
                        <div
                            key={product.id}
                            className="group bg-white overflow-hidden"
                        >
                            {/* Image */}
                            <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                                {product.images[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* New Badge */}
                                {index < 2 && (
                                    <span className="absolute top-3 left-3 px-3 py-1 bg-accent text-white text-xs font-bold uppercase tracking-wider">
                                        Nuevo
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-black line-clamp-1">
                                    {product.name}
                                </h3>
                                <div className="mt-2">
                                    <p className="font-bold text-lg text-black">
                                        {formatPrice(product.price)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
