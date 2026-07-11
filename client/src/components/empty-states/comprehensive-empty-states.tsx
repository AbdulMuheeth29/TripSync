import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Calendar, Users, MessageCircle, Plus, Search, Mail } from "lucide-react";

interface EmptyStateProps {
  onAction: () => void;
  actionLabel?: string;
}

export function NoExpensesEmptyState({ onAction, actionLabel = "Add First Expense" }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Receipt className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">No expenses yet</h3>
          <p className="text-muted-foreground">
            Start tracking your trip expenses. Add receipts, split costs, and keep everyone on the same page.
          </p>
        </div>
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
        <p className="text-xs text-muted-foreground">
          Tip: Upload receipts for automatic OCR extraction
        </p>
      </div>
    </Card>
  );
}

export function NoActivitiesEmptyState({ onAction, actionLabel = "Add Activity" }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
            <Calendar className="h-10 w-10 text-purple-600" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">No activities planned</h3>
          <p className="text-muted-foreground">
            Build your itinerary by adding activities, or let Atlas AI suggest personalized recommendations.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Get AI Suggestions
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function NoMembersEmptyState({ onAction, actionLabel = "Invite Members" }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Just you so far</h3>
          <p className="text-muted-foreground">
            Invite friends and family to collaborate on this trip. The more the merrier!
          </p>
        </div>
        <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
          <p className="font-medium">When you add members, they can:</p>
          <ul className="text-muted-foreground text-left space-y-1">
            <li>• Vote on activities and make suggestions</li>
            <li>• Add and track shared expenses</li>
            <li>• Chat and coordinate in real-time</li>
            <li>• View and edit the itinerary</li>
          </ul>
        </div>
        <Button onClick={onAction}>
          <Mail className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

export function NoMessagesEmptyState({ onAction, actionLabel = "Send First Message" }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-100">
            <MessageCircle className="h-10 w-10 text-pink-600" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">No messages yet</h3>
          <p className="text-muted-foreground">
            Start the conversation! Coordinate with your group, share ideas, and stay connected.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-muted rounded-lg text-left">
            <p className="font-semibold mb-1">💬 Group Chat</p>
            <p className="text-xs text-muted-foreground">Discuss plans together</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-left">
            <p className="font-semibold mb-1">🔔 @Mentions</p>
            <p className="text-xs text-muted-foreground">Tag specific members</p>
          </div>
        </div>
        <Button onClick={onAction}>
          <MessageCircle className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

export function NoSearchResultsEmptyState({ searchTerm, onClearSearch }: { searchTerm: string; onClearSearch: () => void }) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            No matches for "<strong>{searchTerm}</strong>". Try different keywords.
          </p>
        </div>
        <Button variant="outline" onClick={onClearSearch}>
          Clear Search
        </Button>
      </div>
    </Card>
  );
}
