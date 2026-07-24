import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ThumbsUp, ThumbsDown, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VoteDeadlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptSuggestion: () => void;
  onRejectSuggestion: () => void;
  activityName: string;
  voteStats: {
    upvotes: number;
    downvotes: number;
    abstain: number;
    total: number;
  };
  atlasSuggestion: {
    action: 'modify' | 'remove' | 'replace' | 'compromise';
    reasoning: string;
    details: string;
  };
}

export function VoteDeadlockModal({
  isOpen,
  onClose,
  onAcceptSuggestion,
  onRejectSuggestion,
  activityName,
  voteStats,
  atlasSuggestion,
}: VoteDeadlockModalProps) {
  const { upvotes, downvotes, abstain, total } = voteStats;
  const upvotePercent = Math.round((upvotes / total) * 100);
  const downvotePercent = Math.round((downvotes / total) * 100);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'modify':
        return { label: 'Modify Activity', variant: 'default' as const, color: 'bg-blue-500' };
      case 'remove':
        return { label: 'Remove Activity', variant: 'destructive' as const, color: 'bg-red-500' };
      case 'replace':
        return { label: 'Replace Activity', variant: 'default' as const, color: 'bg-purple-500' };
      case 'compromise':
        return {
          label: 'Compromise Solution',
          variant: 'secondary' as const,
          color: 'bg-green-500',
        };
      default:
        return { label: 'Suggested Action', variant: 'outline' as const, color: 'bg-gray-500' };
    }
  };

  const actionBadge = getActionBadge(atlasSuggestion.action);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Vote Deadlock Detected</DialogTitle>
          <DialogDescription className="text-center">
            Your group can't agree on "{activityName}". Atlas AI has a suggestion to help.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Vote Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Current Votes</span>
                <Badge variant="outline">{total} members</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Upvotes</span>
                      <span className="font-medium">
                        {upvotes} ({upvotePercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${upvotePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Downvotes</span>
                      <span className="font-medium">
                        {downvotes} ({downvotePercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${downvotePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {abstain > 0 && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Abstained</span>
                        <span className="font-medium">{abstain}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Atlas Suggestion */}
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Atlas AI Suggestion</span>
              <Badge variant={actionBadge.variant} className="ml-auto">
                {actionBadge.label}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium mb-1">Reasoning:</div>
                <p className="text-sm text-muted-foreground">{atlasSuggestion.reasoning}</p>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Suggested Action:</div>
                <p className="text-sm">{atlasSuggestion.details}</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="rounded-lg bg-muted/50 p-3 border border-border">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium">Tip:</span> Activities need 70%+ approval to be
              auto-accepted. Consider discussing in group chat to reach consensus.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onRejectSuggestion} className="w-full sm:w-auto">
            Discuss More
          </Button>
          <Button onClick={onAcceptSuggestion} className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4 mr-2" />
            Accept Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
