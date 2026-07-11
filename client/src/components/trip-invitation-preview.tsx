import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Users, DollarSign, Sparkles, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface TripInvitation {
  tripId: string;
  tripName: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  groupSize: number;
  organizer: {
    name: string;
    email: string;
  };
  currentMembers: Array<{
    id: string;
    name: string;
  }>;
  itineraryHighlights: string[];
  inviteMessage?: string;
}

interface TripInvitationPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  invitation: TripInvitation;
  isProcessing?: boolean;
}

export function TripInvitationPreview({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  invitation,
  isProcessing = false
}: TripInvitationPreviewProps) {
  const duration = differenceInDays(invitation.endDate, invitation.startDate) + 1;
  const daysUntilTrip = differenceInDays(invitation.startDate, new Date());

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            You're Invited to Join a Trip!
          </DialogTitle>
          <DialogDescription className="text-center">
            {invitation.organizer.name} invited you to join their group trip
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip Header */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <h3 className="text-2xl font-bold mb-2">{invitation.tripName}</h3>
            <div className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">{invitation.destination}</span>
            </div>
          </Card>

          {/* Personal Message */}
          {invitation.inviteMessage && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <p className="text-sm italic">"{invitation.inviteMessage}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                - {invitation.organizer.name}
              </p>
            </Card>
          )}

          {/* Trip Details */}
          <Card className="p-5">
            <h4 className="font-semibold mb-4">Trip Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Dates</p>
                  <p className="font-medium">
                    {format(invitation.startDate, "MMM d")} - {format(invitation.endDate, "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {duration} days • {daysUntilTrip > 0 ? `Starts in ${daysUntilTrip} days` : "Started"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Group Size</p>
                  <p className="font-medium">{invitation.groupSize} people</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Estimated Budget</p>
                  <p className="font-medium">${invitation.budget.toLocaleString()} per person</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Current Members */}
          <Card className="p-5">
            <h4 className="font-semibold mb-3">
              Group Members ({invitation.currentMembers.length})
            </h4>
            <div className="flex flex-wrap gap-3">
              {invitation.currentMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.name}</span>
                  {member.name === invitation.organizer.name && (
                    <Badge variant="secondary" className="text-xs">Organizer</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Itinerary Highlights */}
          {invitation.itineraryHighlights.length > 0 && (
            <Card className="p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Planned Activities
              </h4>
              <ul className="space-y-2">
                {invitation.itineraryHighlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* What Happens Next */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-sm mb-2">What happens when you accept?</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>You'll get full access to the trip itinerary</li>
              <li>You can vote on activities and suggest changes</li>
              <li>Join the group chat to coordinate with everyone</li>
              <li>Track shared expenses and settle costs easily</li>
            </ul>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDecline}
            disabled={isProcessing}
            className="flex-1"
          >
            Decline
          </Button>
          <Button
            onClick={onAccept}
            disabled={isProcessing}
            className="flex-1"
            size="lg"
          >
            {isProcessing ? "Joining..." : "Accept & Join Trip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
