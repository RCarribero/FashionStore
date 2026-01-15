import React from 'react';
import { motion } from 'framer-motion';

export const Hero = ({ config }: { config?: any }) => {
    const title = config?.title || "DEFINE TU ESTILO"; // Handle highlighting logic later if needed
    const subtitle = config?.subtitle || "Piezas premium para el hombre que marca tendencia. Calidad, diseño y actitud en cada prenda.";
    const buttonText = config?.buttonText || "Ver Colección";

    // Simple parser for title to keep the "ESTILO" highlight if user enters similar text?
    // For now, let's just render the text. If we want "ESTILO" highlighted, we'd need a rich text editor or a convention.
    // Let's assume input is plain text for now.

    // To maintain the design where the last word is highlighted if it matches defaults:
    // We can do a simple split if we want, or just print it all white for custom text.
    // Let's print it all white for custom text to avoid breaking layout, unless it's default.

    const renderTitle = () => {
        if (config?.title) {
            return config.title; // Render custom title as is (all white)
        }
        return (
            <>
                DEFINE TU <span className="text-accent">ESTILO</span>
            </>
        );
    };

    return (
        <section className="relative min-h-[90vh] bg-black flex items-center overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black"></div>

            {/* Animated Grid Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="max-w-3xl">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 mb-8 rounded-full"
                        >
                            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                            <span className="text-accent text-sm font-semibold uppercase tracking-wider">Nueva Colección 2026</span>
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="font-display text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                        >
                            {renderTitle()}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-xl lg:text-2xl text-slate-300 mb-10 max-w-2xl"
                        >
                            {subtitle}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="flex flex-wrap gap-4"
                        >
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
                        </motion.div>
                    </div>

                    {/* Right Column - Floating Image */}
                    <div className="hidden lg:flex items-center justify-center relative z-20">
                        {/* Abstract background shapes */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, x: 100, rotateY: 20 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }}
                            className="relative z-10 w-full max-w-lg"
                            style={{ perspective: 1000 }}
                        >
                            <motion.img
                                src="https://res.cloudinary.com/dzaka0idb/image/upload/v1768292616/fashionstore/categories/zapatillas.webp"
                                alt="Nike Air Max Premium"
                                className="w-full h-auto drop-shadow-2xl object-contain transform-gpu"
                                animate={{
                                    y: [-15, 15, -15],
                                    rotateZ: [-2, 2, -2],
                                    rotateX: [5, -5, 5]
                                }}
                                transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            {/* Floating Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="absolute -bottom-10 -right-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-xl z-20 max-w-[200px]"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Just Dropped</p>
                                </div>
                                <p className="font-display font-bold text-lg leading-tight text-white">Air Max Pulse</p>
                                <p className="text-sm text-white/60">Edición Limitada</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Decorative Element */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-[600px] bg-gradient-to-l from-accent/20 to-transparent blur-3xl pointer-events-none"
            ></motion.div>
        </section>
    );
};
