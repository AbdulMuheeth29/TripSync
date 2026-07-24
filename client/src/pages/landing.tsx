import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AppLogo } from '@/components/app-logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { spacing } from '@/lib/spacing-tokens';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Sparkles,
  Calendar,
  CreditCard,
  MessageSquare,
  ArrowRight,
  MapPin,
  ChevronDown,
  Check,
} from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Itineraries',
    description:
      'Generate complete trip plans in minutes. Our AI considers your budget, travel style, and group preferences to create the perfect itinerary.',
  },
  {
    icon: Users,
    title: 'Real-Time Collaboration',
    description:
      'Make decisions together with built-in voting, comments, and chat. End the endless group text threads and keep everyone on the same page.',
  },
  {
    icon: Calendar,
    title: 'Intelligent Scheduling',
    description:
      'Optimize your itinerary with realistic travel times and built-in reminders. Never miss a reservation or overbook your day again.',
  },
  {
    icon: CreditCard,
    title: 'Fair Expense Splitting',
    description:
      'Track shared costs and split expenses fairly. See exactly who owes what at a glance, then settle up after your trip.',
  },
  {
    icon: MessageSquare,
    title: 'Instant Synchronization',
    description:
      'Every change syncs instantly across all devices. Your entire group stays updated in real-time, no matter where they are.',
  },
  {
    icon: MapPin,
    title: 'Seamless Booking Links',
    description:
      'Book flights, hotels, and reservations directly from your itinerary with integrated booking links. No more switching between apps.',
  },
];

const steps = [
  {
    step: 1,
    title: 'Set Your Trip Details',
    desc: 'Destination, dates, group size, and budget in under a minute',
  },
  {
    step: 2,
    title: 'Invite Your Group',
    desc: "Send email invites and collect everyone's preferences with our quick survey",
  },
  {
    step: 3,
    title: 'Get AI Recommendations',
    desc: "Receive a customized itinerary that matches your group's interests and budget",
  },
  {
    step: 4,
    title: 'Collaborate & Book',
    desc: 'Vote on activities, discuss in group chat, split expenses, and book everything in one place',
  },
];

