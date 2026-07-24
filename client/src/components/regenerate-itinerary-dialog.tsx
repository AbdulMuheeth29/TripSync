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
import { AlertTriangle, Sparkles } from 'lucide-react';

interface RegenerateItineraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isRegenerating?: boolean;
}

export function RegenerateItineraryDialog({
  isOpen,
  onClose,
  onConfirm,
  isRegenerating = false,
}: RegenerateItineraryDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center">Regenerate Itinerary?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This will replace your current itinerary with a new AI-generated plan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900 mb-2">What will happen:</p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>All current activities will be replaced</li>
              <li>Votes and comments will be preserved</li>
              <li>Your preferences will remain the same</li>
              <li>New activities will be generated</li>
            </ul>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">AI Regeneration</p>
                <p className="text-sm text-blue-700 mt-1">
                  Atlas AI will create a fresh itinerary based on your trip preferences. This
                  usually takes 30-60 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRegenerating}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isRegenerating}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isRegenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              'Regenerate Itinerary'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
