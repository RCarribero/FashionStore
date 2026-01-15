
import { ROUTES } from "../../../../../config";

export const PreviewOfferBanner = ({ config }: { config?: any }) => {
    const title = config?.title || "OFERTA FLASH";
    const subtitle = config?.subtitle || "Hasta -50% en seleccion de productos";

    return (
        <section className="bg-accent py-4 lg:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 text-center">
                    <span className="text-white font-bold text-lg lg:text-xl uppercase tracking-wide">
                        {title}
                    </span>
                    <span className="text-white/90 text-base lg:text-lg">
                        {subtitle}
                    </span>
                    <div
                        className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-bold uppercase tracking-wider hover:bg-slate-900 transition-colors"
                    >
                        Comprar Ahora
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
};
