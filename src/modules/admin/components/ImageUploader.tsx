/**
 * ImageUploader - React Island Component
 * Drag and drop image uploader for admin product forms
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../auth';
import { ADMIN_CONFIG } from '../config';

interface UploadedImage {
    url: string;
    path: string;
}

export default function ImageUploader() {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateHiddenInput = useCallback((newImages: UploadedImage[]) => {
        const input = document.getElementById('images-input') as HTMLInputElement;
        if (input) {
            input.value = JSON.stringify(newImages.map(img => img.url));
        }
    }, []);

    const uploadFiles = useCallback(async (files: FileList) => {
        setUploading(true);
        const newImages: UploadedImage[] = [];

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue;

            const ext = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            const { data, error } = await supabase.storage
                .from(ADMIN_CONFIG.products.imageBucket)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (data && !error) {
                const { data: urlData } = supabase.storage
                    .from(ADMIN_CONFIG.products.imageBucket)
                    .getPublicUrl(fileName);

                newImages.push({
                    url: urlData.publicUrl,
                    path: fileName,
                });
            }
        }

        const updated = [...images, ...newImages];
        setImages(updated);
        updateHiddenInput(updated);
        setUploading(false);
    }, [images, updateHiddenInput]);

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

    const removeImage = useCallback(async (index: number) => {
        const imageToRemove = images[index];

        await supabase.storage
            .from(ADMIN_CONFIG.products.imageBucket)
            .remove([imageToRemove.path]);

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
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-navy-500 bg-navy-50' : 'border-charcoal-200 hover:border-charcoal-300'}
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

                <svg className="mx-auto h-12 w-12 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>

                <p className="mt-4 text-sm text-charcoal-600">
                    {uploading ? 'Subiendo imagenes...' : (
                        <>
                            <span className="font-medium text-navy-600">Arrastra imagenes aqui</span>
                            {' '}o haz clic para seleccionar
                        </>
                    )}
                </p>
                <p className="mt-1 text-xs text-charcoal-400">PNG, JPG, WEBP hasta 10MB</p>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={image.path} className="relative group aspect-square">
                            <img src={image.url} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover rounded" />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
