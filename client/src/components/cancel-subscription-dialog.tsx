import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Heart, Gift } from 'lucide-react';
import { format } from 'date-fns';

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: (reason: string, feedback?: string) => void | Promise<void>;
  onAcceptDiscount: () => void;
  currentPeriodEnd: Date;
  showRetentionOffer?: boolean;
}

const CANCEL_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using it enough' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'bugs', label: 'Too many bugs/issues' },
  { value: 'switching', label: 'Switching to another service' },
  { value: 'other', label: 'Other' },
];

export function CancelSubscriptionDialog({
  isOpen,
  onClose,
  onCancel,
  onAcceptDiscount,
  currentPeriodEnd,
  showRetentionOffer = true,
}: CancelSubscriptionDialogProps) {
  const [step, setStep] = useState<'reason' | 'retention' | 'confirm'>(
    showRetentionOffer ? 'reason' : 'confirm'
  );
  const [selectedReason, setSelectedReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  const handleSubmitReason = () => {
    if (selectedReason === 'too_expensive' && showRetentionOffer) {
      setStep('retention');
    } else {
      setStep('confirm');
    }
  };

  const handleConfirmCancel = async () => {
    setIsCanceling(true);
    try {
      await onCancel(selectedReason, feedback);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        {step === 'reason' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Heart className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-center">We're sorry to see you go!</DialogTitle>
              <DialogDescription className="text-center">
                Help us improve by telling us why you're canceling
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>What's your main reason for canceling?</Label>
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                  {CANCEL_REASONS.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label htmlFor={reason.value} className="cursor-pointer">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {selectedReason === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="feedback">Please tell us more (optional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Your feedback helps us improve..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Keep Subscription
              </Button>
              <Button onClick={handleSubmitReason} disabled={!selectedReason} variant="destructive">
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'retention' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-center">Special Offer Just For You!</DialogTitle>
              <DialogDescription className="text-center">
                We'd love to keep you on board
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 text-center">
                <p className="text-3xl font-bold text-primary mb-2">50% Off</p>
                <p className="text-lg font-semibold mb-1">For the Next 3 Months</p>
                <p className="text-sm text-muted-foreground">
                  Just $2.50/month instead of $4.99/month
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a limited-time offer exclusively for you. Stay with Pro at half price!
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">
                No Thanks, Cancel Anyway
              </Button>
              <Button onClick={onAcceptDiscount} className="flex-1">
                Accept 50% Off Offer
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-center">Confirm Cancellation</DialogTitle>
              <DialogDescription className="text-center">
                Your subscription will be canceled
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">What happens next:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>You'll keep Pro access until {format(currentPeriodEnd, 'MMM d, yyyy')}</li>
                  <li>No future charges will be made</li>
                  <li>Your trips will be saved (limited to 1 active trip)</li>
                  <li>You can resubscribe anytime</li>
                </ul>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action will cancel your Pro subscription at the end of the current billing
                  period.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isCanceling}>
                Keep Subscription
              </Button>
              <Button onClick={handleConfirmCancel} disabled={isCanceling} variant="destructive">
                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
