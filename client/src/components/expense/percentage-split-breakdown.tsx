import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email?: string;
}

interface PercentageSplitBreakdownProps {
  members: Member[];
  totalAmount: number;
  onSplitChange: (splits: Record<string, number>) => void;
  currency?: string;
}

export function PercentageSplitBreakdown({
  members,
  totalAmount,
  onSplitChange,
  currency = 'USD',
}: PercentageSplitBreakdownProps) {
  const [percentages, setPercentages] = useState<Record<string, number>>(
    Object.fromEntries(members.map((m) => [m.id, Math.floor(100 / members.length)]))
  );

  const totalPercentage = Object.values(percentages).reduce((sum, val) => sum + val, 0);
  const isValid = totalPercentage === 100;

  useEffect(() => {
    const splits = Object.fromEntries(
      Object.entries(percentages).map(([id, percentage]) => [id, (totalAmount * percentage) / 100])
    );
    onSplitChange(splits);
  }, [percentages, totalAmount, onSplitChange]);

  const handlePercentageChange = (memberId: string, value: string) => {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setPercentages((prev) => ({
      ...prev,
      [memberId]: numValue,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Percentage Split</Label>
        <div className="flex items-center gap-2">
          {isValid ? (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Total: {totalPercentage}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Total: {totalPercentage}% (must be 100%)</span>
            </div>
          )}
        </div>
      </div>

      <Card className="divide-y">
        {members.map((member) => {
          const percentage = percentages[member.id] || 0;
          const amount = (totalAmount * percentage) / 100;

          return (
            <div key={member.id} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  {member.email && <p className="text-sm text-muted-foreground">{member.email}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                        className="w-20 text-right"
                      />
                      <span className="text-sm font-medium">%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{formatCurrency(amount)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Percentages must add up to exactly 100%. Current total: {totalPercentage}%
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg bg-muted p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Amount</span>
          <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
