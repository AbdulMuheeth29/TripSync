import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Car, Plane, Train, MapPin, Users, Plus, Trash2, Calendar, User } from "lucide-react";
import { useState } from "react";

interface TransportationEntry {
  id: string;
  dayNumber: number;
  type: string;
  description: string;
  driverUserId?: string | null;
  passengerUserIds?: string[];
  driver?: { id: string; name: string };
  notes?: string | null;
}

interface TripMember {
  id: string;
  name: string;
}

interface TransportationCoordinatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  entries: TransportationEntry[];
  members: TripMember[];
  tripDays: number;
  onAddEntry: (entry: {
    dayNumber: number;
    type: string;
    description: string;
    driverUserId?: string;
    passengerUserIds?: string[];
    notes?: string;
  }) => Promise<void>;
  onUpdateEntry: (entryId: string, updates: {
    description?: string;
    driverUserId?: string;
    passengerUserIds?: string[];
    notes?: string;
  }) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
}

export function TransportationCoordinatorModal({
  isOpen,
  onClose,
  tripId,
  entries,
  members,
  tripDays,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry
}: TransportationCoordinatorModalProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [newEntry, setNewEntry] = useState({
    dayNumber: 1,
    type: "drive",
    description: "",
    driverUserId: "",
    passengerUserIds: [] as string[],
    notes: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    driverUserId: "",
    passengerUserIds: [] as string[],
    notes: ""
  });

  const transportTypes = [
    { id: "drive", label: "Drive", icon: Car },
    { id: "flight", label: "Flight", icon: Plane },
    { id: "train", label: "Train/Bus", icon: Train },
    { id: "rideshare", label: "Rideshare", icon: Users },
    { id: "pickup", label: "Airport Pickup", icon: MapPin }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAddEntry = async () => {
    if (!newEntry.description.trim()) return;

    await onAddEntry({
      dayNumber: newEntry.dayNumber,
      type: newEntry.type,
      description: newEntry.description,
      driverUserId: newEntry.driverUserId || undefined,
      passengerUserIds: newEntry.passengerUserIds.length > 0 ? newEntry.passengerUserIds : undefined,
      notes: newEntry.notes || undefined
    });

    setNewEntry({
      dayNumber: selectedDay,
      type: "drive",
      description: "",
      driverUserId: "",
      passengerUserIds: [],
      notes: ""
    });
  };

  const handleStartEdit = (entry: TransportationEntry) => {
    setEditingId(entry.id);
    setEditForm({
      description: entry.description,
      driverUserId: entry.driverUserId || "",
      passengerUserIds: entry.passengerUserIds || [],
      notes: entry.notes || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    await onUpdateEntry(editingId, {
      description: editForm.description,
      driverUserId: editForm.driverUserId || undefined,
      passengerUserIds: editForm.passengerUserIds.length > 0 ? editForm.passengerUserIds : undefined,
      notes: editForm.notes || undefined
    });

    setEditingId(null);
  };

  const handleTogglePassenger = (memberId: string) => {
    setNewEntry(prev => ({
      ...prev,
      passengerUserIds: prev.passengerUserIds.includes(memberId)
        ? prev.passengerUserIds.filter(id => id !== memberId)
        : [...prev.passengerUserIds, memberId]
    }));
  };

  const handleTogglePassengerEdit = (memberId: string) => {
    setEditForm(prev => ({
      ...prev,
      passengerUserIds: prev.passengerUserIds.includes(memberId)
        ? prev.passengerUserIds.filter(id => id !== memberId)
        : [...prev.passengerUserIds, memberId]
    }));
  };

  const dayEntries = entries.filter(e => e.dayNumber === selectedDay);
  const getTypeIcon = (type: string) => {
    const found = transportTypes.find(t => t.id === type);
    return found ? found.icon : Car;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <DialogTitle>Transportation Coordinator</DialogTitle>
          </div>
          <DialogDescription>
            Manage rides, drivers, and transportation logistics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Day Selector */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <p className="font-semibold text-blue-900">Select Day</p>
              </div>
              <Badge variant="outline">{dayEntries.length} arrangements</Badge>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {Array.from({ length: tripDays }, (_, i) => i + 1).map(day => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedDay(day);
                    setNewEntry(prev => ({ ...prev, dayNumber: day }));
                  }}
                  className="w-full"
                >
                  Day {day}
                </Button>
              ))}
            </div>
          </Card>

          {/* Add New Entry */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold mb-3">Add Transportation</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newEntry.type}
                    onValueChange={(value) => setNewEntry(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transportTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    placeholder="e.g., Airport to hotel"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Driver (Optional)</Label>
                  <Select
                    value={newEntry.driverUserId}
                    onValueChange={(value) => setNewEntry(prev => ({ ...prev, driverUserId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No driver assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No driver</SelectItem>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="Departure time, meeting point"
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Passengers (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {members.map(member => (
                    <Badge
                      key={member.id}
                      variant={newEntry.passengerUserIds.includes(member.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTogglePassenger(member.id)}
                    >
                      {member.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddEntry}
                disabled={!newEntry.description.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transportation
              </Button>
            </div>
          </Card>

          {/* Entries for Selected Day */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Day {selectedDay} Transportation</h4>

            {dayEntries.length === 0 ? (
              <Card className="p-8 text-center">
                <Car className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No transportation planned for Day {selectedDay}</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {dayEntries.map(entry => {
                  const TypeIcon = getTypeIcon(entry.type);
                  const isEditing = editingId === entry.id;

                  return (
                    <Card key={entry.id} className="p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Driver</Label>
                              <Select
                                value={editForm.driverUserId}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, driverUserId: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="No driver" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No driver</SelectItem>
                                  {members.map(member => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Input
                                value={editForm.notes}
                                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Passengers</Label>
                            <div className="flex flex-wrap gap-2">
                              {members.map(member => (
                                <Badge
                                  key={member.id}
                                  variant={editForm.passengerUserIds.includes(member.id) ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => handleTogglePassengerEdit(member.id)}
                                >
                                  {member.name}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                <TypeIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{entry.description}</p>
                                {entry.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="capitalize">{entry.type}</Badge>
                          </div>

                          {entry.driver && (
                            <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-lg">
                              <User className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-900">
                                <strong>Driver:</strong> {entry.driver.name}
                              </span>
                            </div>
                          )}

                          {entry.passengerUserIds && entry.passengerUserIds.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-2">Passengers ({entry.passengerUserIds.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {entry.passengerUserIds.map(passengerId => {
                                  const passenger = members.find(m => m.id === passengerId);
                                  if (!passenger) return null;
                                  return (
                                    <div key={passengerId} className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 rounded text-xs">
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs">
                                          {getInitials(passenger.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{passenger.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(entry)}
                            >
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove transportation?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Remove "{entry.description}" from Day {entry.dayNumber}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteEntry(entry.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
