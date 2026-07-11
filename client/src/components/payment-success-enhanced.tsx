import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, Mail, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { format } from "date-fns";

interface PaymentSuccessEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  plan: "Pro" | "Teams";
  amount: number;
  transactionId: string;
  nextBillingDate: Date;
  onDownloadReceipt: () => void;
  onEmailReceipt: () => void;
}

export function PaymentSuccessEnhanced({
  isOpen,
  onClose,
  plan,
  amount,
  transactionId,
  nextBillingDate,
  onDownloadReceipt,
  onEmailReceipt
}: PaymentSuccessEnhancedProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Payment Successful!
          </DialogTitle>
          <DialogDescription className="text-center">
            Welcome to TripSync {plan}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Message */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  You now have access to all {plan} features!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Start creating unlimited trips, using advanced AI, and more.
                </p>
              </div>
            </div>
          </Card>

          {/* Transaction Details */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-3">Transaction Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-medium">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Billing</span>
                <span className="font-medium">{format(nextBillingDate, "MMM d, yyyy")}</span>
              </div>
            </div>
          </Card>

          {/* Receipt Options */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" className="flex-1" onClick={onEmailReceipt}>
              <Mail className="h-4 w-4 mr-2" />
              Email Receipt
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full" size="lg">
            Start Using {plan}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
