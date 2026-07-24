import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AppLogo } from '@/components/app-logo';
import { AppHero } from '@/components/app-hero';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Sparkles,
  Mountain,
  Utensils,
  Wine,
  Palmtree,
  Building,
  Landmark,
  Home,
  UtensilsCrossed,
  Check,
  Loader2,
  Mail,
  Plus,
  X,
} from 'lucide-react';
import type { TripWizardData } from '@shared/schema';
import confetti from 'canvas-confetti';

const vibeOptions = [
  { id: 'relaxing', label: 'Relaxing', icon: Palmtree, description: 'Beach, spa, slow-paced' },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: Mountain,
    description: 'Hiking, activities, exploring',
  },
  { id: 'foodie', label: 'Foodie', icon: Utensils, description: 'Restaurants, markets, cooking' },
  { id: 'nightlife', label: 'Nightlife', icon: Wine, description: 'Bars, clubs, entertainment' },
  { id: 'culture', label: 'Culture', icon: Landmark, description: 'Museums, history, local arts' },
];

const accommodationOptions = [
  { id: 'hotel', label: 'Hotel', icon: Building, description: 'Traditional hotel stays' },
  { id: 'airbnb', label: 'Airbnb', icon: Home, description: 'Home rentals & unique stays' },
  { id: 'mix', label: 'Mix', icon: Sparkles, description: 'Best of both worlds' },
];

const diningOptions = [
  {
    id: 'fine_dining',
    label: 'Fine Dining',
    icon: UtensilsCrossed,
    description: 'Upscale restaurants',
  },
  { id: 'casual', label: 'Casual', icon: Utensils, description: 'Local spots & cafes' },
  { id: 'mix', label: 'Mix', icon: Sparkles, description: 'Variety of experiences' },
];

const STEPS = [
  { id: 1, title: 'Trip Details', description: 'Where and when' },
  { id: 2, title: 'Trip Vibe', description: "What's the mood?" },
  { id: 3, title: 'Accommodation', description: 'Where to stay' },
  { id: 4, title: 'Dining', description: 'How to eat' },
  { id: 5, title: 'Invite', description: 'Invite your group' },
];

