import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Car, Train, Plane, Bus, Navigation, Clock, DollarSign, Leaf, ThumbsUp } from "lucide-react";

interface TransportOption {
  id: string;
  type: "flight" | "train" | "bus" | "car_rental" | "rideshare" | "public_transit";
  name: string;
  provider?: string;
  description: string;
  duration: string;
  estimatedCost: number;
  ecoFriendly: boolean;
  pros: string[];
  cons: string[];
  bookingUrl?: string;
}

interface TransportationRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: TransportOption[];
  fromLocation: string;
  toLocation: string;
  currency?: string;
  onSelectOption?: (optionId: string) => void;
}

const TRANSPORT_ICONS: Record<TransportOption['type'], typeof Car> = {
  flight: Plane,
  train: Train,
  bus: Bus,
  car_rental: Car,
  rideshare: Navigation,
  public_transit: Bus
};

export function TransportationRecommendationsModal({
  isOpen,
  onClose,
  options,
  fromLocation,
  toLocation,
  currency = "USD",
  onSelectOption
}: TransportationRecommendationsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const cheapestOption = options.reduce((min, option) =>
    option.estimatedCost < min.estimatedCost ? option : min
  , options[0]);

  const fastestOption = options.reduce((fastest, option) => {
    const currentMinutes = parseDuration(option.duration);
    const fastestMinutes = parseDuration(fastest.duration);
    return currentMinutes < fastestMinutes ? option : fastest;
  }, options[0]);

  function parseDuration(duration: string): number {
    const hours = duration.match(/(\d+)h/)?.[1] || '0';
    const minutes = duration.match(/(\d+)m/)?.[1] || '0';
    return parseInt(hours) * 60 + parseInt(minutes);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Transportation Options</DialogTitle>
          </div>
          <DialogDescription>
            Getting from <strong>{fromLocation}</strong> to <strong>{toLocation}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Atlas Recommendation */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary mb-1">Atlas Recommendation</p>
                <p className="text-sm text-muted-foreground">
                  Based on your budget and timeline, I recommend <strong>{cheapestOption?.name}</strong> for
                  the best value ({formatCurrency(cheapestOption?.estimatedCost)}).
                  If speed is priority, go with <strong>{fastestOption?.name}</strong> ({fastestOption?.duration}).
                </p>
              </div>
            </div>
          </Card>

          {/* Transportation Options */}
          <div className="space-y-3">
            {options.map((option) => {
              const Icon = TRANSPORT_ICONS[option.type];
              const isCheapest = option.id === cheapestOption?.id;
              const isFastest = option.id === fastestOption?.id;

              return (
                <Card
                  key={option.id}
                  className="p-5 transition-all hover:border-primary cursor-pointer"
                  onClick={() => onSelectOption?.(option.id)}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{option.name}</h4>
                            {option.ecoFriendly && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <Leaf className="h-3 w-3 mr-1" />
                                Eco-Friendly
                              </Badge>
                            )}
                          </div>
                          {option.provider && (
                            <p className="text-sm text-muted-foreground">
                              via {option.provider}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {isCheapest && (
                          <Badge className="bg-green-100 text-green-800">
                            Best Value
                          </Badge>
                        )}
                        {isFastest && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Fastest
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>

                    {/* Key Info */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-semibold">{option.duration}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Est. Cost</p>
                          <p className="font-semibold">{formatCurrency(option.estimatedCost)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pros & Cons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          Pros
                        </p>
                        <ul className="space-y-1">
                          {option.pros.map((pro, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-2">Cons</p>
                        <ul className="space-y-1">
                          {option.cons.map((con, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Booking Link */}
                    {option.bookingUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(option.bookingUrl, '_blank');
                        }}
                      >
                        View Booking Options
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Eco Tip */}
          {options.some(o => o.ecoFriendly) && (
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="flex items-start gap-2">
                <Leaf className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-xs text-green-900">
                  <strong>Eco Tip:</strong> Consider choosing eco-friendly transportation options to reduce
                  your carbon footprint during the trip.
                </p>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
