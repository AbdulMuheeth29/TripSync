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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Archive, AlertCircle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface TripArchiveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    memberCount: number;
    expenseCount: number;
    activityCount: number;
    hasUnsettledExpenses: boolean;
    totalUnsettled: number;
    currency: string;
  };
  onConfirm: () => Promise<void>;
}

export function TripArchiveConfirmationModal({
  isOpen,
  onClose,
  trip,
  onConfirm,
}: TripArchiveConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [acknowledgeUnsettled, setAcknowledgeUnsettled] = useState(false);
  const [acknowledgeReadOnly, setAcknowledgeReadOnly] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: trip.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const canArchive = trip.hasUnsettledExpenses
    ? acknowledgeUnsettled && acknowledgeReadOnly
    : acknowledgeReadOnly;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to archive trip:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            <DialogTitle>Archive Trip</DialogTitle>
          </div>
          <DialogDescription>Archive "{trip.name}" from your active trips</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip Summary */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <h3 className="font-semibold mb-3">{trip.name}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Dates</p>
                <p className="font-medium">
                  {format(trip.startDate, 'MMM d')} - {format(trip.endDate, 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Members</p>
                <p className="font-medium">{trip.memberCount} people</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Activities</p>
                <p className="font-medium">{trip.activityCount} planned</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Expenses</p>
                <p className="font-medium">{trip.expenseCount} tracked</p>
              </div>
            </div>
          </Card>

          {/* Unsettled Expenses Warning */}
          {trip.hasUnsettledExpenses && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> This trip has {formatCurrency(trip.totalUnsettled)} in
                unsettled expenses. Members will still be able to view and settle these after
                archiving.
              </AlertDescription>
            </Alert>
          )}

          {/* What Happens */}
          <Card className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <h4 className="text-sm font-semibold">What happens when you archive?</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">Trip moves to "Archived" section</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">All data remains accessible for viewing</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Members can still settle outstanding expenses
                </p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">No new activities or expenses can be added</p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">Chat and voting will be disabled</p>
              </div>
            </div>
          </Card>

          {/* Acknowledgments */}
          <Card className="p-4 bg-muted">
            <div className="space-y-3">
              {trip.hasUnsettledExpenses && (
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="acknowledge-unsettled"
                    checked={acknowledgeUnsettled}
                    onCheckedChange={(checked) => setAcknowledgeUnsettled(checked === true)}
                  />
                  <Label
                    htmlFor="acknowledge-unsettled"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I understand there are unsettled expenses and members will need to settle them
                  </Label>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acknowledge-readonly"
                  checked={acknowledgeReadOnly}
                  onCheckedChange={(checked) => setAcknowledgeReadOnly(checked === true)}
                />
                <Label
                  htmlFor="acknowledge-readonly"
                  className="text-sm font-normal cursor-pointer"
                >
                  I understand this trip will become read-only (except for settling expenses)
                </Label>
              </div>
            </div>
          </Card>

          {/* Restore Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> You can unarchive this trip later from the Archived section if
              needed.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canArchive || isConfirming}
            className="bg-primary"
          >
            <Archive className="h-4 w-4 mr-2" />
            {isConfirming ? 'Archiving...' : 'Archive Trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
