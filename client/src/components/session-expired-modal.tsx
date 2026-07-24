import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogIn } from "lucide-react";

interface SessionExpiredModalProps {
  isOpen: boolean;
  onLogin: () => void;
}

export function SessionExpiredModal({
  isOpen,
  onLogin
}: SessionExpiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Your Session Has Expired
          </DialogTitle>
          <DialogDescription className="text-center">
            For your security, you've been logged out after a period of inactivity.
            Please log in again to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-muted/50 p-4 border border-border space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Don't worry!</span> All your trip data has been saved.
              You'll be right where you left off after logging in.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onLogin}
            className="w-full"
            size="lg"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Log In Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
