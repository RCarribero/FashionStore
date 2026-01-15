/**
 * CategoryImageUploader - React Island Component
 * Single image uploader for admin category forms
 * Uploads via server-side API endpoint
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface CategoryImageUploaderProps {
    initialImage?: string;
    inputId?: string;
}

export default function CategoryImageUploader({
    initialImage = '',
    inputId = 'categoryImage'
}: CategoryImageUploaderProps) {
    const [imageUrl, setImageUrl] = useState<string>(initialImage);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update when initialImage changes (modal reuse)
    useEffect(() => {
        setImageUrl(initialImage);
    }, [initialImage]);

    // Sync with hidden input
    useEffect(() => {
        const input = document.getElementById(inputId) as HTMLInputElement;
        if (input) input.value = imageUrl;
    }, [imageUrl, inputId]);

    const uploadFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Solo se permiten imagenes');
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'fashionstore/categories');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.url) {
                setImageUrl(data.url);
            } else {
                console.error('Upload error:', data);
                alert(`Error subiendo imagen: ${data.error || 'Desconocido'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error de red al subir imagen');
        } finally {
            setUploading(false);
        }
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
        }
    }, [uploadFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
        }
    }, [uploadFile]);

    const removeImage = useCallback(() => {
        setImageUrl('');
    }, []);

    return (
        <div className="space-y-3">
            {imageUrl ? (
                <div className="relative group">
                    <img
                        src={imageUrl}
                        alt="Imagen de categoria"
                        className="w-full h-32 object-cover rounded border border-slate-700"
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
                        ${dragActive
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'}
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                    />

                    <svg className="mx-auto h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>

                    <p className="mt-2 text-sm text-slate-400">
                        {uploading ? (
                            <span className="text-red-400">Subiendo...</span>
                        ) : (
                            <span className="font-medium text-white">Subir imagen</span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}
