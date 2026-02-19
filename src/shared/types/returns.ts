/**
 * Return Type Definitions
 * Types for returns management system
 */

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Return {
    id: string;
    order_id: string;
    user_id: string;
    reason: string;
    details: string | null;
    images: string[];
    status: ReturnStatus;
    created_at: string;
}

export interface ReturnWithRelations extends Return {
    orders: {
        order_number: string;
        tracking_number: string | null;
        total_amount: number;
        status: string;
    };
    user_profiles: {
        first_name: string | null;
        last_name: string | null;
        email: string;
        phone: string | null;
    };
}

export interface ReturnFormData {
    order_id: string;
    reason: string;
    details?: string;
    images: string[];
}
