import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Lightbulb, MapPin, Coffee, Utensils, AlertCircle, Shield, Train, DollarSign } from "lucide-react";

interface LocalTip {
  id: string;
  category: "food" | "transportation" | "safety" | "money" | "culture" | "hidden_gem";
  title: string;
  description: string;
  priority: "essential" | "recommended" | "nice_to_know";
}

interface LocalTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  tips: LocalTip[];
  onSaveTip?: (tipId: string) => void;
}

const TIP_CATEGORIES: Record<LocalTip['category'], { icon: typeof Coffee; label: string; color: string }> = {
  food: { icon: Utensils, label: "Food & Dining", color: "bg-orange-100 text-orange-800" },
  transportation: { icon: Train, label: "Getting Around", color: "bg-blue-100 text-blue-800" },
  safety: { icon: Shield, label: "Safety", color: "bg-red-100 text-red-800" },
  money: { icon: DollarSign, label: "Money Tips", color: "bg-green-100 text-green-800" },
  culture: { icon: MapPin, label: "Culture & Customs", color: "bg-purple-100 text-purple-800" },
  hidden_gem: { icon: Lightbulb, label: "Hidden Gems", color: "bg-amber-100 text-amber-800" }
};

const PRIORITY_BADGES: Record<LocalTip['priority'], { label: string; variant: "default" | "secondary" | "outline" }> = {
  essential: { label: "Essential", variant: "default" },
  recommended: { label: "Recommended", variant: "secondary" },
  nice_to_know: { label: "Nice to Know", variant: "outline" }
};

export function LocalTipsModal({
  isOpen,
  onClose,
  destination,
  tips,
  onSaveTip
}: LocalTipsModalProps) {
  const essentialTips = tips.filter(t => t.priority === "essential");
  const groupedTips = tips.reduce((acc, tip) => {
    if (!acc[tip.category]) {
      acc[tip.category] = [];
    }
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<LocalTip['category'], LocalTip[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Local Insider Tips</DialogTitle>
          </div>
          <DialogDescription>
            Essential knowledge for <strong>{destination}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Atlas Introduction */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary mb-1">Atlas Local Guide</p>
                <p className="text-sm text-muted-foreground">
                  I've gathered insider tips from locals and experienced travelers to help you make the most
                  of your trip to {destination}. Pay special attention to essential tips!
                </p>
              </div>
            </div>
          </Card>

          {/* Essential Tips Highlight */}
          {essentialTips.length > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <h4 className="font-semibold text-amber-900">Essential Tips</h4>
              </div>
              <div className="space-y-2">
                {essentialTips.map((tip) => (
                  <div key={tip.id} className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <p className="text-sm text-amber-900">
                      <strong>{tip.title}:</strong> {tip.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tips by Category */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {Object.entries(groupedTips).map(([category, categoryTips]) => {
                const categoryInfo = TIP_CATEGORIES[category as LocalTip['category']];
                const CategoryIcon = categoryInfo.icon;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">{categoryInfo.label}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {categoryTips.length}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {categoryTips.map((tip) => {
                        const priorityBadge = PRIORITY_BADGES[tip.priority];

                        return (
                          <Card key={tip.id} className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h5 className="font-semibold">{tip.title}</h5>
                              <Badge
                                variant={priorityBadge.variant}
                                className="text-xs flex-shrink-0"
                              >
                                {priorityBadge.label}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              {tip.description}
                            </p>

                            <div className="flex items-center gap-2">
                              <Badge className={`${categoryInfo.color} text-xs`}>
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {categoryInfo.label}
                              </Badge>

                              {onSaveTip && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => onSaveTip(tip.id)}
                                >
                                  Save to Notes
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Pro Tip */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-900">
                <strong>Pro Tip:</strong> Share these tips with your group so everyone is prepared.
                You can save specific tips to your trip notes for easy reference later.
              </p>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
