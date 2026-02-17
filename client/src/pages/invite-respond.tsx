import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth-context";
import { AppLogo } from "@/components/app-logo";
import { MapPin, Calendar, Users, Loader2, Check, X } from "lucide-react";

interface InviteData {
  invite: { id: string; tripId: string; email: string; status: string };
  trip: { id: string; destination: string; startDate: string; endDate: string; groupSize: number; budgetPerPerson?: number };
}

export default function InviteRespondPage() {
  const params = useParams();
  const inviteId = params.inviteId;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!inviteId) {
      setLoading(false);
      return;
    }
    fetch(`/api/invites/${inviteId}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [inviteId]);

  const handleRespond = async (action: "accept" | "decline") => {
    if (!inviteId || !data) return;
    setResponding(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/invites/${inviteId}/respond`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401 && action === "accept") {
          toast({ title: "Log in required", description: "Redirecting to login...", variant: "default" });
          setLocation(`/login?invite=${inviteId}&redirect=/invite/${inviteId}`);
        } else {
          toast({ title: json.error || "Failed", variant: "destructive" });
        }
        return;
      }
      if (action === "accept") {
        toast({ title: "Invite accepted!", description: "You're in the trip." });
        setLocation(`/trip/${json.tripId}`);
      } else {
        toast({ title: "Invite declined" });
        setData(null);
      }
    } catch {
      toast({ title: "Request failed", variant: "destructive" });
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Invite not found</h2>
            <p className="text-muted-foreground mb-6">
              This invite link is invalid, expired, or already responded to.
            </p>
            <Link href="/">
              <Button>Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invite, trip } = data;
  const canAccept = user?.email?.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <AppLogo className="h-10 w-10 object-contain" />
        <span className="text-2xl font-bold">TripSync</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Trip invitation</CardTitle>
          <CardDescription>
            You&apos;re invited to join a trip — {trip.destination}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{trip.destination}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{trip.groupSize} travelers</span>
            </div>
          </div>

          {canAccept ? (
            <p className="text-sm text-center text-muted-foreground">
              Logged in as <span className="font-medium">{user?.name}</span> ({invite.email})
            </p>
          ) : !user ? (
            <p className="text-sm text-center text-muted-foreground">
              Log in with <span className="font-medium">{invite.email}</span> to accept this invite.
            </p>
          ) : (
            <p className="text-sm text-center text-amber-600 dark:text-amber-400">
              You must log in with {invite.email} to accept.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleRespond("decline")}
              disabled={responding}
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleRespond("accept")}
              disabled={responding || !canAccept}
            >
              {responding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Accept
            </Button>
          </div>

          {!user && (
            <div className="text-center">
              <Link href={`/login?invite=${inviteId}&redirect=/invite/${inviteId}`}>
                <Button variant="ghost" size="sm">Log in to accept</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
