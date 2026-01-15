/**
 * Global Toast Script
 * Can be used from vanilla JS scripts in Astro pages
 */

(function () {
    // Create container if not exists
    function getContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none';
            document.body.appendChild(container);
        }
        return container;
    }

    const typeStyles = {
        success: { bg: 'bg-green-900/95', border: 'border-green-500', icon: 'M5 13l4 4L19 7' },
        error: { bg: 'bg-red-900/95', border: 'border-red-500', icon: 'M6 18L18 6M6 6l12 12' },
        warning: { bg: 'bg-yellow-900/95', border: 'border-yellow-500', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        info: { bg: 'bg-blue-900/95', border: 'border-blue-500', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
    };

    let toastId = 0;

    function showToast(message, type = 'info', duration = 4000) {
        const container = getContainer();
        const style = typeStyles[type] || typeStyles.info;
        const id = 'toast-' + (++toastId);

        const toast = document.createElement('div');
        toast.id = id;
        toast.className = `${style.bg} ${style.border} border rounded-lg p-4 shadow-xl pointer-events-auto flex items-start gap-3 animate-slide-up`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="${style.icon}" />
            </svg>
            <p class="text-white text-sm flex-1">${message}</p>
            <button class="text-white/60 hover:text-white transition-colors flex-shrink-0 toast-dismiss">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;

        container.appendChild(toast);

        // Dismiss on click
        toast.querySelector('.toast-dismiss').addEventListener('click', () => {
            toast.remove();
        });

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                toast.remove();
            }, duration);
        }

        return id;
    }

    // Expose globally
    window.showToast = showToast;
    window.toast = {
        success: (msg, dur) => showToast(msg, 'success', dur),
        error: (msg, dur) => showToast(msg, 'error', dur || 6000),
        warning: (msg, dur) => showToast(msg, 'warning', dur),
        info: (msg, dur) => showToast(msg, 'info', dur)
    };
})();
