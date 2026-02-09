/**
 * Product Image URL Optimizer
 * Converts Cloudinary URLs to optimized versions with transformations
 */

import { buildCloudinaryUrl, buildResponsiveSet, extractPublicId, isCloudinaryUrl, type ResourceType } from './cloudinary-url';

/**
 * Optimize a single product image URL
 * Handles both full Cloudinary URLs and public IDs
 */
export function optimizeProductImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';

  // If it's already a Cloudinary URL, extract and rebuild with optimizations
  if (isCloudinaryUrl(imageUrl)) {
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      return buildCloudinaryUrl(publicId, 'product');
    }
  }

  // If it's a public ID (no domain), build directly
  if (!imageUrl.includes('://')) {
    return buildCloudinaryUrl(imageUrl, 'product');
  }

  // Return as-is if not a Cloudinary URL
  return imageUrl;
}

/**
 * Optimize multiple product images (array)
 */
export function optimizeProductImages(images: string[]): string[] {
  return images.map(url => optimizeProductImageUrl(url));
}

/**
 * Get first optimized image from product image array
 * Commonly used for product cards and listings
 */
export function getOptimizedProductImage(images: string[] | string | null): string {
  if (!images) return '';

  const imageArray = Array.isArray(images) ? images : [images];
  const firstImage = imageArray[0];

  return optimizeProductImageUrl(firstImage);
}

/**
 * Build optimized product image srcset for responsive loading
 */
export function buildProductImageSrcset(imageUrl: string): string {
  const publicId = isCloudinaryUrl(imageUrl) ? extractPublicId(imageUrl) : imageUrl;

  if (!publicId) return '';

  // Use the centralized builder which now handles folder paths correctly
  return buildResponsiveSet(publicId, 'product');
}

/**
 * Get image dimensions for explicit width/height (prevents CLS)
 */
export function getProductImageDimensions(): { width: number; height: number } {
  return { width: 700, height: 800 };
}

/**
 * Convert product image array to optimized versions
 * Useful for component props
 */
export interface OptimizedProductImages {
  primary: string;
  srcset: string;
  width: number;
  height: number;
}

export function optimizeProductImageSet(images: string[] | null): OptimizedProductImages | null {
  if (!images || images.length === 0) {
    return null;
  }

  const primary = optimizeProductImageUrl(images[0]);
  const srcset = buildProductImageSrcset(images[0]);
  const { width, height } = getProductImageDimensions();

  return { primary, srcset, width, height };
}
