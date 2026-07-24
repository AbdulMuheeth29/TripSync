import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, MapPin, Navigation, Sparkles, Check } from 'lucide-react';

interface MapViewPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const MAP_FEATURES = [
  'Interactive map view of all trip activities',
  'Real-time location sharing with your group',
  'Directions to activities and accommodations',
  'Nearby recommendations and points of interest',
  'Custom map markers and route planning',
  'Offline map access for your trip',
];

export function MapViewPaywall({ isOpen, onClose, onUpgrade }: MapViewPaywallProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <DialogTitle className="text-center text-2xl">Map View</DialogTitle>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Sparkles className="h-3 w-3 mr-1" />
              Pro Feature
            </Badge>
          </div>
          <DialogDescription className="text-center">
            Visualize your entire trip on an interactive map
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Image */}
          <Card className="p-4 bg-muted/50 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Upgrade to unlock</p>
              </div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Navigation className="h-16 w-16 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Interactive Map Preview</p>
              </div>
            </div>
          </Card>

          {/* Features List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">What you'll get:</h4>
            <div className="space-y-2">
              {MAP_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-0.5 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Upgrade to Pro</p>
              <p className="text-3xl font-bold text-primary mb-1">
                $4.99<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground">14-day free trial • Cancel anytime</p>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button onClick={onUpgrade} className="w-full" size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Start Free Trial
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
