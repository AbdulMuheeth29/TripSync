"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Sparkles } from "lucide-react";

const ONBOARDING_KEY = "tripsync_onboarding_done";

const SCREENS = [
  {
    icon: MapPin,
    title: "Plan trips together",
    description: "Create a trip, set destination and dates, and invite your group. Everyone can share preferences and vote on the itinerary.",
  },
  {
    icon: Users,
    title: "AI does the heavy lifting",
    description: "Our AI generates a full day-by-day plan based on your vibe, budget, and group preferences. Edit, vote, and book with one click.",
  },
  {
    icon: Sparkles,
    title: "One place for everything",
    description: "Maps, expenses, packing lists, emergency contacts, and trip recap—all in one place. Travel smarter with TripSync.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const handleNext = () => {
    if (step < SCREENS.length - 1) setStep((s) => s + 1);
    else handleClose();
  };

  const Icon = SCREENS[step].icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">{SCREENS[step].title}</DialogTitle>
        </DialogHeader>
        <p className="text-center text-muted-foreground text-sm leading-relaxed">
          {SCREENS[step].description}
        </p>
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="flex gap-1">
            {SCREENS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full w-6 transition-colors ${i === step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <Button onClick={handleNext}>
            {step < SCREENS.length - 1 ? "Next" : "Get started"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
