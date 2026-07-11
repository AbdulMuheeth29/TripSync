import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, CreditCard, RefreshCw, Mail, AlertCircle } from "lucide-react";

interface PaymentFailureEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  errorCode: string;
  errorMessage: string;
  onTryAgain: () => void;
  onUpdateCard: () => void;
  onContactSupport: () => void;
}

const ERROR_MESSAGES: Record<string, { title: string; description: string; canRetry: boolean }> = {
  "card_declined": {
    title: "Card Declined",
    description: "Your card was declined. Please try a different payment method or contact your bank.",
    canRetry: false
  },
  "insufficient_funds": {
    title: "Insufficient Funds",
    description: "Your card has insufficient funds. Please use a different card.",
    canRetry: false
  },
  "expired_card": {
    title: "Card Expired",
    description: "Your card has expired. Please update your payment method.",
    canRetry: false
  },
  "incorrect_cvc": {
    title: "Incorrect CVC",
    description: "The security code (CVC) is incorrect. Please check and try again.",
    canRetry: true
  },
  "processing_error": {
    title: "Processing Error",
    description: "We encountered an error processing your payment. Please try again.",
    canRetry: true
  },
  "network_error": {
    title: "Network Error",
    description: "Unable to connect to payment processor. Check your connection and try again.",
    canRetry: true
  },
  "unknown": {
    title: "Payment Failed",
    description: "An unexpected error occurred. Please try again or contact support.",
    canRetry: true
  }
};

export function PaymentFailureEnhanced({
  isOpen,
  onClose,
  errorCode,
  errorMessage,
  onTryAgain,
  onUpdateCard,
  onContactSupport
}: PaymentFailureEnhancedProps) {
  const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES["unknown"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {errorInfo.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {errorInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Details */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>

          {/* Common Reasons */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-2 text-sm">Common Reasons:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Incorrect card details</li>
              <li>Insufficient funds</li>
              <li>Card expired or blocked</li>
              <li>Bank security restrictions</li>
              <li>Network connectivity issues</li>
            </ul>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            {errorInfo.canRetry && (
              <Button onClick={onTryAgain} className="w-full" variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}

            <Button onClick={onUpdateCard} className="w-full" variant="outline">
              <CreditCard className="h-4 w-4 mr-2" />
              {errorInfo.canRetry ? "Try Different Card" : "Update Card"}
            </Button>

            <Button onClick={onContactSupport} className="w-full" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            Need help? Our support team is available 24/7 to assist you.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
