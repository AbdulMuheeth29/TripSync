import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Clock, Users, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";

interface VoterStatus {
  userId: string;
  userName: string;
  hasVoted: boolean;
  vote?: string;
}

interface VoteItem {
  id: string;
  title: string;
  description: string;
  type: "activity" | "destination" | "budget" | "date" | "general";
  deadline: Date;
  createdBy: string;
  totalVoters: number;
  votedCount: number;
  voters: VoterStatus[];
  options: Array<{ id: string; label: string; voteCount: number }>;
}

interface VoteDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  vote: VoteItem;
  currentUserId: string;
  onVoteNow: () => void;
  onExtendDeadline?: (hours: number) => void;
  onRemindMembers?: () => void;
}

export function VoteDeadlineModal({
  isOpen,
  onClose,
  vote,
  currentUserId,
  onVoteNow,
  onExtendDeadline,
  onRemindMembers
}: VoteDeadlineModalProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const hoursUntilDeadline = differenceInHours(vote.deadline, new Date());
  const isCritical = hoursUntilDeadline <= 6;
  const isUrgent = hoursUntilDeadline <= 24;
  const isPast = hoursUntilDeadline < 0;

  const percentageVoted = (vote.votedCount / vote.totalVoters) * 100;
  const currentUserVoted = vote.voters.find(v => v.userId === currentUserId)?.hasVoted;

  const getTypeIcon = () => {
    switch (vote.type) {
      case "activity":
        return "🎯";
      case "destination":
        return "📍";
      case "budget":
        return "💰";
      case "date":
        return "📅";
      default:
        return "📋";
    }
  };

  const getUrgencyColor = () => {
    if (isPast) return "text-red-600";
    if (isCritical) return "text-red-600";
    if (isUrgent) return "text-amber-600";
    return "text-blue-600";
  };

  const getUrgencyBg = () => {
    if (isPast) return "bg-red-50 border-red-200";
    if (isCritical) return "bg-red-50 border-red-200";
    if (isUrgent) return "bg-amber-50 border-amber-200";
    return "bg-blue-50 border-blue-200";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isPast ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Clock className="h-5 w-5 text-primary" />
            )}
            <DialogTitle>
              {isPast ? "Vote Deadline Passed" : "Vote Deadline Reminder"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isPast
              ? "This vote's deadline has passed"
              : `Deadline: ${format(vote.deadline, "MMM d, yyyy 'at' h:mm a")}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Urgency Alert */}
          <Card className={`p-4 ${getUrgencyBg()}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center text-2xl">
                {getTypeIcon()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{vote.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{vote.description}</p>
                <div className={`flex items-center gap-2 ${getUrgencyColor()} font-semibold`}>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {isPast
                      ? `Deadline was ${formatDistanceToNow(vote.deadline, { addSuffix: true })}`
                      : `${formatDistanceToNow(vote.deadline, { addSuffix: true })}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Voting Progress */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Voting Progress</h4>
              </div>
              <Badge variant={percentageVoted === 100 ? "secondary" : "outline"}>
                {vote.votedCount}/{vote.totalVoters} voted
              </Badge>
            </div>

            <Progress value={percentageVoted} className="h-2 mb-3" />

            <div className="space-y-2">
              {vote.voters.map((voter) => (
                <div key={voter.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {getInitials(voter.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{voter.userName}</span>
                  </div>
                  {voter.hasVoted ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Voted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs">Pending</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Current Results */}
          {vote.options.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Current Results</h4>
              <div className="space-y-2">
                {vote.options.map((option) => {
                  const optionPercentage = vote.votedCount > 0
                    ? (option.voteCount / vote.votedCount) * 100
                    : 0;
                  return (
                    <div key={option.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{option.label}</span>
                        <span className="font-medium">{option.voteCount} votes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${optionPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Actions for non-voters */}
          {!currentUserVoted && !isPast && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    You haven't voted yet!
                  </p>
                  <p className="text-xs text-green-800 mt-1">
                    Your opinion matters. Cast your vote before the deadline.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Deadline Management (for creator) */}
          {onExtendDeadline && !isPast && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-900 font-medium mb-2">Vote Creator Options</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExtendDeadline(24)}
                  className="flex-1 text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  +24 hours
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExtendDeadline(48)}
                  className="flex-1 text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  +48 hours
                </Button>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onRemindMembers && !isPast && vote.votedCount < vote.totalVoters && (
            <Button variant="outline" onClick={onRemindMembers} className="flex-1">
              Remind Members
            </Button>
          )}
          {!currentUserVoted && !isPast ? (
            <Button onClick={onVoteNow} className="flex-1">
              Vote Now
            </Button>
          ) : (
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
