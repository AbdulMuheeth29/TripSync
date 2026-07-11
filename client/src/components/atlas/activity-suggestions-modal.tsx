import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, MapPin, Clock, DollarSign, Users, ThumbsUp, Calendar, Star } from "lucide-react";
import { useState } from "react";

interface ActivitySuggestion {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  duration: string;
  estimatedCost: number;
  bestFor: string[];
  rating: number;
  popularity: "trending" | "hidden_gem" | "must_see";
  timeOfDay: "morning" | "afternoon" | "evening" | "any";
}

interface ActivitySuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: ActivitySuggestion[];
  destination: string;
  tripVibe?: string;
  onAddToItinerary: (activityIds: string[]) => void;
  currency?: string;
}

const POPULARITY_LABELS: Record<ActivitySuggestion['popularity'], { label: string; color: string; icon: string }> = {
  trending: { label: "Trending", color: "bg-orange-100 text-orange-800", icon: "🔥" },
  hidden_gem: { label: "Hidden Gem", color: "bg-purple-100 text-purple-800", icon: "💎" },
  must_see: { label: "Must-See", color: "bg-blue-100 text-blue-800", icon: "⭐" }
};

export function ActivitySuggestionsModal({
  isOpen,
  onClose,
  suggestions,
  destination,
  tripVibe,
  onAddToItinerary,
  currency = "USD"
}: ActivitySuggestionsModalProps) {
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  const handleToggleActivity = (activityId: string) => {
    setSelectedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedActivities(new Set(suggestions.map(s => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedActivities(new Set());
  };

  const handleAddSelected = () => {
    onAddToItinerary(Array.from(selectedActivities));
    setSelectedActivities(new Set());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Activity Suggestions</DialogTitle>
          </div>
          <DialogDescription>
            Personalized recommendations for <strong>{destination}</strong>
            {tripVibe && ` with a ${tripVibe} vibe`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedActivities.size} of {suggestions.length} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Clear
              </Button>
            </div>
          </div>

          {/* Atlas Insight */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary mb-1">Atlas AI Insight</p>
                <p className="text-sm text-muted-foreground">
                  These activities are curated based on your {tripVibe || "trip"} preferences, group size, and budget.
                  Select the ones you like and I'll add them to your itinerary.
                </p>
              </div>
            </div>
          </Card>

          {/* Activity List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {suggestions.map((activity) => {
                const isSelected = selectedActivities.has(activity.id);
                const popularityInfo = POPULARITY_LABELS[activity.popularity];

                return (
                  <Card
                    key={activity.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected ? "border-primary border-2 bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleToggleActivity(activity.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleActivity(activity.id)}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{activity.name}</h4>
                          <Badge className={popularityInfo.color}>
                            {popularityInfo.icon} {popularityInfo.label}
                          </Badge>
                        </div>

                        {/* Rating & Category */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium">{activity.rating.toFixed(1)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.category}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-3">
                          {activity.description}
                        </p>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Location</p>
                              <p className="text-sm font-medium truncate">{activity.location}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="text-sm font-medium">{activity.duration}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Est. Cost</p>
                              <p className="text-sm font-medium">{formatCurrency(activity.estimatedCost)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Best For</p>
                              <p className="text-sm font-medium capitalize">{activity.timeOfDay}</p>
                            </div>
                          </div>
                        </div>

                        {/* Best For Tags */}
                        {activity.bestFor.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {activity.bestFor.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          {/* Summary */}
          {selectedActivities.size > 0 && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      {selectedActivities.size} {selectedActivities.size === 1 ? 'activity' : 'activities'} selected
                    </p>
                    <p className="text-xs text-green-700">
                      Estimated total: {formatCurrency(
                        suggestions
                          .filter(s => selectedActivities.has(s.id))
                          .reduce((sum, s) => sum + s.estimatedCost, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button
            onClick={handleAddSelected}
            disabled={selectedActivities.size === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add {selectedActivities.size > 0 ? `${selectedActivities.size}` : ''} to Itinerary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
