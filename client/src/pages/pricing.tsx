import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { spacing } from "@/lib/spacing-tokens";
import { AppHero } from "@/components/app-hero";
import { useAuth } from "@/lib/auth-context";
import {
  Check,
  X,
  Sparkles,
  MapPin,
  Cloud,
  Calendar,
  Mail,
  DollarSign,
  Users,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";

const pricingPlans = {
  free: {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Perfect for occasional group trips",
    popular: false,
    features: [
      { text: "3 active trips", included: true },
      { text: "Up to 6 members per trip", included: true },
      { text: "Basic AI itinerary (1 per trip)", included: true },
      { text: "Voting & collaboration", included: true },
      { text: "Expense tracking", included: true },
      { text: "Group chat", included: true },
      { text: "5 photos per trip", included: true },
      { text: "Weather forecasts", included: true },
      { text: "Community support", included: true },
      { text: "Map view", included: false },
      { text: "Offline access", included: false },
      { text: "Calendar export", included: false },
      { text: "Email import", included: false },
      { text: "Unlimited AI generations", included: false },
    ],
    cta: "Get Started",
    ctaHref: "/login",
  },
  pro: {
    name: "Pro",
    monthlyPrice: 4.99,
    annualPrice: 39,
    description: "Best for frequent travelers",
    popular: true,
    features: [
      { text: "Everything in Free, plus:", included: true, bold: true },
      { text: "Unlimited trips & members", included: true },
      { text: "Unlimited AI generations", included: true },
      { text: "Interactive map view", included: true },
      { text: "Offline access & PWA", included: true },
      { text: "Calendar export (.ics)", included: true },
      { text: "Email import", included: true },
      { text: "Place discovery", included: true },
      { text: "Receipt OCR", included: true },
      { text: "Currency conversion", included: true },
      { text: "AI Trip Concierge", included: true },
      { text: "Unlimited photos", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Free Trial",
    ctaHref: "/login?plan=pro",
  },
  teams: {
    name: "Teams",
    monthlyPrice: 9.99,
    annualPrice: 89,
    description: "Built for travel professionals",
    popular: false,
    features: [
      { text: "Everything in Pro, plus:", included: true, bold: true },
      { text: "Custom branding", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Admin controls", included: true },
      { text: "API access", included: true },
      { text: "White-label options", included: true },
      { text: "Dedicated support", included: true },
      { text: "SLA guarantee", included: true },
    ],
    cta: "Contact Sales",
    ctaHref: "mailto:sales@tripsync.app",
  },
};

const comparisonFeatures = [
  { category: "Planning", features: [
    { name: "Active trips", free: "3", pro: "Unlimited", teams: "Unlimited" },
    { name: "Group size", free: "6 people", pro: "Unlimited", teams: "Unlimited" },
    { name: "AI generations", free: "1 per trip", pro: "Unlimited", teams: "Unlimited" },
    { name: "Map view", free: false, pro: true, teams: true },
    { name: "Route optimization", free: false, pro: true, teams: true },
    { name: "Place discovery", free: false, pro: true, teams: true },
    { name: "Calendar export", free: false, pro: true, teams: true },
    { name: "Email import", free: false, pro: true, teams: true },
  ]},
  { category: "Collaboration", features: [
    { name: "Voting & polls", free: true, pro: true, teams: true },
    { name: "Group chat", free: true, pro: true, teams: true },
    { name: "@mentions", free: true, pro: true, teams: true },
    { name: "Advanced voting", free: false, pro: true, teams: true },
    { name: "Video integration", free: false, pro: true, teams: true },
  ]},
  { category: "Expenses", features: [
    { name: "Expense tracking", free: true, pro: true, teams: true },
    { name: "Fair splitting", free: true, pro: true, teams: true },
    { name: "Receipt OCR", free: false, pro: true, teams: true },
    { name: "Currency conversion", free: false, pro: true, teams: true },
    { name: "Budget optimizer", free: false, pro: true, teams: true },
    { name: "Payment integrations", free: false, pro: true, teams: true },
  ]},
  { category: "Storage", features: [
    { name: "Photo uploads", free: "5 per trip", pro: "Unlimited", teams: "Unlimited" },
    { name: "Document storage", free: false, pro: true, teams: true },
    { name: "High-res storage", free: false, pro: true, teams: true },
  ]},
  { category: "Mobile & Offline", features: [
    { name: "Mobile responsive", free: true, pro: true, teams: true },
    { name: "Offline access", free: false, pro: true, teams: true },
    { name: "PWA install", free: false, pro: true, teams: true },
  ]},
  { category: "Support & Features", features: [
    { name: "Community support", free: true, pro: true, teams: true },
    { name: "Priority support", free: false, pro: true, teams: true },
    { name: "Dedicated support", free: false, pro: false, teams: true },
    { name: "Custom branding", free: false, pro: false, teams: true },
    { name: "Analytics", free: false, pro: false, teams: true },
    { name: "API access", free: false, pro: false, teams: true },
  ]},
];

function PricingCard({
  plan,
  isAnnual,
  planKey,
  onUpgrade,
  upgradeLoading,
  ctaHrefOverride,
}: {
  plan: typeof pricingPlans.free;
  isAnnual: boolean;
  planKey: "free" | "pro" | "teams";
  onUpgrade?: (tier: "pro" | "teams", isAnnual: boolean) => void;
  upgradeLoading?: boolean;
  /** When set and not using checkout, use this link (e.g. login then redirect back to checkout) */
  ctaHrefOverride?: string;
}) {
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const period = isAnnual ? "year" : "month";
  const savings = plan.monthlyPrice * 12 - plan.annualPrice;
  const isPro = plan.name === "Pro";
  const isPaidPlan = planKey === "pro" || planKey === "teams";
  const useCheckout = isPaidPlan && onUpgrade;
  const ctaHref = ctaHrefOverride ?? plan.ctaHref;

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-2xl ${
        plan.popular
          ? "border-2 border-primary shadow-xl scale-105"
          : "border-border hover:border-primary/50"
      }`}
    >
      {plan.popular && (
        <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
          <Sparkles className="inline h-3 w-3 mr-1" />
          Most Popular
        </div>
      )}

      <CardHeader className={plan.popular ? "pt-10" : ""}>
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-base">{plan.description}</CardDescription>

        <div className="mt-6">
          {price === 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">Free</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${price}</span>
                <span className="text-muted-foreground">/ {period}</span>
              </div>
              {isAnnual && savings > 0 && (
                <Badge variant="secondary" className="mt-2">
                  Save ${savings.toFixed(0)} per year
                </Badge>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {useCheckout ? (
          <Button
            className={`w-full mb-6 ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
            variant={plan.popular ? "default" : "outline"}
            disabled={upgradeLoading}
            onClick={() => onUpgrade(planKey as "pro" | "teams", isAnnual)}
          >
            {upgradeLoading ? "Redirecting…" : plan.cta}
            {plan.cta.includes("Trial") && !upgradeLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        ) : (
          <Button
            className={`w-full mb-6 ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
            variant={plan.popular ? "default" : "outline"}
            asChild
          >
            <Link href={ctaHref}>
              {plan.cta}
              {plan.cta.includes("Trial") && <ArrowRight className="ml-2 h-4 w-4" />}
            </Link>
          </Button>
        )}

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              {feature.included ? (
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${'bold' in feature && feature.bold ? "font-semibold" : ""} ${!feature.included ? "text-muted-foreground" : ""}`}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function FeatureCell({ value }: { value: string | boolean | undefined }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-primary mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground mx-auto" />
    );
  }
  return <span className="text-sm text-center">{value}</span>;
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pathname] = useLocation();

  const checkoutStarted = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "canceled") {
      toast({ title: "Checkout canceled", description: "No charges were made. Try again when you're ready.", variant: "default" });
      window.history.replaceState({}, "", "/pricing");
    }
  }, [toast]);

  // When user lands on /pricing?checkout=pro or ?checkout=teams and is logged in, go straight to payment
  useEffect(() => {
    if (!user || upgradeLoading || checkoutStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout !== "pro" && checkout !== "teams") return;
    checkoutStarted.current = true;
    window.history.replaceState({}, "", "/pricing");
    handleUpgrade(checkout, true);
  }, [user]);

  const handleUpgrade = async (tier: "pro" | "teams", isAnnualPlan: boolean) => {
    setUpgradeError(null);
    setUpgradeLoading(true);
    try {
      const token = localStorage.getItem("tripsync_token") || sessionStorage.getItem("tripsync_token");
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ tier, isAnnual: isAnnualPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpgradeError(data?.error || "Checkout failed");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setUpgradeError("No checkout URL returned");
    } catch (e) {
      setUpgradeError("Network error. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const checkoutParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("checkout") : null;
  const loginThenCheckoutHrefPro = !user && checkoutParam === "pro" ? `/login?redirect=${encodeURIComponent("/pricing?checkout=pro")}` : undefined;
  const loginThenCheckoutHrefTeams = !user && checkoutParam === "teams" ? `/login?redirect=${encodeURIComponent("/pricing?checkout=teams")}` : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <AppLogo className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold">TripSync</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
            </Link>
            <Link href="/pricing">
              <a
                className={`text-sm transition-colors ${
                  pathname === "/pricing" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pricing
              </a>
            </Link>
            <Link href="/contact">
              <a
                className={`text-sm transition-colors ${
                  pathname === "/contact" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Contact
              </a>
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <AppHero />

      {/* Hero Section */}
      <section className={spacing.section.lg}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Transparent pricing that grows with you
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Start with our free plan and upgrade as your travel needs evolve. Flexible billing with no long-term commitment.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <span className={isAnnual ? "text-muted-foreground" : "text-foreground font-medium"}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={isAnnual ? "text-foreground font-medium" : "text-muted-foreground"}>
              Annual
              <Badge variant="secondary" className="ml-2">
                Save 34%
              </Badge>
            </span>
          </div>

          {upgradeError && (
            <p className="text-sm text-destructive mb-4 max-w-6xl mx-auto text-center">{upgradeError}</p>
          )}
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard plan={pricingPlans.free} isAnnual={isAnnual} planKey="free" />
            <PricingCard
              plan={pricingPlans.pro}
              isAnnual={isAnnual}
              planKey="pro"
              onUpgrade={user ? handleUpgrade : undefined}
              upgradeLoading={upgradeLoading}
              ctaHrefOverride={loginThenCheckoutHrefPro}
            />
            <PricingCard
              plan={pricingPlans.teams}
              isAnnual={isAnnual}
              planKey="teams"
              onUpgrade={user ? handleUpgrade : undefined}
              upgradeLoading={upgradeLoading}
              ctaHrefOverride={loginThenCheckoutHrefTeams}
            />
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className={`${spacing.section.md} bg-muted/30`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Compare all features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-semibold">Features</th>
                  <th className="text-center py-4 px-4 font-semibold">Free</th>
                  <th className="text-center py-4 px-4 font-semibold bg-primary/5 border-x-2 border-primary">
                    Pro
                  </th>
                  <th className="text-center py-4 px-4 font-semibold">Teams</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((section) => (
                  <>
                    <tr key={section.category} className="border-b bg-muted/50">
                      <td colSpan={4} className="py-3 px-4 font-semibold text-sm uppercase tracking-wide">
                        {section.category}
                      </td>
                    </tr>
                    {section.features.map((feature) => (
                      <tr key={feature.name} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 text-sm">{feature.name}</td>
                        <td className="py-3 px-4">
                          <FeatureCell value={feature.free} />
                        </td>
                        <td className="py-3 px-4 bg-primary/5 border-x-2 border-primary">
                          <FeatureCell value={feature.pro} />
                        </td>
                        <td className="py-3 px-4">
                          <FeatureCell value={feature.teams} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className={`${spacing.section.sm} border-y`}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            <div>
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">Risk-Free Trial</h3>
              <p className="text-sm text-muted-foreground">14 days to explore Pro features</p>
            </div>
            <div>
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">Instant Activation</h3>
              <p className="text-sm text-muted-foreground">Start planning within minutes</p>
            </div>
            <div>
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">Flexible Billing</h3>
              <p className="text-sm text-muted-foreground">Cancel anytime without penalties</p>
            </div>
            <div>
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">Trusted Globally</h3>
              <p className="text-sm text-muted-foreground">Join 10,000+ travelers</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={spacing.section.lg}>
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Frequently asked questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about TripSync pricing
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="trial" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Is there a free trial?
              </AccordionTrigger>
              <AccordionContent>
                Yes. TripSync Pro includes a risk-free 14-day trial with complete access to all premium features. Start immediately—no credit card required.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancel" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Can I cancel anytime?
              </AccordionTrigger>
              <AccordionContent>
                Yes. Cancel anytime directly from your account settings with no fees or penalties. After cancellation, you'll retain full access through the end of your current billing cycle.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refund" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What's your refund policy?
              </AccordionTrigger>
              <AccordionContent>
                We offer a 14-day money-back guarantee. If you're not satisfied with TripSync Pro for any reason, contact us within 14 days of purchase for a full refund.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="upgrade" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Can I upgrade or downgrade later?
              </AccordionTrigger>
              <AccordionContent>
                Yes! You can upgrade to Pro or Teams at any time to unlock premium features. If you want to downgrade, you can do so at the end of your current billing cycle. Any unused time on your current plan will be prorated.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent>
                We accept all major credit cards (Visa, Mastercard, American Express, Discover) via Stripe, our secure payment processor. We also accept payments via PayPal.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="limits" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What happens when I hit the free plan limits?
              </AccordionTrigger>
              <AccordionContent>
                When you reach 3 active trips on the Free plan, you can either archive a completed trip or upgrade to Pro for unlimited trips. Archived trips remain accessible in read-only mode.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="team" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                How does the Teams plan work?
              </AccordionTrigger>
              <AccordionContent>
                The Teams plan is designed for travel agencies, tour operators, and professional trip planners. It includes custom branding, analytics, admin controls, and dedicated support. Contact our sales team to discuss your specific needs and pricing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What happens to my data if I cancel?
              </AccordionTrigger>
              <AccordionContent>
                Your trips and data remain accessible even if you downgrade to the free plan. However, if you have more than 3 active trips, you'll need to archive some to continue using the app. You can export your data at any time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${spacing.section.lg} bg-gradient-to-b from-muted/30 to-background`}>
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto rounded-3xl border bg-card p-12 md:p-16 shadow-xl">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Start planning smarter group trips
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join thousands of travelers who've transformed their group trip planning with TripSync
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="gap-2">
                <Link href="/login">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing?checkout=pro">Start Pro Trial</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
