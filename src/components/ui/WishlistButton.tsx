import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

interface WishlistButtonProps {
    productId: string;
    initialIsInWishlist?: boolean;
}

export default function WishlistButton({ productId, initialIsInWishlist = false }: WishlistButtonProps) {
    const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkWishlistStatus();
    }, [productId]);

    const checkWishlistStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (data) setIsInWishlist(true);
    };

    const toggleWishlist = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            window.location.href = '/login';
            return;
        }

        if (isInWishlist) {
            await supabase
                .from('wishlists')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);
            setIsInWishlist(false);
        } else {
            await supabase
                .from('wishlists')
                .insert({ user_id: user.id, product_id: productId });
            setIsInWishlist(true);
        }
        setIsLoading(false);
    };

    return (
        <button
            onClick={toggleWishlist}
            disabled={isLoading}
            className={`p-2 rounded-full transition-colors ${isInWishlist
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            title={isInWishlist ? "Eliminar de favoritos" : "Añadir a favoritos"}
        >
            <svg
                className={`w-6 h-6 ${isInWishlist ? 'fill-current' : 'fill-none'}`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        </button>
    );
}
