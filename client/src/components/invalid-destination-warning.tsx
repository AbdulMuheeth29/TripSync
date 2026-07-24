import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, MapPin } from 'lucide-react';

interface InvalidDestinationWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAnyway: () => void;
  onChangeDestination: () => void;
  destination: string;
}

export function InvalidDestinationWarning({
  isOpen,
  onClose,
  onContinueAnyway,
  onChangeDestination,
  destination,
}: InvalidDestinationWarningProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center">
            Limited Information for This Destination
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            We couldn't find much information about{' '}
            <span className="font-semibold">"{destination}"</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900 mb-2">This might mean:</p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>The destination name might be misspelled</li>
              <li>It's a very small or uncommon location</li>
              <li>We have limited data for this area</li>
            </ul>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Try these formats:</p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• "City, Country" (e.g., "Paris, France")</li>
                  <li>• "City, State, Country" (e.g., "Austin, Texas, USA")</li>
                  <li>• Popular tourist destination names</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-muted bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> You can continue anyway, but AI-generated recommendations might
              be limited or generic.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onChangeDestination} className="flex-1">
            Change Destination
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onContinueAnyway}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
