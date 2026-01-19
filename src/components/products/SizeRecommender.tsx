import React, { useState } from 'react';

export default function SizeRecommender() {
    const [isOpen, setIsOpen] = useState(false);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [recommendation, setRecommendation] = useState<string | null>(null);

    const calculateSize = (e: React.FormEvent) => {
        e.preventDefault();
        const h = parseInt(height);
        const w = parseInt(weight);

        if (!h || !w) return;

        let size = 'L';
        if (w < 70 && h < 175) {
            size = 'M';
        } else if (w > 90) {
            size = 'XL';
        } else if (w < 60) {
            size = 'S';
        }

        setRecommendation(size);
    };

    const reset = () => {
        setRecommendation(null);
        setHeight('');
        setWeight('');
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-accent hover:text-red-400 underline decoration-dotted underline-offset-4 flex items-center gap-2 mb-4"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                ¿Cuál es mi talla?
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="relative bg-slate-900 border border-slate-700 p-6 rounded-lg shadow-2xl w-full max-w-sm">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="font-display text-xl text-white mb-4">Calculadora de Talla</h3>

                        {!recommendation ? (
                            <form onSubmit={calculateSize} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Altura (cm)</label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-accent outline-none"
                                        placeholder="Ej: 175"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-accent outline-none"
                                        placeholder="Ej: 75"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded transition-colors"
                                >
                                    Calcular
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-4 animate-fade-in">
                                <p className="text-slate-400 mb-2">Basado en tus medidas, te recomendamos:</p>
                                <div className="text-4xl font-bold text-accent mb-4">Talla {recommendation}</div>
                                <p className="text-sm text-slate-500 mb-6">Esta es una recomendación aproximada.</p>
                                <button
                                    onClick={reset}
                                    className="text-sm text-slate-400 hover:text-white underline"
                                >
                                    Calcular otra vez
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
