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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JoinRequest {
  id: string;
  user: {
    name: string;
    email: string;
  };
  requestedAt: Date;
  message?: string;
}

interface JoinRequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string) => void | Promise<void>;
  onDecline: (requestId: string) => void | Promise<void>;
  request: JoinRequest;
  tripName: string;
  currentMemberCount: number;
  isProcessing?: boolean;
}

export function JoinRequestApprovalModal({
  isOpen,
  onClose,
  onApprove,
  onDecline,
  request,
  tripName,
  currentMemberCount,
  isProcessing = false,
}: JoinRequestApprovalModalProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleApprove = async () => {
    await onApprove(request.id);
  };

  const handleDecline = async () => {
    await onDecline(request.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">New Join Request</DialogTitle>
          <DialogDescription className="text-center">
            Someone wants to join your trip to <strong>{tripName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <Card className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {getInitials(request.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold">{request.user.name}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {request.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Requested {formatDistanceToNow(request.requestedAt, { addSuffix: true })}</span>
            </div>
          </Card>

          {/* Personal Message */}
          {request.message && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Message from requester:</p>
              <p className="text-sm text-blue-800 italic">"{request.message}"</p>
            </Card>
          )}

          {/* Trip Impact */}
          <Card className="p-4 bg-muted/50">
            <p className="text-sm font-medium mb-2">If you approve:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {request.user.name} will join the trip
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Group size will be {currentMemberCount + 1} people
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                They can vote, comment, and edit the trip
              </li>
            </ul>
          </Card>

          {/* Warning */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Once approved, this person will have full access to your trip
              itinerary, expenses, and group chat. You can remove them later if needed.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isProcessing}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {isProcessing ? 'Declining...' : 'Decline'}
          </Button>
          <Button onClick={handleApprove} disabled={isProcessing} className="flex-1">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isProcessing ? 'Approving...' : 'Approve & Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
