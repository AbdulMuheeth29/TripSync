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
import { Progress } from '@/components/ui/progress';
import { Lock, Sparkles, Zap, Check, Infinity } from 'lucide-react';

interface AIGenerationLimitPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentUsage: number;
  limit: number;
}

const UNLIMITED_FEATURES = [
  'Unlimited AI itinerary generations',
  'Regenerate itineraries as many times as you want',
  'AI-powered activity recommendations',
  'Smart budget optimization',
  'Atlas AI priority responses',
  'Advanced trip personalization',
];

export function AIGenerationLimitPaywall({
  isOpen,
  onClose,
  onUpgrade,
  currentUsage,
  limit,
}: AIGenerationLimitPaywallProps) {
  const percentageUsed = Math.min((currentUsage / limit) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <DialogTitle className="text-center text-2xl">AI Generation Limit Reached</DialogTitle>
          </div>
          <DialogDescription className="text-center">
            You've used all {limit} free AI generation{limit > 1 ? 's' : ''} for this trip
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Usage Progress */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Free Plan Usage</span>
                <span className="text-sm font-bold">
                  {currentUsage} / {limit}
                </span>
              </div>
              <Progress value={percentageUsed} className="h-2" />
              <p className="text-xs text-amber-800">
                Free plan includes {limit} AI generation{limit > 1 ? 's' : ''} per trip. Upgrade for
                unlimited!
              </p>
            </div>
          </Card>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center bg-muted/50">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-semibold mb-1">Free</p>
              <p className="text-2xl font-bold text-muted-foreground mb-1">{limit}</p>
              <p className="text-xs text-muted-foreground">AI generations per trip</p>
            </Card>

            <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold mb-1">Pro</p>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Infinity className="h-6 w-6 text-primary" />
                <p className="text-2xl font-bold text-primary">Unlimited</p>
              </div>
              <p className="text-xs text-blue-700">Generate as many as you want</p>
            </Card>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Unlock unlimited AI with Pro:</h4>
            <div className="space-y-2">
              {UNLIMITED_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-0.5 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Upgrade to Pro</p>
              <p className="text-3xl font-bold text-primary mb-1">
                $4.99<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground">14-day free trial • Cancel anytime</p>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button onClick={onUpgrade} className="w-full" size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Continue with Manual Planning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
