import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Check, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeaturePaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: {
    name: string;
    description: string;
    icon: string;
    benefits: string[];
  };
}

const FEATURE_CONFIGS = {
  receipt_ocr: {
    name: "Receipt OCR",
    description: "Automatically extract expense data from receipt photos using AI",
    icon: "📸",
    benefits: [
      "AI extracts amount, merchant, date automatically",
      "Supports multiple currencies",
      "Save time on manual data entry",
      "More accurate expense tracking"
    ]
  },
  currency_conversion: {
    name: "Currency Conversion",
    description: "Track expenses in multiple currencies with real-time exchange rates",
    icon: "💱",
    benefits: [
      "10+ supported currencies",
      "Real-time exchange rates",
      "Automatic conversion for multi-country trips",
      "See totals in your preferred currency"
    ]
  },
  map_view: {
    name: "Interactive Map View",
    description: "Visualize your trip itinerary on an interactive map",
    icon: "🗺️",
    benefits: [
      "See all activities plotted on map",
      "Optimize travel routes",
      "Discover nearby attractions",
      "Export map to Google Maps"
    ]
  },
  email_import: {
    name: "Email Import",
    description: "Paste booking confirmation emails and let AI extract the details",
    icon: "📧",
    benefits: [
      "Auto-extract flights, hotels, activities",
      "Parse dates, times, prices automatically",
      "Support for major booking sites",
      "Save hours of manual entry"
    ]
  },
  advanced_analytics: {
    name: "Advanced Analytics",
    description: "Deep insights into trip budget, spending patterns, and group behavior",
    icon: "📊",
    benefits: [
      "Spending breakdown by category",
      "Budget vs. actual analysis",
      "Member contribution tracking",
      "Export reports (CSV, PDF)"
    ]
  },
  priority_support: {
    name: "Priority Atlas AI",
    description: "Skip the queue and get instant responses from Atlas AI",
    icon: "⚡",
    benefits: [
      "Faster AI response times",
      "No rate limiting",
      "Access to advanced AI features",
      "Early access to new AI capabilities"
    ]
  }
};

export function FeaturePaywall({
  isOpen,
  onClose,
  onUpgrade,
  feature
}: FeaturePaywallProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
              {feature.icon}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <DialogTitle className="text-center text-xl">
              {feature.name}
            </DialogTitle>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              Pro Feature
            </Badge>
          </div>
          <DialogDescription className="text-center">
            {feature.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Feature Benefits */}
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20 space-y-3">
            <div className="font-semibold text-sm">What you'll get:</div>
            <div className="space-y-2">
              {feature.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg bg-muted/50 p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold">TripSync Pro</div>
                <div className="text-sm text-muted-foreground">Unlock all features</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$4.99</div>
                <div className="text-xs text-muted-foreground">/month</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t border-border mt-2">
              Cancel anytime • 14-day free trial
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center text-xs text-muted-foreground">
            Join 10,000+ travelers planning smarter trips with Pro
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button onClick={onUpgrade} className="w-full sm:w-auto" size="lg">
            <Zap className="h-4 w-4 mr-2" />
            Start Free Trial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to show paywall for specific features
export function showFeaturePaywall(featureKey: keyof typeof FEATURE_CONFIGS) {
  return FEATURE_CONFIGS[featureKey];
}
