import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface EditorProps {
    articleId?: string;
}

interface Block {
    id: string;
    type: 'text' | 'image' | 'product';
    data: any;
}

export default function EditorialEditor({ articleId }: EditorProps) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [published, setPublished] = useState(false);
    const [loading, setLoading] = useState(false);

    const supabase = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );

    useEffect(() => {
        if (articleId) {
            loadArticle();
        }
    }, [articleId]);

    const loadArticle = async () => {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', articleId)
            .single();

        if (data) {
            setTitle(data.title);
            setSlug(data.slug);
            setExcerpt(data.excerpt || '');
            setBlocks(data.content || []);
            setPublished(!!data.published_at);
        }
    };

    const addBlock = (type: 'text' | 'image' | 'product') => {
        const newBlock: Block = {
            id: crypto.randomUUID(),
            type,
            data: type === 'text' ? { content: '' } : type === 'image' ? { url: '', caption: '' } : { productId: '' }
        };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id: string, data: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...data } } : b));
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                title,
                slug: slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
                excerpt,
                content: blocks,
                published_at: published ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            };

            if (articleId) {
                await supabase.from('articles').update(payload).eq('id', articleId);
            } else {
                await supabase.from('articles').insert([payload]);
            }
            window.location.href = '/gestion-fm/editorial';
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4 bg-slate-900 p-6 rounded-lg border border-slate-800">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-accent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Slug (URL)</label>
                    <input
                        type="text"
                        value={slug}
                        onChange={e => setSlug(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-slate-300 focus:outline-none focus:border-accent text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Extracto</label>
                    <textarea
                        value={excerpt}
                        onChange={e => setExcerpt(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-slate-300 focus:outline-none focus:border-accent h-24"
                    />
                </div>
            </div>

            <div className="space-y-6">
                {blocks.map((block, index) => (
                    <div key={block.id} className="relative group bg-slate-900 border border-slate-800 rounded-lg p-6">
                        <button
                            onClick={() => removeBlock(block.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-2"
                        >
                            ✕
                        </button>

                        {block.type === 'text' && (
                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-2 font-bold">Bloque de Texto</label>
                                <textarea
                                    value={block.data.content}
                                    onChange={e => updateBlock(block.id, { content: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-3 text-white focus:outline-none focus:border-accent min-h-[150px]"
                                    placeholder="Escribe el contenido aquí..."
                                />
                            </div>
                        )}

                        {block.type === 'image' && (
                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-2 font-bold">Bloque de Imagen</label>
                                <input
                                    type="text"
                                    value={block.data.url}
                                    onChange={e => updateBlock(block.id, { url: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white mb-2"
                                    placeholder="URL de la imagen"
                                />
                                <input
                                    type="text"
                                    value={block.data.caption}
                                    onChange={e => updateBlock(block.id, { caption: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-slate-400 text-sm"
                                    placeholder="Leyenda de la imagen (opcional)"
                                />
                            </div>
                        )}

                        {block.type === 'product' && (
                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-2 font-bold">Bloque de Producto</label>
                                <input
                                    type="text"
                                    value={block.data.productId}
                                    onChange={e => updateBlock(block.id, { productId: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white"
                                    placeholder="ID del Producto (UUID)"
                                />
                                <p className="text-xs text-slate-500 mt-1">Ingresa el ID del producto para mostrar su tarjeta.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-4 justify-center py-4 border-t border-slate-800 border-dashed">
                <button onClick={() => addBlock('text')} className="px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors">+ Texto</button>
                <button onClick={() => addBlock('image')} className="px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors">+ Imagen</button>
                <button onClick={() => addBlock('product')} className="px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors">+ Producto</button>
            </div>

            <div className="fixed bottom-0 left-64 right-0 bg-slate-900 border-t border-slate-800 p-4 flex justify-end gap-4 z-40">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={published}
                        onChange={e => setPublished(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-accent focus:ring-accent"
                    />
                    <span className="text-white text-sm">Publicar inmediatamente</span>
                </label>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-accent text-white font-bold rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : 'Guardar Artículo'}
                </button>
            </div>
            <div className="h-20"></div> {/* Spacer for fixed footer */}
        </div>
    );
}
