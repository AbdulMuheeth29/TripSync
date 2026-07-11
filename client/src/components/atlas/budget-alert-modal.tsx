import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, Sparkles, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BudgetAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewBudget: () => void;
  onGetSuggestions: () => void;
  totalBudget: number;
  currentSpend: number;
  currency?: string;
  overageAmount?: number;
  suggestedCuts?: Array<{category: string; amount: number}>;
}

export function BudgetAlertModal({
  isOpen,
  onClose,
  onViewBudget,
  onGetSuggestions,
  totalBudget,
  currentSpend,
  currency = "USD",
  overageAmount,
  suggestedCuts = []
}: BudgetAlertModalProps) {
  const percentageUsed = Math.min((currentSpend / totalBudget) * 100, 100);
  const isOverBudget = currentSpend > totalBudget;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle className="text-center">
              Atlas Budget Alert
            </DialogTitle>
          </div>
          <DialogDescription className="text-center">
            {isOverBudget
              ? `You're ${formatCurrency(overageAmount || currentSpend - totalBudget)} over budget`
              : `You've used ${percentageUsed.toFixed(0)}% of your budget`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Budget Overview */}
          <Card className={`p-4 ${
            isOverBudget
              ? "bg-red-50 border-red-200"
              : percentageUsed >= 80
              ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Budget Status</span>
                <span className={`font-bold ${
                  isOverBudget ? "text-red-700" : percentageUsed >= 80 ? "text-amber-700" : "text-blue-700"
                }`}>
                  {percentageUsed.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(percentageUsed, 100)}
                className="h-2"
                indicatorClassName={
                  isOverBudget
                    ? "bg-red-500"
                    : percentageUsed >= 80
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Budget</p>
                  <p className="font-semibold">{formatCurrency(totalBudget)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Spend</p>
                  <p className="font-semibold">{formatCurrency(currentSpend)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Atlas Insight */}
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              {isOverBudget ? (
                <span>
                  <strong>I noticed</strong> you're over budget. I can help you find ways to reduce costs
                  or suggest areas to cut back.
                </span>
              ) : percentageUsed >= 80 ? (
                <span>
                  <strong>Heads up!</strong> You're approaching your budget limit. Let me help you
                  stay on track with smart spending suggestions.
                </span>
              ) : (
                <span>
                  <strong>Good progress!</strong> You're at {percentageUsed.toFixed(0)}% of your budget.
                  Keep monitoring to stay on track.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Suggested Cuts */}
          {suggestedCuts.length > 0 && (
            <Card className="p-4 bg-green-50 border-green-200">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Quick Savings Suggestions
              </h4>
              <div className="space-y-2">
                {suggestedCuts.map((cut, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-green-800">{cut.category}</span>
                    <span className="font-medium text-green-700">
                      Save {formatCurrency(cut.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendation */}
          <Card className="p-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong>My recommendation:</strong>{" "}
              {isOverBudget
                ? "Review your expenses and consider removing non-essential activities or finding cheaper alternatives."
                : percentageUsed >= 80
                ? "Monitor your remaining expenses carefully and prioritize must-have activities."
                : "Continue tracking expenses and I'll alert you if you get close to your limit."
              }
            </p>
          </Card>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button onClick={onGetSuggestions} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Get Cost-Cutting Suggestions
          </Button>
          <Button onClick={onViewBudget} variant="outline" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Full Budget
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
