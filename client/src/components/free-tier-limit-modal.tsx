import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, Check, Zap } from 'lucide-react';

interface FreeTierLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  limitType: 'trips' | 'members' | 'ai_generations' | 'storage';
  currentUsage: number;
  limit: number;
}

const LIMIT_MESSAGES = {
  trips: {
    title: 'Trip Limit Reached',
    description: "You've reached the 3-trip limit on the Free plan.",
    icon: '🗺️',
    action: 'Create unlimited trips',
  },
  members: {
    title: 'Member Limit Reached',
    description: "You've hit the 6-member limit for this trip on the Free plan.",
    icon: '👥',
    action: 'Add unlimited members',
  },
  ai_generations: {
    title: 'AI Generation Limit Reached',
    description: "You've used your 1 AI generation for this month on the Free plan.",
    icon: '🤖',
    action: 'Get unlimited AI generations',
  },
  storage: {
    title: 'Storage Limit Reached',
    description: "You've reached the 100MB storage limit on the Free plan.",
    icon: '📦',
    action: 'Get 10GB storage',
  },
};

export function FreeTierLimitModal({
  isOpen,
  onClose,
  onUpgrade,
  limitType,
  currentUsage,
  limit,
}: FreeTierLimitModalProps) {
  const limitInfo = LIMIT_MESSAGES[limitType];

  const proFeatures = [
    'Unlimited trips and members',
    'Unlimited AI generations',
    'Receipt OCR with Claude AI',
    'Currency conversion (10+ currencies)',
    '10GB file storage',
    'Priority Atlas AI responses',
    'Export trip data (CSV, PDF)',
    'Remove TripSync branding',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
              {limitInfo.icon}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <DialogTitle className="text-center text-xl">{limitInfo.title}</DialogTitle>
            <Badge variant="secondary" className="text-xs">
              Free Plan
            </Badge>
          </div>
          <DialogDescription className="text-center">{limitInfo.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current Usage */}
          <div className="rounded-lg bg-muted/50 p-4 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Usage</span>
              <span className="text-sm text-muted-foreground">
                {currentUsage} / {limit}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Upgrade Benefits */}
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Upgrade to Pro for $4.99/mo</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {proFeatures.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              + {proFeatures.length - 4} more features
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button onClick={onUpgrade} className="w-full sm:w-auto" size="lg">
            <Zap className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
