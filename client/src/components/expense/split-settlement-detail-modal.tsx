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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';

interface SettlementHistory {
  id: string;
  amount: number;
  settledAt: Date;
  method: 'cash' | 'card' | 'venmo' | 'paypal' | 'zelle' | 'other';
  note?: string;
}

interface Split {
  userId: string;
  userName: string;
  amount: number;
  settled: boolean;
  settlementHistory: SettlementHistory[];
}

interface SplitSettlementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    date: Date;
  };
  payer: {
    id: string;
    name: string;
  };
  split: Split;
  currentUserId: string;
  onMarkAsSettled: (
    method: 'cash' | 'card' | 'venmo' | 'paypal' | 'zelle' | 'other',
    note?: string
  ) => Promise<void>;
  onSendReminder?: () => void;
}

export function SplitSettlementDetailModal({
  isOpen,
  onClose,
  expense,
  payer,
  split,
  currentUserId,
  onMarkAsSettled,
  onSendReminder,
}: SplitSettlementDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: expense.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'venmo':
      case 'paypal':
      case 'zelle':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const totalSettled = split.settlementHistory.reduce((sum, s) => sum + s.amount, 0);
  const remainingAmount = split.amount - totalSettled;
  const isCurrentUserPayer = currentUserId === payer.id;
  const isCurrentUserDebtor = currentUserId === split.userId;

  const handleQuickSettle = async (
    method: 'cash' | 'card' | 'venmo' | 'paypal' | 'zelle' | 'other'
  ) => {
    await onMarkAsSettled(method);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settlement Details</DialogTitle>
          <DialogDescription>
            {expense.title} • {format(expense.date, 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Flow */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm">{getInitials(split.userName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Owes</p>
                  <p className="font-semibold">{split.userName}</p>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-muted-foreground" />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-semibold">{payer.name}</p>
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm">{getInitials(payer.name)}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Amount</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(split.amount)}</p>
            </div>
          </Card>

          {/* Settlement Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Status</h4>
              {split.settled ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Fully Settled
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>

            {!split.settled && totalSettled > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid so far</span>
                  <span className="font-medium">{formatCurrency(totalSettled)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(totalSettled / split.amount) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Quick Settle Options (only for debtor) */}
          {!split.settled && isCurrentUserDebtor && (
            <Card className="p-4 bg-green-50 border-green-200">
              <h4 className="font-semibold mb-3 text-sm">Quick Settle</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSettle('cash')}
                  className="flex flex-col h-auto py-2"
                >
                  <Banknote className="h-4 w-4 mb-1" />
                  <span className="text-xs">Cash</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSettle('card')}
                  className="flex flex-col h-auto py-2"
                >
                  <CreditCard className="h-4 w-4 mb-1" />
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSettle('venmo')}
                  className="flex flex-col h-auto py-2"
                >
                  <Smartphone className="h-4 w-4 mb-1" />
                  <span className="text-xs">Venmo</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSettle('paypal')}
                  className="flex flex-col h-auto py-2"
                >
                  <Smartphone className="h-4 w-4 mb-1" />
                  <span className="text-xs">PayPal</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSettle('zelle')}
                  className="flex flex-col h-auto py-2"
                >
                  <Smartphone className="h-4 w-4 mb-1" />
                  <span className="text-xs">Zelle</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSettle('other')}
                  className="flex flex-col h-auto py-2"
                >
                  <DollarSign className="h-4 w-4 mb-1" />
                  <span className="text-xs">Other</span>
                </Button>
              </div>
            </Card>
          )}

          {/* Settlement History */}
          {split.settlementHistory.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Payment History
              </h4>
              <div className="space-y-3">
                {split.settlementHistory.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        {getMethodIcon(settlement.method)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(settlement.amount)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(settlement.settledAt, 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span>{getMethodLabel(settlement.method)}</span>
                        </div>
                        {settlement.note && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">
                            "{settlement.note}"
                          </p>
                        )}
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reminder (only for payer if not settled) */}
          {!split.settled && isCurrentUserPayer && onSendReminder && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-900">
                  Send a friendly reminder to {split.userName}
                </p>
                <Button variant="outline" size="sm" onClick={onSendReminder}>
                  Send
                </Button>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
