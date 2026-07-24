import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart } from 'lucide-react';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  totalAmount: number;
  currency: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Accommodation: '#3b82f6', // blue
  Transportation: '#10b981', // green
  'Food & Dining': '#f59e0b', // amber
  Activities: '#8b5cf6', // purple
  Shopping: '#ec4899', // pink
  Entertainment: '#14b8a6', // teal
  Groceries: '#84cc16', // lime
  Other: '#6b7280', // gray
};

export function CategoryBreakdownChart({
  data,
  totalAmount,
  currency,
}: CategoryBreakdownChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate donut chart segments
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  const strokeWidth = 40;

  let currentAngle = -90; // Start at top

  const segments = data.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Calculate arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData = [`M ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`].join(
      ' '
    );

    currentAngle = endAngle;

    return {
      ...item,
      pathData,
      color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other'],
    };
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Spending by Category</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Donut Chart */}
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 200" className="w-full max-w-[280px]">
            {/* Background circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={strokeWidth}
            />

            {/* Category segments */}
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={segment.pathData}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="transition-opacity hover:opacity-80 cursor-pointer"
                />
              </g>
            ))}

            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 10}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              Total Spent
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="text-xl font-bold fill-gray-900"
            >
              {formatCurrency(totalAmount)}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other'],
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.category}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(item.amount)}</p>
                </div>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">
                {item.percentage.toFixed(1)}%
              </Badge>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No expenses yet. Add expenses to see the breakdown.
              </p>
            </div>
          )}
        </div>
      </div>

      {data.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Top category:</strong> {data[0]?.category} ({data[0]?.percentage.toFixed(1)}% of
            total spending)
          </p>
        </div>
      )}
    </Card>
  );
}
