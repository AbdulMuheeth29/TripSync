import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TripDestinationHero } from "@/components/trip-destination-hero";
import { TripMap } from "@/components/trip-map";
import type { Trip, ItineraryItem } from "@shared/schema";

interface PublicTripResponse {
  trip: Trip;
  items: ItineraryItem[];
}

export default function PublicTripPage() {
  const { code } = useParams<{ code: string }>();

  const { data, isLoading, error } = useQuery<PublicTripResponse>({
    queryKey: ["/api/public/trips", code],
    queryFn: async () => {
      const res = await fetch(`/api/public/trips/${encodeURIComponent(code)}`);
      if (!res.ok) {
        throw new Error("Trip not found");
      }
      return res.json();
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (data?.trip?.destination) {
      document.title = `${data.trip.destination} – TripSync public trip`;
    }
  }, [data?.trip?.destination]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Trip not found</CardTitle>
            <CardDescription>
              This public trip link may have expired or never existed. Ask the organizer to share a new link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button asChild>
              <Link href="/">Back to TripSync</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { trip, items } = data;
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  return (
    <div className="min-h-screen bg-background">
      <TripDestinationHero destination={trip.destination} />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">{trip.destination}</h1>
            <p className="text-muted-foreground mt-1">
              {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} –{" "}
              {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
              {trip.groupSize} travelers
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/login">Plan this trip in TripSync</Link>
            </Button>
          </div>
        </header>

        {items.length > 0 && (
          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Itinerary overview</CardTitle>
                <CardDescription>High‑level view of this trip’s activities.</CardDescription>
              </CardHeader>
              <CardContent>
                <TripMap destination={trip.destination} items={items} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {Array.from(new Set(items.map((i) => i.dayNumber)))
                .sort((a, b) => a - b)
                .map((day) => {
                  const dayItems = items
                    .filter((i) => i.dayNumber === day)
                    .sort((a, b) => a.time.localeCompare(b.time));
                  const date = new Date(trip.startDate);
                  date.setDate(date.getDate() + (day - 1));
                  return (
                    <Card key={day}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Day {day} ·{" "}
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {dayItems.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <div className="text-xs text-muted-foreground">{item.time}</div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.location}</div>
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">{item.type}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

