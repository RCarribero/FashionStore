
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const GET: APIRoute = async () => {
    try {
        const { data, error } = await supabase
            .from('home_sections')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: 'Error fetching layout' }), { status: 500 });
    }
};

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const rawBody = await request.text();
        console.log('Admin Layout Update Request Body:', rawBody);

        if (!rawBody) {
            throw new Error('Request body is empty');
        }

        const body = JSON.parse(rawBody);
        const { sections, deletedIds } = body;

        if (!Array.isArray(sections)) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid data' }), { status: 400 });
        }

        // 1. Handle Deletions
        if (Array.isArray(deletedIds) && deletedIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('home_sections')
                .delete()
                .in('id', deletedIds);

            if (deleteError) {
                console.error('Delete error:', deleteError);
                // Continue with upsert even if delete fails? better to throw.
                throw deleteError;
            }
        }

        // 2. Handle Updates and Inserts separately
        const newSections = sections.filter((s: any) => !s.id);
        const existingSections = sections.filter((s: any) => s.id);

        // Insert new sections (without id - let DB generate it)
        if (newSections.length > 0) {
            const inserts = newSections.map((section: any, idx: number) => {
                // Find the correct order_index based on original position
                const originalIndex = sections.findIndex((s: any) => s === section);
                return {
                    key: section.key,
                    label: section.label,
                    order_index: section.order_index ?? originalIndex,
                    is_visible: section.is_visible,
                    component_config: section.component_config || {},
                    updated_at: new Date().toISOString()
                };
            });

            const { error: insertError } = await supabase
                .from('home_sections')
                .insert(inserts);

            if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
            }
        }

        // Update existing sections
        if (existingSections.length > 0) {
            const updates = existingSections.map((section: any) => ({
                id: section.id,
                key: section.key,
                label: section.label,
                order_index: section.order_index,
                is_visible: section.is_visible,
                component_config: section.component_config || {},
                updated_at: new Date().toISOString()
            }));

            const { error: updateError } = await supabase
                .from('home_sections')
                .upsert(updates);

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }
        }

        return new Response(JSON.stringify({ success: true, message: 'Layout updated' }), {
            status: 200
        });
    } catch (error: any) {
        console.error('Home Layout API Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Error updating layout',
            details: error
        }), { status: 500 });
    }
};
