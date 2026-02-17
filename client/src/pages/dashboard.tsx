import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { AppLogo } from "@/components/app-logo";
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import type { Trip } from "@shared/schema";

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

function TripCard({ trip, isPlanner }: { trip: TripWithCounts; isPlanner?: boolean }) {
  const progress = trip.totalItems ? Math.round((trip.bookedCount || 0) / trip.totalItems * 100) : 0;

  return (
    <Link href={`/trip/${trip.id}`}>
      <Card className="hover-elevate cursor-pointer group rounded-xl border-card-border shadow-sm overflow-hidden" data-testid={`card-trip-${trip.id}`}>
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
            <Badge variant="outline" className={statusColors[trip.status]}>
              {statusLabels[trip.status]}
            </Badge>
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
  const { user, logout } = useAuth();

  const { data: trips, isLoading } = useQuery<TripWithCounts[]>({
    queryKey: ["/api/trips"],
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
  const PAGE_SIZE = 6;

  const upcomingTrips = trips?.filter((t) => ["planning", "booked", "in_progress", "active"].includes(t.status)) || [];
  const pastTrips = trips?.filter((t) => t.status === "completed") || [];
  const cancelledTrips = trips?.filter((t) => t.status === "cancelled") || [];

  const upcomingPaginated = upcomingTrips.slice(upcomingPage * PAGE_SIZE, (upcomingPage + 1) * PAGE_SIZE);
  const pastPaginated = pastTrips.slice(pastPage * PAGE_SIZE, (pastPage + 1) * PAGE_SIZE);
  const cancelledPaginated = cancelledTrips.slice(cancelledPage * PAGE_SIZE, (cancelledPage + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <AppLogo className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold">TripSync</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:block text-sm text-muted-foreground">
              {user?.name}
            </div>
            <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold" data-testid="text-dashboard-title">
              My Trips
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan, collaborate, and track all your group adventures
            </p>
          </div>
          <Link href="/create">
            <Button className="gap-2 rounded-lg font-medium" data-testid="button-create-trip">
              <Plus className="h-4 w-4" />
              Plan New Trip
            </Button>
          </Link>
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
                  <TripCard key={trip.id} trip={trip} isPlanner={trip.organizerId === user?.id} />
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
                <TripCard key={trip.id} trip={trip} isPlanner={trip.organizerId === user?.id} />
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
                <TripCard key={trip.id} trip={trip} isPlanner={trip.organizerId === user?.id} />
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
