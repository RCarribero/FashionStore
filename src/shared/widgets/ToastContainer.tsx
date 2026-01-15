/**
 * Toast Container Component
 * Renders toast notifications
 */
import React from 'react';
import { useStore } from '@nanostores/react';
import { $toasts, dismissToast, type Toast } from '../stores/toast.store';

const typeStyles: Record<Toast['type'], { bg: string; icon: string; border: string }> = {
    success: {
        bg: 'bg-green-900/95',
        border: 'border-green-500',
        icon: 'M5 13l4 4L19 7'
    },
    error: {
        bg: 'bg-red-900/95',
        border: 'border-red-500',
        icon: 'M6 18L18 6M6 6l12 12'
    },
    warning: {
        bg: 'bg-yellow-900/95',
        border: 'border-yellow-500',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    info: {
        bg: 'bg-blue-900/95',
        border: 'border-blue-500',
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
};

export default function ToastContainer() {
    const toasts = useStore($toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => {
                const style = typeStyles[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`${style.bg} ${style.border} border rounded-lg p-4 shadow-xl pointer-events-auto animate-slide-up flex items-start gap-3`}
                        role="alert"
                    >
                        <svg
                            className="w-5 h-5 text-white flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                        </svg>
                        <p className="text-white text-sm flex-1">{toast.message}</p>
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
