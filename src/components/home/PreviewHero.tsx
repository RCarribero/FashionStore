import { Hero } from "./Hero";

// Add props to accept config
export const PreviewHero = ({ config }: { config?: any }) => {
    // If config is provided, we might want to pass it to Hero if Hero supports it.
    // Since Hero is a real component used on the site, we should probably update it too.
    // For now, let's create a visual override if config exists, or standard Hero if not.
    // Actually, making Hero accept props is better.

    // But since PreviewHero is just a wrapper, we can just overlay the text if we want "Preview"
    // OR, better, updating Hero to accept props is key for the site to work dynamically.
    // Let's assume standard Hero is static for now, and we simulate here.

    const title = config?.title || "NUEVA COLECCIÓN 2026";
    const subtitle = config?.subtitle || "Define tu estilo. Eleva tu juego.";
    const buttonText = config?.buttonText || "Descubrir Ahora";

    return (
        <div className="pointer-events-none relative">
            <div className="relative h-[80vh] flex items-center bg-black overflow-hidden">
                {/* Background - we keep the video/image from original or allow config? For now static */}
                <div className="absolute inset-0 z-0 opacity-50 bg-slate-900">
                    {/* Placeholder for video */}
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
                    <span className="block font-bold text-white mb-4 tracking-[0.2em] animate-fade-in-up">
                        {subtitle}
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tighter uppercase animate-slide-up">
                        {title}
                    </h1>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
                        <button className="px-8 py-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors">
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
