
import type { APIRoute } from 'astro';
import { createAdminClient } from '../../modules/auth/services/auth.service';

export const GET: APIRoute = async () => {
    const supabase = createAdminClient();

    // Test the exact query used in CatalogPage
    const { data, error } = await supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    // Also check if variants exist at all
    const { count: variantsCount, error: countError } = await supabase
        .from("product_variants")
        .select("*", { count: 'exact', head: true });

    return new Response(JSON.stringify({
        queryError: error,
        productsFound: data?.length,
        firstProduct: data?.[0],
        variantsTotalCount: variantsCount,
        variantsCountError: countError
    }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
