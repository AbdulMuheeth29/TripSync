import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plane,
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
  Home,
  UtensilsCrossed,
  Check,
  Loader2,
} from "lucide-react";
import type { TripWizardData } from "@shared/schema";

const vibeOptions = [
  { id: "relaxing", label: "Relaxing", icon: Palmtree, description: "Beach, spa, slow-paced" },
  { id: "adventure", label: "Adventure", icon: Mountain, description: "Hiking, activities, exploring" },
  { id: "foodie", label: "Foodie", icon: Utensils, description: "Restaurants, markets, cooking" },
  { id: "nightlife", label: "Nightlife", icon: Wine, description: "Bars, clubs, entertainment" },
];

const accommodationOptions = [
  { id: "hotel", label: "Hotel", icon: Building, description: "Traditional hotel stays" },
  { id: "airbnb", label: "Airbnb", icon: Home, description: "Home rentals & unique stays" },
  { id: "mix", label: "Mix", icon: Sparkles, description: "Best of both worlds" },
];

const diningOptions = [
  { id: "fine_dining", label: "Fine Dining", icon: UtensilsCrossed, description: "Upscale restaurants" },
  { id: "casual", label: "Casual", icon: Utensils, description: "Local spots & cafes" },
  { id: "mix", label: "Mix", icon: Sparkles, description: "Variety of experiences" },
];

const STEPS = [
  { id: 1, title: "Trip Details", description: "Where and when" },
  { id: 2, title: "Trip Vibe", description: "What's the mood?" },
  { id: 3, title: "Accommodation", description: "Where to stay" },
  { id: 4, title: "Dining", description: "How to eat" },
];

export default function CreateTripPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<TripWizardData>>({
    destination: "",
    startDate: "",
    endDate: "",
    budgetPerPerson: 1000,
    groupSize: 4,
    vibes: [],
    accommodationPref: "",
    diningPref: "",
  });
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const createTripMutation = useMutation({
    mutationFn: async (data: TripWizardData) => {
      const response = await apiRequest("POST", "/api/trips", {
        ...data,
        organizerId: user?.id,
      });
      return response.json();
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({
        title: "Trip created!",
        description: "AI is generating your itinerary...",
      });
      setLocation(`/trip/${trip.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to create trip",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateField = <K extends keyof TripWizardData>(field: K, value: TripWizardData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleVibe = (vibeId: string) => {
    const current = formData.vibes || [];
    if (current.includes(vibeId)) {
      updateField("vibes", current.filter((v) => v !== vibeId));
    } else {
      updateField("vibes", [...current, vibeId]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.destination && formData.startDate && formData.endDate && formData.groupSize && formData.budgetPerPerson;
      case 2:
        return formData.vibes && formData.vibes.length > 0;
      case 3:
        return formData.accommodationPref;
      case 4:
        return formData.diningPref;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      createTripMutation.mutate(formData as TripWizardData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const progressPercent = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Plane className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold hidden sm:block">TripSync</span>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
            <span className="text-sm font-medium">{STEPS[currentStep - 1].title}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 ${index < STEPS.length - 1 ? "flex-1" : ""}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
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
                  <Label htmlFor="destination" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Miami, FL"
                    value={formData.destination}
                    onChange={(e) => updateField("destination", e.target.value)}
                    data-testid="input-destination"
                  />
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
                      onChange={(e) => updateField("startDate", e.target.value)}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateField("endDate", e.target.value)}
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
                      onChange={(e) => updateField("groupSize", parseInt(e.target.value) || 2)}
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
                      onChange={(e) => updateField("budgetPerPerson", parseInt(e.target.value) || 100)}
                      data-testid="input-budget"
                    />
                  </div>
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
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`button-vibe-${vibe.id}`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <vibe.icon className={`h-6 w-6 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
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
                      onClick={() => updateField("accommodationPref", option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 hover-elevate ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`button-accommodation-${option.id}`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
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
                      onClick={() => updateField("diningPref", option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 hover-elevate ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`button-dining-${option.id}`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
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
                ) : currentStep === 4 ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Itinerary
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
