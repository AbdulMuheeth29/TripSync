import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/file-upload';
import { useToast } from '@/hooks/use-toast';
import { Check, Upload, Link as LinkIcon, DollarSign, User } from 'lucide-react';
import type { ItineraryItem } from '@shared/schema';

interface BookingWorkflowModalProps {
  item: ItineraryItem;
  tripMembers: Array<{ id: string; name: string; email: string }>;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBooking: (
    itemId: string,
    updates: {
      bookingStatus?: string;
      confirmationNumber?: string;
      confirmationUrl?: string;
      bookedByUserId?: string;
      linkToExpense?: boolean;
      expenseAmount?: number;
    }
  ) => Promise<void>;
  onUploadConfirmation: (itemId: string, file: File) => Promise<string>;
}

export function BookingWorkflowModal({
  item,
  tripMembers,
  isOpen,
  onClose,
  onUpdateBooking,
  onUploadConfirmation,
}: BookingWorkflowModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [bookingStatus, setBookingStatus] = useState(item.bookingStatus || 'not_started');
  const [confirmationNumber, setConfirmationNumber] = useState(item.confirmationNumber || '');
  const [confirmationUrl, setConfirmationUrl] = useState(item.bookingUrl || '');
  const [bookedBy, setBookedBy] = useState<string | null>(item.bookedByUserId || null);
  const [createExpense, setCreateExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState(item.pricePerPerson || 0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');

  const handleFileUploadComplete = (urls: string[]) => {
    if (urls.length > 0) {
      setUploadedFileUrl(urls[0]);
      toast({
        title: 'Confirmation uploaded',
        description: 'Booking confirmation has been uploaded successfully',
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdateBooking(item.id, {
        bookingStatus,
        confirmationNumber: confirmationNumber,
        confirmationUrl: uploadedFileUrl || confirmationUrl,
        bookedByUserId: bookedBy || undefined,
        linkToExpense: createExpense,
        expenseAmount: createExpense ? expenseAmount : undefined,
      });

      toast({
        title: 'Booking updated',
        description:
          bookingStatus === 'booked'
            ? 'Item marked as booked successfully'
            : 'Booking status updated',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update booking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Booking: {item.name}</DialogTitle>
          <DialogDescription>
            Track booking status, upload confirmation, and link to expenses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Status */}
          <div className="space-y-2">
            <Label htmlFor="bookingStatus">Booking Status</Label>
            <Select value={bookingStatus} onValueChange={setBookingStatus}>
              <SelectTrigger id="bookingStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">
                  <span className="flex items-center gap-2">Not Started</span>
                </SelectItem>
                <SelectItem value="researching">
                  <span className="flex items-center gap-2">Researching Options</span>
                </SelectItem>
                <SelectItem value="pending">
                  <span className="flex items-center gap-2">Pending Confirmation</span>
                </SelectItem>
                <SelectItem value="booked">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Booked & Confirmed
                  </span>
                </SelectItem>
                <SelectItem value="cancelled">
                  <span className="flex items-center gap-2">Cancelled</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assign Booking Responsibility */}
          <div className="space-y-2">
            <Label htmlFor="bookedBy">Who's Handling This Booking?</Label>
            <Select value={bookedBy || ''} onValueChange={(val) => setBookedBy(val || null)}>
              <SelectTrigger id="bookedBy">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No one assigned</SelectItem>
                {tripMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Assign responsibility to track who is managing this booking
            </p>
          </div>

          {/* Confirmation Number */}
          <div className="space-y-2">
            <Label htmlFor="confirmationNumber">Confirmation Number</Label>
            <Input
              id="confirmationNumber"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              placeholder="ABC123456"
            />
          </div>

          {/* Confirmation URL */}
          <div className="space-y-2">
            <Label htmlFor="confirmationUrl">Booking URL (Optional)</Label>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmationUrl"
                type="url"
                value={confirmationUrl}
                onChange={(e) => setConfirmationUrl(e.target.value)}
                placeholder="https://booking.com/confirmation/..."
              />
            </div>
          </div>

          {/* Upload Confirmation Document */}
          <div className="space-y-2">
            <Label>Upload Confirmation Document</Label>
            <div className="space-y-3">
              <FileUpload
                endpoint="/api/upload/confirmation"
                accept="application/pdf,image/*"
                maxSizeMB={10}
                onUploadComplete={handleFileUploadComplete}
                buttonText="Upload Confirmation"
              />
              {uploadedFileUrl && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Confirmation uploaded successfully
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload booking confirmation (PDF, PNG, or JPG, max 10MB)
            </p>
          </div>

          {/* Link to Expense */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createExpense"
                checked={createExpense}
                onCheckedChange={(checked) => setCreateExpense(!!checked)}
              />
              <Label
                htmlFor="createExpense"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Create linked expense when marking as booked
              </Label>
            </div>

            {createExpense && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="expenseAmount">Expense Amount ($)</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expenseAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This will automatically create an expense entry linked to this booking
                </p>
              </div>
            )}
          </div>

          {/* Current Status Summary */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Booking Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={bookingStatus === 'booked' ? 'default' : 'secondary'}>
                  {bookingStatus.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              {bookedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="font-medium">
                    {tripMembers.find((m) => m.id === bookedBy)?.name || 'Unknown'}
                  </span>
                </div>
              )}
              {confirmationNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confirmation:</span>
                  <code className="font-mono text-xs bg-background px-2 py-1 rounded">
                    {confirmationNumber}
                  </code>
                </div>
              )}
              {uploadedFileUrl && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document:</span>
                  <a
                    href={uploadedFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View confirmation
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Booking Details'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
