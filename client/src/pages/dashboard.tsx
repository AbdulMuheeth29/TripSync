import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingTour } from "@/components/onboarding-tour";
import { useAuth } from "@/lib/auth-context";
import { AppLogo } from "@/components/app-logo";
import { AppHero } from "@/components/app-hero";
import { getDestinationCoverImage } from "@/components/trip-destination-hero";
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
  LogOut,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import type { Trip } from "@shared/schema";
import { listOfflineTripIds } from "@/lib/offline-trips";

type TripWithCounts = Trip & {
  bookedCount?: number;
  totalItems?: number;
  inviteCount?: number;
  memberCount?: number;
  preferenceCompletedCount?: number;
};

const statusColors: Record<string, string> = {
  planning: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  booking: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
  booked: "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200",
  active: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
  in_progress: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
  completed: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  cancelled: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  planning: "Planning",
  booking: "Booking",
  booked: "Booked",
  active: "Active",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function TripCard({ trip, isPlanner, isOffline }: { trip: TripWithCounts; isPlanner?: boolean; isOffline?: boolean }) {
  const progress = trip.totalItems ? Math.round((trip.bookedCount || 0) / trip.totalItems * 100) : 0;
  const coverUrl =
    (trip as TripWithCounts & { coverImageUrl?: string }).coverImageUrl
    || getDestinationCoverImage(trip.destination ?? "");

  return (
    <Link href={`/trip/${trip.id}`}>
      <Card className="hover-elevate cursor-pointer group rounded-xl border-card-border shadow-sm overflow-hidden" data-testid={`card-trip-${trip.id}`}>
        <div className="h-28 w-full bg-muted overflow-hidden">
          <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {(trip as Trip & { title?: string }).title || trip.destination}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" - "}
                {new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className={statusColors[trip.status]}>
                {statusLabels[trip.status]}
              </Badge>
              {isOffline && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Available offline
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {trip.groupSize} people
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              ${trip.budgetPerPerson}/person
            </div>
          </div>

          {isPlanner && (trip.inviteCount !== undefined || trip.preferenceCompletedCount !== undefined) && (
            <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
              {trip.memberCount !== undefined && (
                <span>{trip.memberCount} joined{trip.inviteCount != null && trip.inviteCount > 0 ? ` · ${trip.inviteCount} invited (pending)` : ""}</span>
              )}
              {trip.preferenceCompletedCount !== undefined && (
                <span>{trip.preferenceCompletedCount} completed preference quiz</span>
              )}
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booking progress</span>
              <span className="font-medium">{trip.bookedCount || 0}/{trip.totalItems || 0}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-end mt-4 text-sm text-primary font-medium">
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TripCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-2 w-full" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, logout, refreshUser, isPro } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      toast({ title: "Welcome to Pro!", description: "Your subscription is active. Enjoy unlimited trips and more." });
      refreshUser();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [toast, refreshUser]);

  const { data: trips, isLoading } = useQuery<TripWithCounts[]>({
    queryKey: ["/api/trips"],
    enabled: !!user?.id,
  });

  const { data: insights } = useQuery<{ groupInsight: string; trendPrediction: string; pastTripCount: number; learnedFromTripCount?: number }>({
    queryKey: ["/api/users", user?.id, "insights"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.id}/insights`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const [upcomingPage, setUpcomingPage] = useState(0);
  const [pastPage, setPastPage] = useState(0);
  const [cancelledPage, setCancelledPage] = useState(0);
  const [pathname] = useLocation();
  const PAGE_SIZE = 6;

  const [offlineTripIds, setOfflineTripIds] = useState<string[]>([]);
  const [showAiDemoCard, setShowAiDemoCard] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ids = await listOfflineTripIds();
        if (!cancelled) setOfflineTripIds(ids);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("tripsync_ai_demo_seen");
    if (!seen) {
      setShowAiDemoCard(true);
    }
  }, []);

  const upcomingTrips = trips?.filter((t) => ["planning", "booked", "in_progress", "active"].includes(t.status)) || [];
  const pastTrips = trips?.filter((t) => t.status === "completed") || [];
  const cancelledTrips = trips?.filter((t) => t.status === "cancelled") || [];

  const upcomingPaginated = upcomingTrips.slice(upcomingPage * PAGE_SIZE, (upcomingPage + 1) * PAGE_SIZE);
  const pastPaginated = pastTrips.slice(pastPage * PAGE_SIZE, (pastPage + 1) * PAGE_SIZE);
  const cancelledPaginated = cancelledTrips.slice(cancelledPage * PAGE_SIZE, (cancelledPage + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <OnboardingTour />
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer no-underline text-foreground hover:opacity-90 transition-opacity">
            <AppLogo className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold">TripSync</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <Button
                variant={pathname === "/dashboard/billing" ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href="/dashboard/billing">Billing</Link>
              </Button>
            )}
            <div className="hidden sm:block text-sm text-muted-foreground">
              {user?.name}
            </div>
            <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <AppHero />

      <main className="container mx-auto px-4 py-8">
        {!isLoading && showAiDemoCard && upcomingTrips.length + pastTrips.length === 0 && (
          <Card className="mb-8 border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                See Atlas plan a trip in 30 seconds
              </CardTitle>
              <CardDescription>
                Watch a sample AI‑generated itinerary so you can see how TripSync handles real group trips before you
                create your own.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button asChild className="gap-2">
                <Link href="/trip/trip-austin-1?demo=1">
                  <Sparkles className="h-4 w-4" />
                  Play AI demo trip
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAiDemoCard(false);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("tripsync_ai_demo_seen", "1");
                  }
                }}
              >
                Skip for now
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold" data-testid="text-dashboard-title">
              My Trips
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan, collaborate, and track all your group adventures
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isPro && upcomingTrips.length >= 3 && (
              <Button variant="outline" asChild>
                <Link href="/pricing?checkout=pro">Upgrade for more trips</Link>
              </Button>
            )}
            <Link href="/create">
              <Button className="gap-2 rounded-lg font-medium" data-testid="button-create-trip">
                <Plus className="h-4 w-4" />
                Plan New Trip
              </Button>
            </Link>
          </div>
        </div>

        {insights && (insights.pastTripCount > 0 || insights.groupInsight || (insights.learnedFromTripCount ?? 0) > 0) && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Group travel insights
              </CardTitle>
              <CardDescription>
                AI learns from your past trips to improve recommendations.
                {(insights.learnedFromTripCount ?? 0) > 0 && (
                  <span className="block mt-1 text-primary font-medium">Learned from {insights.learnedFromTripCount} rated trip{(insights.learnedFromTripCount ?? 0) !== 1 ? "s" : ""}.</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{insights.groupInsight}</p>
              <p className="text-sm text-muted-foreground">{insights.trendPrediction}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && (upcomingTrips.length + pastTrips.length) > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Multi-trip timeline
              </CardTitle>
              <CardDescription>All your trips at a glance.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[...upcomingTrips, ...pastTrips]
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((t) => (
                    <Link key={t.id} href={`/trip/${t.id}`}>
                      <div className="flex-shrink-0 w-40 rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <p className="font-medium text-sm truncate">{(t as Trip & { title?: string }).title || t.destination}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(t.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {" → "}
                          {new Date(t.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Upcoming & Active</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <TripCardSkeleton key={i} />
              ))}
            </div>
          ) : upcomingTrips.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingPaginated.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    isPlanner={trip.organizerId === user?.id}
                    isOffline={offlineTripIds.includes(trip.id)}
                  />
                ))}
              </div>
              {upcomingTrips.length > PAGE_SIZE && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant="outline" size="sm" disabled={upcomingPage === 0} onClick={() => setUpcomingPage((p) => p - 1)}>Previous</Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">Page {upcomingPage + 1} of {Math.ceil(upcomingTrips.length / PAGE_SIZE)}</span>
                  <Button variant="outline" size="sm" disabled={upcomingPage >= Math.ceil(upcomingTrips.length / PAGE_SIZE) - 1} onClick={() => setUpcomingPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start planning your next adventure. Our AI will create the perfect itinerary for your group.
                </p>
                <Link href="/create">
                  <Button className="gap-2" data-testid="button-create-first-trip">
                    <Plus className="h-4 w-4" />
                    Plan Your First Trip
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {pastTrips.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Past Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastPaginated.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  isPlanner={trip.organizerId === user?.id}
                  isOffline={offlineTripIds.includes(trip.id)}
                />
              ))}
            </div>
            {pastTrips.length > PAGE_SIZE && (
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={pastPage === 0} onClick={() => setPastPage((p) => p - 1)}>Previous</Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">Page {pastPage + 1} of {Math.ceil(pastTrips.length / PAGE_SIZE)}</span>
                <Button variant="outline" size="sm" disabled={pastPage >= Math.ceil(pastTrips.length / PAGE_SIZE) - 1} onClick={() => setPastPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </section>
        )}

        {cancelledTrips.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Cancelled Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cancelledPaginated.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  isPlanner={trip.organizerId === user?.id}
                  isOffline={offlineTripIds.includes(trip.id)}
                />
              ))}
            </div>
            {cancelledTrips.length > PAGE_SIZE && (
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={cancelledPage === 0} onClick={() => setCancelledPage((p) => p - 1)}>Previous</Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">Page {cancelledPage + 1} of {Math.ceil(cancelledTrips.length / PAGE_SIZE)}</span>
                <Button variant="outline" size="sm" disabled={cancelledPage >= Math.ceil(cancelledTrips.length / PAGE_SIZE) - 1} onClick={() => setCancelledPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
