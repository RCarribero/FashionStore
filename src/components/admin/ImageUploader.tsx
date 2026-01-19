/**
 * ImageUploader - React Island Component
 * Drag and drop image uploader for admin product forms
 * Uploads via server-side API endpoint
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UploadedImage {
    url: string;
    path: string;
}

interface ImageUploaderProps {
    initialImages?: string[];
    folder?: string;
    inputId?: string;
}

export default function ImageUploader({
    initialImages = [],
    folder = 'fashionstore/products',
    inputId = 'images'
}: ImageUploaderProps) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialized = useRef(false);

    // Initialize with existing images
    useEffect(() => {
        if (!initialized.current && initialImages.length > 0) {
            const existingImages = initialImages.map(url => ({ url, path: '' }));
            setImages(existingImages);
            initialized.current = true;
        }
    }, [initialImages]);

    const updateHiddenInput = useCallback((newImages: UploadedImage[]) => {
        const input = document.getElementById('images-input') as HTMLInputElement;
        const textarea = document.getElementById(inputId) as HTMLTextAreaElement;

        const urls = newImages.map(img => img.url);

        if (input) input.value = JSON.stringify(urls);
        if (textarea) textarea.value = urls.join('\n');
    }, [inputId]);

    const uploadFiles = useCallback(async (files: FileList) => {
        setUploading(true);
        const newImages: UploadedImage[] = [];

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (data.url) {
                    newImages.push({
                        url: data.url,
                        path: data.public_id || '',
                    });
                } else {
                    console.error('Upload error:', data);
                    alert(`Error subiendo imagen: ${data.error || 'Desconocido'}`);
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Error de red al subir imagen');
            }
        }

        const updated = [...images, ...newImages];
        setImages(updated);
        updateHiddenInput(updated);
        setUploading(false);
    }, [images, updateHiddenInput, folder]);

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
            uploadFiles(e.dataTransfer.files);
        }
    }, [uploadFiles]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFiles(e.target.files);
        }
    }, [uploadFiles]);

    const removeImage = useCallback((index: number) => {
        const updated = images.filter((_, i) => i !== index);
        setImages(updated);
        updateHiddenInput(updated);
    }, [images, updateHiddenInput]);

    return (
        <div className="space-y-4">
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
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
                    multiple
                    onChange={handleChange}
                    className="hidden"
                />

                <svg className="mx-auto h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>

                <p className="mt-3 text-sm text-slate-400">
                    {uploading ? (
                        <span className="text-red-400">Subiendo imagen...</span>
                    ) : (
                        <>
                            <span className="font-medium text-white">Arrastra imagenes aqui</span>
                            {' '}o haz clic para seleccionar
                        </>
                    )}
                </p>
                <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP</p>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                    {images.map((image, index) => (
                        <div key={image.url} className="relative group aspect-square bg-slate-800 rounded overflow-hidden">
                            <img
                                src={image.url}
                                alt={`Imagen ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="absolute top-1 right-1 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
