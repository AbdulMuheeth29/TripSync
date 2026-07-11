import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Mail, MessageCircle, UserMinus, Receipt, MessageSquare, ThumbsUp, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";

interface MemberActivity {
  type: "expense" | "comment" | "vote" | "activity_added";
  description: string;
  timestamp: Date;
}

interface MemberProfileData {
  id: string;
  name: string;
  email: string;
  role: "organizer" | "member";
  joinedDate: Date;
  stats: {
    expensesPaid: number;
    totalPaid: number;
    totalOwed: number;
    netBalance: number;
    commentsPosted: number;
    votesParticipated: number;
    activitiesAdded: number;
  };
  recentActivity: MemberActivity[];
}

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberProfileData;
  currency: string;
  isCurrentUser: boolean;
  canRemoveMember: boolean;
  onSendMessage?: () => void;
  onRemoveMember?: () => void;
}

export function MemberProfileModal({
  isOpen,
  onClose,
  member,
  currency,
  isCurrentUser,
  canRemoveMember,
  onSendMessage,
  onRemoveMember
}: MemberProfileModalProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getActivityIcon = (type: MemberActivity['type']) => {
    switch (type) {
      case "expense":
        return <Receipt className="h-4 w-4 text-green-600" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case "vote":
        return <ThumbsUp className="h-4 w-4 text-purple-600" />;
      case "activity_added":
        return <Calendar className="h-4 w-4 text-amber-600" />;
    }
  };

  const participationScore = Math.min(
    ((member.stats.commentsPosted * 10 + member.stats.votesParticipated * 5 + member.stats.activitiesAdded * 15) / 100) * 100,
    100
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Profile</DialogTitle>
          <DialogDescription>
            {isCurrentUser ? "Your profile for this trip" : `${member.name}'s profile`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold">{member.name}</h3>
                  {member.role === "organizer" && (
                    <Badge className="bg-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Organizer
                    </Badge>
                  )}
                  {isCurrentUser && (
                    <Badge variant="secondary">You</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Mail className="h-4 w-4" />
                  <span>{member.email}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(member.joinedDate, "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Financial Summary */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Financial Summary
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(member.stats.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {member.stats.expensesPaid} {member.stats.expensesPaid === 1 ? 'expense' : 'expenses'}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Owed</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(member.stats.totalOwed)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  For shared expenses
                </p>
              </Card>

              <Card className={`p-4 col-span-2 ${
                member.stats.netBalance > 0
                  ? "bg-green-50 border-green-200"
                  : member.stats.netBalance < 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200"
              }`}>
                <p className="text-sm mb-1 font-medium">Net Balance</p>
                <p className="text-3xl font-bold">
                  {member.stats.netBalance === 0 ? (
                    <span className="text-blue-600">All Settled</span>
                  ) : member.stats.netBalance > 0 ? (
                    <span className="text-green-600">+{formatCurrency(member.stats.netBalance)}</span>
                  ) : (
                    <span className="text-amber-600">-{formatCurrency(member.stats.netBalance)}</span>
                  )}
                </p>
                <p className="text-xs mt-1">
                  {member.stats.netBalance > 0 && "Group members owe them"}
                  {member.stats.netBalance < 0 && "They owe to group members"}
                  {member.stats.netBalance === 0 && "No outstanding balance"}
                </p>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Participation Stats */}
          <div>
            <h4 className="font-semibold mb-3">Trip Participation</h4>

            <Card className="p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Participation Score</span>
                <span className="text-lg font-bold">{Math.round(participationScore)}%</span>
              </div>
              <Progress value={participationScore} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                Based on contributions to planning and decision-making
              </p>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 text-center">
                <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{member.stats.commentsPosted}</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </Card>

              <Card className="p-4 text-center">
                <ThumbsUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{member.stats.votesParticipated}</p>
                <p className="text-xs text-muted-foreground">Votes</p>
              </Card>

              <Card className="p-4 text-center">
                <Calendar className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{member.stats.activitiesAdded}</p>
                <p className="text-xs text-muted-foreground">Activities</p>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Recent Activity */}
          <div>
            <h4 className="font-semibold mb-3">Recent Activity</h4>

            {member.recentActivity.length > 0 ? (
              <div className="space-y-2">
                {member.recentActivity.slice(0, 5).map((activity, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(activity.timestamp, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}

                {member.recentActivity.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    +{member.recentActivity.length - 5} more activities
                  </p>
                )}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isCurrentUser && onRemoveMember && canRemoveMember && (
            <Button
              variant="outline"
              onClick={onRemoveMember}
              className="text-red-600 hover:text-red-600 hover:bg-red-50"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove from Trip
            </Button>
          )}
          {!isCurrentUser && onSendMessage && (
            <Button variant="outline" onClick={onSendMessage}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
