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
  Receipt,
  Calendar,
  DollarSign,
  Users,
  Tag,
  FileText,
  Edit,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface ExpenseSplit {
  userId: string;
  userName: string;
  amount: number;
  settled: boolean;
}

interface ExpenseDetailViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    category: string;
    date: Date;
    paidBy: { id: string; name: string };
    splitMethod: 'equal' | 'percentage' | 'custom' | 'self';
    splits: ExpenseSplit[];
    notes?: string;
    receiptUrl?: string;
    tipAmount?: number;
    taxAmount?: number;
    createdAt: Date;
  };
  canEdit: boolean;
  canDelete: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewReceipt?: () => void;
}

export function ExpenseDetailViewModal({
  isOpen,
  onClose,
  expense,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onViewReceipt,
}: ExpenseDetailViewModalProps) {
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

  const settledCount = expense.splits.filter((s) => s.settled).length;
  const allSettled = settledCount === expense.splits.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{expense.title}</DialogTitle>
            <Badge
              variant={allSettled ? 'secondary' : 'outline'}
              className={allSettled ? 'bg-green-100 text-green-800' : ''}
            >
              {allSettled ? 'Fully Settled' : `${settledCount}/${expense.splits.length} Settled`}
            </Badge>
          </div>
          <DialogDescription>
            Added {format(expense.createdAt, "MMM d, yyyy 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Card */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
              <p className="text-4xl font-bold text-primary mb-3">
                {formatCurrency(expense.amount)}
              </p>
              {(expense.tipAmount || expense.taxAmount) && (
                <div className="flex justify-center gap-4 text-sm">
                  {expense.tipAmount && (
                    <span className="text-muted-foreground">
                      Tip: {formatCurrency(expense.tipAmount)}
                    </span>
                  )}
                  {expense.taxAmount && (
                    <span className="text-muted-foreground">
                      Tax: {formatCurrency(expense.taxAmount)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{format(expense.date, 'MMM d, yyyy')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{expense.category}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Paid By */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Paid By</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {getInitials(expense.paidBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{expense.paidBy.name}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Split Details */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Split Details</h4>
              </div>
              <Badge variant="outline" className="capitalize">
                {expense.splitMethod} Split
              </Badge>
            </div>

            <Separator className="mb-3" />

            <div className="space-y-2">
              {expense.splits.map((split) => (
                <div
                  key={split.userId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(split.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{split.userName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(split.amount)}</span>
                    {split.settled ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Settled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          {expense.notes && (
            <Card className="p-4">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{expense.notes}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Receipt */}
          {expense.receiptUrl && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Receipt Attached</p>
                    <p className="text-xs text-muted-foreground">View full receipt image</p>
                  </div>
                </div>
                {onViewReceipt && (
                  <Button variant="outline" size="sm" onClick={onViewReceipt}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    View
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {canDelete && onDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              className="text-red-600 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          {canEdit && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
