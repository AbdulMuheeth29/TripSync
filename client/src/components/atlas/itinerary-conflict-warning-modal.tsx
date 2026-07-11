import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface ConflictingActivity {
  id: string;
  name: string;
  location: string;
  startTime: Date;
  endTime: Date;
  attendees: number;
}

interface ItineraryConflictWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: Array<{
    date: Date;
    activities: ConflictingActivity[];
    conflictType: "overlap" | "tight_schedule" | "location_distance";
  }>;
  onResolve: (conflictIndex: number) => void;
  onIgnore: () => void;
}

export function ItineraryConflictWarningModal({
  isOpen,
  onClose,
  conflicts,
  onResolve,
  onIgnore
}: ItineraryConflictWarningModalProps) {
  const getConflictMessage = (type: string) => {
    switch (type) {
      case "overlap":
        return "These activities overlap in time";
      case "tight_schedule":
        return "Not enough time between activities";
      case "location_distance":
        return "Activities are far apart";
      default:
        return "Potential scheduling issue";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Itinerary Conflicts Detected</DialogTitle>
          </div>
          <DialogDescription>
            Atlas found {conflicts.length} scheduling {conflicts.length === 1 ? 'conflict' : 'conflicts'} in your itinerary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Schedule Optimization Needed
                </p>
                <p className="text-sm text-amber-800">
                  I've identified timing or location conflicts that could make your itinerary difficult to execute.
                  Review and resolve them for a smoother trip.
                </p>
              </div>
            </div>
          </Card>

          {conflicts.map((conflict, index) => (
            <Card key={index} className="p-4 border-red-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold">{format(conflict.date, "EEEE, MMMM d")}</h4>
                </div>
                <Badge variant="destructive">
                  {getConflictMessage(conflict.conflictType)}
                </Badge>
              </div>

              <div className="space-y-3">
                {conflict.activities.map((activity, actIndex) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{activity.name}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(activity.startTime, "h:mm a")} - {format(activity.endTime, "h:mm a")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{activity.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{activity.attendees} people</span>
                        </div>
                      </div>
                    </div>
                    {actIndex === 0 && (
                      <Badge className="bg-red-500">Conflict</Badge>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(index)}
                className="w-full mt-3"
              >
                Resolve This Conflict
              </Button>
            </Card>
          ))}

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-2">Atlas Suggestions</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Adjust activity times to avoid overlaps</li>
                  <li>• Add buffer time for travel between locations</li>
                  <li>• Consider removing or rescheduling conflicting activities</li>
                  <li>• Group activities by location to minimize travel</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onIgnore} className="flex-1">
            Ignore Warnings
          </Button>
          <Button onClick={() => onResolve(0)} className="flex-1">
            Review & Fix
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
