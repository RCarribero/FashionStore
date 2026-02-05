import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ROUTES } from '../../../config/routes';

interface Article {
    id: string;
    title: string;
    slug: string;
    published_at: string | null;
    created_at: string;
}

export default function EditorialList() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('id, title, slug, published_at, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setArticles(data || []);
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este artículo?')) return;

        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setArticles(articles.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Error al eliminar artículo');
        }
    };

    if (loading) return <div className="text-white">Cargando artículos...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Artículos Publicados</h2>
                <a
                    href={ROUTES.ADMIN.EDITORIAL.NEW}
                    className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
                >
                    Nuevo Artículo
                </a>
            </div>

            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Título</th>
                            <th className="px-6 py-4">Slug</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {articles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No hay artículos creados aún.
                                </td>
                            </tr>
                        ) : (
                            articles.map((article) => (
                                <tr key={article.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{article.title}</td>
                                    <td className="px-6 py-4">{article.slug}</td>
                                    <td className="px-6 py-4">
                                        {article.published_at ? (
                                            <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs">Publicado</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs">Borrador</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(article.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <a
                                            href={ROUTES.ADMIN.EDITORIAL.EDIT(article.id)}
                                            className="text-accent hover:text-white transition-colors"
                                        >
                                            Editar
                                        </a>
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="text-red-500 hover:text-red-400 transition-colors"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
