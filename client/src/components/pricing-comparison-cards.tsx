import { Button } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingPlan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  badge?: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for trying out TripSync",
    features: [
      "1 active trip",
      "Up to 5 members per trip",
      "1 AI itinerary generation per trip",
      "Basic expense tracking",
      "Group chat",
      "500 MB file storage"
    ],
    buttonText: "Get Started",
  },
  {
    name: "Pro",
    price: 4.99,
    period: "month",
    description: "For frequent travelers",
    features: [
      "Unlimited trips",
      "Unlimited members",
      "Unlimited AI generations",
      "Advanced expense tracking with OCR",
      "Currency conversion",
      "Map view & location sharing",
      "Email import for bookings",
      "5 GB file storage",
      "Priority Atlas AI responses",
      "Export reports (PDF, CSV)"
    ],
    highlighted: true,
    buttonText: "Start Free Trial",
    badge: "Most Popular"
  },
  {
    name: "Teams",
    price: 9.99,
    period: "month",
    description: "For travel agencies & groups",
    features: [
      "Everything in Pro",
      "Multi-trip dashboard",
      "Advanced analytics",
      "Custom branding",
      "Priority support",
      "50 GB file storage",
      "API access",
      "Dedicated account manager"
    ],
    buttonText: "Contact Sales",
  }
];

interface PricingComparisonCardsProps {
  onSelectPlan?: (planName: string) => void;
}

export function PricingComparisonCards({ onSelectPlan }: PricingComparisonCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {PRICING_PLANS.map((plan) => (
        <Card
          key={plan.name}
          className={cn(
            "p-8 flex flex-col",
            plan.highlighted && "border-primary border-2 shadow-lg relative"
          )}
        >
          {plan.badge && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              {plan.badge}
            </Badge>
          )}

          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className="text-muted-foreground text-sm">{plan.description}</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground">/{plan.period}</span>
            </div>
          </div>

          <Button
            onClick={() => onSelectPlan?.(plan.name)}
            className={cn(
              "w-full mb-8",
              plan.highlighted && "bg-primary hover:bg-primary/90"
            )}
            variant={plan.highlighted ? "default" : "outline"}
          >
            {plan.buttonText}
          </Button>

          <div className="space-y-3 flex-1">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-0.5 mt-0.5">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
