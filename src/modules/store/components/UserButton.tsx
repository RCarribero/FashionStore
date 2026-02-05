/**
 * User Button Component
 * Shows login icon or user icon depending on auth state
 */
import React, { useEffect, useState } from 'react';
import AuthPopover from './AuthPopover';

export default function UserButton() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    useEffect(() => {
        // Check auth status on mount
        const checkAuth = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const { getCurrentUser } = await import('../../auth/services/auth-client.service');
                const user = await getCurrentUser();
                setIsLoggedIn(!!user);
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsLoggedIn(false);
            }
        };
        checkAuth();
    }, []);

    const handleMouseEnter = () => {
        if (!isLoggedIn) {
            if (timeoutId) clearTimeout(timeoutId);
            setShowPopover(true);
        }
    };

    const handleMouseLeave = () => {
        if (!isLoggedIn) {
            timeoutId = setTimeout(() => {
                setShowPopover(false);
            }, 300);
        }
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <a
                href={isLoggedIn ? '/cuenta/perfil' : '/auth/login'}
                className="block p-2 lg:p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all duration-200"
            >
                <svg
                    className="h-5 w-5 lg:h-6 lg:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                </svg>
            </a>

            {!isLoggedIn && showPopover && (
                <AuthPopover onClose={() => setShowPopover(false)} />
            )}
        </div>
    );
}
