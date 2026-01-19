import React, { useState, useRef } from 'react';
import { supabase } from '../../auth/services/auth-client.service';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderNumber: number;
    onSuccess: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, orderId, orderNumber, onSuccess }) => {
    const [reason, setReason] = useState('wrong_size');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) throw new Error("No usuario autenticado");

            const imageUrls: string[] = [];

            // 1. Upload images
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${orderId}/${Date.now()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('returns-evidence')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('returns-evidence')
                    .getPublicUrl(fileName);

                imageUrls.push(publicUrl);
            }

            // 2. Create Return Record via API to handle Email Sending as well
            const response = await fetch('/api/returns/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    userId: user.data.user.id,
                    reason,
                    details,
                    images: imageUrls
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al crear la devolucion');

            // Show success with instructions instead of alert
            setShowSuccess(true);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error desconocido');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display text-white">
                        {showSuccess ? 'Devolucion Solicitada' : `Devolver Pedido #${orderNumber}`}
                    </h3>
                    <button onClick={() => { onClose(); if (showSuccess) onSuccess(); }} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {showSuccess ? (
                    // Success State - Show Instructions
                    <div className="space-y-6">
                        {/* Success Icon */}
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-green-400 font-medium">Solicitud recibida correctamente</p>
                        </div>

                        {/* Shipping Instructions */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Instrucciones de Envio
                            </h4>
                            <p className="text-slate-300 text-sm mb-3">
                                Debes enviar los articulos en su embalaje original a:
                            </p>
                            <div className="bg-slate-900 p-3 rounded text-sm font-mono text-slate-400">
                                <p>FashionMarket - Devoluciones</p>
                                <p>Calle de la Moda 123</p>
                                <p>Poligono Industrial</p>
                                <p>28001 Madrid, Espana</p>
                            </div>
                        </div>

                        {/* Email Confirmation */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <p className="text-blue-400 font-medium text-sm">Confirmacion enviada</p>
                                    <p className="text-slate-400 text-sm">
                                        Hemos enviado un correo con la etiqueta de devolucion a tu email asociado.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Refund Disclaimer */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-yellow-400 font-medium text-sm">Informacion importante</p>
                                    <p className="text-slate-400 text-sm">
                                        Una vez recibido y validado el paquete, el reembolso se procesara en tu metodo de pago original en un plazo de <strong className="text-yellow-400">5 a 7 dias habiles</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => { onClose(); onSuccess(); }}
                            className="w-full py-3 bg-accent hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-colors"
                        >
                            Entendido
                        </button>
                    </div>
                ) : (
                    // Form State
                    <>
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Motivo de la devolucion</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-accent rounded"
                                >
                                    <option value="wrong_size">Talla incorrecta</option>
                                    <option value="damaged">Producto danado / defectuoso</option>
                                    <option value="not_like_description">No coincide con la descripcion</option>
                                    <option value="changed_mind">He cambiado de opinion</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Detalles adicionales</label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent rounded h-24 resize-none"
                                    placeholder="Por favor, explicanos brevemente el problema..."
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Fotos del producto (Obligatorio si esta danado)</label>
                                <div
                                    className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <svg className="mx-auto h-8 w-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm text-slate-400">
                                        {files.length > 0
                                            ? <span className="text-accent font-medium">{files.length} archivos seleccionados</span>
                                            : "Haz clic para subir fotos"}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-accent hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Procesando...' : 'Confirmar Devolucion'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
