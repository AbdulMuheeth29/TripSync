import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Mail, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface JoinRequestPendingProps {
  tripName: string;
  organizerName: string;
  organizerEmail: string;
  requestSentDate: Date;
  onCancel: () => void;
  onResendRequest: () => void;
}

export function JoinRequestPending({
  tripName,
  organizerName,
  organizerEmail,
  requestSentDate,
  onCancel,
  onResendRequest,
}: JoinRequestPendingProps) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 animate-pulse">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Join Request Pending</h2>
          <p className="text-muted-foreground">
            Your request to join <span className="font-semibold">{tripName}</span> has been sent
          </p>
        </div>

        <Alert className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Your join request was successfully sent to {organizerName} on{' '}
            {format(requestSentDate, "MMM d, yyyy 'at' h:mm a")}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold text-sm mb-3">What happens next?</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>The trip organizer ({organizerName}) will review your request</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>You'll receive an email notification when they approve or decline</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>Once approved, you'll get instant access to the trip</span>
              </li>
            </ol>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Organizer Contact</p>
                <p className="text-sm text-blue-700">
                  {organizerName} ({organizerEmail})
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  You can reach out directly if you have questions about your request
                </p>
              </div>
            </div>
          </Card>

          <div className="pt-4 space-y-2">
            <Button variant="outline" className="w-full" onClick={onResendRequest}>
              <Mail className="h-4 w-4 mr-2" />
              Resend Request
            </Button>
            <Button
              variant="ghost"
              className="w-full text-red-600 hover:text-red-600 hover:bg-red-50"
              onClick={onCancel}
            >
              Cancel Join Request
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4">
            Haven't heard back? Most organizers respond within 24-48 hours.
          </p>
        </div>
      </Card>
    </div>
  );
}
