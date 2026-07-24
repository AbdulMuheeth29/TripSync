import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetOverviewHeaderProps {
  totalBudget: number;
  spent: number;
  peopleCount: number;
  currency?: string;
}

export function BudgetOverviewHeader({
  totalBudget,
  spent,
  peopleCount,
  currency = "USD"
}: BudgetOverviewHeaderProps) {
  const remaining = totalBudget - spent;
  const percentageSpent = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const perPersonBudget = totalBudget / peopleCount;
  const perPersonSpent = spent / peopleCount;

  const getStatusColor = () => {
    if (percentageSpent >= 100) return "text-red-600";
    if (percentageSpent >= 80) return "text-amber-600";
    return "text-green-600";
  };

  const getStatusIcon = () => {
    if (percentageSpent >= 100) return <AlertCircle className="h-5 w-5" />;
    if (percentageSpent >= 80) return <TrendingUp className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const getProgressColor = () => {
    if (percentageSpent >= 100) return "bg-red-500";
    if (percentageSpent >= 80) return "bg-amber-500";
    return "bg-green-500";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Budget Overview
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(perPersonBudget)}/person × {peopleCount} {peopleCount === 1 ? "person" : "people"}
            </p>
          </div>
          <div className={cn("flex items-center gap-2", getStatusColor())}>
            {getStatusIcon()}
            <span className="text-sm font-medium">
              {percentageSpent.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Progress
              value={Math.min(percentageSpent, 100)}
              className="h-3"
            />
            {percentageSpent > 100 && (
              <div
                className="absolute top-0 left-0 h-3 bg-red-200 rounded-full"
                style={{ width: '100%' }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(0)}</span>
            <span>Budget: {formatCurrency(totalBudget)}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Budget</p>
            <p className="text-lg font-semibold">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className={cn("text-lg font-semibold", getStatusColor())}>
              {formatCurrency(spent)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={cn(
              "text-lg font-semibold",
              remaining < 0 ? "text-red-600" : "text-green-600"
            )}>
              {formatCurrency(Math.abs(remaining))}
              {remaining < 0 && " over"}
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        {percentageSpent >= 80 && (
          <div className={cn(
            "rounded-lg p-3 flex items-start gap-2",
            percentageSpent >= 100
              ? "bg-red-50 border border-red-200"
              : "bg-amber-50 border border-amber-200"
          )}>
            <AlertCircle className={cn(
              "h-4 w-4 mt-0.5",
              percentageSpent >= 100 ? "text-red-600" : "text-amber-600"
            )} />
            <p className={cn(
              "text-sm",
              percentageSpent >= 100 ? "text-red-800" : "text-amber-800"
            )}>
              {percentageSpent >= 100
                ? `You're ${formatCurrency(spent - totalBudget)} over budget. Consider reviewing expenses.`
                : `You've used ${percentageSpent.toFixed(0)}% of your budget. Monitor spending carefully.`
              }
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
