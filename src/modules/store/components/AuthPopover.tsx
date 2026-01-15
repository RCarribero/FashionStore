
import React from 'react';
import { ROUTES } from '../../../config';

interface Props {
    onClose: () => void;
}

export default function AuthPopover({ onClose }: Props) {
    return (
        <div className="absolute top-full right-0 mt-4 w-96 bg-white shadow-2xl z-50 p-8 text-center border border-slate-100 animate-fade-in-up before:content-[''] before:absolute before:-top-2 before:right-5 before:w-4 before:h-4 before:bg-white before:rotate-45">
            {/* Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    console.log('Close clicked');
                    onClose();
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors"
                aria-label="Cerrar"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Title */}
            <h3 className="font-display font-bold text-lg leading-tight mb-6 mt-2 uppercase">
                ¡Registrate o crea tu cuenta para disfrutar de mas ventajas!
            </h3>

            {/* Benefits List */}
            <ul className="text-left space-y-3 mb-8 text-sm text-slate-600 pl-4">
                <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-black shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Pago mas rapido y sencillo</span>
                </li>
                <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-black shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Promociones exclusivas... ¡y mas!</span>
                </li>
                <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-black shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Tu lista de deseos</span>
                </li>
            </ul>

            {/* Actions */}
            <div className="space-y-3">
                <a
                    href="/login"
                    className="block w-full py-3 bg-black text-white text-sm font-bold uppercase tracking-wider hover:bg-slate-900 transition-colors"
                >
                    Inicia Sesion
                </a>
                <a
                    href="/registro"
                    className="block w-full py-3 bg-white text-black border border-slate-200 text-sm font-bold uppercase tracking-wider hover:border-black transition-colors"
                >
                    Crear una cuenta
                </a>
            </div>
        </div>
    );
}
