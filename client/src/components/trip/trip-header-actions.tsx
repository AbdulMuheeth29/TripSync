import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Share2,
  Download,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Mail,
  Copy,
  Calendar,
  Settings,
  MoreVertical,
} from 'lucide-react';
import type { Trip } from '@shared/schema';
import { ShareTripLinkModal } from './share-trip-link-modal';
import { TripSettingsModal } from './trip-settings-modal';

interface TripHeaderActionsProps {
  trip: Trip;
  isOrganizer: boolean;
  onUpdateTrip: (updates: Partial<Trip>) => Promise<void>;
  onDeleteTrip: () => Promise<void>;
  onRegenerateShareCode: () => Promise<string>;
}

export function TripHeaderActions({
  trip,
  isOrganizer,
  onUpdateTrip,
  onDeleteTrip,
  onRegenerateShareCode,
}: TripHeaderActionsProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const handleLockToggle = async () => {
    try {
      await onUpdateTrip({ isLocked: !trip.isLocked });
      toast({
        title: trip.isLocked ? 'Trip unlocked' : 'Trip locked',
        description: trip.isLocked
          ? 'Members can now edit the itinerary'
          : 'Only organizers can edit the itinerary',
      });
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  // TODO: Add 'isPublic' field to trips schema to enable this feature
  // const handlePublicToggle = async () => {
  //   try {
  //     await onUpdateTrip({ isPublic: !trip.isPublic });
  //     toast({
  //       title: trip.isPublic ? "Trip is now private" : "Trip is now public",
  //       description: trip.isPublic
  //         ? "Only members can view this trip"
  //         : "Anyone with the link can view this trip",
  //     });
  //   } catch (error) {
  //     toast({
  //       title: "Failed to update",
  //       description: error instanceof Error ? error.message : "Something went wrong",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/join/${trip.shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard',
    });
  };

  const handleShareEmail = () => {
    const shareUrl = `${window.location.origin}/join/${trip.shareCode}`;
    const subject = encodeURIComponent(`Join me on ${trip.title || trip.destination}`);
    const body = encodeURIComponent(
      `Hey! I'm planning a trip to ${trip.destination} from ${new Date(trip.startDate).toLocaleDateString()} to ${new Date(trip.endDate).toLocaleDateString()}.\n\nJoin me by clicking this link:\n${shareUrl}\n\nLet's plan this together!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleExportCalendar = () => {
    // Generate .ics file
    const icsContent = generateICS(trip);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(trip.title || trip.destination).replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Calendar exported',
      description: 'Trip added to your calendar',
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Share Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy invite link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Share via email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsSharing(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            More sharing options
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export to Calendar */}
      <Button variant="outline" size="sm" onClick={handleExportCalendar}>
        <Calendar className="h-4 w-4 mr-2" />
        Export
      </Button>

      {/* Organizer-only actions */}
      {isOrganizer && (
        <>
          {/* Lock/Unlock Toggle */}
          <Button variant="outline" size="sm" onClick={handleLockToggle}>
            {trip.isLocked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock
              </>
            )}
          </Button>

          {/* TODO: Uncomment when 'isPublic' field is added to trips schema */}
          {/* <Button variant="outline" size="sm" onClick={handlePublicToggle}>
            {trip.isPublic ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Make Private
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Make Public
              </>
            )}
          </Button> */}

          {/* Settings Modal */}
          <TripSettingsModal
            trip={trip}
            isOrganizer={isOrganizer}
            onUpdateTrip={onUpdateTrip}
            onDeleteTrip={onDeleteTrip}
            onRegenerateShareCode={onRegenerateShareCode}
          />
        </>
      )}

      {/* Share Trip Link Modal */}
      {isSharing && (
        <ShareTripLinkModal
          isOpen={isSharing}
          onClose={() => setIsSharing(false)}
          trip={{
            id: trip.id,
            name: trip.title || trip.destination,
            startDate: new Date(trip.startDate),
            endDate: new Date(trip.endDate),
            memberCount: trip.groupSize,
          }}
          shareLink={`${window.location.origin}/join/${trip.shareCode}`}
          onRegenerateLink={onRegenerateShareCode}
          onTogglePublicAccess={async (enabled: boolean) => {
            // TODO: Add isPublic field to schema to enable this
            await onUpdateTrip({ isPublic: enabled } as any);
          }}
          initialPublicAccess={false}
        />
      )}
    </div>
  );
}

// Helper function to generate ICS calendar file
function generateICS(trip: Trip): string {
  const now = new Date();
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatDate(trip.startDate);
  const endDate = formatDate(trip.endDate);
  const timestamp = formatDate(now);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TripSync//Trip Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${trip.id}@tripsync.com
DTSTAMP:${timestamp}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${trip.title || trip.destination}
DESCRIPTION:Trip to ${trip.destination}\\n\\nBudget: $${trip.budgetPerPerson} per person\\nGroup Size: ${trip.groupSize}\\n\\nView details: ${window.location.origin}/trip/${trip.id}
LOCATION:${trip.destination}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
}
