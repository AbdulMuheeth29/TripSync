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
import { Mail, CheckCircle2, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface EmailVerificationSentModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResendEmail: () => void | Promise<void>;
  sentAt: Date;
}

export function EmailVerificationSentModal({
  isOpen,
  onClose,
  email,
  onResendEmail,
  sentAt,
}: EmailVerificationSentModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastResentAt, setLastResentAt] = useState<Date | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    await onResendEmail();
    setResendCount((prev) => prev + 1);
    setLastResentAt(new Date());
    setIsResending(false);
  };

  const canResend = resendCount < 3;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 animate-pulse">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-center">Check Your Email</DialogTitle>
          <DialogDescription className="text-center">
            We've sent a verification link to your email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Address */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Sent to</p>
                  <p className="text-sm text-blue-700 break-all">{email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {format(lastResentAt || sentAt, 'h:mm a')}
              </Badge>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Next Steps
            </h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>Check your inbox for an email from TripSync</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>Click the verification link in the email</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>You'll be redirected back and automatically logged in</span>
              </li>
            </ol>
          </Card>

          {/* Tips */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-2">Didn't receive the email?</p>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure {email} is correct</li>
                  <li>• Wait a few minutes for the email to arrive</li>
                  <li>• Try resending the verification email</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Resend Status */}
          {resendCount > 0 && (
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-900">
                  Email resent successfully! Check your inbox.
                </p>
              </div>
            </Card>
          )}

          {/* Rate Limit Warning */}
          {resendCount >= 3 && (
            <Card className="p-3 bg-red-50 border-red-200">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-xs text-red-900">
                  You've reached the maximum resend attempts. Please wait 15 minutes before trying
                  again, or contact support if you continue to have issues.
                </p>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Resending...' : 'Resend Email'}
          </Button>
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground">
          The verification link expires in 24 hours
        </p>
      </DialogContent>
    </Dialog>
  );
}
