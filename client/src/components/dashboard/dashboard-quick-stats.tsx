import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MapPin, TrendingUp, Clock } from 'lucide-react';

interface DashboardQuickStatsProps {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalMembers: number;
  upcomingDeparture: {
    tripTitle: string;
    daysUntil: number;
    destination: string;
  } | null;
}

export function DashboardQuickStats({
  totalTrips,
  activeTrips,
  completedTrips,
  totalMembers,
  upcomingDeparture,
}: DashboardQuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Trips */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
              <p className="text-3xl font-bold">{totalTrips}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Trips */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Active Trips</p>
              <p className="text-3xl font-bold">{activeTrips}</p>
              {activeTrips > 0 && (
                <Badge variant="default" className="mt-1">
                  In Progress
                </Badge>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Members */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Members</p>
              <p className="text-3xl font-bold">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">Across all trips</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Departure */}
      <Card>
        <CardContent className="pt-6">
          {upcomingDeparture ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Next Departure</p>
                <p className="text-3xl font-bold">
                  {upcomingDeparture.daysUntil}
                  <span className="text-base font-normal text-muted-foreground ml-1">
                    {upcomingDeparture.daysUntil === 1 ? 'day' : 'days'}
                  </span>
                </p>
                <p
                  className="text-xs text-muted-foreground truncate"
                  title={upcomingDeparture.tripTitle}
                >
                  {upcomingDeparture.tripTitle}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0 ml-2">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Next Departure</p>
                <p className="text-lg text-muted-foreground">No upcoming trips</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-neutral-400" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate stats from trips data
export function calculateDashboardStats<
  T extends {
    status: string;
    startDate: string;
    title: string | null;
    destination: string;
    members?: Array<{ userId: string }>;
  },
>(trips: T[]) {
  const now = new Date();

  const totalTrips = trips.length;
  const activeTrips = trips.filter((t) => t.status === 'active' || t.status === 'booking').length;
  const completedTrips = trips.filter((t) => t.status === 'completed').length;

  // Calculate total unique members across all trips
  const allMemberIds = new Set<string>();
  trips.forEach((trip) => {
    trip.members?.forEach((member) => {
      allMemberIds.add(member.userId);
    });
  });
  const totalMembers = allMemberIds.size;

  // Find upcoming departure
  const upcomingTrips = trips
    .filter((t) => {
      const startDate = new Date(t.startDate);
      return (
        startDate > now &&
        (t.status === 'planning' || t.status === 'booking' || t.status === 'active')
      );
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const upcomingDeparture =
    upcomingTrips.length > 0
      ? {
          tripTitle: upcomingTrips[0].title || upcomingTrips[0].destination,
          destination: upcomingTrips[0].destination,
          daysUntil: Math.ceil(
            (new Date(upcomingTrips[0].startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        }
      : null;

  return {
    totalTrips,
    activeTrips,
    completedTrips,
    totalMembers,
    upcomingDeparture,
  };
}
