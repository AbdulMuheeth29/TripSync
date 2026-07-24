import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { AppLogo } from '@/components/app-logo';
import { AppHero } from '@/components/app-hero';
import { ArrowLeft, CreditCard, Sparkles, Loader2 } from 'lucide-react';

export default function BillingPage() {
  const { user, subscriptionTier, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planLabel =
    subscriptionTier === 'teams' ? 'Teams' : subscriptionTier === 'pro' ? 'Pro' : 'Free';
  const isPaid = subscriptionTier === 'pro' || subscriptionTier === 'teams';

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        localStorage.getItem('tripsync_token') || sessionStorage.getItem('tripsync_token');
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ returnUrl: `${window.location.origin}/dashboard` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not open billing portal');
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError('No portal URL returned');
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/dashboard">
            <a className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </a>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 no-underline text-foreground hover:opacity-90 transition-opacity"
          >
            <AppLogo className="h-8 w-8" />
            <span className="font-semibold">TripSync</span>
          </Link>
          <div className="w-32" />
        </div>
      </header>

      <AppHero />

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-heading text-3xl font-bold mb-2">Subscription & Billing</h1>
        <p className="text-muted-foreground mb-8">
          Manage your plan, payment method, and billing history
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current plan
            </CardTitle>
            <CardDescription>
              You are on the <strong>{planLabel}</strong> plan
              {user?.email && ` (${user.email})`}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {isPaid ? (
              <Button onClick={openPortal} disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Opening…
                  </>
                ) : (
                  'Manage subscription'
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Unlock unlimited trips, advanced features, and priority support with Pro or Teams.
                </p>
                <Button asChild>
                  <Link href="/pricing?checkout=pro">
                    <a className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Explore Upgrade Options
                    </a>
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
