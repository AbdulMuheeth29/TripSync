import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, DollarSign, Users, Vote } from "lucide-react";

interface TripHealthScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthData: {
    score: number;
    completionPercentage: number;
    budgetUsagePercentage: number;
    daysUntilTrip: number | null;
    stuckVotesCount: number;
    inactiveDays: number;
    issues: string[];
  };
}

export function TripHealthScoreModal({
  isOpen,
  onClose,
  healthData
}: TripHealthScoreModalProps) {
  const { score, completionPercentage, budgetUsagePercentage, daysUntilTrip, stuckVotesCount, inactiveDays, issues } = healthData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Excellent", variant: "default" as const };
    if (score >= 60) return { label: "Good", variant: "secondary" as const };
    if (score >= 40) return { label: "Needs Attention", variant: "outline" as const };
    return { label: "Critical", variant: "destructive" as const };
  };

  const scoreBadge = getScoreBadge(score);

  const metrics = [
    {
      label: "Itinerary Completion",
      value: completionPercentage,
      icon: Activity,
      target: 100,
      unit: "%",
      status: completionPercentage >= 70 ? "good" : completionPercentage >= 40 ? "warning" : "critical"
    },
    {
      label: "Budget Usage",
      value: budgetUsagePercentage,
      icon: DollarSign,
      target: 100,
      unit: "%",
      status: budgetUsagePercentage <= 100 ? "good" : budgetUsagePercentage <= 120 ? "warning" : "critical"
    },
    {
      label: "Days Until Trip",
      value: daysUntilTrip || 0,
      icon: Clock,
      target: null,
      unit: " days",
      status: !daysUntilTrip || daysUntilTrip > 14 ? "good" : daysUntilTrip > 7 ? "warning" : "critical"
    },
    {
      label: "Stuck Votes",
      value: stuckVotesCount,
      icon: Vote,
      target: 0,
      unit: "",
      status: stuckVotesCount === 0 ? "good" : stuckVotesCount <= 2 ? "warning" : "critical"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Trip Health Score
          </DialogTitle>
          <DialogDescription>
            Real-time analysis of your trip planning progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Score */}
          <div className="text-center space-y-4 p-6 rounded-lg bg-muted/30 border border-border">
            <div className={`text-7xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className="space-y-2">
              <Badge variant={scoreBadge.variant} className="text-sm px-4 py-1">
                {scoreBadge.label}
              </Badge>
              <p className="text-sm text-muted-foreground">
                out of 100 points
              </p>
            </div>
            <Progress value={score} className="h-3" />
          </div>

          {/* Metrics Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Detailed Metrics
            </h3>
            <div className="grid gap-3">
              {metrics.map((metric) => {
                const MetricIcon = metric.icon;
                const statusColor = metric.status === "good" ? "text-green-500" : metric.status === "warning" ? "text-yellow-500" : "text-red-500";

                return (
                  <div key={metric.label} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${statusColor}`}>
                        <MetricIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{metric.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {metric.target !== null ? `Target: ${metric.target}${metric.unit}` : "Informational"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${statusColor}`}>
                        {Math.round(metric.value)}{metric.unit}
                      </div>
                      {metric.status === "good" && <CheckCircle className="h-4 w-4 text-green-500 ml-auto mt-1" />}
                      {metric.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 ml-auto mt-1" />}
                      {metric.status === "critical" && <TrendingDown className="h-4 w-4 text-red-500 ml-auto mt-1" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Issues & Recommendations */}
          {issues.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Issues Detected
              </h3>
              <div className="space-y-2">
                {issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{issue.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {score < 80 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
              <div className="font-medium text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Recommendations to Improve
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground ml-6">
                {completionPercentage < 70 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Add more activities to complete your daily itinerary</span>
                  </li>
                )}
                {budgetUsagePercentage > 100 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Review expenses and consider budget-friendly alternatives</span>
                  </li>
                )}
                {stuckVotesCount > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Chat with Atlas AI to help resolve voting deadlocks</span>
                  </li>
                )}
                {inactiveDays >= 3 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Engage your group - share updates in the group chat</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
