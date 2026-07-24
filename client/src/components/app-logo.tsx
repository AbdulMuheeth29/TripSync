/**
 * Global TripSync logo. Import from assets so it is always available (bundled by Vite).
 */
import logoUrl from '@/assets/logo.png';

export interface AppLogoProps {
  className?: string;
  alt?: string;
}

export function AppLogo({ className = 'h-8 w-8 object-contain', alt = 'TripSync' }: AppLogoProps) {
  return <img src={logoUrl} alt={alt} className={className} />;
}
