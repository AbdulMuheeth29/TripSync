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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, X, Check, Info, Crown, Users } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface DowngradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDowngrade: (acknowledgedLoss: boolean) => void | Promise<void>;
  currentPlan: 'Pro' | 'Teams';
  targetPlan: 'Free' | 'Pro';
  currentPeriodEnd: Date;
  featuresYoullLose: string[];
  currentUsage: {
    activeTrips: number;
    aiGenerations: number;
    members: number;
  };
  limits: {
    trips: number | null;
    aiGenerations: number | null;
    members: number | null;
  };
}

export function DowngradeConfirmationModal({
  isOpen,
  onClose,
  onConfirmDowngrade,
  currentPlan,
  targetPlan,
  currentPeriodEnd,
  featuresYoullLose,
  currentUsage,
  limits,
}: DowngradeConfirmationModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirmDowngrade(acknowledged);
    setIsProcessing(false);
    setAcknowledged(false);
  };

  const willExceedLimits =
    (limits.trips !== null && currentUsage.activeTrips > limits.trips) ||
    (limits.aiGenerations !== null && currentUsage.aiGenerations > limits.aiGenerations) ||
    (limits.members !== null && currentUsage.members > limits.members);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <DialogTitle>Confirm Downgrade</DialogTitle>
          </div>
          <DialogDescription>
            You're about to downgrade from <strong>{currentPlan}</strong> to{' '}
            <strong>{targetPlan}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current Plan */}
            <Card className="p-4 bg-primary/5 border-primary">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Current: {currentPlan}</h4>
              </div>
              <Badge className="mb-3">Active</Badge>
              <p className="text-xs text-muted-foreground">
                Current benefits through {format(currentPeriodEnd, 'MMM d, yyyy')}
              </p>
            </Card>

            {/* Target Plan */}
            <Card className="p-4 border-muted">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">After: {targetPlan}</h4>
              </div>
              <Badge variant="outline" className="mb-3">
                Downgrade
              </Badge>
              <p className="text-xs text-muted-foreground">
                Takes effect {format(currentPeriodEnd, 'MMM d, yyyy')}
              </p>
            </Card>
          </div>

          {/* Features You'll Lose */}
          <Card className="p-4 bg-red-50 border-red-200">
            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
              <X className="h-5 w-5" />
              Features You'll Lose
            </h4>
            <ul className="space-y-2">
              {featuresYoullLose.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                  <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Usage vs Limits Warning */}
          {willExceedLimits && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">
                    Usage Exceeds {targetPlan} Limits
                  </h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Your current usage exceeds the limits of the {targetPlan} plan. Here's what will
                    happen:
                  </p>

                  <div className="space-y-2">
                    {limits.trips !== null && currentUsage.activeTrips > limits.trips && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-800">Active Trips</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-white">
                            {currentUsage.activeTrips} / {limits.trips}
                          </Badge>
                          <span className="text-xs text-amber-700">
                            {currentUsage.activeTrips - limits.trips} over limit
                          </span>
                        </div>
                      </div>
                    )}

                    {limits.members !== null && currentUsage.members > limits.members && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-800">Team Members</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-white">
                            {currentUsage.members} / {limits.members}
                          </Badge>
                          <span className="text-xs text-amber-700">
                            {currentUsage.members - limits.members} over limit
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-amber-800 mt-3">
                    <strong>Action Required:</strong> You'll need to archive trips or remove members
                    before the downgrade takes effect.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* What Happens */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2 mb-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <h4 className="font-semibold text-blue-900">What Happens Next</h4>
            </div>

            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>
                  Your {currentPlan} plan remains active until{' '}
                  {format(currentPeriodEnd, 'MMM d, yyyy')}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>You won't be charged again after this billing period ends</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>
                  On {format(currentPeriodEnd, 'MMM d, yyyy')}, you'll switch to {targetPlan} plan
                  with its limitations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>You can upgrade back anytime to regain access to premium features</span>
              </li>
            </ul>
          </Card>

          {/* Acknowledgment Checkbox */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              />
              <Label htmlFor="acknowledge" className="text-sm cursor-pointer leading-relaxed">
                I understand that I will lose access to {featuresYoullLose.length} premium features
                and that my plan will downgrade to {targetPlan} on{' '}
                {format(currentPeriodEnd, 'MMM d, yyyy')}.
              </Label>
            </div>
          </Card>

          {/* Alternative Offer */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Wait! Special Offer</h4>
            <p className="text-sm text-purple-800 mb-3">
              We'd hate to see you go. How about <strong>50% off</strong> your next 3 months if you
              stay?
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-purple-300 hover:bg-purple-100"
              onClick={() => {
                /* Handle special offer */
              }}
            >
              Keep {currentPlan} at 50% Off
            </Button>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!acknowledged || isProcessing}
            variant="destructive"
          >
            {isProcessing ? 'Processing...' : `Confirm Downgrade to ${targetPlan}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
