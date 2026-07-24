import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SettlementConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  fromPerson: string;
  toPerson: string;
  amount: number;
  currency?: string;
  isProcessing?: boolean;
}

export function SettlementConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  fromPerson,
  toPerson,
  amount,
  currency = 'USD',
  isProcessing = false,
}: SettlementConfirmationDialogProps) {
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
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <AlertDialogTitle className="text-center">Mark Payment as Settled?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This will mark the payment as completed in the settlement summary
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <Avatar className="h-12 w-12 mx-auto mb-2">
                <AvatarFallback>{getInitials(fromPerson)}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{fromPerson}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <p className="text-2xl font-bold text-green-600">{formatCurrency(amount)}</p>
            </div>

            <div className="text-center">
              <Avatar className="h-12 w-12 mx-auto mb-2">
                <AvatarFallback>{getInitials(toPerson)}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{toPerson}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Note:</strong> This action can be undone later if needed. The payment will be
            marked as settled in expense reports.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? 'Marking as Settled...' : 'Mark as Settled'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
