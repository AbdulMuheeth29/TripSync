import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRightLeft, TrendingUp, TrendingDown, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface CurrencyConversionCardProps {
  fromAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  lastUpdated: Date;
  onRefreshRate?: () => void;
  isRefreshing?: boolean;
  showTrend?: boolean;
  rateChange?: number; // Percentage change from yesterday
}

export function CurrencyConversionCard({
  fromAmount,
  fromCurrency,
  toCurrency,
  exchangeRate,
  lastUpdated,
  onRefreshRate,
  isRefreshing = false,
  showTrend = true,
  rateChange
}: CurrencyConversionCardProps) {
  const toAmount = fromAmount * exchangeRate;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const isRateIncreasing = rateChange && rateChange > 0;
  const isRateDecreasing = rateChange && rateChange < 0;

  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return format(lastUpdated, "MMM d 'at' h:mm a");
  };

  return (
    <Card className="p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold mb-1">Currency Conversion</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {getTimeSinceUpdate()}</span>
            </div>
          </div>

          {onRefreshRate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshRate}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        {/* Conversion Display */}
        <div className="space-y-3">
          {/* From Amount */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">From</span>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(fromAmount, fromCurrency)}</p>
              <Badge variant="outline" className="mt-1">{fromCurrency}</Badge>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* To Amount */}
          <div className="flex items-center justify-between p-3 bg-primary/5 border-2 border-primary rounded-lg">
            <span className="text-sm text-muted-foreground">To</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatCurrency(toAmount, toCurrency)}</p>
              <Badge className="mt-1">{toCurrency}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Exchange Rate Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Exchange Rate</span>
            <span className="font-medium">
              1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
            </span>
          </div>

          {showTrend && rateChange !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">24h Change</span>
              <div className="flex items-center gap-1">
                {isRateIncreasing && <TrendingUp className="h-4 w-4 text-green-600" />}
                {isRateDecreasing && <TrendingDown className="h-4 w-4 text-red-600" />}
                <span className={`font-medium ${
                  isRateIncreasing ? 'text-green-600' :
                  isRateDecreasing ? 'text-red-600' :
                  'text-muted-foreground'
                }`}>
                  {rateChange > 0 ? '+' : ''}{rateChange.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Calculation Breakdown */}
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-900 mb-2 font-medium">Calculation</p>
          <p className="text-xs text-blue-800 font-mono">
            {formatCurrency(fromAmount, fromCurrency)} × {exchangeRate.toFixed(4)} = {formatCurrency(toAmount, toCurrency)}
          </p>
        </Card>

        {/* Important Notice */}
        <Card className="p-3 bg-muted/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Exchange rates fluctuate constantly. The actual rate charged by your
              bank or payment processor may differ slightly from this mid-market rate.
            </p>
          </div>
        </Card>
      </div>
    </Card>
  );
}
