import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, FileEdit, Mail } from "lucide-react";

interface AIGenerationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onCreateManually: () => void;
  onContactSupport: () => void;
  errorMessage?: string;
}

export function AIGenerationErrorModal({
  isOpen,
  onClose,
  onTryAgain,
  onCreateManually,
  onContactSupport,
  errorMessage = "An unexpected error occurred during AI generation"
}: AIGenerationErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">
            AI Generation Failed
          </DialogTitle>
          <DialogDescription className="text-center">
            We encountered an issue while generating your itinerary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Message */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {errorMessage}
            </p>
          </div>

          {/* Possible Reasons */}
          <div className="rounded-lg border border-muted bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">Common reasons:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>High server demand</li>
              <li>Network connectivity issues</li>
              <li>Invalid destination or date range</li>
              <li>Service temporarily unavailable</li>
            </ul>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Button
              onClick={onTryAgain}
              className="w-full justify-start"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button
              onClick={onCreateManually}
              className="w-full justify-start"
              variant="outline"
            >
              <FileEdit className="mr-2 h-4 w-4" />
              Create Trip Manually
            </Button>

            <Button
              onClick={onContactSupport}
              className="w-full justify-start"
              variant="outline"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