export default function LandingPage() {
  const [pathname] = useLocation();
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col overflow-hidden bg-neutral-950">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div
          className="absolute top-0 right-0 w-[85%] md:w-[55%] h-full pointer-events-none"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-l from-amber-500/12 via-amber-400/5 to-transparent" />
          <div className="absolute top-1/3 right-0 w-full h-1/2 bg-gradient-to-l from-amber-400/8 to-transparent blur-3xl" />
        </div>

        <header className="relative z-10 glass flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <AppLogo className="h-9 w-9 object-contain" />
            <span className="text-lg font-semibold text-white tracking-tight">TripSync</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200"
            >
              How it works
            </a>
            <Link href="/pricing">
              <a
                className={`text-sm transition-colors duration-200 ${
                  pathname === '/pricing'
                    ? 'text-white font-medium'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Pricing
              </a>
            </Link>
            <Link href="/contact">
              <a
                className={`text-sm transition-colors duration-200 ${
                  pathname === '/contact'
                    ? 'text-white font-medium'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Contact
              </a>
            </Link>
          </nav>
          <div className="flex items-center gap-3 md:gap-3">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Open navigation</span>
                  {/* simple menu icon */}
                  <span className="block w-5 h-[2px] bg-white rounded mb-1" />
                  <span className="block w-5 h-[2px] bg-white rounded mb-1" />
                  <span className="block w-5 h-[2px] bg-white rounded" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 sm:w-80">
                <nav className="mt-10 flex flex-col gap-4 text-sm">
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    How it works
                  </a>
                  <Link href="/pricing">
                    <a
                      className={`hover:text-foreground transition-colors ${
                        pathname === '/pricing'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Pricing
                    </a>
                  </Link>
                  <Link href="/contact">
                    <a
                      className={`hover:text-foreground transition-colors ${
                        pathname === '/contact'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Contact
                    </a>
                  </Link>
                  <Link href="/login">
                    <a
                      className={`hover:text-foreground transition-colors ${
                        pathname === '/login'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Log In
                    </a>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            {user ? (
              <Link href="/dashboard">
                <Button
                  className="bg-white text-neutral-950 hover:bg-white/95 border-0 rounded-full font-semibold shadow-lg shadow-black/20 transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
                  data-testid="button-dashboard"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-white/90 hover:text-white hover:bg-white/10 border border-transparent rounded-lg transition-colors duration-200"
                    data-testid="button-login"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    className="bg-white text-neutral-950 hover:bg-white/95 border-0 rounded-full font-semibold shadow-lg shadow-black/20 transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
                    data-testid="button-get-started"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-20 text-center">
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            aria-hidden
          >
            <span
              className="text-[clamp(6rem,20vw,14rem)] font-bold tracking-tighter text-white/[0.03]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              TripSync
            </span>
          </div>

          <p className="relative text-xs font-medium tracking-[0.2em] uppercase text-amber-400/80 mb-6">
            Group trip planning, perfected
          </p>
          <h1
            className="relative text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-[1.08]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Plan unforgettable group trips in <span className="text-amber-400">minutes</span>, not
            hours
          </h1>
          <p className="relative text-lg md:text-xl text-white/55 mb-10 max-w-xl leading-relaxed">
            The all-in-one platform for group travel. AI-powered itineraries, real-time
            collaboration, shared expenses, and unanimous decisions—all in one place.
          </p>

          <div className="relative flex flex-col sm:flex-row items-center gap-4 mb-14">
            <Link href="/login">
              <Button
                size="lg"
                className="h-14 px-10 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-base gap-2 border-0 shadow-xl shadow-amber-500/25 transition-all duration-200 hover:shadow-amber-500/30 hover:scale-[1.02]"
                data-testid="button-start-planning"
              >
                Start Planning
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="relative flex flex-wrap items-center justify-center gap-6 text-sm text-white/45">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-400/70" />
              Free forever plan
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-400/70" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-400/70" />
              Instant collaboration via email
            </span>
          </div>

          <a
            href="#features"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/35 hover:text-white/55 transition-colors duration-200"
            aria-label="Scroll to features"
          >
            <ChevronDown className="h-8 w-8" />
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`relative ${spacing.section.lg} scroll-mt-16`}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-xs font-medium text-muted-foreground tracking-[0.2em] uppercase mb-4">
              Features
            </p>
            <h2
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 max-w-2xl mx-auto tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Everything you need for seamless group travel
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-lg">
              From AI-powered itineraries to fair expense splitting, we handle the logistics so you
              can focus on creating memories.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 text-left transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary/15 transition-colors duration-300">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3
                  className="font-heading text-xl font-semibold text-foreground mb-3 tracking-tight"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className={`border-t border-border/60 bg-muted/20 ${spacing.section.lg} scroll-mt-16`}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-xs font-medium text-muted-foreground tracking-[0.2em] uppercase mb-4">
              How it works
            </p>
            <h2
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Idea to itinerary in 4 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 max-w-5xl mx-auto">
            {steps.map((item, i) => (
              <div key={item.step} className="relative text-center md:text-left">
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-6 left-[calc(50%+1.5rem)] w-[calc(100%-3rem)] h-px bg-gradient-to-r from-border to-transparent"
                    aria-hidden
                  />
                )}
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary/20 bg-background text-foreground font-bold text-lg mb-5 shadow-sm">
                  {item.step}
                </div>
                <h3
                  className="font-heading font-semibold text-foreground mb-2 text-lg"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`border-t border-border/60 ${spacing.section.lg}`}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto rounded-3xl border border-border/60 bg-gradient-to-b from-muted/50 to-muted/30 backdrop-blur-sm p-12 md:p-16 text-center shadow-xl shadow-primary/5">
            <h2
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Start planning smarter group trips today
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed text-lg">
              Join thousands of travelers who've transformed their group trip planning. Free
              forever, no credit card required.
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="gap-2 rounded-full font-semibold px-10 h-14 text-base shadow-lg transition-all duration-200 hover:scale-[1.02]"
                data-testid="button-cta-bottom"
              >
                Create Your First Trip—Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
