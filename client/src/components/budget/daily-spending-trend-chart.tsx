import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DailySpending {
  date: string; // ISO date string
  amount: number;
  transactionCount: number;
}

interface DailySpendingTrendChartProps {
  data: DailySpending[];
  currency: string;
}

export function DailySpendingTrendChart({ data, currency }: DailySpendingTrendChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Spending Trend</h3>
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No expenses yet. Add expenses to see the trend.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate chart dimensions
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find min and max values
  const maxAmount = Math.max(...data.map((d) => d.amount));
  const minAmount = 0;

  // Calculate scales
  const xScale = (index: number) => {
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  const yScale = (value: number) => {
    return (
      padding.top + innerHeight - ((value - minAmount) / (maxAmount - minAmount)) * innerHeight
    );
  };

  // Generate path for line
  const linePath = data
    .map((d, i) => {
      const x = xScale(i);
      const y = yScale(d.amount);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate area path
  const areaPath = [
    linePath,
    `L ${xScale(data.length - 1)} ${padding.top + innerHeight}`,
    `L ${xScale(0)} ${padding.top + innerHeight}`,
    'Z',
  ].join(' ');

  // Calculate trend
  const firstAmount = data[0].amount;
  const lastAmount = data[data.length - 1].amount;
  const trend = lastAmount > firstAmount ? 'up' : lastAmount < firstAmount ? 'down' : 'stable';
  const trendPercentage = firstAmount > 0 ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0;

  // Calculate average and total
  const totalSpent = data.reduce((sum, d) => sum + d.amount, 0);
  const avgDaily = totalSpent / data.length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Daily Spending Trend</h3>
        <div className="flex items-center gap-2">
          {trend === 'up' && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />+{Math.abs(trendPercentage).toFixed(1)}%
            </Badge>
          )}
          {trend === 'down' && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-green-100 text-green-800"
            >
              <TrendingDown className="h-3 w-3" />-{Math.abs(trendPercentage).toFixed(1)}%
            </Badge>
          )}
          {trend === 'stable' && <Badge variant="outline">Stable</Badge>}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ minWidth: '600px' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => {
            const y = padding.top + innerHeight - percent * innerHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 5}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {formatCurrency(minAmount + (maxAmount - minAmount) * percent)}
                </text>
              </g>
            );
          })}

          {/* Area */}
          <path d={areaPath} fill="url(#areaGradient)" opacity="0.3" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const x = xScale(i);
            const y = yScale(d.amount);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#3b82f6"
                  className="cursor-pointer hover:r-7 transition-all"
                />
                {/* X-axis labels */}
                <text
                  x={x}
                  y={padding.top + innerHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {format(parseISO(d.date), 'MMM d')}
                </text>
              </g>
            );
          })}

          {/* Gradient */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
          <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Daily Average</p>
          <p className="text-lg font-bold">{formatCurrency(avgDaily)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Days Tracked</p>
          <p className="text-lg font-bold">{data.length}</p>
        </div>
      </div>

      {/* Insight */}
      {trend === 'up' && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>Note:</strong> Your daily spending has increased by{' '}
            {Math.abs(trendPercentage).toFixed(1)}% since the start of your trip
          </p>
        </div>
      )}

      {trend === 'down' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-900">
            <strong>Great job!</strong> Your daily spending has decreased by{' '}
            {Math.abs(trendPercentage).toFixed(1)}% since the start of your trip
          </p>
        </div>
      )}
    </Card>
  );
}
