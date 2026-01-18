import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Plane,
  Users,
  Sparkles,
  Calendar,
  CreditCard,
  MessageSquare,
  Check,
  ArrowRight,
  MapPin,
  ThumbsUp,
} from "lucide-react";
import { SiX, SiInstagram, SiFacebook } from "react-icons/si";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Planning",
    description: "Get a complete itinerary in minutes, not hours. Our AI considers your budget, vibe, and group preferences.",
  },
  {
    icon: Users,
    title: "Group Collaboration",
    description: "Vote on activities, leave comments, and make decisions together. No more endless group chats.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Perfectly timed activities with realistic travel times. Never miss a reservation again.",
  },
  {
    icon: CreditCard,
    title: "Expense Tracking",
    description: "Split bills fairly and see who owes what. Settle up with one click after your trip.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Updates",
    description: "Everyone stays in sync. Changes update instantly for the whole group.",
  },
  {
    icon: MapPin,
    title: "One-Click Booking",
    description: "Deep links to flights, hotels, and restaurants. Book directly from your itinerary.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">TripSync</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">Log In</Button>
            </Link>
            <Link href="/login">
              <Button data-testid="button-get-started">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Plan group trips in{" "}
              <span className="text-primary">10 minutes</span>
              <br />
              not 10 hours
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
              TripSync combines AI itinerary generation, group collaboration, and expense tracking 
              into one seamless platform. Stop juggling spreadsheets and group chats.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link href="/login">
                <Button size="lg" className="gap-2 px-8" data-testid="button-start-planning">
                  Start Planning
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                No credit card required
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                Free forever plan
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                Cancel anytime
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for stress-free group travel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From AI-generated itineraries to seamless expense splitting, 
              TripSync handles the logistics so you can focus on making memories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/30 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                From idea to itinerary in 4 simple steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { step: "1", title: "Enter Details", desc: "Tell us your destination, dates, and budget" },
                { step: "2", title: "Pick Your Vibe", desc: "Adventure, relaxation, foodie, nightlife - you choose" },
                { step: "3", title: "AI Generates", desc: "Get a personalized itinerary in seconds" },
                { step: "4", title: "Collaborate", desc: "Vote, comment, and book together" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to plan your next adventure?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Join thousands of groups who've made trip planning actually fun.
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-bottom">
                Start Planning for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Plane className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">TripSync</span>
            </div>

            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <SiX className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <SiInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <SiFacebook className="h-5 w-5" />
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; 2026 TripSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
