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
import { CheckCircle2, Sparkles, ArrowRight, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface EmailVerifiedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  userName?: string;
  offerFreeTrial?: boolean;
}

export function EmailVerifiedSuccessModal({
  isOpen,
  onClose,
  onGetStarted,
  userName,
  offerFreeTrial = true,
}: EmailVerifiedSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
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
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
            <CheckCircle2 className="h-10 w-10 text-white animate-bounce" />
          </div>
          <DialogTitle className="text-center text-2xl">Email Verified! 🎉</DialogTitle>
          <DialogDescription className="text-center">
            {userName ? `Welcome aboard, ${userName}!` : 'Welcome to TripSync!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Message */}
          <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="text-center">
              <h4 className="font-semibold text-green-900 mb-2">Your account is all set!</h4>
              <p className="text-sm text-green-800">
                You can now access all features and start planning your first trip with your group.
              </p>
            </div>
          </Card>

          {/* What's Next */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What's Next?
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Create your first trip or join an existing one</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Invite friends and family to collaborate</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Let Atlas AI help you plan the perfect itinerary</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Track expenses and split costs effortlessly</span>
              </li>
            </ul>
          </Card>

          {/* Free Trial Offer */}
          {offerFreeTrial && (
            <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">Welcome Gift: Pro Trial</h4>
                  <p className="text-sm text-purple-800 mb-3">
                    Get 14 days of TripSync Pro for free! Unlock unlimited trips, AI generations,
                    and premium features.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Activate Free Trial
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Tips */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>Pro Tip:</strong> Complete your profile and preferences to get personalized
              recommendations from Atlas AI!
            </p>
          </Card>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button onClick={onGetStarted} size="lg" className="w-full">
            <ArrowRight className="h-4 w-4 mr-2" />
            Start Planning Your Trip
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Explore Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
