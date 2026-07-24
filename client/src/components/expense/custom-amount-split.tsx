import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email?: string;
}

interface CustomAmountSplitProps {
  members: Member[];
  totalAmount: number;
  onSplitChange: (splits: Record<string, { amount: number; note?: string }>) => void;
  currency?: string;
}

export function CustomAmountSplit({
  members,
  totalAmount,
  onSplitChange,
  currency = 'USD',
}: CustomAmountSplitProps) {
  const [splits, setSplits] = useState<Record<string, { amount: number; note: string }>>(
    Object.fromEntries(members.map((m) => [m.id, { amount: 0, note: '' }]))
  );

  const totalAllocated = Object.values(splits).reduce((sum, s) => sum + s.amount, 0);
  const remaining = totalAmount - totalAllocated;
  const isValid = Math.abs(remaining) < 0.01; // Allow for floating point errors

  useEffect(() => {
    onSplitChange(splits);
  }, [splits, onSplitChange]);

  const handleAmountChange = (memberId: string, value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setSplits((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], amount: numValue },
    }));
  };

  const handleNoteChange = (memberId: string, note: string) => {
    setSplits((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], note },
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
        <Label>Custom Amount Split</Label>
        <div className="flex items-center gap-2">
          {isValid ? (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Fully allocated</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>Remaining: {formatCurrency(Math.abs(remaining))}</span>
            </div>
          )}
        </div>
      </div>

      <Card className="divide-y">
        {members.map((member) => {
          const split = splits[member.id] || { amount: 0, note: '' };

          return (
            <div key={member.id} className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  {member.email && <p className="text-sm text-muted-foreground">{member.email}</p>}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={split.amount || ''}
                      onChange={(e) => handleAmountChange(member.id, e.target.value)}
                      placeholder="0.00"
                      className="w-28 text-right"
                    />
                  </div>
                </div>
              </div>

              <Textarea
                value={split.note}
                onChange={(e) => handleNoteChange(member.id, e.target.value)}
                placeholder="Optional note (e.g., 'Had seafood platter + 2 drinks')"
                rows={2}
                className="text-sm"
              />
            </div>
          );
        })}
      </Card>

      {!isValid && remaining !== totalAmount && (
        <Alert variant={remaining > 0 ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {remaining > 0
              ? `${formatCurrency(remaining)} left to allocate`
              : `Over-allocated by ${formatCurrency(Math.abs(remaining))}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg bg-muted p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="font-semibold">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Allocated</span>
          <span className="font-semibold">{formatCurrency(totalAllocated)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-medium">Remaining</span>
          <span
            className={`text-lg font-bold ${
              remaining > 0 ? 'text-amber-600' : remaining < 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && ' over'}
          </span>
        </div>
      </div>
    </div>
  );
}
