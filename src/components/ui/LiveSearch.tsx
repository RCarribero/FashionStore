import React, { useState, useEffect, useRef } from 'react';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function LiveSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    const saveSearch = (term: string) => {
        const saved = localStorage.getItem('recentSearches');
        let searches = saved ? JSON.parse(saved) : [];
        if (!searches.includes(term)) {
            searches = [term, ...searches].slice(0, 5);
            localStorage.setItem('recentSearches', JSON.stringify(searches));
            setRecentSearches(searches);
        }
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        // API now returns { products: [], categories: [] } or just products array (backwards compat check if needed, but we updated API)
                        // Actually I updated API to return { products, categories }
                        if (data.products) {
                            setResults(data.products);
                            setCategories(data.categories || []);
                        } else {
                            // Fallback if API hasn't deployed or something
                            setResults(Array.isArray(data) ? data : []);
                            setCategories([]);
                        }
                        setShowResults(true);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const close = () => {
        const container = document.getElementById('searchContainer');
        if (container) {
            container.classList.add('hidden');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query) {
            saveSearch(query);
            window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
        }
    };

    return (
        <div className="max-w-lg ml-auto bg-slate-900 border border-slate-700 shadow-2xl relative rounded-lg overflow-hidden">
            <form onSubmit={handleSearch} className="p-4 flex gap-2 border-b border-slate-800">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar productos..."
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent rounded transition-colors"
                    autoFocus
                    onFocus={() => setShowResults(true)}
                />
                <button
                    type="button"
                    onClick={close}
                    className="px-3 py-2 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </form>

            {isLoading && (
                <div className="p-4 text-center text-slate-500 text-sm">Buscando...</div>
            )}

            {showResults && !isLoading && (
                <div className="max-h-[60vh] overflow-y-auto">
                    {query.length < 2 ? (
                        /* Recent Searches View */
                        <div className="py-2">
                            {recentSearches.length > 0 && (
                                <>
                                    <h5 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Recientes
                                    </h5>
                                    {recentSearches.map((term, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setQuery(term);
                                                saveSearch(term);
                                                window.location.href = `/buscar?q=${encodeURIComponent(term)}`;
                                            }}
                                            className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3"
                                        >
                                            <span className="text-slate-500">🕒</span>
                                            {term}
                                        </button>
                                    ))}
                                </>
                            )}
                            <p className="px-4 py-4 text-xs text-slate-500 text-center">
                                Escribe al menos 2 caracteres para buscar
                            </p>
                        </div>
                    ) : (
                        /* Search Results View */
                        <div className="py-2">
                            {categories.length > 0 && (
                                <div className="mb-2 border-b border-slate-800 pb-2">
                                    <h5 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Categorías
                                    </h5>
                                    {categories.map(cat => (
                                        <a
                                            key={cat.id}
                                            href={`/categorias/${cat.slug}`}
                                            className="block px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-accent transition-colors"
                                        >
                                            {cat.name}
                                        </a>
                                    ))}
                                </div>
                            )}

                            {results.length > 0 && (
                                <>
                                    <h5 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Productos
                                    </h5>
                                    {results.map((product) => (
                                        <a
                                            key={product.id}
                                            href={`/productos/${product.slug}`}
                                            onClick={() => saveSearch(query)}
                                            className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors group"
                                        >
                                            <div className="w-12 h-12 bg-slate-800 rounded overflow-hidden flex-shrink-0">
                                                {product.images?.[0] && (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white group-hover:text-accent transition-colors">
                                                    {product.name}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    {(product.price / 100).toFixed(2)} EUR
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                    <a
                                        href={`/buscar?q=${encodeURIComponent(query)}`}
                                        onClick={() => saveSearch(query)}
                                        className="block text-center py-3 text-sm text-accent hover:underline border-t border-slate-800"
                                    >
                                        Ver todos los resultados
                                    </a>
                                </>
                            )}

                            {results.length === 0 && categories.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    No se encontraron resultados para "{query}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
