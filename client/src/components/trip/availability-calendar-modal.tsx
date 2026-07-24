import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, Calendar as CalendarIcon, Users, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface GroupAvailability {
  id: string;
  userId: string;
  availableDates: string[];
  user: { id: string; name: string };
}

interface TripMember {
  id: string;
  name: string;
}

interface AvailabilityCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  availability: GroupAvailability[];
  members: TripMember[];
  currentUserId: string;
  onSaveAvailability: (dates: string[]) => Promise<void>;
}

export function AvailabilityCalendarModal({
  isOpen,
  onClose,
  availability,
  members,
  currentUserId,
  onSaveAvailability,
}: AvailabilityCalendarModalProps) {
  const currentUserAvailability = availability.find((a) => a.userId === currentUserId);
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    currentUserAvailability?.availableDates.map((d) => parseISO(d)) || []
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDates((prev) => {
      const exists = prev.some((d) => isSameDay(d, date));
      if (exists) {
        return prev.filter((d) => !isSameDay(d, date));
      } else {
        return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      }
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dateStrings = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));
      await onSaveAvailability(dateStrings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate consensus dates (dates where most people are available)
  const dateAvailability = new Map<string, string[]>();
  availability.forEach((av) => {
    av.availableDates.forEach((dateStr) => {
      if (!dateAvailability.has(dateStr)) {
        dateAvailability.set(dateStr, []);
      }
      dateAvailability.get(dateStr)!.push(av.userId);
    });
  });

  const consensusDates = Array.from(dateAvailability.entries())
    .map(([dateStr, userIds]) => ({
      date: dateStr,
      count: userIds.length,
      users: userIds.map((id) => members.find((m) => m.id === id)!).filter(Boolean),
      percentage: (userIds.length / members.length) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const bestDates = consensusDates.filter((d) => d.percentage >= 80);

  // Month calendar view
  const monthDays = eachDayOfInterval({
    start: startOfMonth(viewMonth),
    end: endOfMonth(viewMonth),
  });

  const getDayAvailabilityCount = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return dateAvailability.get(dateStr)?.length || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <DialogTitle>Group Availability</DialogTitle>
          </div>
          <DialogDescription>Find dates that work for everyone</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Calendar Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Your Availability</h4>
                {hasChanges && (
                  <Badge variant="outline" className="bg-amber-50">
                    Unsaved Changes
                  </Badge>
                )}
              </div>

              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => {
                  if (dates) {
                    setSelectedDates(Array.isArray(dates) ? dates : [dates]);
                    setHasChanges(true);
                  }
                }}
                month={viewMonth}
                onMonthChange={setViewMonth}
                className="rounded-md border"
                modifiers={{
                  available: (date) => selectedDates.some((d) => isSameDay(d, date)),
                }}
                modifiersClassNames={{
                  available: 'bg-primary text-primary-foreground',
                }}
              />

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedDates.length} dates selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDates(
                        currentUserAvailability?.availableDates.map((d) => parseISO(d)) || []
                      );
                      setHasChanges(false);
                    }}
                    disabled={!hasChanges}
                  >
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
                    {isSaving ? 'Saving...' : 'Save Availability'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Heat Map View */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Group Consensus</h4>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day) => {
                  const count = getDayAvailabilityCount(day);
                  const percentage = (count / members.length) * 100;

                  return (
                    <div
                      key={day.toString()}
                      className={`aspect-square flex flex-col items-center justify-center rounded text-xs ${
                        count === 0
                          ? 'bg-gray-100 text-gray-400'
                          : percentage >= 80
                            ? 'bg-green-500 text-white'
                            : percentage >= 60
                              ? 'bg-green-400 text-white'
                              : percentage >= 40
                                ? 'bg-amber-400 text-white'
                                : 'bg-amber-200 text-gray-800'
                      }`}
                    >
                      <span className="font-medium">{format(day, 'd')}</span>
                      {count > 0 && <span className="text-[10px]">{count}</span>}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>80%+ available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-amber-400 rounded"></div>
                  <span>40-80% available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>No one available</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Insights & Best Dates */}
          <div className="space-y-4">
            {/* Best Dates */}
            {bestDates.length > 0 && (
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Best Dates</h4>
                </div>
                <div className="space-y-2">
                  {bestDates.slice(0, 5).map(({ date, count, users, percentage }) => (
                    <div key={date} className="p-2 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {format(parseISO(date), 'MMM d, yyyy')}
                        </span>
                        <Badge className="bg-green-600 text-white text-xs">
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {count} of {members.length} available
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Who's Submitted */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Member Status</h4>
              </div>
              <div className="space-y-2">
                {members.map((member) => {
                  const memberAvailability = availability.find((a) => a.userId === member.id);
                  const hasSubmitted =
                    memberAvailability && memberAvailability.availableDates.length > 0;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                      </div>
                      {hasSubmitted ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {memberAvailability.availableDates.length} dates
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Top Consensus Dates */}
            {consensusDates.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold mb-3 text-sm">Top Consensus Dates</h4>
                <div className="space-y-2">
                  {consensusDates.slice(0, 5).map(({ date, count, percentage }) => (
                    <div key={date} className="flex items-center justify-between text-xs">
                      <span>{format(parseISO(date), 'MMM d')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-8 text-right">
                          {count}/{members.length}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">Click dates to toggle your availability</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
