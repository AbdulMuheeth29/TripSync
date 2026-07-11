import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageSquare, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type VoteStatus = "approved" | "discussing" | "not_approved" | "pending";

interface VoteStatusProps {
  status: VoteStatus;
  yesVotes: number;
  noVotes: number;
  totalMembers: number;
  commentsCount?: number;
  showDetails?: boolean;
}

export function VoteStatusIndicator({
  status,
  yesVotes,
  noVotes,
  totalMembers,
  commentsCount = 0,
  showDetails = false
}: VoteStatusProps) {
  const percentage = totalMembers > 0 ? Math.round((yesVotes / totalMembers) * 100) : 0;

  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          icon: "🟢",
          label: "Approved",
          color: "bg-green-100 text-green-800 border-green-200",
          description: `${percentage}% approval (${yesVotes}/${totalMembers})`
        };
      case "discussing":
        return {
          icon: "🟡",
          label: "Under Discussion",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          description: `${percentage}% approval (${yesVotes}/${totalMembers})`
        };
      case "not_approved":
        return {
          icon: "🔴",
          label: "Not Approved",
          color: "bg-red-100 text-red-800 border-red-200",
          description: `Only ${percentage}% approval (${yesVotes}/${totalMembers})`
        };
      case "pending":
        return {
          icon: "⚪",
          label: "Pending Votes",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          description: `${yesVotes + noVotes}/${totalMembers} voted`
        };
    }
  };

  const config = getStatusConfig();

  if (!showDetails) {
    return (
      <Badge variant="outline" className={cn("gap-1.5", config.color)}>
        <span>{config.icon}</span>
        <span className="font-medium">{config.label}</span>
      </Badge>
    );
  }

  return (
    <div className={cn("rounded-lg border p-4", config.color)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="font-semibold">{config.label}</p>
            <p className="text-sm opacity-80">{config.description}</p>
          </div>
        </div>
        {commentsCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            {commentsCount}
          </Badge>
        )}
      </div>

      {/* Vote Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" />
            <span>Yes</span>
          </div>
          <span className="font-medium">{yesVotes}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 rotate-180" />
            <span>No</span>
          </div>
          <span className="font-medium">{noVotes}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </div>
          <span className="font-medium">{totalMembers - yesVotes - noVotes}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 space-y-1">
        <div className="h-2 bg-white/50 rounded-full overflow-hidden flex">
          <div
            className="bg-green-500 h-full transition-all"
            style={{ width: `${percentage}%` }}
          />
          <div
            className="bg-red-500 h-full transition-all"
            style={{ width: `${(noVotes / totalMembers) * 100}%` }}
          />
        </div>
        <p className="text-xs opacity-70 text-center">
          {percentage}% in favor
        </p>
      </div>
    </div>
  );
}
