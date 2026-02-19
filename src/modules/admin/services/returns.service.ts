/**
 * Returns Service
 * Return request CRUD operations for admin
 */

import { supabase, createAdminClient } from '../../auth';
import type { Return, ReturnWithRelations, ReturnStatus, ApiResponse } from '../../../shared/types';

/**
 * Get all returns with related order and user info
 */
export async function getReturns() {
    const adminClient = createAdminClient();
    return await adminClient
        .from('returns')
        .select(`
            *,
            orders!inner(order_number, tracking_number, total_amount, status),
            user_profiles!inner(first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });
}

/**
 * Get returns filtered by status
 */
export async function getReturnsByStatus(status: ReturnStatus) {
    const adminClient = createAdminClient();
    return await adminClient
        .from('returns')
        .select(`
            *,
            orders!inner(order_number, tracking_number, total_amount, status),
            user_profiles!inner(first_name, last_name, email, phone)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });
}

/**
 * Get return by ID with full details
 */
export async function getReturnById(id: string) {
    const adminClient = createAdminClient();
    return await adminClient
        .from('returns')
        .select(`
            *,
            orders!inner(order_number, tracking_number, total_amount, status, shipping_address, created_at),
            user_profiles!inner(first_name, last_name, email, phone)
        `)
        .eq('id', id)
        .single();
}

/**
 * Update return status (admin only)
 */
export async function updateReturnStatus(id: string, status: ReturnStatus): Promise<ApiResponse<Return>> {
    try {
        const adminClient = createAdminClient();

        const { data: returnData, error } = await adminClient
            .from('returns')
            .update({ 
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { error: error.message, success: false };
        }

        return { data: returnData, success: true };
    } catch (e) {
        return { error: 'Error updating return status', success: false };
    }
}

/**
 * Get pending returns count
 */
export async function getPendingReturnsCount(): Promise<number> {
    const adminClient = createAdminClient();
    const { count } = await adminClient
        .from('returns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    return count || 0;
}

/**
 * Get returns by user ID
 */
export async function getReturnsByUserId(userId: string) {
    return await supabase
        .from('returns')
        .select(`
            *,
            orders!inner(order_number, tracking_number, total_amount, status)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
}

/**
 * Get returns statistics
 */
export async function getReturnsStats() {
    const adminClient = createAdminClient();
    const { data: returns } = await adminClient
        .from('returns')
        .select('status');

    const stats = {
        total: returns?.length || 0,
        pending: returns?.filter(r => r.status === 'pending').length || 0,
        approved: returns?.filter(r => r.status === 'approved').length || 0,
        rejected: returns?.filter(r => r.status === 'rejected').length || 0,
        completed: returns?.filter(r => r.status === 'completed').length || 0,
    };

    return stats;
}
