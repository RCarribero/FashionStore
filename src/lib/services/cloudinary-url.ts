/**
 * Cloudinary URL Builder - Generates optimized image URLs with transformations
 * Supports responsive images, auto-format detection, and quality optimization
 *
 * Usage:
 * - buildCloudinaryUrl('fashionstore/categories/zapatillas', 'category')
 * - buildResponsiveSet('fashionstore/products/hiking-boots', 'product')
 */

export type ResourceType = 'category' | 'product' | 'logo' | 'other';

interface UrlOptions {
  width?: number;
  height?: number;
  quality?: 'auto:eco' | 'auto:good' | 'auto:best';
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  crop?: 'fill' | 'fit' | 'thumb' | 'scale';
  gravity?: 'auto' | 'face' | 'center';
  fetchFormat?: boolean;
}

const CLOUDINARY_CLOUD = 'dzaka0idb';
const CATEGORY_WIDTH = 1024;
const CATEGORY_HEIGHT = 800;
const PRODUCT_WIDTH = 700;
const PRODUCT_HEIGHT = 800;

/**
 * Build a single optimized Cloudinary URL with transformations
 * Automatically applies format detection (webp/avif), quality optimization, and resizing
 * 
 * @param publicId - The Cloudinary public ID (without domain or extension)
 * @param resourceType - Type of resource: category, product, logo, or other
 * @param options - Optional customization for transformations
 * @returns Complete optimized URL ready for use in img src
 */
export function buildCloudinaryUrl(
  publicId: string,
  resourceType: ResourceType = 'other',
  options?: UrlOptions
): string {
  if (!publicId) return '';
  if (
    publicId.startsWith('/') ||
    publicId.startsWith('./') ||
    publicId.startsWith('data:') ||
    publicId.startsWith('blob:') ||
    (publicId.startsWith('http') && !isCloudinaryUrl(publicId))
  ) {
    return publicId;
  }

  if (isCloudinaryUrl(publicId)) {
    const extracted = extractPublicId(publicId);
    if (extracted) publicId = extracted;
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload`;

  const quality = options?.quality || 'auto:eco';
  const format = options?.format || 'auto';
  const gravity = options?.gravity || 'auto';
  const crop = options?.crop || 'fill';

  const transformations: Record<string, string | number | boolean>[] = [
    {
      f_auto: format,
      q_auto: quality,
      fl: 'lossy' // Enable lossy optimization for better compression
    }
  ];

  // Determine dimensions based on resource type if not specified
  let width = options?.width;
  let height = options?.height;

  // Fix for simple filenames without folder (e.g. "hiking-boots")
  // Only apply default folder if the ID has NO path at all
  if (resourceType === 'product' && !publicId.startsWith('http')) {
    if (!publicId.includes('/')) {
      publicId = `fashionstore/${publicId}`;
    }
    // If it starts with fashionstore/ but NOT fashionstore/products/ (legacy/mixed data)
    else if (publicId.startsWith('fashionstore/') && !publicId.startsWith('fashionstore/products/')) {
      // This case handles IDs like "fashionstore/item" -> "fashionstore/products/item" 
      // BUT we must be careful. The error logs showing fashionstore/fashionstore suggest
      // some IDs might be 'fashionstore/item' and we were prepending 'fashionstore/products/' blindly?
      // partial fix: let's trust existing folders if they start with fashionstore
      // NOOP - assume if it has a folder, it's correct, OR we need to remap.
      // Let's just fix the duplication case first.
    }
  }

  if (!width && !height) {
    if (resourceType === 'category') {
      width = CATEGORY_WIDTH;
      height = CATEGORY_HEIGHT;
    } else if (resourceType === 'product') {
      width = PRODUCT_WIDTH;
      height = PRODUCT_HEIGHT;
    }
  }

  // Add sizing transformation
  if (width || height) {
    transformations.push({
      w: width || 'auto',
      h: height || 'auto',
      c: crop,
      g: gravity,
      dpr: 'auto' // Device pixel ratio auto-detection
    });
  }

  // Build transformation string
  const transformString = transformations
    .map(t =>
      Object.entries(t)
        .map(([k, v]) => {
          if (v === true) return k;
          if (v === false) return null;
          return `${k}_${v}`;
        })
        .filter(Boolean)
        .join(',')
    )
    .filter(Boolean)
    .join('/');

  // Return complete URL with .auto extension (Cloudinary will deliver best format)
  return `${baseUrl}/${transformString}/${publicId}.auto`;
}

/**
 * Generate a responsive imagery srcset for adaptive image loading
 * Provides multiple resolution options for different viewport sizes
 * 
 * @param publicId - The Cloudinary public ID
 * @param resourceType - Type of resource for automatic sizing decisions
 * @param options - Optional customization
 * @returns HTML srcset attribute value
 *
 * @example
 * <img 
 *   srcSet={buildResponsiveSet('products/hiking-boots', 'product')}
 *   src={buildCloudinaryUrl('products/hiking-boots', 'product')}
 *   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 425px"
 *   alt="Product"
 * />
 */
export function buildResponsiveSet(
  publicId: string,
  resourceType: ResourceType = 'product',
  options?: UrlOptions
): string {
  if (
    !publicId ||
    publicId.startsWith('/') ||
    publicId.startsWith('./') ||
    publicId.startsWith('data:') ||
    publicId.startsWith('blob:') ||
    (publicId.startsWith('http') && !isCloudinaryUrl(publicId))
  ) {
    return '';
  }

  if (isCloudinaryUrl(publicId)) {
    const extracted = extractPublicId(publicId);
    if (extracted) publicId = extracted;
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload`;
  const baseTransforms = 'f_auto,q_auto:eco,fl_lossy';

  // Fix for simple filenames without folder (same as buildCloudinaryUrl)
  if (resourceType === 'product' && !publicId.startsWith('http')) {
    if (!publicId.includes('/')) {
      publicId = `fashionstore/${publicId}`;
    }
  }

  if (resourceType === 'product') {
    // Standard product sizes: mobile, tablet, desktop
    return [
      `${baseUrl}/w_400,${baseTransforms}/${publicId}.auto 400w`,
      `${baseUrl}/w_600,${baseTransforms}/${publicId}.auto 600w`,
      `${baseUrl}/w_700,${baseTransforms}/${publicId}.auto 700w`,
      `${baseUrl}/w_1024,${baseTransforms}/${publicId}.auto 1024w`,
    ].join(', ');
  }

  if (resourceType === 'category') {
    // Category image sizes (wider aspect ratio)
    return [
      `${baseUrl}/w_400,${baseTransforms}/${publicId}.auto 400w`,
      `${baseUrl}/w_700,${baseTransforms}/${publicId}.auto 700w`,
      `${baseUrl}/w_1024,${baseTransforms}/${publicId}.auto 1024w`,
      `${baseUrl}/w_1400,${baseTransforms}/${publicId}.auto 1400w`,
    ].join(', ');
  }

  // Default: single size
  return `${baseUrl}/${baseTransforms}/w_1024/${publicId}.auto 1024w`;
}

/**
 * Batch build multiple URLs - useful for seeding or migrations
 */
export function buildCloudinaryUrls(
  publicIds: Array<{ id: string; type: ResourceType }>,
  options?: UrlOptions
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const item of publicIds) {
    result[item.id] = buildCloudinaryUrl(item.id, item.type, options);
  }

  return result;
}

