import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AppLogo } from '@/components/app-logo';
import { Users, MapPin, Calendar, Loader2 } from 'lucide-react';

export default function JoinTripPage() {
  const params = useParams();
  const shareCode = params.code;
  const [, setLocation] = useLocation();
  const { user, register, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tripInfo, setTripInfo] = useState<{
    destination: string;
    startDate: string;
    groupSize: number;
  } | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);

  useEffect(() => {
    const fetchTripInfo = async () => {
      try {
        const response = await fetch(`/api/trips/join/${shareCode}/info`);
        if (response.ok) {
          const data = await response.json();
          setTripInfo(data);
        }
      } catch (error) {
        console.error('Error fetching trip info:', error);
      } finally {
        setIsLoadingTrip(false);
      }
    };

    if (shareCode) {
      fetchTripInfo();
    }
  }, [shareCode]);

  const joinMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/trips/join/${shareCode}`, { userId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({
        title: 'Joined trip!',
        description: "You've successfully joined the trip",
      });
      setLocation(`/trip/${data.tripId}`);
    },
    onError: () => {
      toast({
        title: 'Failed to join',
        description: 'Could not join the trip. The link may be invalid.',
        variant: 'destructive',
      });
    },
  });

  const handleJoin = async () => {
    if (user) {
      joinMutation.mutate(user.id);
    } else if (email && name) {
      try {
        const autoPassword = crypto.randomUUID().slice(0, 16) + 'A1!';
        await register(email, name, autoPassword, true);
        const token =
          localStorage.getItem('tripsync_token') ?? sessionStorage.getItem('tripsync_token');
        if (token) {
          const meRes = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          });
          if (meRes.ok) {
            const userData = await meRes.json();
            joinMutation.mutate(userData.id);
            return;
          }
        }
        toast({
          title: 'Account created',
          description: 'Please refresh and try joining again.',
          variant: 'destructive',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to create account';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    }
  };

  if (isLoadingTrip || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tripInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Invalid invite link</h2>
            <p className="text-muted-foreground mb-6">
              This trip invite link is invalid or has expired.
            </p>
            <Link href="/">
              <Button>Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 no-underline text-foreground hover:opacity-90 transition-opacity"
      >
        <AppLogo className="h-10 w-10 object-contain" />
        <span className="text-2xl font-bold">TripSync</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join This Trip</CardTitle>
          <CardDescription>
            You've been invited to join a group trip to {tripInfo.destination}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{tripInfo.destination}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(tripInfo.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{tripInfo.groupSize} travelers</span>
            </div>
          </div>

          {user ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Joining as <span className="font-medium">{user.name}</span>
              </p>
              <Button
                className="w-full"
                onClick={handleJoin}
                disabled={joinMutation.isPending}
                data-testid="button-join-trip"
              >
                {joinMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Trip'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Enter your details to join
              </p>
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  data-testid="input-join-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-testid="input-join-email"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleJoin}
                disabled={!email || !name || joinMutation.isPending}
                data-testid="button-join-trip"
              >
                {joinMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Trip'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
