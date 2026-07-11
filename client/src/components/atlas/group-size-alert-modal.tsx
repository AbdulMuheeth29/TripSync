import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, TrendingUp, DollarSign, Calendar, AlertCircle, Lightbulb } from "lucide-react";

interface GroupSizeRecommendation {
  suggestedSize: number;
  reason: string;
  impact: "budget" | "logistics" | "activities";
}

interface GroupSizeAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroupSize: number;
  recommendations: GroupSizeRecommendation[];
  tripType: string;
  destination: string;
  onAdjustGroup?: () => void;
}

const IMPACT_INFO: Record<GroupSizeRecommendation['impact'], { icon: typeof DollarSign; color: string; label: string }> = {
  budget: { icon: DollarSign, label: "Budget Impact", color: "text-green-600" },
  logistics: { icon: Calendar, label: "Logistics", color: "text-blue-600" },
  activities: { icon: Users, label: "Activities", color: "text-purple-600" }
};

export function GroupSizeAlertModal({
  isOpen,
  onClose,
  currentGroupSize,
  recommendations,
  tripType,
  destination,
  onAdjustGroup
}: GroupSizeAlertModalProps) {
  const topRecommendation = recommendations[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Group Size Optimization</DialogTitle>
          </div>
          <DialogDescription>
            Atlas suggests adjusting your group size for {destination}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Atlas Insight */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary mb-1">Atlas Recommendation</p>
                <p className="text-sm text-muted-foreground">
                  Based on your {tripType} trip to {destination}, I've analyzed the optimal group size
                  for the best experience.
                </p>
              </div>
            </div>
          </Card>

          {/* Current vs Recommended */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 border-amber-200 bg-amber-50">
              <div className="text-center">
                <Users className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Current Size</p>
                <p className="text-3xl font-bold text-amber-900">{currentGroupSize}</p>
                <Badge variant="outline" className="mt-2 bg-amber-100 text-amber-800">
                  People
                </Badge>
              </div>
            </Card>

            <Card className="p-4 border-green-200 bg-green-50">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Recommended</p>
                <p className="text-3xl font-bold text-green-900">{topRecommendation.suggestedSize}</p>
                <Badge className="mt-2 bg-green-100 text-green-800">
                  Optimal
                </Badge>
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-semibold mb-3">Why This Matters</h4>
            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                const impactInfo = IMPACT_INFO[rec.impact];
                const ImpactIcon = impactInfo.icon;

                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <ImpactIcon className={`h-5 w-5 ${impactInfo.color}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {impactInfo.label}
                          </Badge>
                          {rec.suggestedSize === topRecommendation.suggestedSize && index === 0 && (
                            <Badge className="text-xs bg-primary">
                              Primary Reason
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.reason}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Specific Examples */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <h4 className="font-semibold text-blue-900">Practical Examples</h4>
            </div>

            <div className="space-y-2 text-sm text-blue-800">
              {currentGroupSize > topRecommendation.suggestedSize ? (
                <>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Smaller groups ({topRecommendation.suggestedSize} people) can more easily book restaurant reservations and coordinate schedules
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Transportation costs per person are usually lower with {topRecommendation.suggestedSize} people (optimal for ride-sharing)
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Decision-making is faster and conflicts are reduced with a smaller group
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Larger groups ({topRecommendation.suggestedSize} people) can split accommodation costs more effectively
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Group activities and tours often have better per-person rates with {topRecommendation.suggestedSize}+ people
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      More people means more diverse perspectives and shared experiences
                    </span>
                  </p>
                </>
              )}
            </div>
          </Card>

          {/* Warning */}
          {Math.abs(currentGroupSize - topRecommendation.suggestedSize) > 5 && (
            <Card className="p-3 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-900">
                  <strong>Heads up:</strong> Your current group size differs significantly from the
                  optimal size. This may impact budget, logistics, and activity options.
                </p>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Keep Current Size
          </Button>
          {onAdjustGroup && (
            <Button onClick={onAdjustGroup} className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Adjust Group
            </Button>
          )}
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground -mt-2">
          This is a suggestion based on typical travel patterns for {destination}
        </p>
      </DialogContent>
    </Dialog>
  );
}
