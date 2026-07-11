import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Calendar, TrendingUp, Zap, Users, Image, Sparkles, MapPin } from "lucide-react";
import { format, addMonths } from "date-fns";

interface SubscriptionData {
  plan: "Free" | "Pro" | "Teams";
  status: "active" | "trialing" | "canceled" | "past_due";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  usage: {
    trips: { used: number; limit: number | null };
    aiGenerations: { used: number; limit: number | null };
    members: { used: number; limit: number | null };
    storage: { used: number; limit: number }; // in GB
  };
}

interface SubscriptionDashboardProps {
  subscription: SubscriptionData;
  onUpgrade: () => void;
  onUpdatePayment: () => void;
  onCancelSubscription: () => void;
  onReactivate: () => void;
}

export function SubscriptionDashboard({
  subscription,
  onUpgrade,
  onUpdatePayment,
  onCancelSubscription,
  onReactivate
}: SubscriptionDashboardProps) {
  const { plan, status, currentPeriodEnd, cancelAtPeriodEnd, paymentMethod, usage } = subscription;

  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
    }
  };

  const getPlanPrice = () => {
    switch (plan) {
      case "Free": return "$0";
      case "Pro": return "$4.99";
      case "Teams": return "$9.99";
    }
  };

  const formatUsage = (used: number, limit: number | null) => {
    if (limit === null) return "Unlimited";
    return `${used} / ${limit}`;
  };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (limit === null) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{plan} Plan</h2>
              {getStatusBadge()}
            </div>
            <p className="text-3xl font-bold text-primary">{getPlanPrice()}<span className="text-base text-muted-foreground font-normal">/month</span></p>
          </div>
          {plan !== "Teams" && (
            <Button onClick={onUpgrade}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          )}
        </div>

        <Separator className="my-6" />

        {/* Billing Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Next Billing Date</span>
            </div>
            <span className="font-medium">{format(currentPeriodEnd, "MMM d, yyyy")}</span>
          </div>

          {paymentMethod && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Payment Method</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {paymentMethod.brand} •••• {paymentMethod.last4}
                </span>
                <Button variant="ghost" size="sm" onClick={onUpdatePayment}>
                  Update
                </Button>
              </div>
            </div>
          )}

          {cancelAtPeriodEnd && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                Subscription will cancel on {format(currentPeriodEnd, "MMM d, yyyy")}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                You'll have access to {plan} features until then.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onReactivate}
              >
                Reactivate Subscription
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Usage This Month */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usage This Month</h3>

        <div className="space-y-4">
          {/* Trips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Trips Created</span>
              </div>
              <span className="font-medium">
                {formatUsage(usage.trips.used, usage.trips.limit)}
                {usage.trips.limit === null && " ✓"}
              </span>
            </div>
            {usage.trips.limit !== null && (
              <Progress value={getUsagePercentage(usage.trips.used, usage.trips.limit)} />
            )}
          </div>

          {/* AI Generations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span>AI Generations</span>
              </div>
              <span className="font-medium">
                {formatUsage(usage.aiGenerations.used, usage.aiGenerations.limit)}
                {usage.aiGenerations.limit === null && " ✓"}
              </span>
            </div>
            {usage.aiGenerations.limit !== null && (
              <Progress value={getUsagePercentage(usage.aiGenerations.used, usage.aiGenerations.limit)} />
            )}
          </div>

          {/* Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Team Members (per trip)</span>
              </div>
              <span className="font-medium">
                {formatUsage(usage.members.used, usage.members.limit)}
                {usage.members.limit === null && " ✓"}
              </span>
            </div>
            {usage.members.limit !== null && (
              <Progress value={getUsagePercentage(usage.members.used, usage.members.limit)} />
            )}
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                <span>File Storage</span>
              </div>
              <span className="font-medium">
                {usage.storage.used.toFixed(2)} / {usage.storage.limit} GB
              </span>
            </div>
            <Progress value={getUsagePercentage(usage.storage.used, usage.storage.limit)} />
          </div>
        </div>
      </Card>

      {/* Actions */}
      {!cancelAtPeriodEnd && plan !== "Free" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Manage Subscription</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={onUpdatePayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment Method
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-600" onClick={onCancelSubscription}>
              <Zap className="h-4 w-4 mr-2" />
              Cancel Subscription
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
