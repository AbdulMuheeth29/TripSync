import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, DollarSign, Users, MapPin } from 'lucide-react';

interface ValidationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType:
    | 'date_past'
    | 'date_reversed'
    | 'date_too_long'
    | 'budget_negative'
    | 'budget_unrealistic'
    | 'budget_overflow'
    | 'members_exceeded'
    | 'invalid_destination';
}

const ERROR_CONFIGS = {
  date_past: {
    icon: Calendar,
    title: 'Trip Date in the Past',
    description: 'The start date cannot be in the past. Please choose a future date for your trip.',
    iconColor: 'text-red-500',
    suggestion: 'Select today or a later date to continue.',
  },
  date_reversed: {
    icon: Calendar,
    title: 'Invalid Date Range',
    description: 'The end date must be after the start date. Please adjust your trip dates.',
    iconColor: 'text-red-500',
    suggestion: 'Make sure your trip ends after it starts.',
  },
  date_too_long: {
    icon: Calendar,
    title: 'Trip Duration Too Long',
    description:
      'Trip duration cannot exceed 1 year. For longer trips, consider creating multiple trips.',
    iconColor: 'text-yellow-500',
    suggestion: 'Shorten your trip to less than 365 days.',
  },
  budget_negative: {
    icon: DollarSign,
    title: 'Invalid Budget Amount',
    description: 'Budget per person must be greater than $0.',
    iconColor: 'text-red-500',
    suggestion: 'Enter a positive budget amount to continue.',
  },
  budget_unrealistic: {
    icon: DollarSign,
    title: 'Budget Seems Unrealistic',
    description: 'The budget amount seems unusually low for this destination. Are you sure?',
    iconColor: 'text-yellow-500',
    suggestion: 'Consider if $50 per person is realistic for your trip duration.',
  },
  budget_overflow: {
    icon: DollarSign,
    title: 'Budget Limit Exceeded',
    description: 'Total trip budget exceeds $999,999. Please enter a lower amount.',
    iconColor: 'text-yellow-500',
    suggestion: 'Maximum budget per person: $100,000',
  },
  members_exceeded: {
    icon: Users,
    title: 'Member Limit Reached',
    description:
      'Free plan supports up to 6 members per trip. Upgrade to Pro for unlimited members.',
    iconColor: 'text-primary',
    suggestion: 'Remove members or upgrade to continue.',
  },
  invalid_destination: {
    icon: MapPin,
    title: 'Invalid Destination',
    description:
      "We couldn't find this destination. Please enter a valid city, country, or landmark.",
    iconColor: 'text-red-500',
    suggestion: 'Try entering a well-known city or country name.',
  },
};

export function ValidationErrorModal({ isOpen, onClose, errorType }: ValidationErrorModalProps) {
  const config = ERROR_CONFIGS[errorType];
  const IconComponent = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">{config.title}</DialogTitle>
          <DialogDescription className="text-center">{config.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-muted/50 p-4 border border-border">
            <p className="text-sm">
              <span className="font-medium">💡 Suggestion:</span> {config.suggestion}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Got It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Conflict Resolution Modal
interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeepLocal: () => void;
  onUseServer: () => void;
  conflictData: {
    field: string;
    localValue: string;
    serverValue: string;
    lastModifiedBy?: string;
  };
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  onKeepLocal,
  onUseServer,
  conflictData,
}: ConflictResolutionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Conflicting Changes Detected</DialogTitle>
          <DialogDescription className="text-center">
            {conflictData.lastModifiedBy
              ? `${conflictData.lastModifiedBy} modified this ${conflictData.field} at the same time. Which version should we keep?`
              : `This ${conflictData.field} was modified by someone else. Which version should we keep?`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="rounded-lg border-2 border-primary p-4">
            <div className="text-xs text-muted-foreground mb-1">Your Version</div>
            <div className="font-medium">{conflictData.localValue}</div>
          </div>

          <div className="text-center text-sm text-muted-foreground">vs</div>

          <div className="rounded-lg border-2 border-border p-4">
            <div className="text-xs text-muted-foreground mb-1">Their Version</div>
            <div className="font-medium">{conflictData.serverValue}</div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onUseServer} className="w-full sm:w-auto">
            Use Their Version
          </Button>
          <Button onClick={onKeepLocal} className="w-full sm:w-auto">
            Keep Mine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
