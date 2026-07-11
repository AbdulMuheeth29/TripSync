import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, DollarSign, Users, Calendar, MessageCircle, TrendingUp } from "lucide-react";

interface AtlasWelcomeMessageProps {
  userName: string;
  tripName: string;
  onQuickAction: (action: string) => void;
}

const QUICK_ACTIONS = [
  {
    id: "suggest_activities",
    icon: MapPin,
    label: "Suggest Activities",
    description: "Get personalized activity recommendations"
  },
  {
    id: "optimize_budget",
    icon: DollarSign,
    label: "Optimize Budget",
    description: "Tips to save money on your trip"
  },
  {
    id: "coordinate_group",
    icon: Users,
    label: "Coordinate Group",
    description: "Help plan group activities and voting"
  },
  {
    id: "create_itinerary",
    icon: Calendar,
    label: "Create Itinerary",
    description: "Build a day-by-day schedule"
  }
];

const ATLAS_CAPABILITIES = [
  "Answer questions about your destination",
  "Suggest restaurants and activities",
  "Help optimize your budget",
  "Create packing lists",
  "Provide weather updates",
  "Coordinate with your group",
  "Send proactive trip reminders"
];

export function AtlasWelcomeMessage({
  userName,
  tripName,
  onQuickAction
}: AtlasWelcomeMessageProps) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Welcome Header */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold">Hey {userName}, I'm Atlas!</h2>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600">
                AI Assistant
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              Your personal AI travel companion for <strong>{tripName}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-base">
            I'm here to make your trip planning easier! I can help you discover amazing activities,
            manage your budget, coordinate with your group, and answer any questions about your destination.
          </p>

          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
            <MessageCircle className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium">
              Ask me anything, or choose a quick action below to get started
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.id}
                className="p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md"
                onClick={() => onQuickAction(action.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{action.label}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Capabilities */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          What I Can Do
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ATLAS_CAPABILITIES.map((capability, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <p className="text-sm">{capability}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Example Questions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3 text-blue-900">Try asking me:</h3>
        <div className="space-y-2">
          {[
            "What are the best restaurants in [destination]?",
            "How can I save money on this trip?",
            "What activities should we do on Day 3?",
            "Create a packing list for this trip",
            "What's the weather forecast for our trip dates?"
          ].map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left h-auto p-3 hover:bg-blue-100"
              onClick={() => onQuickAction(`question_${index}`)}
            >
              <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{question}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Pro Tip */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 mb-1">Pro Tip</p>
            <p className="text-sm text-purple-800">
              I learn from your preferences! The more you interact with me, the better my recommendations become.
              I'll also send proactive alerts about budget, deadlines, and trip planning milestones.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
