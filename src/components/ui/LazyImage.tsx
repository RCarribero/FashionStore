import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    width?: number | string;
    height?: number | string;
}

export default function LazyImage({ src, alt, className = '', ...props }: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (observer) observer.disconnect();
        };
    }, []);

    return (
        <div className={`relative overflow-hidden bg-slate-100 ${className}`} style={{ width: props.width, height: props.height }}>
            {isInView ? (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    className={`transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                    onLoad={() => setIsLoaded(true)}
                    {...props}
                />
            ) : (
                <div ref={imgRef} className="w-full h-full" />
            )}

            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            )}
        </div>
    );
}
