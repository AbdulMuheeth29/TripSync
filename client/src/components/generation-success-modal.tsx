import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Plane, Hotel, Utensils, Activity, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface GenerationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTrip: () => void;
  stats?: {
    flights?: number;
    hotels?: number;
    meals?: number;
    activities?: number;
  };
}

export function GenerationSuccessModal({
  isOpen,
  onClose,
  onViewTrip,
  stats = {
    flights: 2,
    hotels: 3,
    meals: 12,
    activities: 18
  }
}: GenerationSuccessModalProps) {

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti when modal opens
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Silently fail if confetti doesn't load
      }
    }
  }, [isOpen]);

  const generatedItems = [
    { icon: Plane, label: "Flights", count: stats.flights || 0, color: "text-blue-500" },
    { icon: Hotel, label: "Accommodations", count: stats.hotels || 0, color: "text-purple-500" },
    { icon: Utensils, label: "Dining", count: stats.meals || 0, color: "text-orange-500" },
    { icon: Activity, label: "Activities", count: stats.activities || 0, color: "text-green-500" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Your Trip is Ready! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            AI has crafted a personalized itinerary based on your preferences
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Generated Items Summary */}
          <div className="grid grid-cols-2 gap-3">
            {generatedItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-background ${item.color}`}>
                    <ItemIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{item.count}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* What's Next */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
            <div className="font-medium text-sm flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              What's next?
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground ml-6">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Review and vote on activities with your group</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Customize the itinerary to your liking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Chat with Atlas AI for recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Track expenses and settle up easily</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="default"
            onClick={onViewTrip}
            className="w-full"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            View Your Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
