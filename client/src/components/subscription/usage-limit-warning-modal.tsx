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
import { AlertTriangle, TrendingUp, Sparkles, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';

interface UsageLimitWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  limitType: 'trips' | 'ai_generations' | 'members' | 'storage';
  currentUsage: number;
  limit: number;
  currentPlan: 'Free' | 'Pro' | 'Teams';
  upgradePlan: 'Pro' | 'Teams';
  upgradeBenefits: string[];
}

const LIMIT_INFO: Record<string, { label: string; unit: string; icon: typeof AlertTriangle }> = {
  trips: { label: 'Active Trips', unit: 'trip', icon: TrendingUp },
  ai_generations: { label: 'AI Generations', unit: 'generation', icon: Sparkles },
  members: { label: 'Team Members', unit: 'member', icon: Crown },
  storage: { label: 'Storage', unit: 'GB', icon: TrendingUp },
};

export function UsageLimitWarningModal({
  isOpen,
  onClose,
  onUpgrade,
  limitType,
  currentUsage,
  limit,
  currentPlan,
  upgradePlan,
  upgradeBenefits,
}: UsageLimitWarningModalProps) {
  const limitInfo = LIMIT_INFO[limitType];
  const LimitIcon = limitInfo.icon;
  const percentageUsed = (currentUsage / limit) * 100;
  const isAtLimit = currentUsage >= limit;
  const isNearLimit = percentageUsed >= 80 && percentageUsed < 100;

  const upgradePrice = upgradePlan === 'Pro' ? 4.99 : 9.99;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">
            {isAtLimit ? 'Limit Reached' : 'Approaching Limit'}
          </DialogTitle>
          <DialogDescription className="text-center">
            You've {isAtLimit ? 'reached' : 'almost reached'} your {limitInfo.label.toLowerCase()}{' '}
            limit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Usage Display */}
          <Card
            className={`p-4 ${isAtLimit ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LimitIcon className={`h-5 w-5 ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`} />
                <span className="font-semibold">{limitInfo.label}</span>
              </div>

              <Badge
                variant={isAtLimit ? 'destructive' : 'secondary'}
                className={!isAtLimit ? 'bg-amber-100 text-amber-800' : ''}
              >
                {currentUsage} / {limit}
              </Badge>
            </div>

            <Progress value={Math.min(percentageUsed, 100)} className="h-3 mb-2" />

            <p className={`text-sm ${isAtLimit ? 'text-red-800' : 'text-amber-800'}`}>
              {isAtLimit ? (
                <>
                  You've used all {limit} {limit === 1 ? limitInfo.unit : limitInfo.unit + 's'} on
                  your {currentPlan} plan
                </>
              ) : (
                <>
                  You're at {Math.round(percentageUsed)}% of your {currentPlan} plan limit
                </>
              )}
            </p>
          </Card>

          {/* What This Means */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">What This Means</h4>
            <p className="text-sm text-blue-800">
              {isAtLimit ? (
                <>
                  You cannot{' '}
                  {limitType === 'trips'
                    ? 'create new trips'
                    : limitType === 'ai_generations'
                      ? 'generate new AI itineraries'
                      : limitType === 'members'
                        ? 'add more team members'
                        : 'upload more files'}{' '}
                  on the {currentPlan} plan until you upgrade or remove existing items.
                </>
              ) : (
                <>
                  You have {limit - currentUsage}{' '}
                  {limit - currentUsage === 1 ? limitInfo.unit : limitInfo.unit + 's'} remaining.
                  Upgrade to {upgradePlan} for unlimited access.
                </>
              )}
            </p>
          </Card>

          {/* Upgrade Benefits */}
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Upgrade to {upgradePlan}</h4>
            </div>

            <div className="space-y-2 mb-4">
              {upgradeBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-purple-800">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium">Starting at</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">${upgradePrice}</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
            </div>
          </Card>

          {/* Trial Offer */}
          {currentPlan === 'Free' && (
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-green-900">
                  Try {upgradePlan} Free for 14 Days
                </p>
              </div>
              <p className="text-xs text-green-800">
                No credit card required. Cancel anytime during the trial.
              </p>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {isAtLimit ? 'Close' : 'Not Now'}
          </Button>
          <Button onClick={onUpgrade} className="flex-1">
            <ArrowRight className="h-4 w-4 mr-2" />
            {currentPlan === 'Free' ? `Try ${upgradePlan} Free` : `Upgrade to ${upgradePlan}`}
          </Button>
        </DialogFooter>

        {currentPlan === 'Free' && (
          <p className="text-xs text-center text-muted-foreground -mt-2">
            14-day free trial • No credit card required
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
