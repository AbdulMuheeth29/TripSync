import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Check } from "lucide-react";
import { addDays, format } from "date-fns";

interface FreeTrialStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: (email: string) => void | Promise<void>;
  userEmail?: string;
}

const PRO_FEATURES = [
  "Unlimited trips and members",
  "Unlimited AI itinerary generation",
  "Advanced expense tracking with OCR",
  "Currency conversion",
  "Map view & location sharing",
  "Priority Atlas AI support",
];

export function FreeTrialStartModal({
  isOpen,
  onClose,
  onStartTrial,
  userEmail = ""
}: FreeTrialStartModalProps) {
  const [email, setEmail] = useState(userEmail);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const trialEndDate = addDays(new Date(), 14);

  const handleStartTrial = async () => {
    if (!email || !agreedToTerms) return;

    setIsStarting(true);
    try {
      await onStartTrial(email);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center">Start Your 14-Day Free Trial</DialogTitle>
          <DialogDescription className="text-center">
            Experience all Pro features with no credit card required
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trial Info */}
          <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary mb-2">
              Your trial includes:
            </p>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="rounded-full bg-green-100 p-0.5 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isStarting}
            />
          </div>

          {/* Trial Dates */}
          <div className="rounded-lg bg-muted p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trial Starts</span>
              <span className="font-medium">{format(new Date(), "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trial Ends</span>
              <span className="font-medium">{format(trialEndDate, "MMM d, yyyy")}</span>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              disabled={isStarting}
            />
            <Label
              htmlFor="terms"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I agree to the{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-muted-foreground text-center">
            No credit card required. Cancel anytime during the trial with no charges.
            After 14 days, you'll be asked to choose a plan.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isStarting}>
            Maybe Later
          </Button>
          <Button
            onClick={handleStartTrial}
            disabled={!email || !agreedToTerms || isStarting}
          >
            {isStarting ? "Starting Trial..." : "Start Free Trial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
