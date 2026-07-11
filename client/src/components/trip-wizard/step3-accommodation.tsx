import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, Home, Sparkles } from "lucide-react";

export type AccommodationType = "hotels" | "airbnb" | "mix";

interface Step3AccommodationProps {
  onNext: (accommodation: AccommodationType) => void;
  onBack: () => void;
  defaultValue?: AccommodationType;
}

const ACCOMMODATION_OPTIONS: Array<{
  id: AccommodationType;
  name: string;
  icon: typeof Building2;
  description: string;
  pros: string[];
}> = [
  {
    id: "hotels",
    name: "Hotels & Resorts",
    icon: Building2,
    description: "Professional service, amenities, and consistent quality",
    pros: ["Daily housekeeping", "Hotel amenities (pool, gym, spa)", "Concierge service", "Breakfast included"]
  },
  {
    id: "airbnb",
    name: "Airbnb & Vacation Rentals",
    icon: Home,
    description: "Local experience, privacy, and often more space",
    pros: ["Full kitchen", "More space for groups", "Local neighborhood", "Usually more affordable"]
  },
  {
    id: "mix",
    name: "Mix of Both",
    icon: Sparkles,
    description: "Best of both worlds - variety throughout your trip",
    pros: ["Hotel for convenience", "Airbnb for local vibes", "Flexibility", "Diverse experiences"]
  }
];

export function Step3Accommodation({ onNext, onBack, defaultValue }: Step3AccommodationProps) {
  const [selectedType, setSelectedType] = useState<AccommodationType | undefined>(defaultValue);

  const handleSubmit = () => {
    if (selectedType) {
      onNext(selectedType);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Where would you like to stay?</h2>
        <p className="text-muted-foreground">
          Choose your preferred accommodation style
        </p>
      </div>

      <div className="space-y-4">
        {ACCOMMODATION_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.id;

          return (
            <Card
              key={option.id}
              className={cn(
                "p-5 cursor-pointer transition-all hover:border-primary hover:shadow-md",
                isSelected && "border-primary border-2 bg-primary/5"
              )}
              onClick={() => setSelectedType(option.id)}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "rounded-lg p-3",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{option.name}</h3>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        Selected
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {option.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {option.pros.map((pro, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            ✨ We'll recommend {selectedType === "mix" ? "a variety of" : ""} {ACCOMMODATION_OPTIONS.find(o => o.id === selectedType)?.name.toLowerCase()} for your stay.
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
          disabled={!selectedType}
          className="flex-1"
          size="lg"
        >
          Continue to Dining
        </Button>
      </div>
    </div>
  );
}
