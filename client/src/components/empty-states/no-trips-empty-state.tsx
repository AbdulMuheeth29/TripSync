import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Sparkles } from "lucide-react";

interface NoTripsEmptyStateProps {
  onCreateTrip: () => void;
  userName?: string;
}

export function NoTripsEmptyState({ onCreateTrip, userName }: NoTripsEmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
              <Sparkles className="h-4 w-4 text-yellow-900" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-2">
            {userName ? `${userName}, your adventure awaits!` : "No trips yet"}
          </h3>
          <p className="text-muted-foreground">
            Start planning your first trip and experience seamless group travel planning with AI-powered recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-semibold mb-1">✈️ AI Planning</p>
            <p className="text-xs text-muted-foreground">Get personalized itineraries</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-semibold mb-1">💰 Split Costs</p>
            <p className="text-xs text-muted-foreground">Easy expense tracking</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-semibold mb-1">👥 Collaborate</p>
            <p className="text-xs text-muted-foreground">Plan with your group</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onCreateTrip} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Trip
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Or wait for an invitation to join someone else's trip
        </p>
      </div>
    </Card>
  );
}
