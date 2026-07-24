import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingDown, DollarSign, Check, AlertCircle, Info } from 'lucide-react';

interface BudgetOptimizationReportProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestionId: string) => void;
  reportData: {
    currentBudget: number;
    currentSpending: number;
    projectedTotal: number;
    potentialSavings: number;
    suggestions: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      savingsAmount: number;
      difficulty: 'easy' | 'medium' | 'hard';
      impact: 'low' | 'medium' | 'high';
    }>;
    aiReasoning: string;
  };
}

export function AtlasBudgetOptimizationReport({
  isOpen,
  onClose,
  onApplySuggestion,
  reportData,
}: BudgetOptimizationReportProps) {
  const {
    currentBudget,
    currentSpending,
    projectedTotal,
    potentialSavings,
    suggestions,
    aiReasoning,
  } = reportData;

  const budgetUsagePercent = Math.round((currentSpending / currentBudget) * 100);
  const projectedUsagePercent = Math.round((projectedTotal / currentBudget) * 100);
  const overBudget = projectedTotal > currentBudget;

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { label: 'Easy', variant: 'default' as const };
      case 'medium':
        return { label: 'Medium', variant: 'secondary' as const };
      case 'hard':
        return { label: 'Hard', variant: 'outline' as const };
      default:
        return { label: 'Unknown', variant: 'outline' as const };
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Budget Optimization Report
          </DialogTitle>
          <DialogDescription>
            AI-powered suggestions to optimize your trip spending
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Budget Overview */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Current Spending</div>
                <div className="text-2xl font-bold">${currentSpending.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {budgetUsagePercent}% of budget
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Projected Total</div>
                <div
                  className={`text-2xl font-bold ${overBudget ? 'text-red-500' : 'text-green-500'}`}
                >
                  ${projectedTotal.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {projectedUsagePercent}% of budget
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Potential Savings */}
          <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Potential Savings</span>
              </div>
              <div className="text-2xl font-bold text-green-500">
                ${potentialSavings.toFixed(2)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              By implementing these suggestions, you could save up to ${potentialSavings.toFixed(2)}{' '}
              total
            </p>
          </div>

          {/* AI Reasoning */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm mb-1">Atlas AI Analysis</div>
                <p className="text-sm text-muted-foreground">{aiReasoning}</p>
              </div>
            </div>
          </div>

          {/* Optimization Suggestions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Optimization Suggestions
            </h3>

            {suggestions.map((suggestion) => {
              const difficultyBadge = getDifficultyBadge(suggestion.difficulty);
              const impactColor = getImpactColor(suggestion.impact);

              return (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{suggestion.title}</span>
                          <Badge variant={difficultyBadge.variant} className="text-xs">
                            {difficultyBadge.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span className="text-green-500 font-medium">
                              Save ${suggestion.savingsAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingDown className={`h-3 w-3 ${impactColor}`} />
                            <span className={impactColor}>
                              {suggestion.impact.charAt(0).toUpperCase() +
                                suggestion.impact.slice(1)}{' '}
                              impact
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplySuggestion(suggestion.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Apply
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                      <Info className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Category: {suggestion.category}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg bg-muted/50 p-4 border border-border">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Note:</span> These are AI-generated suggestions based
                on your trip data. Actual savings may vary. Always verify recommendations before
                making changes.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
