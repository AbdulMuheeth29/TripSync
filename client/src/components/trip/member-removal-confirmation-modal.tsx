import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserMinus, AlertTriangle, DollarSign, Calendar, MessageCircle, TrendingUp } from "lucide-react";
import { useState } from "react";

interface MemberImpact {
  expensesOwed: number;
  expensesPaid: number;
  activitiesCreated: number;
  messagesPosted: number;
  activeVotes: number;
  hasUnsettledDebts: boolean;
  unsettledAmount: number;
}

interface MemberRemovalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "member";
    joinedAt: Date;
  };
  impact: MemberImpact;
  tripName: string;
  currency: string;
  onConfirm: (reassignExpenses: boolean) => Promise<void>;
}

export function MemberRemovalConfirmationModal({
  isOpen,
  onClose,
  member,
  impact,
  tripName,
  currency,
  onConfirm
}: MemberRemovalConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [acknowledgeImpact, setAcknowledgeImpact] = useState(false);
  const [reassignExpenses, setReassignExpenses] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(reassignExpenses);
      onClose();
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const hasAnyImpact =
    impact.expensesOwed > 0 ||
    impact.expensesPaid > 0 ||
    impact.activitiesCreated > 0 ||
    impact.activeVotes > 0 ||
    impact.hasUnsettledDebts;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-red-600" />
            <DialogTitle>Remove Member</DialogTitle>
          </div>
          <DialogDescription>
            Remove {member.name} from {tripName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Info */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
          </Card>

          {/* Unsettled Debts Warning */}
          {impact.hasUnsettledDebts && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> {member.name} has {formatCurrency(impact.unsettledAmount)} in unsettled expenses.
                They should settle these before being removed.
              </AlertDescription>
            </Alert>
          )}

          {/* Impact Summary */}
          {hasAnyImpact && (
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-3">Member Impact</h4>
              <div className="space-y-2">
                {(impact.expensesOwed > 0 || impact.expensesPaid > 0) && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Expenses</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-red-600">{formatCurrency(impact.expensesOwed)} owed</span>
                      {" • "}
                      <span className="text-green-600">{formatCurrency(impact.expensesPaid)} paid</span>
                    </div>
                  </div>
                )}

                {impact.activitiesCreated > 0 && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Activities Created</span>
                    </div>
                    <span className="text-sm font-medium">{impact.activitiesCreated}</span>
                  </div>
                )}

                {impact.messagesPosted > 0 && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Messages Posted</span>
                    </div>
                    <span className="text-sm font-medium">{impact.messagesPosted}</span>
                  </div>
                )}

                {impact.activeVotes > 0 && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Active Votes</span>
                    </div>
                    <span className="text-sm font-medium">{impact.activeVotes}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* What Happens */}
          <Card className="p-4 bg-red-50 border-red-200">
            <h4 className="text-sm font-semibold text-red-900 mb-2">What happens when you remove this member?</h4>
            <ul className="text-xs text-red-800 space-y-1">
              <li>• {member.name} will lose access to this trip immediately</li>
              <li>• They will no longer receive notifications about trip updates</li>
              <li>• Their messages and activity history will remain visible</li>
              <li>• Their votes will be removed from active polls</li>
              {impact.hasUnsettledDebts && (
                <li>• Outstanding debts will need to be settled outside the app</li>
              )}
            </ul>
          </Card>

          {/* Expense Handling */}
          {(impact.expensesOwed > 0 || impact.expensesPaid > 0) && (
            <Card className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <Checkbox
                  id="reassign-expenses"
                  checked={reassignExpenses}
                  onCheckedChange={(checked) => setReassignExpenses(checked === true)}
                />
                <Label
                  htmlFor="reassign-expenses"
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  Keep expense history but mark as "Removed Member" in records
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {reassignExpenses
                  ? "Expenses will remain in trip history with anonymized label"
                  : "All expenses will be permanently deleted (not recommended)"
                }
              </p>
            </Card>
          )}

          {/* Acknowledgment */}
          <Card className="p-4 bg-muted">
            <div className="flex items-start gap-2">
              <Checkbox
                id="acknowledge-removal"
                checked={acknowledgeImpact}
                onCheckedChange={(checked) => setAcknowledgeImpact(checked === true)}
              />
              <Label
                htmlFor="acknowledge-removal"
                className="text-sm font-normal cursor-pointer"
              >
                I understand this action cannot be undone. {member.name} will need to be re-invited to rejoin.
              </Label>
            </div>
          </Card>

          {/* Admin Warning */}
          {member.role === "admin" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Note:</strong> You're removing an admin. Make sure there's at least one other admin for this trip.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!acknowledgeImpact || isConfirming}
            variant="destructive"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            {isConfirming ? "Removing..." : "Remove Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