/**
 * Get suggested dimensions for different resource types
 * Useful for setting width/height attributes on img elements
 */
export function getResourceDimensions(
  resourceType: ResourceType
): { width: number; height: number } | null {
  switch (resourceType) {
    case 'category':
      return { width: CATEGORY_WIDTH, height: CATEGORY_HEIGHT };
    case 'product':
      return { width: PRODUCT_WIDTH, height: PRODUCT_HEIGHT };
    case 'logo':
      return { width: 100, height: 42 };
    default:
      return null;
  }
}

/**
 * Extract public ID from full Cloudinary URL
 * @example
 * extractPublicId('https://res.cloudinary.com/dzaka0idb/image/upload/v123/fashionstore/categories/zapatillas.webp')
 * // Returns: 'fashionstore/categories/zapatillas'
 */
export function extractPublicId(url: string): string | null {
  // Handle already extracted public IDs or simple filenames
  if (!url.includes('/') && !url.includes('http')) return url;

  // Match versioned or unversioned Cloudinary URLs
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return null;

  // Remove extension if present
  const parts = match[1].split('.');
  if (parts.length > 1) {
    parts.pop();
  }
  return parts.join('.');
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

/**
 * Convert an old/unoptimized Cloudinary URL to an optimized one
 * Extracts public ID and rebuilds with optimizations
 */
export function upgradeCloudinaryUrl(
  oldUrl: string,
  resourceType: ResourceType = 'other'
): string | null {
  const publicId = extractPublicId(oldUrl);
  if (!publicId) return null;
  return buildCloudinaryUrl(publicId, resourceType);
}
