import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import {
  Users,
  Sparkles,
  Calendar,
  CreditCard,
  MessageSquare,
  ArrowRight,
  MapPin,
  ChevronDown,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Planning",
    description: "Complete itineraries in minutes. Budget, vibe, and group preferences in one place.",
  },
  {
    icon: Users,
    title: "Group Collaboration",
    description: "Vote, comment, decide together. No more endless group chats.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Realistic timing and travel. Never miss a reservation.",
  },
  {
    icon: CreditCard,
    title: "Expense Tracking",
    description: "Split fairly, see who owes what. Settle up after the trip.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Sync",
    description: "Changes update instantly for everyone.",
  },
  {
    icon: MapPin,
    title: "One-Click Booking",
    description: "Deep links to flights, hotels, restaurants. Book from the plan.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero: dark, beam, giant type, central CTA */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-neutral-950">
        {/* Subtle speckle / noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        {/* Warm accent beam from right */}
        <div
          className="absolute top-0 right-0 w-[80%] md:w-[60%] h-full pointer-events-none"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-l from-amber-500/15 via-orange-400/5 to-transparent" />
          <div className="absolute top-1/4 right-0 w-full h-1/2 bg-gradient-to-l from-amber-400/10 to-transparent blur-3xl" />
        </div>

        <header className="relative z-10 flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <AppLogo className="h-9 w-9 object-contain" />
            <span className="text-lg font-semibold text-white tracking-tight">TripSync</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Features
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-white/90 hover:text-white hover:bg-white/10 border border-transparent"
                data-testid="button-login"
              >
                Log In
              </Button>
            </Link>
            <Link href="/login">
              <Button
                className="bg-white text-neutral-950 hover:bg-white/90 border border-white/20 font-medium"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-8 pb-24 text-center">
          {/* Giant decorative wordmark (layered behind) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            aria-hidden
          >
            <span
              className="text-[clamp(8rem,25vw,18rem)] font-bold tracking-tighter text-white/[0.04]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              TripSync
            </span>
          </div>

          <h1 className="relative text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 max-w-3xl mx-auto leading-[1.1]">
            Plan group trips in{" "}
            <span className="text-amber-400/90">10 minutes</span>, not 10 hours
          </h1>
          <p className="relative text-lg text-white/60 mb-10 max-w-xl leading-relaxed">
            AI itineraries, voting, chat, and expenses in one place. Create a trip, invite your group, get a plan everyone loves.
          </p>

          {/* Central CTA: pill-style primary action */}
          <div className="relative flex flex-col sm:flex-row items-center gap-4 mb-12">
            <Link href="/login">
              <Button
                size="lg"
                className="h-14 px-10 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-base gap-2 border-0 shadow-lg shadow-amber-500/20"
                data-testid="button-start-planning"
              >
                Start Planning
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="relative text-sm text-white/50 max-w-md">
            Free to use · No credit card · Invite by email and go
          </p>

          <a
            href="#features"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/60 transition-colors"
            aria-label="Scroll to features"
          >
            <ChevronDown className="h-8 w-8" />
          </a>
        </div>
      </section>

      {/* Features: refined, spacious */}
      <section id="features" className="relative bg-background py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-3">
              Features
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4 max-w-2xl mx-auto">
              Everything for stress-free group travel
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              From AI itineraries to expense splitting, we handle the logistics so you can focus on the trip.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-border/80 bg-card p-6 text-left transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works: minimal steps */}
      <section className="border-t bg-muted/30 py-24 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-3">
              How it works
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              Idea to itinerary in 4 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Enter details", desc: "Destination, dates, budget, vibe" },
              { step: "2", title: "Invite & preferences", desc: "Email invite; 3 quick questions" },
              { step: "3", title: "AI generates", desc: "A plan that fits the whole group" },
              { step: "4", title: "Vote, chat & book", desc: "Deep links, expenses, done" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-foreground font-semibold mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t py-24 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to plan your next adventure?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Create a trip, invite your group, and get a plan everyone loves.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="gap-2 rounded-full font-medium px-8"
              data-testid="button-cta-bottom"
            >
              Start Planning for Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AppLogo className="h-8 w-8 object-contain" />
              <span className="font-semibold text-foreground">TripSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TripSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}