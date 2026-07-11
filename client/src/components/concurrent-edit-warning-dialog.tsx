import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, RefreshCw, Save, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EditorInfo {
  userId: string;
  userName: string;
  lastEditedAt: Date;
}

interface ConcurrentEditWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: "activity" | "expense" | "itinerary" | "note";
  itemName: string;
  currentEditor: EditorInfo;
  onOverwrite: () => void;
  onViewChanges: () => void;
  onRefresh: () => void;
  currentUserEdits?: string;
}

export function ConcurrentEditWarningDialog({
  isOpen,
  onClose,
  itemType,
  itemName,
  currentEditor,
  onOverwrite,
  onViewChanges,
  onRefresh,
  currentUserEdits
}: ConcurrentEditWarningDialogProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const itemTypeLabel = itemType.charAt(0).toUpperCase() + itemType.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <DialogTitle>Concurrent Edit Detected</DialogTitle>
          </div>
          <DialogDescription>
            Someone else is editing this {itemType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-1">
                  {itemTypeLabel} Being Edited
                </h4>
                <p className="text-sm text-amber-800 font-medium mb-2">
                  "{itemName}"
                </p>
              </div>
            </div>
          </Card>

          {/* Editor Info */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-semibold">Currently Editing</h4>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                  {getInitials(currentEditor.userName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-medium">{currentEditor.userName}</p>
                <p className="text-xs text-muted-foreground">
                  Last edited {formatDistanceToNow(currentEditor.lastEditedAt, { addSuffix: true })}
                </p>
              </div>

              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </Card>

          {/* Your Changes */}
          {currentUserEdits && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Your Unsaved Changes</h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {currentUserEdits}
              </p>
            </Card>
          )}

          {/* Warning Message */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2 text-sm">
              <p className="font-medium">What happens if you continue?</p>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>Their changes may be overwritten by your changes</li>
                <li>You may lose some of your edits if they save first</li>
                <li>Data conflicts could occur</li>
              </ul>
            </div>
          </Card>

          {/* Options */}
          <Card className="p-4 bg-green-50 border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 text-sm">Recommended Actions</h4>
            <ul className="space-y-1 text-xs text-green-800">
              <li className="flex items-start gap-1">
                <span className="text-green-600">•</span>
                <span>Refresh to see their latest changes</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-600">•</span>
                <span>Coordinate with {currentEditor.userName} via chat</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-600">•</span>
                <span>Wait for them to finish before making changes</span>
              </li>
            </ul>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh & View Latest
          </Button>

          <Button
            variant="outline"
            onClick={onViewChanges}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Compare Changes
          </Button>

          <Button
            onClick={onOverwrite}
            variant="destructive"
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Anyway
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground">
          Tip: Use the chat to coordinate edits with your team
        </p>
      </DialogContent>
    </Dialog>
  );
}
