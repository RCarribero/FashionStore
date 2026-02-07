/**
 * ResponsiveImage.tsx - Optimized responsive image component with lazy loading
 * Features:
 * - Automatic srcset generation for responsive loading
 * - LazyLoad with IntersectionObserver
 * - Skeleton loading state
 * - Format auto-detection (WebP/AVIF)
 * - Explicit dimensions to prevent CLS
 *
 * @example
 * <ResponsiveImage 
 *   publicId="fashionstore/categories/zapatillas"
 *   alt="Zapatillas"
 *   type="category"
 *   width={1024}
 *   height={800}
 * />
 */

import React, { useEffect, useRef, useState } from 'react';
import { buildCloudinaryUrl, buildResponsiveSet, type ResourceType } from '../../lib/services/cloudinary-url';

interface ResponsiveImageProps {
  publicId: string;
  alt: string;
  type?: ResourceType;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

export function ResponsiveImage({
  publicId,
  alt,
  type = 'other',
  width,
  height,
  priority = false,
  className = '',
  onClick,
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return; // Skip if already marked for loading

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const src = buildCloudinaryUrl(publicId, type, { width, height });
  const srcSet = buildResponsiveSet(publicId, type);

  // Determine placeholder aspect ratio
  const aspectRatio = width && height ? (width / height).toFixed(3) : undefined;

  return (
    <div
      className={`relative bg-slate-200 overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
      )}

      {/* Lazy-loaded image */}
      {isInView || priority ? (
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          sizes="
            (max-width: 640px) 100vw,
            (max-width: 1024px) 50vw,
            (max-width: 1536px) 33vw,
            25vw
          "
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setIsLoaded(true);
            onError?.();
          }}
          onClick={onClick}
        />
      ) : (
        // Placeholder while waiting for intersection
        <div className="w-full h-full bg-slate-300" />
      )}
    </div>
  );
}

/**
 * CategoryImage - Specialized version for category images
 */
export function CategoryImage({
  publicId,
  alt,
  className = '',
  onClick,
}: Omit<ResponsiveImageProps, 'type'> & { onClick?: () => void }) {
  return (
    <ResponsiveImage
      publicId={publicId}
      alt={alt}
      type="category"
      width={1024}
      height={800}
      className={className}
      onClick={onClick}
    />
  );
}

/**
 * ProductImage - Specialized version for product images with standard dimensions
 */
export function ProductImage({
  publicId,
  alt,
  priority = false,
  className = '',
  onClick,
}: Omit<ResponsiveImageProps, 'type'>) {
  return (
    <ResponsiveImage
      publicId={publicId}
      alt={alt}
      type="product"
      width={700}
      height={800}
      priority={priority}
      className={className}
      onClick={onClick}
    />
  );
}

/**
 * Logo - Specialized version for logos and small images
 */
export function LogoImage({
  publicId,
  alt,
  className = '',
}: Omit<ResponsiveImageProps, 'type'>) {
  return (
    <ResponsiveImage
      publicId={publicId}
      alt={alt}
      type="logo"
      width={100}
      height={42}
      priority={true}
      className={className}
    />
  );
}
