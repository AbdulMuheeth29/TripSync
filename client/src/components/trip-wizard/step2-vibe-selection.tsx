import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Waves, Mountain, UtensilsCrossed, Landmark, PartyPopper, Moon, Sparkles } from "lucide-react";

export type TripVibe = "relaxing" | "adventure" | "foodie" | "cultural" | "party" | "nightlife" | "balanced";

interface Step2VibeSelectionProps {
  onNext: (vibe: TripVibe) => void;
  onBack: () => void;
  defaultValue?: TripVibe;
}

const VIBES: Array<{
  id: TripVibe;
  name: string;
  icon: typeof Waves;
  description: string;
  examples: string;
}> = [
  {
    id: "relaxing",
    name: "Relaxing",
    icon: Waves,
    description: "Slow-paced, spa days, and beach lounging",
    examples: "Spa treatments, yoga, sunset watching"
  },
  {
    id: "adventure",
    name: "Adventure",
    icon: Mountain,
    description: "Hiking, extreme sports, and outdoor activities",
    examples: "Surfing, rock climbing, zip-lining"
  },
  {
    id: "foodie",
    name: "Foodie",
    icon: UtensilsCrossed,
    description: "Street food tours, fine dining, and cooking classes",
    examples: "Food markets, wine tasting, chef experiences"
  },
  {
    id: "cultural",
    name: "Cultural",
    icon: Landmark,
    description: "Museums, historical sites, and local traditions",
    examples: "Temples, art galleries, cultural shows"
  },
  {
    id: "party",
    name: "Party",
    icon: PartyPopper,
    description: "Clubs, beach parties, and social events",
    examples: "Nightclubs, pool parties, festivals"
  },
  {
    id: "nightlife",
    name: "Nightlife",
    icon: Moon,
    description: "Bars, live music, and evening entertainment",
    examples: "Rooftop bars, jazz clubs, night markets"
  },
  {
    id: "balanced",
    name: "Balanced",
    icon: Sparkles,
    description: "A mix of everything - something for everyone",
    examples: "Variety of relaxation, activities, and culture"
  }
];

export function Step2VibeSelection({ onNext, onBack, defaultValue }: Step2VibeSelectionProps) {
  const [selectedVibe, setSelectedVibe] = useState<TripVibe | undefined>(defaultValue);

  const handleSubmit = () => {
    if (selectedVibe) {
      onNext(selectedVibe);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">What's your trip vibe?</h2>
        <p className="text-muted-foreground">
          This helps us tailor your itinerary to match your travel style
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VIBES.map((vibe) => {
          const Icon = vibe.icon;
          const isSelected = selectedVibe === vibe.id;

          return (
            <Card
              key={vibe.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md",
                isSelected && "border-primary border-2 bg-primary/5"
              )}
              onClick={() => setSelectedVibe(vibe.id)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "rounded-lg p-2",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{vibe.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {vibe.description}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    e.g., {vibe.examples}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedVibe && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            ✨ Great choice! We'll plan a {VIBES.find(v => v.id === selectedVibe)?.name.toLowerCase()} trip for you.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedVibe}
          className="flex-1"
          size="lg"
        >
          Continue to Accommodation
        </Button>
      </div>
    </div>
  );
}
