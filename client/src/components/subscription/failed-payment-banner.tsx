import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard, X, Clock, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useState } from 'react';

interface FailedPaymentBannerProps {
  failureReason: string;
  failedAmount: number;
  failedDate: Date;
  nextRetryDate?: Date;
  daysUntilSuspension: number;
  onUpdatePaymentMethod: () => void;
  onRetryPayment: () => void;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

export function FailedPaymentBanner({
  failureReason,
  failedAmount,
  failedDate,
  nextRetryDate,
  daysUntilSuspension,
  onUpdatePaymentMethod,
  onRetryPayment,
  onDismiss,
  canDismiss = false,
}: FailedPaymentBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  if (isDismissed) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetryPayment();
    setIsRetrying(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const isCritical = daysUntilSuspension <= 3;
  const isUrgent = daysUntilSuspension <= 7;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card
      className={`p-0 overflow-hidden border-2 ${
        isCritical
          ? 'border-red-500 bg-red-50'
          : isUrgent
            ? 'border-amber-500 bg-amber-50'
            : 'border-blue-500 bg-blue-50'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0 ${
              isCritical ? 'bg-red-100' : isUrgent ? 'bg-amber-100' : 'bg-blue-100'
            }`}
          >
            <AlertCircle
              className={`h-6 w-6 ${
                isCritical ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-blue-600'
              }`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`text-lg font-semibold ${
                      isCritical ? 'text-red-900' : isUrgent ? 'text-amber-900' : 'text-blue-900'
                    }`}
                  >
                    Payment Failed
                  </h3>
                  {isCritical && (
                    <Badge variant="destructive" className="uppercase text-xs">
                      Critical
                    </Badge>
                  )}
                  {isUrgent && !isCritical && (
                    <Badge className="bg-amber-500 uppercase text-xs">Urgent</Badge>
                  )}
                </div>

                <p
                  className={`text-sm mb-3 ${
                    isCritical ? 'text-red-800' : isUrgent ? 'text-amber-800' : 'text-blue-800'
                  }`}
                >
                  Your payment of <strong>{formatCurrency(failedAmount)}</strong> failed on{' '}
                  {format(failedDate, 'MMM d, yyyy')}. {failureReason}
                </p>
              </div>

              {canDismiss && (
                <Button variant="ghost" size="sm" onClick={handleDismiss} className="flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Countdown Warning */}
            {daysUntilSuspension > 0 && (
              <Alert
                className={`mb-4 ${
                  isCritical
                    ? 'bg-red-100 border-red-300'
                    : isUrgent
                      ? 'bg-amber-100 border-amber-300'
                      : 'bg-blue-100 border-blue-300'
                }`}
              >
                <Clock className="h-4 w-4" />
                <AlertDescription
                  className={`text-sm ${
                    isCritical ? 'text-red-900' : isUrgent ? 'text-amber-900' : 'text-blue-900'
                  }`}
                >
                  <strong>
                    {daysUntilSuspension === 1 ? 'Final day' : `${daysUntilSuspension} days left`}
                  </strong>{' '}
                  to update your payment before your account is suspended and you lose access to
                  premium features.
                </AlertDescription>
              </Alert>
            )}

            {/* Retry Information */}
            {nextRetryDate && (
              <p
                className={`text-xs mb-4 ${
                  isCritical ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-blue-700'
                }`}
              >
                Next automatic retry: {format(nextRetryDate, "MMM d 'at' h:mm a")}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onUpdatePaymentMethod}
                size="sm"
                className={
                  isCritical
                    ? 'bg-red-600 hover:bg-red-700'
                    : isUrgent
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : ''
                }
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>

              <Button variant="outline" size="sm" onClick={handleRetry} disabled={isRetrying}>
                {isRetrying ? (
                  'Retrying...'
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Retry Payment Now
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <p
              className={`text-xs mt-3 ${
                isCritical ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-blue-700'
              }`}
            >
              <strong>Need help?</strong> Contact our support team at support@tripsync.com or check
              that your card has sufficient funds and hasn't expired.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className={`h-1 ${isCritical ? 'bg-red-200' : isUrgent ? 'bg-amber-200' : 'bg-blue-200'}`}
      >
        <div
          className={`h-full transition-all ${
            isCritical ? 'bg-red-600' : isUrgent ? 'bg-amber-600' : 'bg-blue-600'
          }`}
          style={{
            width: `${Math.max(0, Math.min(100, ((7 - daysUntilSuspension) / 7) * 100))}%`,
          }}
        />
      </div>
    </Card>
  );
}
