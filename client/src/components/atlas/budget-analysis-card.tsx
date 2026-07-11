import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb, DollarSign, PieChart } from "lucide-react";

interface BudgetInsight {
  category: string;
  currentSpend: number;
  projectedSpend: number;
  budgetAllocation: number;
  status: "under" | "on_track" | "over";
}

interface CostSavingTip {
  category: string;
  suggestion: string;
  potentialSavings: number;
  priority: "high" | "medium" | "low";
}

interface BudgetAnalysisCardProps {
  totalBudget: number;
  currentSpend: number;
  projectedFinalSpend: number;
  currency: string;
  insights: BudgetInsight[];
  costSavingTips: CostSavingTip[];
  onViewDetails?: () => void;
}

export function BudgetAnalysisCard({
  totalBudget,
  currentSpend,
  projectedFinalSpend,
  currency,
  insights,
  costSavingTips,
  onViewDetails
}: BudgetAnalysisCardProps) {
  const percentSpent = (currentSpend / totalBudget) * 100;
  const percentProjected = (projectedFinalSpend / totalBudget) * 100;
  const isOverBudget = projectedFinalSpend > totalBudget;
  const underBudget = totalBudget - projectedFinalSpend;
  const overBudgetAmount = projectedFinalSpend - totalBudget;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalPotentialSavings = costSavingTips.reduce((sum, tip) => sum + tip.potentialSavings, 0);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Atlas Budget Analysis</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered insights to optimize your spending
            </p>
          </div>

          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <PieChart className="h-4 w-4 mr-2" />
              Details
            </Button>
          )}
        </div>

        {/* Budget Overview */}
        <Card className={`p-5 ${
          isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Projected Final Cost</h4>
              <Badge variant={isOverBudget ? "destructive" : "secondary"} className={!isOverBudget ? "bg-green-100 text-green-800" : ""}>
                {isOverBudget ? "Over Budget" : "Under Budget"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="text-lg font-bold">{formatCurrency(currentSpend)}</p>
                <p className="text-xs text-muted-foreground">{percentSpent.toFixed(0)}%</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Projected</p>
                <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(projectedFinalSpend)}
                </p>
                <p className="text-xs text-muted-foreground">{percentProjected.toFixed(0)}%</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Budget</p>
                <p className="text-lg font-bold">{formatCurrency(totalBudget)}</p>
                <p className="text-xs text-muted-foreground">100%</p>
              </div>
            </div>

            <Progress
              value={Math.min(percentProjected, 100)}
              className="h-3"
              indicatorClassName={isOverBudget ? "bg-red-500" : "bg-green-500"}
            />

            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <TrendingUp className="h-5 w-5 text-red-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-600" />
              )}
              <p className={`text-sm font-medium ${isOverBudget ? 'text-red-900' : 'text-green-900'}`}>
                {isOverBudget
                  ? `Projected to exceed budget by ${formatCurrency(overBudgetAmount)}`
                  : `Projected to stay under budget by ${formatCurrency(underBudget)}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Category Insights */}
        <div>
          <h4 className="font-semibold mb-3">Spending by Category</h4>
          <div className="space-y-2">
            {insights.map((insight, index) => {
              const percentage = (insight.currentSpend / insight.budgetAllocation) * 100;
              const Icon = insight.status === "over" ? AlertTriangle :
                           insight.status === "on_track" ? TrendingUp :
                           CheckCircle2;

              return (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${
                        insight.status === "over" ? "text-red-600" :
                        insight.status === "on_track" ? "text-amber-600" :
                        "text-green-600"
                      }`} />
                      <span className="font-medium">{insight.category}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(insight.currentSpend)} / {formatCurrency(insight.budgetAllocation)}
                    </Badge>
                  </div>

                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-2"
                    indicatorClassName={
                      insight.status === "over" ? "bg-red-500" :
                      insight.status === "on_track" ? "bg-amber-500" :
                      "bg-green-500"
                    }
                  />

                  <p className="text-xs text-muted-foreground mt-1">
                    Projected: {formatCurrency(insight.projectedSpend)}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Cost Saving Tips */}
        {costSavingTips.length > 0 && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Cost-Saving Recommendations</h4>
            </div>

            <div className="space-y-3">
              {costSavingTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                  <div>
                    <Badge
                      variant={tip.priority === "high" ? "destructive" : "secondary"}
                      className={`text-xs mb-2 ${
                        tip.priority === "medium" ? "bg-amber-100 text-amber-800" :
                        tip.priority === "low" ? "bg-blue-100 text-blue-800" : ""
                      }`}
                    >
                      {tip.priority === "high" ? "High Priority" : tip.priority === "medium" ? "Medium" : "Low Priority"}
                    </Badge>
                    <p className="text-sm text-blue-900 mb-1">
                      <strong>{tip.category}:</strong> {tip.suggestion}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-green-700">
                      <DollarSign className="h-3 w-3" />
                      <span>Save up to {formatCurrency(tip.potentialSavings)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPotentialSavings > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm text-blue-900 font-medium">
                  Total potential savings: <span className="text-lg text-green-700">{formatCurrency(totalPotentialSavings)}</span>
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Atlas Message */}
        <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
            <p className="text-xs text-purple-900">
              <strong>Atlas Insight:</strong>{" "}
              {isOverBudget
                ? `You're projected to be over budget. Consider implementing the cost-saving tips above to get back on track.`
                : `Great job staying on budget! Keep tracking your expenses to maintain this trend.`}
            </p>
          </div>
        </Card>
      </div>
    </Card>
  );
}
