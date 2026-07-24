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
import { Clock, CheckCircle2, AlertCircle, Sparkles, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface DeadlineNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTrip: () => void;
  tripName: string;
  startDate: Date;
  daysUntilTrip: number;
  completionPercentage: number;
  pendingTasks: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export function DeadlineNudgeModal({
  isOpen,
  onClose,
  onViewTrip,
  tripName,
  startDate,
  daysUntilTrip,
  completionPercentage,
  pendingTasks,
}: DeadlineNudgeModalProps) {
  const isUrgent = daysUntilTrip <= 7;
  const isCritical = daysUntilTrip <= 3;

  const getUrgencyColor = () => {
    if (isCritical) return 'from-red-500 to-orange-600';
    if (isUrgent) return 'from-amber-500 to-orange-600';
    return 'from-blue-500 to-purple-600';
  };

  const getUrgencyMessage = () => {
    if (isCritical) return 'Your trip starts very soon!';
    if (isUrgent) return 'Your trip is coming up!';
    return 'Trip Starting Soon!';
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant="destructive" className="text-xs">
            High Priority
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="default" className="text-xs bg-amber-500">
            Medium
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="secondary" className="text-xs">
            Low
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${getUrgencyColor()}`}
          >
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle className="text-center">{getUrgencyMessage()}</DialogTitle>
          </div>
          <DialogDescription className="text-center">
            <strong>{tripName}</strong> starts in {daysUntilTrip}{' '}
            {daysUntilTrip === 1 ? 'day' : 'days'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown */}
          <Card
            className={`p-4 bg-gradient-to-br ${
              isCritical
                ? 'from-red-50 to-orange-50 border-red-200'
                : isUrgent
                  ? 'from-amber-50 to-orange-50 border-amber-200'
                  : 'from-blue-50 to-purple-50 border-blue-200'
            }`}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                <p className="text-sm font-medium">Trip Start Date</p>
              </div>
              <p className="text-2xl font-bold mb-1">{format(startDate, 'MMMM d, yyyy')}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(startDate, { addSuffix: true })}
              </p>
            </div>
          </Card>

          {/* Completion Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Trip Completion</h4>
              <Badge
                variant="outline"
                className={
                  completionPercentage === 100
                    ? 'bg-green-100 text-green-800'
                    : completionPercentage >= 70
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                }
              >
                {completionPercentage}%
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  completionPercentage === 100
                    ? 'bg-green-500'
                    : completionPercentage >= 70
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </Card>

          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <Card className="p-4 bg-muted/50">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                {pendingTasks.length} Pending {pendingTasks.length === 1 ? 'Task' : 'Tasks'}
              </h4>
              <div className="space-y-2">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-start justify-between gap-2">
                    <p className="text-sm flex-1">{task.title}</p>
                    {getPriorityBadge(task.priority)}
                  </div>
                ))}
                {pendingTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{pendingTasks.length - 3} more tasks
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Atlas Message */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">
                {completionPercentage === 100 ? (
                  <span>
                    <strong>Great work!</strong> Your trip is fully planned. Have an amazing time!
                  </span>
                ) : isCritical ? (
                  <span>
                    <strong>Time is running out!</strong> Focus on completing high-priority tasks
                    before your trip.
                  </span>
                ) : isUrgent ? (
                  <span>
                    <strong>Don't wait!</strong> Complete pending tasks soon to ensure a smooth
                    trip.
                  </span>
                ) : (
                  <span>
                    <strong>Stay on track!</strong> Complete pending tasks to be fully prepared.
                  </span>
                )}
              </p>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-col gap-2">
          {completionPercentage < 100 && (
            <Button onClick={onViewTrip} className="w-full">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Pending Tasks
            </Button>
          )}
          <Button
            onClick={onClose}
            variant={completionPercentage === 100 ? 'default' : 'outline'}
            className="w-full"
          >
            {completionPercentage === 100 ? 'Sounds Good!' : 'Remind Me Later'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
