/**
 * Cloudinary Upload API Endpoint
 * Server-side signed upload using API credentials
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
    api_key: import.meta.env.CLOUDINARY_API_KEY,
    api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

export const POST: APIRoute = async ({ request }) => {
    try {
        // Check content type
        const contentType = request.headers.get('content-type') || '';

        let file: File;
        let folder: string;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            file = formData.get('file') as File;
            folder = formData.get('folder') as string || 'fashionstore/uploads';
        } else {
            return new Response(JSON.stringify({ error: 'Invalid content type. Use multipart/form-data' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Convert File to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: folder,
            resource_type: 'image',
        });

        return new Response(JSON.stringify({
            url: result.secure_url,
            public_id: result.public_id,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Upload failed'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
