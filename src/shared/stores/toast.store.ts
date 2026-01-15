/**
 * Toast Notification System
 * Controlled notifications to replace browser alerts
 */
import { atom } from 'nanostores';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

export const $toasts = atom<Toast[]>([]);

let toastId = 0;

export function showToast(message: string, type: Toast['type'] = 'info', duration = 4000) {
    const id = `toast-${++toastId}`;
    const toast: Toast = { id, message, type, duration };

    $toasts.set([...$toasts.get(), toast]);

    if (duration > 0) {
        setTimeout(() => {
            dismissToast(id);
        }, duration);
    }

    return id;
}

export function dismissToast(id: string) {
    $toasts.set($toasts.get().filter(t => t.id !== id));
}

// Convenience functions
export const toast = {
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration ?? 6000),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
};
