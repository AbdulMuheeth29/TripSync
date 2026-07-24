import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Trash2, Lock, Unlock, Eye, EyeOff, Copy, RefreshCw, AlertTriangle, Check } from "lucide-react";
import type { Trip } from "@shared/schema";

interface TripSettingsModalProps {
  trip: Trip;
  isOrganizer: boolean;
  onUpdateTrip: (updates: Partial<Trip>) => Promise<void>;
  onDeleteTrip: () => Promise<void>;
  onRegenerateShareCode: () => Promise<string>;
}

export function TripSettingsModal({
  trip,
  isOrganizer,
  onUpdateTrip,
  onDeleteTrip,
  onRegenerateShareCode,
}: TripSettingsModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Form states for each section
  const [title, setTitle] = useState(trip.title || "");
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [budgetPerPerson, setBudgetPerPerson] = useState(trip.budgetPerPerson);
  const [groupSize, setGroupSize] = useState(trip.groupSize);
  const [tripType, setTripType] = useState(trip.tripType || "leisure");
  const [accommodationPref, setAccommodationPref] = useState(trip.accommodationPref || "mix");
  const [diningPref, setDiningPref] = useState(trip.diningPref || "mix");
  const [isLocked, setIsLocked] = useState(trip.isLocked || false);
  // const [isPublic, setIsPublic] = useState(trip.isPublic || false); // TODO: Add isPublic field to schema
  const [voteDeadline, setVoteDeadline] = useState(trip.voteDeadline || "");
  const [status, setStatus] = useState(trip.status || "planning");

  if (!isOrganizer) {
    return null;
  }

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      const updates: Partial<Trip> = {};

      if (section === "details") {
        updates.title = title;
        updates.destination = destination;
        updates.startDate = startDate;
        updates.endDate = endDate;
        updates.budgetPerPerson = budgetPerPerson;
        updates.groupSize = groupSize;
      } else if (section === "preferences") {
        updates.tripType = tripType as "leisure" | "business" | "adventure" | "other";
        updates.accommodationPref = accommodationPref as "hotel" | "airbnb" | "mix";
        updates.diningPref = diningPref as "fine_dining" | "casual" | "mix";
      } else if (section === "visibility") {
        // updates.isPublic = isPublic; // TODO: Add isPublic field to schema
        updates.isLocked = isLocked;
      } else if (section === "voting") {
        updates.voteDeadline = voteDeadline;
      } else if (section === "advanced") {
        updates.status = status as "planning" | "booking" | "active" | "completed" | "cancelled";
        updates.isLocked = isLocked;
      }

      await onUpdateTrip(updates);
      toast({
        title: "Settings updated",
        description: "Your trip settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to update settings",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    try {
      const newCode = await onRegenerateShareCode();
      toast({
        title: "Share code regenerated",
        description: `New code: ${newCode}`,
      });
    } catch (error) {
      toast({
        title: "Failed to regenerate code",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    const confirmText = trip.title || trip.destination;
    if (deleteConfirmText !== confirmText) {
      toast({
        title: "Confirmation failed",
        description: "Please type the exact trip name to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onDeleteTrip();
      setOpen(false);
      toast({
        title: "Trip deleted",
        description: "Your trip has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete trip",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/join/${trip.shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Trip Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trip Settings</DialogTitle>
          <DialogDescription>
            Manage your trip settings, visibility, and preferences. Only organizers can make changes.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="voting">Voting</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Trip Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Trip Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Trip to Tokyo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Tokyo, Japan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetPerPerson">Budget per Person ($)</Label>
                  <Input
                    id="budgetPerPerson"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetPerPerson}
                    onChange={(e) => setBudgetPerPerson(parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupSize">Group Size</Label>
                  <Input
                    id="groupSize"
                    type="number"
                    min="1"
                    max="50"
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave("details")} disabled={loading}>
                {loading ? "Saving..." : "Save Details"}
              </Button>
            </div>
          </TabsContent>

          {/* Trip Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tripType">Trip Type</Label>
                <Select value={tripType} onValueChange={setTripType}>
                  <SelectTrigger id="tripType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leisure">Leisure</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accommodationPref">Accommodation Preference</Label>
                <Select value={accommodationPref} onValueChange={setAccommodationPref}>
                  <SelectTrigger id="accommodationPref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotels</SelectItem>
                    <SelectItem value="airbnb">Airbnb/Vacation Rentals</SelectItem>
                    <SelectItem value="mix">Mix of Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diningPref">Dining Preference</Label>
                <Select value={diningPref} onValueChange={setDiningPref}>
                  <SelectTrigger id="diningPref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fine_dining">Fine Dining</SelectItem>
                    <SelectItem value="casual">Casual Dining</SelectItem>
                    <SelectItem value="mix">Mix of Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => handleSave("preferences")} disabled={loading}>
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </TabsContent>

          {/* Visibility & Sharing Tab */}
          <TabsContent value="visibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Share Link</CardTitle>
                <CardDescription>Anyone with this link can join your trip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/join/${trip.shareCode}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{trip.shareCode}</Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Code
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate Share Code?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a new share code and invalidate the old one. Anyone using the old link won't be able to join.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerateCode}>Regenerate</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* TODO: Uncomment when isPublic field is added to schema */}
              {/* <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Trip</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this trip visible to search engines and shareable publicly
                  </p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div> */}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lock Trip</Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent non-organizers from editing the itinerary
                  </p>
                </div>
                <Switch
                  checked={isLocked}
                  onCheckedChange={setIsLocked}
                />
              </div>

              <Button onClick={() => handleSave("visibility")} disabled={loading}>
                {loading ? "Saving..." : "Save Visibility Settings"}
              </Button>
            </div>
          </TabsContent>

          {/* Voting Settings Tab */}
          <TabsContent value="voting" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voteDeadline">Vote Deadline</Label>
                <Input
                  id="voteDeadline"
                  type="datetime-local"
                  value={voteDeadline}
                  onChange={(e) => setVoteDeadline(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  After this deadline, voting will be locked and items will be finalized
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Voting Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Deadline Set</span>
                      <Badge variant={voteDeadline ? "default" : "secondary"}>
                        {voteDeadline ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {voteDeadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Deadline</span>
                        <span className="text-sm font-medium">
                          {new Date(voteDeadline).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => handleSave("voting")} disabled={loading}>
                {loading ? "Saving..." : "Save Voting Settings"}
              </Button>
            </div>
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Trip Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Status transitions: Planning → Booking → Active → Completed
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lock Trip Editing</Label>
                  <p className="text-sm text-muted-foreground">
                    Only organizers can make changes when locked
                  </p>
                </div>
                <Switch
                  checked={isLocked}
                  onCheckedChange={setIsLocked}
                />
              </div>

              <Button onClick={() => handleSave("advanced")} disabled={loading}>
                {loading ? "Saving..." : "Save Advanced Settings"}
              </Button>

              {/* Danger Zone */}
              <Card className="border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions. Please be certain before proceeding.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Trip Permanently
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your trip, including all:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Itinerary items and bookings</li>
                            <li>Expenses and settlements</li>
                            <li>Chat messages and comments</li>
                            <li>Photos and documents</li>
                            <li>All member data</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirm">
                          Type <span className="font-bold">{trip.title || trip.destination}</span> to confirm
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Enter trip name"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteConfirmText !== (trip.title || trip.destination) || loading}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {loading ? "Deleting..." : "Delete Forever"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
