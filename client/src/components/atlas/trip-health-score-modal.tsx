import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Heart, CheckCircle2, AlertCircle, Clock, Users, DollarSign, Calendar, TrendingUp } from "lucide-react";

interface HealthMetric {
  category: "planning" | "budget" | "collaboration" | "timeline";
  score: number; // 0-100
  status: "excellent" | "good" | "needs_attention" | "critical";
  completedItems: number;
  totalItems: number;
  recommendations: string[];
}

interface TripHealthScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  overallScore: number; // 0-100
  metrics: HealthMetric[];
  tripName: string;
  daysUntilTrip: number;
  onTakeAction?: (category: HealthMetric['category']) => void;
}

const CATEGORY_INFO: Record<HealthMetric['category'], { icon: typeof Calendar; label: string; color: string }> = {
  planning: { icon: Calendar, label: "Trip Planning", color: "text-blue-600" },
  budget: { icon: DollarSign, label: "Budget Management", color: "text-green-600" },
  collaboration: { icon: Users, label: "Group Collaboration", color: "text-purple-600" },
  timeline: { icon: Clock, label: "Timeline Progress", color: "text-amber-600" }
};

const STATUS_CONFIG: Record<HealthMetric['status'], { color: string; bgColor: string; label: string }> = {
  excellent: { color: "text-green-700", bgColor: "bg-green-100", label: "Excellent" },
  good: { color: "text-blue-700", bgColor: "bg-blue-100", label: "Good" },
  needs_attention: { color: "text-amber-700", bgColor: "bg-amber-100", label: "Needs Attention" },
  critical: { color: "text-red-700", bgColor: "bg-red-100", label: "Critical" }
};

export function TripHealthScoreModal({
  isOpen,
  onClose,
  overallScore,
  metrics,
  tripName,
  daysUntilTrip,
  onTakeAction
}: TripHealthScoreModalProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const criticalItems = metrics.filter(m => m.status === "critical");
  const needsAttentionItems = metrics.filter(m => m.status === "needs_attention");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Trip Health Score</DialogTitle>
          </div>
          <DialogDescription>
            Overall planning health for <strong>{tripName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Overall Health Score</h3>
                <p className="text-sm text-muted-foreground">
                  {daysUntilTrip} days until trip
                </p>
              </div>

              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                  {Math.round(overallScore)}
                </div>
                <Badge className={getScoreColor(overallScore).replace('text-', 'bg-').replace('600', '100')}>
                  {getScoreLabel(overallScore)}
                </Badge>
              </div>
            </div>

            <Progress
              value={overallScore}
              className="h-3 mb-3"
              indicatorClassName={getProgressColor(overallScore)}
            />

            <Card className="p-3 bg-white/50">
              <div className="flex items-start gap-2">
                <Heart className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-sm">
                  {overallScore >= 80 && "Your trip is in great shape! Keep up the excellent planning."}
                  {overallScore >= 60 && overallScore < 80 && "You're on the right track. Address a few items to improve your score."}
                  {overallScore >= 40 && overallScore < 60 && "Your trip needs some attention. Focus on the areas highlighted below."}
                  {overallScore < 40 && "Several areas need immediate attention. Let's get your trip back on track!"}
                </p>
              </div>
            </Card>
          </Card>

          {/* Critical Alerts */}
          {criticalItems.length > 0 && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Critical Items ({criticalItems.length})</h4>
                  <p className="text-sm text-red-800">These require immediate attention</p>
                </div>
              </div>

              <div className="space-y-2">
                {criticalItems.map((metric, index) => {
                  const categoryInfo = CATEGORY_INFO[metric.category];
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium text-red-900">{categoryInfo.label}</span>
                      {onTakeAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTakeAction(metric.category)}
                          className="text-red-600 border-red-300"
                        >
                          Take Action
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Health Metrics */}
          <div>
            <h4 className="font-semibold mb-3">Health Breakdown</h4>
            <div className="space-y-3">
              {metrics.map((metric, index) => {
                const categoryInfo = CATEGORY_INFO[metric.category];
                const statusConfig = STATUS_CONFIG[metric.status];
                const CategoryIcon = categoryInfo.icon;

                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusConfig.bgColor}`}>
                          <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
                        </div>

                        <div>
                          <h5 className="font-semibold">{categoryInfo.label}</h5>
                          <p className="text-xs text-muted-foreground">
                            {metric.completedItems} of {metric.totalItems} items complete
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                          {Math.round(metric.score)}
                        </div>
                        <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} text-xs`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <Progress
                      value={metric.score}
                      className="h-2 mb-3"
                      indicatorClassName={getProgressColor(metric.score)}
                    />

                    {metric.recommendations.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Recommendations:</p>
                        {metric.recommendations.map((rec, recIndex) => (
                          <div key={recIndex} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {onTakeAction && metric.status !== "excellent" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTakeAction(metric.category)}
                        className="w-full mt-3"
                      >
                        Improve This Area
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Improvement Tip */}
          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Quick Win</h4>
                <p className="text-sm text-green-800">
                  {needsAttentionItems.length > 0
                    ? `Focus on improving "${CATEGORY_INFO[needsAttentionItems[0].category].label}" for the biggest impact on your overall score.`
                    : "Your trip is well-planned! Keep monitoring as the departure date approaches."}
                </p>
              </div>
            </div>
          </Card>

          {/* Atlas Message */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-900">
                <strong>Atlas Insight:</strong> I'll keep monitoring your trip health and send proactive alerts
                when things need attention. Check back regularly to maintain a high score!
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
