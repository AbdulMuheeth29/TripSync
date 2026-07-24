import { useState } from 'react';
import { getOptimizedImageUrl, type ImageTransformOptions } from '@/lib/assets';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  fallback?: string;
  showLoader?: boolean;
}

/**
 * Optimized image component with lazy loading and format optimization
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 85,
  format,
  fallback,
  showLoader = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const transformOptions: ImageTransformOptions = {
    width,
    height,
    quality,
    format,
  };

  const optimizedSrc = getOptimizedImageUrl(src, transformOptions);
  const fallbackSrc = fallback || '/assets/ui/placeholder.svg';

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && showLoader && <div className="absolute inset-0 bg-muted animate-pulse" />}

      <img
        src={error ? fallbackSrc : optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface LocationImageProps extends Omit<OptimizedImageProps, 'src' | 'alt'> {
  location: string;
  countryCode?: string;
  type?: 'hero' | 'thumbnail';
}

/**
 * Location-based image component
 * Automatically fetches the right image for a destination
 */
export function LocationImage({
  location,
  countryCode,
  type = 'hero',
  ...props
}: LocationImageProps) {
  const [imageData, setImageData] = useState<{ url: string; alt: string } | null>(null);

  useState(() => {
    import('@/lib/assets').then(({ getLocationImage }) => {
      const data = getLocationImage(location, countryCode);
      setImageData(data);
    });
  });

  if (!imageData) {
    return <div className={cn('bg-muted animate-pulse', props.className)} />;
  }

  return <OptimizedImage src={imageData.url} alt={imageData.alt} {...props} />;
}

interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'srcSet'> {
  srcSet?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

/**
 * Responsive image component with srcset support
 */
export function ResponsiveImage({ src, srcSet, alt, ...props }: ResponsiveImageProps) {
  const generateSrcSet = () => {
    if (!srcSet) return undefined;

    const parts: string[] = [];
    if (srcSet.sm) parts.push(`${srcSet.sm} 640w`);
    if (srcSet.md) parts.push(`${srcSet.md} 768w`);
    if (srcSet.lg) parts.push(`${srcSet.lg} 1024w`);
    if (srcSet.xl) parts.push(`${srcSet.xl} 1280w`);

    return parts.length > 0 ? parts.join(', ') : undefined;
  };

  return (
    <OptimizedImage
      src={src}
      srcSet={generateSrcSet()}
      sizes="(max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1280px"
      alt={alt}
      {...props}
    />
  );
}
