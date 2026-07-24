import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function ForgotPasswordSuccessModal({
  isOpen,
  onClose,
  email,
}: ForgotPasswordSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Check Your Email</DialogTitle>
          <DialogDescription className="text-center">
            If an account exists with <span className="font-medium text-foreground">{email}</span>,
            we've sent a password reset link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-muted bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">What's next?</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the reset link (valid for 1 hour)</li>
                  <li>Create a new password</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Didn't receive an email? Check your spam folder or try again.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Back to Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
