import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, MessageCircle, CheckCircle2, BarChart3, ArrowRight } from "lucide-react";

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface AnalyticsDashboardCardProps {
  tripId: string;
  tripName: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  analytics: {
    totalSpent: number;
    budget: number;
    currency: string;
    totalActivities: number;
    completedActivities: number;
    totalMembers: number;
    activeMembers: number;
    totalMessages: number;
    expenseCount: number;
    categorySpending: CategorySpending[];
    spendingTrend: "up" | "down" | "stable";
    trendPercentage: number;
    avgDailySpend: number;
    projectedFinalSpend: number;
  };
  onViewDetails: () => void;
}

export function AnalyticsDashboardCard({
  tripId,
  tripName,
  dateRange,
  analytics,
  onViewDetails
}: AnalyticsDashboardCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: analytics.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const budgetPercentage = (analytics.totalSpent / analytics.budget) * 100;
  const isOverBudget = analytics.totalSpent > analytics.budget;
  const activitiesPercentage = (analytics.completedActivities / analytics.totalActivities) * 100;

  const getTrendIcon = () => {
    if (analytics.spendingTrend === "up") return <TrendingUp className="h-4 w-4" />;
    if (analytics.spendingTrend === "down") return <TrendingDown className="h-4 w-4" />;
    return <span className="h-4 w-4">→</span>;
  };

  const getTrendColor = () => {
    if (analytics.spendingTrend === "up") return "text-red-600";
    if (analytics.spendingTrend === "down") return "text-green-600";
    return "text-muted-foreground";
  };

  const topCategories = analytics.categorySpending
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Trip Analytics</h3>
            </div>
            <p className="text-sm text-muted-foreground">{tripName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Budget Overview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Budget Status</span>
            </div>
            <Badge variant={isOverBudget ? "destructive" : "secondary"}>
              {budgetPercentage.toFixed(0)}%
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold">{formatCurrency(analytics.totalSpent)}</span>
            <span className="text-sm text-muted-foreground">of {formatCurrency(analytics.budget)}</span>
          </div>
          <Progress
            value={Math.min(budgetPercentage, 100)}
            className={`h-2 ${isOverBudget ? "bg-red-200" : ""}`}
          />
          {analytics.projectedFinalSpend > analytics.budget && (
            <p className="text-xs text-red-600 mt-2">
              Projected to exceed budget by {formatCurrency(analytics.projectedFinalSpend - analytics.budget)}
            </p>
          )}
        </div>

        {/* Spending Trend */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {getTrendIcon()}
              <span className="text-xs text-muted-foreground">Spending Trend</span>
            </div>
            <div className={`text-lg font-bold ${getTrendColor()}`}>
              {analytics.spendingTrend === "up" && "+"}
              {analytics.spendingTrend === "down" && "-"}
              {analytics.trendPercentage}%
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg Daily Spend</span>
            </div>
            <div className="text-lg font-bold">
              {formatCurrency(analytics.avgDailySpend)}
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Top Spending Categories</h4>
          <div className="space-y-3">
            {topCategories.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm">{cat.category}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(cat.amount)}</span>
                </div>
                <Progress value={cat.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 mb-1" />
            <span className="text-xs text-muted-foreground mb-0.5">Activities</span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">{analytics.completedActivities}</span>
              <span className="text-sm text-muted-foreground">/{analytics.totalActivities}</span>
            </div>
            {activitiesPercentage === 100 && (
              <CheckCircle2 className="h-3 w-3 text-green-600 mt-1" />
            )}
          </div>

          <div className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <Users className="h-5 w-5 text-green-600 mb-1" />
            <span className="text-xs text-muted-foreground mb-0.5">Members</span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">{analytics.activeMembers}</span>
              <span className="text-sm text-muted-foreground">/{analytics.totalMembers}</span>
            </div>
          </div>

          <div className="flex flex-col items-center p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
            <MessageCircle className="h-5 w-5 text-pink-600 mb-1" />
            <span className="text-xs text-muted-foreground mb-0.5">Messages</span>
            <span className="text-lg font-bold">{analytics.totalMessages}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {analytics.expenseCount} expenses tracked
          </span>
          <Button variant="link" size="sm" onClick={onViewDetails} className="text-xs">
            View Full Report
          </Button>
        </div>
      </div>
    </Card>
  );
}
