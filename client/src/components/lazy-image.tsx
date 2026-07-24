import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: number;
  placeholderClassName?: string;
}

export function LazyImage({
  src,
  alt,
  fallback = '/placeholder.png',
  aspectRatio,
  placeholderClassName,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  const containerStyle = aspectRatio ? { paddingBottom: `${(1 / aspectRatio) * 100}%` } : {};

  return (
    <div
      className={`relative overflow-hidden ${aspectRatio ? 'relative' : ''} ${placeholderClassName || ''}`}
      style={containerStyle}
    >
      {!isLoaded && <Skeleton className={`absolute inset-0 ${className || ''}`} />}

      <img
        ref={imgRef}
        src={isInView ? (error ? fallback : src) : ''}
        alt={alt}
        className={`${aspectRatio ? 'absolute inset-0 w-full h-full object-cover' : ''} ${className || ''} ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
}
