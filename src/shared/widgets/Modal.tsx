import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success' | 'warning';
    actionLabel?: string;
    onAction?: () => void;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    actionLabel,
    onAction
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const iconColors = {
        info: 'text-blue-400',
        error: 'text-red-400',
        success: 'text-green-400',
        warning: 'text-yellow-400'
    };

    const borderColors = {
        info: 'border-blue-500',
        error: 'border-red-500',
        success: 'border-green-500',
        warning: 'border-yellow-500'
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in"
            onClick={onClose}
        >
            <div
                className={`bg-slate-900 border ${borderColors[type]} max-w-md w-full p-6 shadow-2xl transform transition-all animate-scale-in`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 ${iconColors[type]}`}>
                        {type === 'error' && (
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {type === 'success' && (
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {type === 'warning' && (
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {type === 'info' && (
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-white mb-2">
                            {title}
                        </h3>
                        <p className="text-slate-300">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-slate-700 text-white hover:bg-slate-800 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="px-6 py-2 bg-accent hover:bg-red-700 text-white transition-colors font-bold"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
