import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import {
  Plane,
  Plus,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
  LogOut,
} from "lucide-react";
import type { Trip } from "@shared/schema";

const statusColors: Record<string, string> = {
  planning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  booked: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  planning: "Planning",
  booked: "Booked",
  in_progress: "In Progress",
  completed: "Completed",
};

function TripCard({ trip }: { trip: Trip & { bookedCount?: number; totalItems?: number } }) {
  const progress = trip.totalItems ? Math.round((trip.bookedCount || 0) / trip.totalItems * 100) : 0;

  return (
    <Link href={`/trip/${trip.id}`}>
      <Card className="hover-elevate cursor-pointer group" data-testid={`card-trip-${trip.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {trip.destination}
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

  const { data: trips, isLoading } = useQuery<(Trip & { bookedCount?: number; totalItems?: number })[]>({
    queryKey: ["/api/trips"],
  });

  const upcomingTrips = trips?.filter((t) => ["planning", "booked", "in_progress"].includes(t.status)) || [];
  const pastTrips = trips?.filter((t) => t.status === "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
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
            <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
              My Trips
            </h1>
            <p className="text-muted-foreground">
              Plan, collaborate, and track all your group adventures
            </p>
          </div>
          <Link href="/create">
            <Button className="gap-2" data-testid="button-create-trip">
              <Plus className="h-4 w-4" />
              Plan New Trip
            </Button>
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Upcoming & Active</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <TripCardSkeleton key={i} />
              ))}
            </div>
          ) : upcomingTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
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
          <section>
            <h2 className="text-xl font-semibold mb-4">Past Trips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
