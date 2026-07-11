import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, CreditCard, Sparkles, Zap, Bell, Info } from "lucide-react";
import { format, addDays } from "date-fns";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface TrialConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  plan: "Pro" | "Teams";
  trialDays: number;
  trialStartDate: Date;
  features: string[];
}

export function TrialConfirmationModal({
  isOpen,
  onClose,
  onGetStarted,
  plan,
  trialDays,
  trialStartDate,
  features
}: TrialConfirmationModalProps) {
  const trialEndDate = addDays(trialStartDate, trialDays);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 }
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 }
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg animate-bounce">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Trial Activated! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            Welcome to TripSync {plan}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trial Info Card */}
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center mb-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-2">
                <Zap className="h-3 w-3 mr-1" />
                {trialDays}-Day Free Trial
              </Badge>
              <p className="text-sm text-muted-foreground">
                Full access to all {plan} features
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Trial Starts</span>
                </div>
                <span className="text-sm">{format(trialStartDate, "MMM d, yyyy")}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Trial Ends</span>
                </div>
                <span className="text-sm font-semibold">{format(trialEndDate, "MMM d, yyyy")}</span>
              </div>
            </div>
          </Card>

          {/* Features Unlocked */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Features Unlocked</h4>
            </div>

            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Important Info */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="text-blue-900">
                  <strong>No credit card required!</strong>
                </p>
                <ul className="space-y-1 text-blue-800">
                  <li className="flex items-start gap-1">
                    <span>•</span>
                    <span>Start using all features immediately</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span>•</span>
                    <span>Cancel anytime during the trial</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span>•</span>
                    <span>We'll remind you 3 days before trial ends</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* What Happens Next */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start gap-2 mb-2">
              <Bell className="h-4 w-4 text-green-600 mt-0.5" />
              <h4 className="font-semibold text-green-900 text-sm">What Happens Next?</h4>
            </div>

            <ol className="space-y-1 text-xs text-green-800 list-decimal list-inside">
              <li>Explore all {plan} features for {trialDays} days</li>
              <li>We'll send you helpful tips to get the most out of your trial</li>
              <li>3 days before your trial ends, you'll get a reminder</li>
              <li>Decide if you want to continue with {plan} or switch to Free</li>
            </ol>
          </Card>

          {/* No Credit Card Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>No credit card required • Cancel anytime</span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button onClick={onGetStarted} size="lg" className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Start Exploring {plan}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            I'll explore later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
