import React, { useState, useEffect } from 'react';
import { findSize, SIZE_CHART } from '../../config/constants/sizing';
import Modal from '../ui/Modal';

type FitPreference = 'tight' | 'regular' | 'loose';

export default function SizeRecommender() {
    const [isOpen, setIsOpen] = useState(false);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [fit, setFit] = useState<FitPreference>('regular');
    const [recommendation, setRecommendation] = useState<string | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const storedHeight = localStorage.getItem('fm_user_height');
        const storedWeight = localStorage.getItem('fm_user_weight');
        if (storedHeight) setHeight(storedHeight);
        if (storedWeight) setWeight(storedWeight);
    }, []);

    const calculateSize = (e: React.FormEvent) => {
        e.preventDefault();
        const h = parseInt(height);
        const w = parseInt(weight);

        if (!h || !w) return;

        // Save to localStorage
        localStorage.setItem('fm_user_height', height);
        localStorage.setItem('fm_user_weight', weight);

        let size = findSize(h, w);

        // Adjust for fit preference logic (simplified)
        // If "Loose", and we are at the upper bound of a size, maybe recommend next up?
        // Actually, let's keep it simple: Just show the preference in the result text for now
        // or apply a small modifier to weight conceptually.

        if (size && fit === 'loose') {
            // Logic: If user wants loose, check if they are close to max weight of current size.
            // If so, bump up. For simplicity, let's strictly stick to the chart but add a note.
        } else if (size && fit === 'tight') {
            // Logic: If user wants tight, maybe bump down if close to min?
        }

        setRecommendation(size || 'Consulta sop.');
    };

    const reset = () => {
        setRecommendation(null);
        // Don't clear inputs as they are user stats
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-accent hover:text-red-400 underline decoration-dotted underline-offset-4 flex items-center gap-2 mb-4 group"
            >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                ¿Cuál es mi talla?
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Calculadora de Talla">
                {!recommendation ? (
                    <form onSubmit={calculateSize} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Altura (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-accent outline-none"
                                    placeholder="175"
                                    required
                                    min="100"
                                    max="250"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Peso (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-accent outline-none"
                                    placeholder="75"
                                    required
                                    min="30"
                                    max="200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Preferencia de Ajuste</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['tight', 'regular', 'loose'] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFit(p)}
                                        className={`px-2 py-2 text-sm rounded border transition-all ${fit === p
                                                ? 'bg-accent/20 border-accent text-accent'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        {p === 'tight' ? 'Ajustado' : p === 'regular' ? 'Regular' : 'Holgado'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-3 rounded transition-colors mt-2"
                        >
                            Calcular mi talla
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-2 animate-fade-in">
                        <p className="text-slate-400 mb-2">Para tus medidas y preferencia <span className="text-white font-medium">{fit === 'tight' ? 'ajustada' : fit === 'loose' ? 'holgada' : 'regular'}</span>:</p>

                        <div className="relative inline-block my-4">
                            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full"></div>
                            <div className="relative text-5xl font-display font-bold text-white drop-shadow-lg">
                                {recommendation}
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 mb-6">
                            {fit === 'loose' && recommendation !== 'XXL' ? 'Considera una talla más si buscas extra amplitud.' : ''}
                            {fit === 'tight' && recommendation !== 'S' ? 'Podrías probar una talla menos para un fit muy ceñido.' : ''}
                        </p>

                        <button
                            onClick={reset}
                            className="text-sm text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4"
                        >
                            Recalcular
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
}
