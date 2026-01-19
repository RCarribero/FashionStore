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
            if (!response.ok) throw new Error(result.message || 'Error al crear la devolución');

            onSuccess();
            onClose();
            alert('Solicitud de devolución enviada con éxito. Te hemos enviado un correo de confirmación.');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error desconocido');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display text-white">Devolver Pedido #{orderNumber}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Motivo de la devolución</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-accent rounded"
                        >
                            <option value="wrong_size">Talla incorrecta</option>
                            <option value="damaged">Producto dañado / defectuoso</option>
                            <option value="not_like_description">No coincide con la descripción</option>
                            <option value="changed_mind">He cambiado de opinión</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Detalles adicionales</label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent rounded h-24 resize-none"
                            placeholder="Por favor, explícanos brevemente el problema..."
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Fotos del producto (Obligatorio si está dañado)</label>
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
                            {isSubmitting ? 'Procesando...' : 'Confirmar Devolución'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
