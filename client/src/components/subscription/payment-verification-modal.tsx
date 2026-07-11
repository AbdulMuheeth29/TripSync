import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, AlertCircle, Info, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationType: "3ds" | "bank_auth" | "sca";
  verificationUrl: string;
  amount: number;
  currency: string;
  onVerificationComplete: (success: boolean) => void;
  onCancel: () => void;
}

export function PaymentVerificationModal({
  isOpen,
  onClose,
  verificationType,
  verificationUrl,
  amount,
  currency,
  onVerificationComplete,
  onCancel
}: PaymentVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutWarning, setTimeoutWarning] = useState(false);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amt);
  };

  const getVerificationTitle = () => {
    switch (verificationType) {
      case "3ds":
        return "3D Secure Verification";
      case "bank_auth":
        return "Bank Authorization";
      case "sca":
        return "Strong Customer Authentication";
      default:
        return "Payment Verification";
    }
  };

  const getVerificationDescription = () => {
    switch (verificationType) {
      case "3ds":
        return "Your bank requires additional verification for this payment. Please complete the verification in the window below.";
      case "bank_auth":
        return "Your bank needs to authorize this payment. You may need to enter a code or use your banking app.";
      case "sca":
        return "EU regulations require additional authentication. Please verify your identity to continue.";
      default:
        return "Additional verification is required to complete this payment.";
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle messages from the verification iframe
      if (event.data.type === "verification_complete") {
        onVerificationComplete(true);
      } else if (event.data.type === "verification_failed") {
        onVerificationComplete(false);
      }
    };

    window.addEventListener("message", handleMessage);

    // Show timeout warning after 2 minutes
    const timeoutTimer = setTimeout(() => {
      setTimeoutWarning(true);
    }, 120000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeoutTimer);
    };
  }, [onVerificationComplete]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeoutWarning(false);
    // Force iframe reload
    const iframe = document.getElementById("verification-iframe") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = verificationUrl;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>{getVerificationTitle()}</DialogTitle>
          </div>
          <DialogDescription>
            Verifying payment of {formatCurrency(amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {getVerificationDescription()}
            </AlertDescription>
          </Alert>

          {/* Verification Frame Container */}
          <Card className="relative overflow-hidden" style={{ height: "400px" }}>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading verification...</p>
              </div>
            )}
            <iframe
              id="verification-iframe"
              src={verificationUrl}
              className="w-full h-full border-0"
              title="Payment Verification"
              sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation"
              onLoad={handleIframeLoad}
            />
          </Card>

          {/* Timeout Warning */}
          {timeoutWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Verification is taking longer than expected. If you're having trouble, try refreshing or contact your bank.
              </AlertDescription>
            </Alert>
          )}

          {/* Help Section */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Need Help?</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Check your phone for SMS codes from your bank</li>
              <li>• Look for push notifications in your banking app</li>
              <li>• Make sure you're using the correct authentication method</li>
              <li>• Contact your bank if you don't receive a verification code</li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 text-red-600 hover:text-red-600 hover:bg-red-50"
            >
              Cancel Payment
            </Button>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Secure Connection</p>
              <p>
                This verification is provided directly by your bank. TripSync never sees your banking credentials or verification codes.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
