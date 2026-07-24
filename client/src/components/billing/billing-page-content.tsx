import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Sparkles,
  Check,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BillingContentProps {
  user: any;
  subscriptionTier: string;
}

export function BillingPageContent({ user, subscriptionTier }: BillingContentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [cancelFeedback, setCancelFeedback] = useState('');

  const planLabel =
    subscriptionTier === 'teams' ? 'Teams' : subscriptionTier === 'pro' ? 'Pro' : 'Free';
  const isPaid = subscriptionTier === 'pro' || subscriptionTier === 'teams';

  // Fetch subscription details
  useEffect(() => {
    if (isPaid) {
      fetchSubscriptionDetails();
      fetchUsageStats();
      fetchBillingHistory();
      fetchPaymentMethod();
    }
  }, [isPaid]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await apiRequest('GET', '/api/stripe/subscription');
      const data = await response.json();
      setSubscriptionDetails(data);
    } catch (error) {
      console.error('Failed to fetch subscription details:', error);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await apiRequest('GET', '/api/user/usage-stats');
      const data = await response.json();
      setUsageStats(data);
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const response = await apiRequest('GET', '/api/stripe/invoices');
      const data = await response.json();
      setBillingHistory(data.invoices || []);
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
    }
  };

  const fetchPaymentMethod = async () => {
    try {
      const response = await apiRequest('GET', '/api/stripe/payment-method');
      const data = await response.json();
      setPaymentMethod(data);
    } catch (error) {
      console.error('Failed to fetch payment method:', error);
    }
  };

  const openPortal = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/stripe/portal', {
        returnUrl: `${window.location.origin}/dashboard/billing`,
      });
      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      await apiRequest('POST', '/api/stripe/cancel-subscription', {
        feedback: cancelFeedback,
      });
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription will remain active until the end of the billing period.',
      });
      fetchSubscriptionDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await apiRequest('GET', `/api/stripe/invoices/${invoiceId}/pdf`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  // Plan features
  const planFeatures = {
    free: [
      '3 active trips',
      'Up to 6 members per trip',
      'Basic itinerary planning',
      'Expense tracking',
      'Community support',
    ],
    pro: [
      'Unlimited trips',
      'Unlimited members',
      'AI itinerary generation',
      'Advanced features',
      'Priority support',
      'Export to PDF/CSV',
      'Map view',
      'Place discovery',
    ],
    teams: [
      'Everything in Pro',
      'Team collaboration tools',
      'Admin dashboard',
      'Priority support',
      'Custom branding (coming soon)',
    ],
  };

  const features = planFeatures[subscriptionTier as keyof typeof planFeatures] || planFeatures.free;

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>Manage your {planLabel} plan and billing settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{planLabel} Plan</h3>
                {subscriptionDetails?.status && (
                  <Badge
                    variant={subscriptionDetails.status === 'active' ? 'default' : 'secondary'}
                  >
                    {subscriptionDetails.status}
                  </Badge>
                )}
              </div>
              {subscriptionDetails?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {subscriptionDetails.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                  {new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {isPaid && subscriptionDetails?.amount && (
                <p className="text-lg font-semibold mt-2">
                  ${(subscriptionDetails.amount / 100).toFixed(2)}/{subscriptionDetails.interval}
                </p>
              )}
            </div>
            {isPaid && (
              <Button onClick={openPortal} disabled={loading}>
                {loading ? 'Loading...' : 'Manage Subscription'}
              </Button>
            )}
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Plan Features</h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {isPaid && usageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
            <CardDescription>Your activity this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Active Trips
                </div>
                <div className="text-2xl font-bold">{usageStats.activeTrips || 0}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  AI Generations
                </div>
                <div className="text-2xl font-bold">{usageStats.aiGenerations || 0}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  API Calls
                </div>
                <div className="text-2xl font-bold">{usageStats.apiCalls || 0}</div>
              </div>
            </div>

            {usageStats.limits && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Used</span>
                  <span>
                    {usageStats.storageUsed || 0} MB / {usageStats.limits.storage} MB
                  </span>
                </div>
                <Progress value={(usageStats.storageUsed / usageStats.limits.storage) * 100} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upgrade Options (for Free users) */}
      {!isPaid && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Pro Plan</CardTitle>
              <CardDescription>Perfect for frequent travelers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                $4.99<span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2">
                {planFeatures.pro.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full">
                <Link href="/pricing?checkout=pro">
                  <a className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Upgrade to Pro
                  </a>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teams Plan</CardTitle>
              <CardDescription>For groups and organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                $9.99<span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2">
                {planFeatures.teams.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant="outline">
                <Link href="/pricing?checkout=teams">
                  <a className="inline-flex items-center gap-2">Upgrade to Teams</a>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Method */}
      {isPaid && paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>Your default payment method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 rounded border bg-muted flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">
                    {paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last4}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={openPortal}>
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      {isPaid && billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {billingHistory.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {new Date(invoice.created * 1000).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Invoice #{invoice.number || invoice.id.slice(-8)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">${(invoice.amount / 100).toFixed(2)}</div>
                      <Badge
                        variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.invoicePdf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(invoice.invoicePdf, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription */}
      {isPaid && !subscriptionDetails?.cancelAtPeriodEnd && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancel Subscription
            </CardTitle>
            <CardDescription>
              Cancel your subscription at any time. You'll retain access until the end of your
              billing period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Cancel Subscription</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                  <AlertDialogDescription>
                    We're sorry to see you go! Before you cancel, here's what you'll lose:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Unlimited trips and members</li>
                      <li>AI-powered itinerary generation</li>
                      <li>Advanced features and integrations</li>
                      <li>Priority support</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Help us improve - What's your reason for cancelling? (Optional)
                  </label>
                  <Textarea
                    placeholder="Your feedback helps us improve TripSync..."
                    value={cancelFeedback}
                    onChange={(e) => setCancelFeedback(e.target.value)}
                    rows={3}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep My Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={loading}
                  >
                    {loading ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Reactivate if cancelled */}
      {isPaid && subscriptionDetails?.cancelAtPeriodEnd && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Subscription Ending
            </CardTitle>
            <CardDescription>
              Your subscription will end on{' '}
              {new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString()}. You can
              reactivate it at any time before then.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openPortal}>Reactivate Subscription</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
