import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, Trash2, Check, X } from "lucide-react";

interface BulkActionsProps {
  selectedItems: Set<string>;
  totalItems: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkVote: (itemIds: string[], voteType: "up" | "down") => Promise<void>;
  onBulkDelete: (itemIds: string[]) => Promise<void>;
}

export function ItineraryBulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onDeselectAll,
  onBulkVote,
  onBulkDelete,
}: BulkActionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const selectedCount = selectedItems.size;
  const allSelected = selectedCount === totalItems && totalItems > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalItems;

  const handleBulkVote = async (voteType: "up" | "down") => {
    if (selectedCount === 0) return;

    setLoading(true);
    try {
      await onBulkVote(Array.from(selectedItems), voteType);
      toast({
        title: "Votes submitted",
        description: `${voteType === "up" ? "Approved" : "Rejected"} ${selectedCount} item${selectedCount > 1 ? "s" : ""}`,
      });
      onDeselectAll();
    } catch (error) {
      toast({
        title: "Bulk vote failed",
        description: error instanceof Error ? error.message : "Failed to submit votes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;

    setLoading(true);
    try {
      await onBulkDelete(Array.from(selectedItems));
      toast({
        title: "Items deleted",
        description: `Deleted ${selectedCount} item${selectedCount > 1 ? "s" : ""}`,
      });
      onDeselectAll();
      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Bulk delete failed",
        description: error instanceof Error ? error.message : "Failed to delete items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show the action bar if nothing is selected
  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectAll();
            } else {
              onDeselectAll();
            }
          }}
          aria-label="Select all items"
        />
        <span>Select items for bulk actions</span>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-background border rounded-lg p-3 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected || someSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectAll();
                } else {
                  onDeselectAll();
                }
              }}
              aria-label={allSelected ? "Deselect all" : "Select all"}
            />
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedCount} selected
              </Badge>
              {someSelected && !allSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSelectAll}
                  className="h-7 text-xs"
                >
                  Select all {totalItems}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Approve */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkVote("up")}
              disabled={loading}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve
            </Button>

            {/* Bulk Reject */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkVote("down")}
              disabled={loading}
              className="gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              Reject
            </Button>

            {/* Bulk Delete */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

            {/* Deselect All */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              disabled={loading}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} item{selectedCount > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected itinerary items, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All booking information</li>
                <li>All votes and comments</li>
                <li>All linked expenses (if any)</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : `Delete ${selectedCount} item${selectedCount > 1 ? "s" : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Component to be used on each itinerary item card
interface ItemSelectionCheckboxProps {
  itemId: number;
  isSelected: boolean;
  onToggle: (itemId: number, selected: boolean) => void;
  disabled?: boolean;
}

export function ItemSelectionCheckbox({
  itemId,
  isSelected,
  onToggle,
  disabled = false,
}: ItemSelectionCheckboxProps) {
  return (
    <div className="absolute top-2 left-2 z-10">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onToggle(itemId, !!checked)}
        disabled={disabled}
        className="bg-background border-2 shadow-sm"
        aria-label={`Select item ${itemId}`}
      />
    </div>
  );
}
