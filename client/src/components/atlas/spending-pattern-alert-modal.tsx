import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, DollarSign, AlertCircle, Lightbulb } from 'lucide-react';

interface SpendingPatternAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  pattern: 'overspending' | 'uneven_split' | 'high_category' | 'missing_expenses';
  category?: string;
  amount?: number;
  currency: string;
  insights: string[];
  recommendations: string[];
  onViewBudget: () => void;
}

export function SpendingPatternAlertModal({
  isOpen,
  onClose,
  pattern,
  category,
  amount,
  currency,
  insights,
  recommendations,
  onViewBudget,
}: SpendingPatternAlertModalProps) {
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const getPatternInfo = () => {
    switch (pattern) {
      case 'overspending':
        return {
          title: 'Overspending Detected',
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'uneven_split':
        return {
          title: 'Uneven Cost Distribution',
          icon: TrendingUp,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
        };
      case 'high_category':
        return {
          title: `High ${category} Spending`,
          icon: DollarSign,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      case 'missing_expenses':
        return {
          title: 'Possible Missing Expenses',
          icon: AlertCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
    }
  };

  const patternInfo = getPatternInfo();
  const PatternIcon = patternInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Spending Pattern Alert</DialogTitle>
          </div>
          <DialogDescription>Atlas noticed an unusual spending pattern</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className={`p-4 ${patternInfo.bgColor} ${patternInfo.borderColor}`}>
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${patternInfo.bgColor}`}
              >
                <PatternIcon className={`h-5 w-5 ${patternInfo.color}`} />
              </div>
              <div>
                <h4 className={`font-semibold ${patternInfo.color} mb-1`}>{patternInfo.title}</h4>
                {amount && <p className="text-2xl font-bold mb-2">{formatCurrency(amount)}</p>}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              What I Noticed
            </h4>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
              <h4 className="font-semibold text-blue-900 text-sm">Recommendations</h4>
            </div>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="text-blue-600">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Dismiss
          </Button>
          <Button onClick={onViewBudget} className="flex-1">
            <DollarSign className="h-4 w-4 mr-2" />
            View Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
