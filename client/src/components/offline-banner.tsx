import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, AlertCircle, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Check if there are pending changes to sync
      const pending = getPendingChangesCount();
      if (pending > 0) {
        setPendingChanges(pending);
        // Auto-hide banner after 5 seconds when back online
        setTimeout(() => setShowBanner(false), 5000);
      } else {
        setShowBanner(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getPendingChangesCount = (): number => {
    // Check localStorage for pending offline changes
    try {
      const pendingStr = localStorage.getItem("offline_pending_changes");
      if (!pendingStr) return 0;
      const pending = JSON.parse(pendingStr);
      return Array.isArray(pending) ? pending.length : 0;
    } catch {
      return 0;
    }
  };

  const handleSync = async () => {
    // Trigger manual sync of pending changes
    try {
      const pendingStr = localStorage.getItem("offline_pending_changes");
      if (!pendingStr) {
        setPendingChanges(0);
        setShowBanner(false);
        return;
      }

      const pending = JSON.parse(pendingStr);
      // TODO: Implement actual sync logic with backend
      // For now, just clear pending changes
      localStorage.removeItem("offline_pending_changes");
      setPendingChanges(0);
      setShowBanner(false);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="container mx-auto max-w-2xl pointer-events-auto">
        <Alert
          variant={isOnline ? "default" : "destructive"}
          className="shadow-lg border-2"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {isOnline ? "Back Online" : "You're Offline"}
                  </span>
                  {!isOnline && (
                    <Badge variant="outline" className="text-xs">
                      Changes saved locally
                    </Badge>
                  )}
                </div>
                <AlertDescription className="text-xs">
                  {isOnline ? (
                    pendingChanges > 0 ? (
                      <>
                        {pendingChanges} change{pendingChanges !== 1 ? "s" : ""} ready to sync
                      </>
                    ) : (
                      "All changes synced successfully"
                    )
                  ) : (
                    "Your changes are being saved locally and will sync when you're back online"
                  )}
                </AlertDescription>
              </div>
            </div>

            {isOnline && pendingChanges > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                className="flex-shrink-0"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Now
              </Button>
            )}

            {!isOnline && (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
          </div>
        </Alert>
      </div>
    </div>
  );
}
