import React, { useState } from 'react';

export const Hero = ({ config }: { config?: any }) => {
    const title = config?.title || "DEFINE TU ESTILO";
    const subtitle = config?.subtitle || "Piezas premium para el hombre que marca tendencia. Calidad, diseño y actitud en cada prenda.";
    const buttonText = config?.buttonText || "Ver Colección";

    // Mouse tilt interaction for responsive 3D feel
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16; // -8 to +8 deg
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16; // -8 to +8 deg
        setTilt({ rotateX: y, rotateY: x });
    };

    const handleMouseLeave = () => {
        setTilt({ rotateX: 0, rotateY: 0 });
    };

    const renderTitle = () => {
        if (config?.title) {
            return config.title;
        }
        return (
            <>
                DEFINE TU <span className="text-accent">ESTILO</span>
            </>
        );
    };

    // Cloudinary transparent studio asset with local backup
    const sneakerUrl = "https://res.cloudinary.com/dzaka0idb/image/upload/e_make_transparent:40,f_webp,q_auto/v1768389286/fashionstore/products/running-shoes-red.webp";

    return (
        <section 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative min-h-[85vh] lg:min-h-[90vh] bg-black flex items-center overflow-hidden py-16 lg:py-28"
        >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black pointer-events-none"></div>

            {/* Animated Grid Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Left Column - Text & Actions */}
                    <div className="max-w-2xl">
                        {/* Badge */}
                        <div className="hero-anim-badge inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 mb-8 rounded-full">
                            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                            <span className="text-accent text-sm font-semibold uppercase tracking-wider">Nueva Colección 2026</span>
                        </div>

                        {/* Title */}
                        <h1 className="hero-anim-title font-display text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                            {renderTitle()}
                        </h1>

                        {/* Subtitle */}
                        <p className="hero-anim-subtitle text-xl lg:text-2xl text-slate-300 mb-10 max-w-xl">
                            {subtitle}
                        </p>

                        {/* CTAs */}
                        <div className="hero-anim-ctas flex flex-wrap gap-4">
                            <a
                                href="/productos"
                                className="group inline-flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-600 text-white font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 rounded-none"
                            >
                                {buttonText}
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                                </svg>
                            </a>
                            <a
                                href="/categoria/camisetas"
                                className="inline-flex items-center gap-3 px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 rounded-none"
                            >
                                Explorar Camisetas
                            </a>
                        </div>
                    </div>

                    {/* Right Column - 3D Floating Sneaker Stage */}
                    <div className="hero-sneaker-enter flex items-center justify-center relative z-20 mt-8 lg:mt-0 w-full">
                        {/* Dynamic Atmospheric Radial Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-accent/30 via-red-600/10 to-transparent rounded-full blur-3xl pointer-events-none scale-125" />

                        {/* 3D Floating Stage with Perspective */}
                        <div 
                            className="hero-sneaker-container relative z-10 w-full max-w-md sm:max-w-lg flex flex-col items-center justify-center"
                            style={{
                                transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                                transition: 'transform 0.15s ease-out'
                            }}
                        >
                            <div className="hero-floating-sneaker relative w-full flex items-center justify-center">
                                <img
                                    src={sneakerUrl}
                                    alt="Nike Air Max Runner Red - Edición Limitada"
                                    width="600"
                                    height="450"
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                    className="w-full h-auto drop-shadow-[0_20px_35px_rgba(239,68,68,0.25)] drop-shadow-[0_30px_50px_rgba(0,0,0,0.85)] object-contain select-none pointer-events-none"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (!target.src.includes('/images/hero/hero-sneaker-transparent.webp')) {
                                            target.src = '/images/hero/hero-sneaker-transparent.webp';
                                        }
                                    }}
                                />

                                {/* Floating Glassmorphism Badge */}
                                <div className="hero-badge-float absolute -bottom-6 -right-2 sm:-bottom-8 sm:-right-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl z-20 max-w-[210px] pointer-events-auto">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Just Dropped</p>
                                    </div>
                                    <p className="font-display font-bold text-lg leading-tight text-white">Air Max Pulse</p>
                                    <p className="text-sm text-white/70">Edición Limitada</p>
                                </div>
                            </div>

                            {/* 3D Dynamic Synchronized Contact Shadow */}
                            <div className="hero-sneaker-shadow w-3/4 sm:w-2/3 h-5 sm:h-7 bg-black/80 rounded-[100%] blur-md mt-2 pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Element */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-[600px] bg-gradient-to-l from-accent/15 to-transparent blur-3xl pointer-events-none"></div>
        </section>
    );
};
