import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, CreditCard, Shield, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface PaymentProcessingModalProps {
  isOpen: boolean;
  status: "processing" | "verifying" | "success" | "error";
  amount: number;
  currency: string;
  paymentMethod: {
    type: "card" | "paypal" | "bank";
    last4?: string;
    brand?: string;
  };
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export function PaymentProcessingModal({
  isOpen,
  status,
  amount,
  currency,
  paymentMethod,
  errorMessage,
  onSuccess,
  onError
}: PaymentProcessingModalProps) {
  const [progress, setProgress] = useState(0);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amt);
  };

  const getPaymentMethodDisplay = () => {
    if (paymentMethod.type === "card" && paymentMethod.brand && paymentMethod.last4) {
      return `${paymentMethod.brand} •••• ${paymentMethod.last4}`;
    }
    if (paymentMethod.type === "paypal") {
      return "PayPal";
    }
    if (paymentMethod.type === "bank") {
      return `Bank Account ${paymentMethod.last4 ? `••••${paymentMethod.last4}` : ""}`;
    }
    return "Payment Method";
  };

  useEffect(() => {
    if (status === "processing") {
      setProgress(30);
      const timer = setTimeout(() => setProgress(60), 500);
      return () => clearTimeout(timer);
    } else if (status === "verifying") {
      setProgress(80);
    } else if (status === "success") {
      setProgress(100);
      const timer = setTimeout(() => {
        onSuccess?.();
      }, 1500);
      return () => clearTimeout(timer);
    } else if (status === "error") {
      setProgress(0);
      const timer = setTimeout(() => {
        onError?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onSuccess, onError]);

  const getStatusContent = () => {
    switch (status) {
      case "processing":
        return {
          icon: <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />,
          title: "Processing Payment",
          description: "Please wait while we securely process your payment...",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
      case "verifying":
        return {
          icon: <Shield className="h-12 w-12 text-purple-600 animate-pulse" />,
          title: "Verifying Payment",
          description: "Confirming your payment with the bank...",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200"
        };
      case "success":
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
          title: "Payment Successful!",
          description: "Your payment has been processed successfully",
          bgColor: "bg-green-50",
          borderColor: "border-green-200"
        };
      case "error":
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-600" />,
          title: "Payment Failed",
          description: errorMessage || "We couldn't process your payment. Please try again.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">Payment</DialogTitle>
          <DialogDescription className="text-center">
            {formatCurrency(amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Card */}
          <Card className={`p-6 ${statusContent.bgColor} ${statusContent.borderColor}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center justify-center">
                {statusContent.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {statusContent.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {statusContent.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Progress Bar */}
          {(status === "processing" || status === "verifying") && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processing</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-semibold">{formatCurrency(amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{getPaymentMethodDisplay()}</span>
                </div>
              </div>
              {status === "success" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Confirmed</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Security Notice */}
          {(status === "processing" || status === "verifying") && (
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Secure Payment</p>
                <p>Your payment information is encrypted and secure. Do not close this window.</p>
              </div>
            </div>
          )}

          {/* Error Details */}
          {status === "error" && errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">
                <strong>Error:</strong> {errorMessage}
              </p>
              <p className="text-xs text-red-700 mt-1">
                Please verify your payment details and try again, or contact support if the problem persists.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