export default function CreateTripPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [formData, setFormData] = useState<
    Partial<TripWizardData & { title: string; tripType: string; voteDeadline: string }>
  >({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    budgetPerPerson: 1000,
    groupSize: 4,
    vibes: [],
    accommodationPref: '',
    diningPref: '',
    tripType: '',
    voteDeadline: '',
  });
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const createTripMutation = useMutation({
    mutationFn: async (
      data: TripWizardData & {
        inviteEmails?: string[];
        title?: string;
        tripType?: string;
        voteDeadline?: string;
      }
    ) => {
      if (!user?.id) {
        throw new Error('You must be logged in to create a trip');
      }

      const response = await apiRequest('POST', '/api/trips', {
        title: data.title ?? undefined,
        tripType: data.tripType ?? undefined,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        budgetPerPerson: data.budgetPerPerson,
        groupSize: data.groupSize,
        vibes: data.vibes,
        accommodationPref: data.accommodationPref,
        diningPref: data.diningPref,
        voteDeadline: (data as { voteDeadline?: string }).voteDeadline || undefined,
      });
      const trip = await response.json();
      const emails = (data as { inviteEmails?: string[] }).inviteEmails || [];
      for (const email of emails) {
        if (email?.trim()) {
          try {
            await apiRequest('POST', `/api/trips/${trip.id}/invites`, { email: email.trim() });
          } catch (_) {}
        }
      }
      return trip;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      } catch (_) {}
      toast({
        title: 'Trip created!',
        description: 'Invites sent. AI is generating your itinerary...',
      });
      setLocation(`/trip/${trip.id}`);
    },
    onError: (error: Error & { upgradeUrl?: string }) => {
      const message = error.message || 'Something went wrong. Please try again.';
      const upgradeUrl = error.upgradeUrl;
      toast({
        title: 'Failed to create trip',
        description: upgradeUrl ? `${message} Upgrade to Pro for unlimited trips.` : message,
        variant: 'destructive',
        action: upgradeUrl ? (
          <a
            href={upgradeUrl}
            className="inline-flex items-center rounded-md bg-background px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-border hover:bg-muted"
          >
            Upgrade
          </a>
        ) : undefined,
      });
    },
  });

  const updateField = <K extends keyof TripWizardData>(field: K, value: TripWizardData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleVibe = (vibeId: string) => {
    const current = formData.vibes || [];
    if (current.includes(vibeId)) {
      updateField(
        'vibes',
        current.filter((v) => v !== vibeId)
      );
    } else {
      updateField('vibes', [...current, vibeId]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        if (
          !formData.destination ||
          !formData.startDate ||
          !formData.endDate ||
          !formData.groupSize ||
          !formData.budgetPerPerson
        ) {
          return false;
        }
        try {
          const start = new Date(formData.startDate);
          const end = new Date(formData.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (start < today) return false;
          if (end < start) return false;
        } catch {
          return false;
        }
        return true;
      case 2:
        return formData.vibes && formData.vibes.length > 0;
      case 3:
        return formData.accommodationPref;
      case 4:
        return formData.diningPref;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      createTripMutation.mutate({ ...formData, inviteEmails } as TripWizardData & {
        inviteEmails: string[];
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const progressPercent = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 no-underline text-foreground hover:opacity-90 transition-opacity"
          >
            <AppLogo className="h-8 w-8 object-contain" />
            <span className="font-semibold hidden sm:block">TripSync</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      <AppHero />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of 5</span>
            <span className="text-sm font-medium">{STEPS[currentStep - 1].title}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="flex justify-center gap-1 mb-8">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  currentStep > step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    Trip title (optional)
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Miami Bachelorette 2026"
                    value={formData.title ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    data-testid="input-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location / Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Miami, FL"
                    value={formData.destination}
                    onChange={(e) => updateField('destination', e.target.value)}
                    data-testid="input-destination"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tripType">Trip type / template (optional)</Label>
                  <select
                    id="tripType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.tripType ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, tripType: e.target.value }))}
                    data-testid="select-trip-type"
                  >
                    <option value="">None</option>
                    <option value="beach">Beach / getaway</option>
                    <option value="city">City break</option>
                    <option value="food_tour">Food tour</option>
                    <option value="adventure">Adventure</option>
                    <option value="bachelorette">Bachelorette / bachelor</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      data-testid="input-end-date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupSize" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Group Size
                    </Label>
                    <Input
                      id="groupSize"
                      type="number"
                      min={2}
                      max={20}
                      value={formData.groupSize}
                      onChange={(e) => updateField('groupSize', parseInt(e.target.value) || 2)}
                      data-testid="input-group-size"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget / Person
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      min={100}
                      step={100}
                      value={formData.budgetPerPerson}
                      onChange={(e) =>
                        updateField('budgetPerPerson', parseInt(e.target.value) || 100)
                      }
                      data-testid="input-budget"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voteDeadline">Decision deadline (optional)</Label>
                  <Input
                    id="voteDeadline"
                    type="date"
                    value={formData.voteDeadline ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, voteDeadline: e.target.value }))}
                    data-testid="input-vote-deadline"
                  />
                  <p className="text-xs text-muted-foreground">
                    Voting and itinerary changes lock after this date so the group can finalize.
                  </p>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-4">
                {vibeOptions.map((vibe) => {
                  const isSelected = formData.vibes?.includes(vibe.id);
                  return (
                    <button
                      key={vibe.id}
                      onClick={() => toggleVibe(vibe.id)}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all hover-elevate ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`button-vibe-${vibe.id}`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <vibe.icon
                        className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <div className="font-medium">{vibe.label}</div>
                      <div className="text-sm text-muted-foreground">{vibe.description}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                {accommodationOptions.map((option) => {
                  const isSelected = formData.accommodationPref === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => updateField('accommodationPref', option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 hover-elevate ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`button-accommodation-${option.id}`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        <option.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                {diningOptions.map((option) => {
                  const isSelected = formData.diningPref === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => updateField('diningPref', option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 hover-elevate ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`button-dining-${option.id}`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        <option.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add email addresses to invite. They'll get the trip share link. You can also copy
                  the share link from the trip page after creation.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmailInput}
                    onChange={(e) => setInviteEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = inviteEmailInput.trim();
                        if (
                          trimmed &&
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) &&
                          !inviteEmails.includes(trimmed)
                        ) {
                          setInviteEmails([...inviteEmails, trimmed]);
                          setInviteEmailInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const trimmed = inviteEmailInput.trim();
                      if (
                        trimmed &&
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) &&
                        !inviteEmails.includes(trimmed)
                      ) {
                        setInviteEmails([...inviteEmails, trimmed]);
                        setInviteEmailInput('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {inviteEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {inviteEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1 pr-1">
                        <Mail className="h-3 w-3" />
                        {email}
                        <button
                          type="button"
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                          onClick={() => setInviteEmails(inviteEmails.filter((e) => e !== email))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                data-testid="button-wizard-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || createTripMutation.isPending}
                data-testid="button-wizard-next"
              >
                {createTripMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : currentStep === 5 ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Trip & Invite
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
