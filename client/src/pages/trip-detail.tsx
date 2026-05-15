import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload, BatchPhotoUpload } from "@/components/file-upload";
import { AppLogo } from "@/components/app-logo";
import { TripDestinationHero } from "@/components/trip-destination-hero";
import { TripMap } from "@/components/trip-map";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, getAuthHeaders } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { saveOfflineTrip, loadOfflineTrip, isTripOfflineEnabled, setTripOfflineEnabled } from "@/lib/offline-trips";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plane,
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Lock,
  Unlock,
  Hotel,
  Utensils,
  Activity,
  Check,
  Copy,
  Loader2,
  Send,
  Plus,
  Bell,
  Image,
  CalendarPlus,
  Cloud,
  FileText,
  Phone,
  BarChart3,
  Sparkles,
  MapPinOff,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  GripVertical,
  AlertTriangle,
  Trash2,
  Search,
  Pin,
  Mail,
} from "lucide-react";
import type { Trip, ItineraryItem, Comment, Vote, Expense, User } from "@shared/schema";

const DEMO_TRIP_ID = "trip-austin-1";

const typeIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Hotel,
  dining: Utensils,
  activity: Activity,
};

const typeColors: Record<string, string> = {
  flight: "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
  hotel: "bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-100",
  dining: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
  activity: "bg-neutral-200 text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200",
};

const statusBadgeColors: Record<string, string> = {
  not_started: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  suggested: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400", // legacy
  in_progress: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
  booking_in_progress: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300", // legacy
  booked: "bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-100",
  cancelled: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500",
};
const bookingStatusLabel: Record<string, string> = {
  not_started: "Not started",
  suggested: "Not started",
  in_progress: "In progress",
  booking_in_progress: "In progress",
  booked: "Booked",
  cancelled: "Cancelled",
};

interface ChatMessageWithUser {
  id: string;
  tripId: string;
  userId: string;
  content: string;
  itemId: string | null;
  createdAt: string;
  user: User;
}

/** Parse message content and render @mentions as highlighted spans. Matches @Name (word or "Word Word") against member names. */
function ChatMessageContent({ content, members }: { content: string; members: { id: string; name: string }[] }) {
  const parts: { type: "text" | "mention"; value: string }[] = [];
  let lastEnd = 0;
  const re = /@([A-Za-z][A-Za-z0-9]*(?:\s+[A-Za-z][A-Za-z0-9]*)*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const full = match[0];
    const namePart = match[1].trim();
    const isMention = members.some((m) => m.name.toLowerCase() === namePart.toLowerCase());
    if (lastEnd < match.index) {
      parts.push({ type: "text", value: content.slice(lastEnd, match.index) });
    }
    parts.push({ type: isMention ? "mention" : "text", value: full });
    lastEnd = re.lastIndex;
  }
  if (lastEnd < content.length) {
    parts.push({ type: "text", value: content.slice(lastEnd) });
  }
  return (
    <span className="text-sm">
      {parts.map((p, i) =>
        p.type === "mention" ? (
          <span key={i} className="font-medium text-primary bg-primary/10 px-1 rounded">
            {p.value}
          </span>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </span>
  );
}

// Open-Meteo WMO weather code → label and icon
const weatherCodeInfo: Record<number, { label: string; icon: typeof Cloud }> = {
  0: { label: "Clear", icon: Sun },
  1: { label: "Mainly clear", icon: Sun },
  2: { label: "Partly cloudy", icon: Cloud },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Fog", icon: Cloud },
  48: { label: "Fog", icon: Cloud },
  51: { label: "Drizzle", icon: CloudRain },
  53: { label: "Drizzle", icon: CloudRain },
  55: { label: "Drizzle", icon: CloudRain },
  61: { label: "Rain", icon: CloudRain },
  63: { label: "Rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  71: { label: "Snow", icon: CloudSnow },
  73: { label: "Snow", icon: CloudSnow },
  75: { label: "Heavy snow", icon: CloudSnow },
  80: { label: "Showers", icon: CloudRain },
  81: { label: "Showers", icon: CloudRain },
  82: { label: "Heavy showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunderstorm", icon: CloudLightning },
  99: { label: "Thunderstorm", icon: CloudLightning },
};

function getWeatherInfo(code: number) {
  return weatherCodeInfo[code] ?? { label: "Unknown", icon: Cloud };
}

/** Cinematic hourly weather card for one day — fetches from Open-Meteo (no API key). */
function DayWeatherCard({ destination, date }: { destination: string; date: string }) {
  const geocodeQuery = useQuery({
    queryKey: ["weather-geocode", destination],
    queryFn: async () => {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`
      );
      const data = await res.json();
      const first = data.results?.[0];
      if (!first?.latitude || !first?.longitude) throw new Error("No location found");
      return { lat: first.latitude as number, lon: first.longitude as number };
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const lat = geocodeQuery.data?.lat;
  const lon = geocodeQuery.data?.lon;

  const weatherQuery = useQuery({
    queryKey: ["weather-hourly", destination, date],
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,precipitation_probability&start=${date}&end=${date}`
      );
      const data = await res.json();
      return data as {
        hourly: {
          time: string[];
          temperature_2m: number[];
          weathercode: number[];
          precipitation_probability?: number[];
        };
      };
    },
    enabled: !!lat && !!lon && !!date,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const hourly = weatherQuery.data?.hourly;
  const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const emptyCardClassName = "mb-6 overflow-hidden border border-border bg-card text-card-foreground shadow-sm";
  const filledCardClassName = "mb-6 overflow-hidden border-0 bg-gradient-to-br from-slate-800/90 via-sky-900/80 to-slate-900/90 dark:from-slate-900/95 dark:via-sky-950/90 dark:to-slate-950 text-white shadow-xl";

  if (geocodeQuery.isLoading || (lat != null && weatherQuery.isLoading)) {
    return (
      <Card className={emptyCardClassName}>
        <CardContent className="p-6 min-h-[120px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading weather for {dayLabel}…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (geocodeQuery.isError || weatherQuery.isError) {
    return (
      <Card className={emptyCardClassName}>
        <CardContent className="p-6 min-h-[120px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <Cloud className="h-8 w-8" />
            <span className="text-sm font-medium">Weather unavailable</span>
            <span className="text-xs">No forecast for {dayLabel}. Try again later.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hourly?.time?.length) {
    return (
      <Card className={emptyCardClassName}>
        <CardContent className="p-6 min-h-[120px] flex flex-col justify-center">
          <div className="flex items-center gap-2 font-medium">
            <Cloud className="h-5 w-5 text-muted-foreground" />
            <span>Hourly forecast — {dayLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Forecast is available within 16 days of travel. Check back closer to your trip date.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Full day broken by hour (every hour)
  const slots = hourly.time.map((time, i) => ({
    time,
    temp: hourly.temperature_2m[i],
    code: hourly.weathercode[i],
    pop: hourly.precipitation_probability?.[i] ?? 0,
  }));

  return (
    <Card className={filledCardClassName}>
      <CardContent className="p-0">
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 text-white/90">
            <Cloud className="h-5 w-5" />
            <span className="font-semibold tracking-wide">Hourly forecast</span>
            <span className="text-white/70 text-sm">— {dayLabel}</span>
          </div>
        </div>
        <div className="flex overflow-x-auto gap-0.5 pb-4 px-4 scrollbar-thin snap-x snap-mandatory">
          {slots.map((slot) => {
            const hour = new Date(slot.time).getHours();
            const ampm = hour % 12 === 0 ? 12 : hour % 12;
            const ampmLabel = hour < 12 ? `${ampm}a` : `${ampm}p`;
            const info = getWeatherInfo(slot.code);
            const Icon = info.icon;
            return (
              <div
                key={slot.time}
                className="flex flex-col items-center justify-center min-w-[56px] py-2.5 px-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors snap-start shrink-0"
              >
                <span className="text-[10px] text-white/70 font-medium">{ampmLabel}</span>
                <Icon className="h-5 w-5 mt-0.5 text-white/90" />
                <span className="text-sm font-bold mt-0.5">{Math.round(slot.temp)}°</span>
                {slot.pop > 0 && (
                  <span className="text-[9px] text-white/50">💧{slot.pop}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-6 pb-4 text-xs text-white/80 space-y-1">
          {slots.some((s) => (s.pop ?? 0) >= 60) ? (
            <p>
              This day has a high chance of rain. Consider moving outdoor‑heavy activities to another day and swapping in
              more indoor options like museums, cafes, or shows.
            </p>
          ) : (
            <p>
              Weather looks fairly stable. It could be a good day to schedule longer outdoor blocks like hikes, beach
              time, or walking tours.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

/** Push reminders button — registers service worker, subscribes via VAPID, and POSTs to backend. */
function PushRemindersButton({ tripId, toast }: { tripId: string; toast: ReturnType<typeof useToast>["toast"] }) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") setEnabled(true);
  }, []);
  const handleClick = async () => {
    setLoading(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast({ title: "Not supported", description: "Push notifications are not supported in this browser.", variant: "destructive" });
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = "Notification" in window ? await Notification.requestPermission() : "denied";
      if (perm !== "granted") {
        toast({ title: "Permission denied", description: "Enable notifications in your browser settings for reminders.", variant: "destructive" });
        return;
      }
      const vapidRes = await fetch("/api/push/vapid-public", { credentials: "include" });
      const { publicKey } = await vapidRes.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const res = await fetch(`/api/trips/${tripId}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setEnabled(true);
      toast({ title: "Reminders enabled", description: "You'll receive push notifications before trip events." });
    } catch (err) {
      toast({ title: "Error", description: "Could not enable push reminders.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") setEnabled(true);
  return (
    <Button variant="outline" size="sm" className="mt-4" onClick={handleClick} disabled={loading || enabled}>
      <Bell className="h-4 w-4 mr-2" />
      {loading ? "Enabling…" : enabled ? "Reminders enabled" : "Enable push reminders"}
    </Button>
  );
}

/** Location sharing card — GPS + map. */
function LocationSharingCard({ tripId, locationSharing, currentUserId }: { tripId: string; locationSharing: { id: string; userId: string; lat: string; lng: string; user: User }[]; currentUserId: string }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const locationRef = useRef<number | null>(null);

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        fetch(`/api/trips/${tripId}/location`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: currentUserId, lat: String(lat), lng: String(lng) }),
        })
          .then((r) => { if (!r.ok) throw new Error("Failed to update"); queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }); })
          .catch(() => setError("Could not save location"));
      },
      () => { setError("Location permission denied"); setSharing(false); if (locationRef.current) clearInterval(locationRef.current); }
    );
  }, [tripId, currentUserId]);

  const enableSharing = () => {
    setError(null);
    setSharing(true);
    updateLocation();
    locationRef.current = window.setInterval(updateLocation, 60_000);
  };

  const disableSharing = () => {
    setSharing(false);
    if (locationRef.current) { clearInterval(locationRef.current); locationRef.current = null; }
  };

  useEffect(() => () => { if (locationRef.current) clearInterval(locationRef.current); }, []);

  const hasLocations = locationSharing.length > 0;
  const latArr = locationSharing.map((l) => parseFloat(l.lat)).filter((n) => !isNaN(n));
  const lngArr = locationSharing.map((l) => parseFloat(l.lng)).filter((n) => !isNaN(n));
  const minLat = latArr.length ? Math.min(...latArr) : 0;
  const maxLat = latArr.length ? Math.max(...latArr) : 0;
  const minLng = lngArr.length ? Math.min(...lngArr) : 0;
  const maxLng = lngArr.length ? Math.max(...lngArr) : 0;
  const pad = 0.01;
  const bbox = hasLocations ? `${minLng - pad},${minLat - pad},${maxLng + pad},${maxLat + pad}` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><MapPinOff className="h-5 w-5 text-primary" /> Real-time location sharing</CardTitle>
        <CardDescription>Optional during-trip location sharing for safety.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">Share your location with the group. Requires browser permission.</p>
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={enableSharing} disabled={sharing || !currentUserId}>Enable location sharing</Button>
          {sharing && <Button variant="ghost" size="sm" onClick={disableSharing}>Stop sharing</Button>}
        </div>
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        {hasLocations && <p className="text-xs text-muted-foreground mb-2">{locationSharing.length} member(s) sharing location.</p>}
        {hasLocations && bbox && (
          <div className="rounded-lg overflow-hidden border aspect-video max-h-[300px]">
            <iframe
              title="Group locations"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`}
              className="w-full h-full"
              loading="lazy"
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {locationSharing.map((l) => (
                <a key={l.id} href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  {l.user?.name ?? "Unknown"} on map
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Local tips for recap — fetches dynamic content from Wikipedia and displays trip-specific guidance. */
function RecapLocalTips({ destination, startDate, endDate }: { destination: string; startDate: string; endDate: string }) {
  const wikiQuery = useQuery({
    queryKey: ["wiki-summary", destination],
    queryFn: async () => {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(destination)}&limit=1&format=json&origin=*`
      );
      const searchData = (await searchRes.json()) as [string, string[], string[], string[]];
      const title = searchData[1]?.[0];
      if (!title) return { extract: null as string | null, title: null as string | null };
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`
      );
      const data = (await res.json()) as { extract?: string; title?: string };
      return { extract: data.extract ?? null, title: data.title ?? null };
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
  const start = new Date(startDate);
  const end = new Date(endDate);
  const monthName = start.toLocaleString("en-US", { month: "long" });
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return (
    <div className="space-y-4">
      {wikiQuery.data?.extract && (
        <p className="text-sm text-muted-foreground leading-relaxed">{wikiQuery.data.extract}</p>
      )}
      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
        <li>Your {dayCount}-day trip is in {monthName} — check seasonal events and packing needs.</li>
        <li>Best times: morning for outdoor activities, afternoon for indoor sights.</li>
        <li>Local transport and peak-hour crowds vary by city — plan buffer time.</li>
      </ul>
      <a href={`https://www.google.com/search?q=best+time+to+visit+${encodeURIComponent(destination)}+things+to+do`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
        <ExternalLink className="h-3 w-3" />
        Search local tips for {destination} →
      </a>
    </div>
  );
}

interface TripDetailData {
  trip: Trip;
  items: ItineraryItem[];
  comments: Record<string, Comment[]>;
  votes: Record<string, { up: number; down: number; abstain: number; userVote?: string }>;
  voteDetails?: Record<string, { userId: string; voteType: string; userName: string }[]>;
  members: (User & { role: string; rsvpStatus?: string; memberId?: string })[];
  expenses: Expense[];
  invites?: { id: string; tripId: string; email: string; status: string }[];
  preferences?: { id: string; tripId: string; userId: string; diet: string | null; budgetFlexibility: string | null; mustDoActivities: string | null; accessibility?: string | null; user: User }[];
  chatMessages?: ChatMessageWithUser[];
  photos?: { id: string; tripId: string; userId: string; url: string; caption: string | null; createdAt: string; user: User }[];
  polls?: { id: string; tripId: string; question: string; options: string[]; deadline?: string | null; status: string; voteCounts: number[]; createdBy: User }[];
  packing?: { id: string; tripId: string; name: string; assignedToUserId?: string | null; notes?: string | null; assignedTo?: User }[];
  transportation?: { id: string; tripId: string; dayNumber: number; type: string; description: string; driverUserId?: string | null; passengerUserIds?: string[]; driver?: User }[];
  groupAvailability?: { id: string; tripId: string; userId: string; availableDates: string[]; user: User }[];
  documents?: { id: string; tripId: string; type: string; name: string; url: string; notes?: string | null; uploadedBy?: User }[];
  emergencyContacts?: { id: string; tripId: string; type: string; name: string; phone?: string | null; url?: string | null; notes?: string | null }[];
  moodBoard?: { id: string; tripId: string; url: string; label: string | null; addedByUserId: string; addedBy?: User }[];
  satisfaction?: { id: string; tripId: string; userId: string; score: number; comment?: string | null; user: User }[];
  locationSharing?: { id: string; tripId: string; userId: string; lat: string; lng: string; user: User }[];
}

function SortableItineraryDay({
  dayItems,
  tripId,
  isLocked,
  isPlanner,
  comments,
  votes,
  voteDetails,
  members,
  groupDietSummary,
  hasAccessibilityPrefs,
  onReorder,
  onDeleteItem,
  onDeleteComment,
}: {
  dayItems: ItineraryItem[];
  tripId: string;
  isLocked: boolean;
  isPlanner: boolean;
  comments: Record<string, Comment[]>;
  votes: Record<string, { up: number; down: number; abstain: number; userVote?: string }>;
  voteDetails: Record<string, { userId: string; voteType: string; userName: string }[]>;
  members: (User & { role: string })[];
  groupDietSummary?: string;
  hasAccessibilityPrefs?: boolean;
  onReorder: (itemIds: string[]) => void;
  onDeleteItem?: (itemId: string) => void;
  onDeleteComment?: (itemId: string, commentId: string) => void;
}) {
  const itemIds = dayItems.map((i) => i.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = (event: { active: { id: unknown }; over: { id: unknown } | null }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(itemIds, oldIndex, newIndex));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {dayItems
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((item) => (
              <SortableItineraryItemInner
                key={item.id}
                item={{ ...item, locked: item.locked ?? undefined } as ItineraryItem & { locked?: boolean; bookedByUserId?: string | null }}
                tripId={tripId!}
                isLocked={isLocked}
                isPlanner={isPlanner}
                comments={comments[item.id] || []}
                votes={votes[item.id] || { up: 0, down: 0, abstain: 0 }}
                voteDetails={voteDetails[item.id]}
                members={members}
                groupDietSummary={groupDietSummary}
                hasAccessibilityPrefs={hasAccessibilityPrefs}
                onDeleteItem={onDeleteItem}
                onDeleteComment={onDeleteComment}
              />
            ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItineraryItemInner(props: Parameters<typeof ItineraryItemCard>[0]) {
  const { item, tripId, isLocked, isPlanner } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !isPlanner || isLocked || !!item.locked,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const canDrag = isPlanner && !isLocked && !item.locked;
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-60" : ""}>
      <div className="relative flex items-start gap-2">
        {canDrag && (
          <div className="flex-shrink-0 mt-4 cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners} title="Drag to reorder">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <ItineraryItemCard {...props} />
        </div>
      </div>
    </div>
  );
}

function ItineraryItemCard({
  item,
  comments,
  votes,
  voteDetails,
  tripId,
  isLocked,
  isPlanner,
  members,
  groupDietSummary,
  hasAccessibilityPrefs,
  onDeleteItem,
  onDeleteComment,
}: {
  item: ItineraryItem & { locked?: boolean; bookedByUserId?: string | null };
  comments: Comment[];
  votes: { up: number; down: number; abstain: number; userVote?: string };
  voteDetails?: { userId: string; voteType: string; userName: string }[];
  tripId: string;
  isLocked: boolean;
  isPlanner: boolean;
  members: (User & { role: string })[];
  groupDietSummary?: string;
  hasAccessibilityPrefs?: boolean;
  onDeleteItem?: (itemId: string) => void;
  onDeleteComment?: (itemId: string, commentId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showVoteBreakdown, setShowVoteBreakdown] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showBookedModal, setShowBookedModal] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [confirmationImageUrl, setConfirmationImageUrl] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ dayNumber: item.dayNumber, type: item.type, time: item.time, name: item.name, description: item.description, location: item.location, pricePerPerson: String(item.pricePerPerson), bookingUrl: item.bookingUrl ?? "" });
  const { user } = useAuth();
  const { toast } = useToast();
  const Icon = typeIcons[item.type] || Activity;

  const voteMutation = useMutation({
    mutationFn: async (voteType: "up" | "down" | "abstain") => {
      return apiRequest("POST", `/api/trips/${tripId}/items/${item.id}/vote`, {
        userId: user?.id,
        voteType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/trips/${tripId}/items/${item.id}/comments`, {
        userId: user?.id,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setNewComment("");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (updates: { bookingStatus?: string; confirmationNumber?: string; confirmationImageUrl?: string; locked?: boolean; bookedByUserId?: string | null }) => {
      return apiRequest("PATCH", `/api/trips/${tripId}/items/${item.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setShowBookedModal(false);
      setConfirmationNumber("");
      setConfirmationImageUrl("");
      toast({
        title: "Booking confirmed",
        description: "Confirmation details saved",
      });
    },
  });

  const editItemMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/trips/${tripId}/items/${item.id}`, {
        dayNumber: editForm.dayNumber,
        type: editForm.type,
        time: editForm.time,
        name: editForm.name,
        description: editForm.description,
        location: editForm.location,
        pricePerPerson: Math.round(parseFloat(editForm.pricePerPerson) || 0),
        bookingUrl: editForm.bookingUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setShowEditModal(false);
      toast({ title: "Item updated", description: "Itinerary item saved." });
    },
  });

  const getBookingUrl = () => {
    if (item.bookingUrl) return item.bookingUrl;
    const base = {
      flight: `https://www.google.com/travel/flights?q=${encodeURIComponent(item.location)}`,
      hotel: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(item.location)}`,
      dining: `https://www.google.com/search?q=${encodeURIComponent(item.name + " restaurant " + item.location)}`,
      activity: `https://www.google.com/search?q=${encodeURIComponent(item.name + " " + item.location)}`,
    };
    return base[item.type as keyof typeof base] || base.activity;
  };

  return (
    <Card className="relative" data-testid={`card-item-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${typeColors[item.type]}`}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
              <h3 className="font-medium truncate">{item.name}</h3>
              <div className="flex items-center gap-2">
                {item.locked && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-0.5" />
                    Locked
                  </Badge>
                )}
                <Badge variant="outline" className={statusBadgeColors[item.bookingStatus] ?? statusBadgeColors.not_started}>
                  {bookingStatusLabel[item.bookingStatus] ?? "Not started"}
                </Badge>
              </div>
            </div>
            {item.bookedByUserId && (
              <p className="text-xs text-muted-foreground mb-1">
                Booking by: {members.find((m) => m.id === item.bookedByUserId)?.name ?? "—"}
              </p>
            )}

            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {item.description}
            </p>

            {item.type === "dining" && groupDietSummary && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                Group dietary preferences: {groupDietSummary}. Confirm restaurant can accommodate.
              </p>
            )}
            {hasAccessibilityPrefs && (
              <p className="text-xs text-muted-foreground mb-2">
                Accessibility considerations noted in group preferences — check venue if needed.
              </p>
            )}

            {item.bookingUrl && (
              <div className="flex items-center gap-1 text-xs mb-2">
                <a href={item.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Booking link
                </a>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.time}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{item.location}</span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs ml-1 hover:underline"
                  title="Get directions"
                >
                  Directions
                </a>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${item.pricePerPerson}/person
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${votes.userVote === "up" ? "text-neutral-700 dark:text-neutral-300" : ""}`}
                  onClick={() => voteMutation.mutate("up")}
                  disabled={isLocked || !!item.locked}
                  data-testid={`button-vote-up-${item.id}`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {votes.up}
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${votes.userVote === "down" ? "text-neutral-600 dark:text-neutral-400" : ""}`}
                  onClick={() => voteMutation.mutate("down")}
                  disabled={isLocked || !!item.locked}
                  data-testid={`button-vote-down-${item.id}`}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {votes.down}
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${votes.userVote === "abstain" ? "text-neutral-600 dark:text-neutral-400" : ""}`}
                  onClick={() => voteMutation.mutate("abstain")}
                  disabled={isLocked || !!item.locked}
                  title="Abstain"
                  data-testid={`button-vote-abstain-${item.id}`}
                >
                  —
                </Button>
                {(votes.abstain ?? 0) > 0 && <span className="text-xs text-muted-foreground px-1">{votes.abstain} abstain</span>}
              </div>
              {voteDetails && voteDetails.length > 0 && (
                <Dialog open={showVoteBreakdown} onOpenChange={setShowVoteBreakdown}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" title="View who voted">
                      Who voted
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Vote breakdown</DialogTitle>
                      <CardDescription>Who voted for: {item.name}</CardDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {voteDetails.map((vd, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                          <span>{vd.userName}</span>
                          <Badge variant={vd.voteType === "up" ? "default" : vd.voteType === "down" ? "destructive" : "secondary"}>
                            {vd.voteType === "up" ? "👍 Yes" : vd.voteType === "down" ? "👎 No" : "— Abstain"}
                          </Badge>
                        </div>
                      ))}
                      {votes.up > (voteDetails.filter((v) => v.voteType === "up").length) && (
                        <p className="text-xs text-muted-foreground">Consensus: {votes.up} Yes, {votes.down} No</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setShowComments(!showComments)}
                data-testid={`button-comments-${item.id}`}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                {comments.length}
              </Button>

              <a href={getBookingUrl()} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-8" data-testid={`button-book-${item.id}`}>
                  Book Now
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </a>

              {isPlanner && (
                <>
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditForm({ dayNumber: item.dayNumber, type: item.type, time: item.time, name: item.name, description: item.description, location: item.location, pricePerPerson: String(item.pricePerPerson), bookingUrl: item.bookingUrl ?? "" }); setShowEditModal(true); }} title="Edit item">
                    Edit
                  </Button>
                  {onDeleteItem && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" title="Delete item">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete itinerary item?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove &quot;{item.name}&quot; and its comments/votes.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDeleteItem?.(item.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => updateStatusMutation.mutate({ locked: !item.locked })}
                    title={item.locked ? "Unlock item" : "Lock item (planner override)"}
                  >
                    {item.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </Button>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    value={item.bookedByUserId ?? ""}
                    onChange={(e) => updateStatusMutation.mutate({ bookedByUserId: e.target.value || null })}
                    title="Who is responsible for booking"
                  >
                    <option value="">Assign booking...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </>
              )}

              {item.bookingStatus !== "booked" && item.bookingStatus !== "cancelled" && !isLocked && !item.locked && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => (item.bookingStatus === "suggested" || item.bookingStatus === "not_started") ? updateStatusMutation.mutate({ bookingStatus: "in_progress" }) : setShowBookedModal(true)}
                  data-testid={`button-status-${item.id}`}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {(item.bookingStatus === "suggested" || item.bookingStatus === "not_started") ? "Mark In Progress" : "Confirm Booked"}
                </Button>
              )}
              {item.bookingStatus === "booked" && (item.confirmationNumber || item.confirmationImageUrl) && (
                <span className="text-xs text-muted-foreground">
                  {item.confirmationNumber && `#${item.confirmationNumber}`}
                </span>
              )}
              {showBookedModal && (
                <Dialog open={showBookedModal} onOpenChange={setShowBookedModal}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Confirm booking</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confirmation number (optional)</label>
                        <Input
                          placeholder="e.g. ABC123"
                          value={confirmationNumber}
                          onChange={(e) => setConfirmationNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confirmation screenshot (optional)</label>
                        <FileUpload
                          endpoint="/api/upload/photo"
                          accept="image/*"
                          maxSizeMB={10}
                          onUploadComplete={(urls) => setConfirmationImageUrl(urls[0] || confirmationImageUrl)}
                          buttonText="Upload screenshot"
                          showPreview={true}
                        />
                        <Input
                          placeholder="Or paste image URL"
                          value={confirmationImageUrl}
                          onChange={(e) => setConfirmationImageUrl(e.target.value)}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => updateStatusMutation.mutate({
                          bookingStatus: "booked",
                          confirmationNumber: confirmationNumber || undefined,
                          confirmationImageUrl: confirmationImageUrl || undefined,
                        })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Save & mark booked
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {showEditModal && (
                <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit item</DialogTitle>
                      <CardDescription>Update itinerary item details.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Day</label>
                          <Input type="number" min={1} value={editForm.dayNumber} onChange={(e) => setEditForm({ ...editForm, dayNumber: parseInt(e.target.value, 10) || 1 })} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Type</label>
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                            <option value="flight">Flight</option>
                            <option value="hotel">Hotel</option>
                            <option value="dining">Dining</option>
                            <option value="activity">Activity</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Time</label>
                        <Input value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Location</label>
                        <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Price per person ($)</label>
                        <Input type="number" value={editForm.pricePerPerson} onChange={(e) => setEditForm({ ...editForm, pricePerPerson: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Booking URL (optional)</label>
                        <Input value={editForm.bookingUrl} onChange={(e) => setEditForm({ ...editForm, bookingUrl: e.target.value })} placeholder="https://..." className="mt-1" />
                      </div>
                      <Button className="w-full" onClick={() => editItemMutation.mutate()} disabled={!editForm.name || !editForm.description || !editForm.location || editItemMutation.isPending}>
                        {editItemMutation.isPending ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {showComments && (
              <div className="mt-4 pt-4 border-t space-y-3">
                {comments.map((comment) => {
                  const canDelete = onDeleteComment && (comment.userId === user?.id || isPlanner);
                  return (
                    <div key={comment.id} className="text-sm flex items-center justify-between gap-2">
                      <span><span className="font-medium">{members.find((m) => m.id === comment.userId)?.name ?? "Unknown"}</span>
                      <span className="text-muted-foreground ml-2">{comment.content}</span></span>
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-destructive hover:text-destructive text-xs">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDeleteComment?.(item.id, comment.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
                {!isLocked && !item.locked && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="h-8"
                      data-testid={`input-comment-${item.id}`}
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => newComment && commentMutation.mutate(newComment)}
                      disabled={!newComment || commentMutation.isPending}
                      data-testid={`button-send-comment-${item.id}`}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExpenseItem({
  expense,
  members,
  tripId,
  onUpdate,
  convert,
  displayCurrency,
}: {
  expense: Expense;
  members: User[];
  tripId: string;
  onUpdate: () => void;
  convert?: (amount: number, from: string, to: string) => number | null;
  displayCurrency?: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState(String(expense.amount));
  const [editDesc, setEditDesc] = useState(expense.description);
  const payer = members.find((m) => m.id === expense.paidByUserId);
  const splitCount = expense.splitAmong.length;
  const perPerson = expense.amount / splitCount;
  const expenseCurrency = (expense as { currency?: string }).currency ?? "USD";
  const convertedAmount = convert && displayCurrency && expenseCurrency !== displayCurrency ? convert(expense.amount, expenseCurrency, displayCurrency) : null;
  const convertedPerPerson = convert && displayCurrency && expenseCurrency !== displayCurrency && splitCount ? (convert(expense.amount, expenseCurrency, displayCurrency) ?? 0) / splitCount : null;
  const { toast } = useToast();
  const settleMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/trips/${tripId}/expenses/${expense.id}`, { isSettled: !expense.isSettled }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }); onUpdate(); toast({ title: expense.isSettled ? "Marked pending" : "Marked settled" }); },
  });
  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/trips/${tripId}/expenses/${expense.id}`, { amount: Math.round(parseFloat(editAmount) || 0), description: editDesc }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }); setEditOpen(false); onUpdate(); toast({ title: "Expense updated" }); },
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/trips/${tripId}/expenses/${expense.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }); onUpdate(); toast({ title: "Expense deleted" }); },
  });

  return (
    <Card data-testid={`card-expense-${expense.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-medium">{expense.description}</div>
            <div className="text-sm text-muted-foreground">
              {payer?.name || "Unknown"} paid {expenseCurrency} {expense.amount.toFixed(2)}
              {convertedAmount != null && displayCurrency && (
                <span className="text-muted-foreground"> (≈ {displayCurrency} {convertedAmount.toFixed(2)})</span>
              )}
              {expense.location && ` at ${expense.location}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Split among {splitCount} people ({expenseCurrency} {perPerson.toFixed(2)}/person
              {convertedPerPerson != null && displayCurrency && ` ≈ ${displayCurrency} ${convertedPerPerson.toFixed(2)}`})
            </div>
            {(expense as Expense & { receiptImageUrl?: string | null }).receiptImageUrl && (
              <a href={(expense as Expense & { receiptImageUrl?: string }).receiptImageUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                <img src={(expense as Expense & { receiptImageUrl?: string }).receiptImageUrl} alt="Receipt" className="h-20 rounded border object-cover hover:opacity-90" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={expense.isSettled ? "outline" : "default"}>
              {expense.isSettled ? "Settled" : "Pending"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => { setEditAmount(String(expense.amount)); setEditDesc(expense.description); setEditOpen(true); }}>Edit</Button>
            <Button variant="ghost" size="sm" onClick={() => settleMutation.mutate()} disabled={settleMutation.isPending}>
              {expense.isSettled ? "Mark pending" : "Mark settled"}
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </div>
      </CardContent>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    currency: "USD",
    description: "",
    location: "",
    itemId: "",
    receiptImageUrl: "",
  });
  const [expenseSplitMemberIds, setExpenseSplitMemberIds] = useState<string[]>([]);
  const [expenseDisplayCurrency, setExpenseDisplayCurrency] = useState("USD");
  const { convert: convertCurrency, isLoading: ratesLoading } = useExchangeRates();
  const [chatInput, setChatInput] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState<{ start: number; end: number } | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const [prefForm, setPrefForm] = useState({ budgetBand: "", pace: "", diet: "", budgetFlexibility: "", mustDoActivities: "", accessibility: "" });
  const [photoForm, setPhotoForm] = useState({ url: "", caption: "" });
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [pollForm, setPollForm] = useState<{ question: string; options: string[] }>({ question: "", options: ["", ""] });
  const [packingForm, setPackingForm] = useState({ name: "", assignedToUserId: "" });
  const [transportForm, setTransportForm] = useState({ dayNumber: 1, type: "drive", description: "", driverUserId: "" });
  const [availabilityDates, setAvailabilityDates] = useState<string[]>([]);
  const [availabilityDateToAdd, setAvailabilityDateToAdd] = useState("");
  const [voteDeadlineEdit, setVoteDeadlineEdit] = useState<string>("");
  const [docForm, setDocForm] = useState({ type: "boarding_pass", name: "", url: "", notes: "", expiryDate: "" });
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({ type: "embassy", name: "", phone: "", url: "", notes: "" });
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [emergencyEditId, setEmergencyEditId] = useState<string | null>(null);
  const [emergencyEditForm, setEmergencyEditForm] = useState({ type: "embassy", name: "", phone: "", url: "", notes: "" });
  const [planningChatInput, setPlanningChatInput] = useState("");
  const [planningSuggestion, setPlanningSuggestion] = useState<string | null>(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [budgetOptimizeLoading, setBudgetOptimizeLoading] = useState(false);
  const [budgetOptimizeResult, setBudgetOptimizeResult] = useState<string | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [chatTabActive, setChatTabActive] = useState(false);
  const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null);
  const [personalizedView, setPersonalizedView] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemForm, setAddItemForm] = useState({ dayNumber: 1, type: "activity", time: "09:00", name: "", description: "", location: "", pricePerPerson: "0", bookingUrl: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [moodBoardForm, setMoodBoardForm] = useState({ url: "", label: "" });
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");
  const [placeSearchResults, setPlaceSearchResults] = useState<{ id: string; name: string; lat: number; lng: number; type: string }[]>([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [recapLoading, setRecapLoading] = useState(false);
  const [emailImportText, setEmailImportText] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<{ name: string; description: string; location: string; type: string; dayNumber: number; time: string; pricePerPerson?: number }[]>([]);
  const [emailImportLoading, setEmailImportLoading] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(false);

  const { user: currentUser, isPro } = useAuth();
  // Any user can view the demo trip via the demo endpoint (no membership required)
  const useDemoEndpoint = tripId === DEMO_TRIP_ID;

  const { data, isLoading, error } = useQuery<TripDetailData>({
    queryKey: useDemoEndpoint ? ["/api/demo/trip", currentUser?.id] : ["/api/trips", tripId, currentUser?.id],
    queryFn: async () => {
      const url = useDemoEndpoint ? "/api/demo/trip" : `/api/trips/${tripId}`;
      const headers = getAuthHeaders();
      try {
        const res = await fetch(url, {
          headers,
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text();
          let errorMessage = text || `HTTP ${res.status}`;
          try {
            const errorJson = JSON.parse(text);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            // Use text as-is if not JSON
          }
          throw new Error(errorMessage);
        }
        const json = (await res.json()) as TripDetailData;
        if (tripId) {
          void saveOfflineTrip(tripId, json);
        }
        return json;
      } catch (err) {
        if (tripId) {
          const offline = await loadOfflineTrip<TripDetailData>(tripId);
          if (offline) return offline;
        }
        throw err;
      }
    },
    enabled: !!tripId && !!currentUser?.id,
    retry: false,
  });

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    (async () => {
      try {
        const enabled = await isTripOfflineEnabled(tripId);
        if (!cancelled) setOfflineEnabled(enabled);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const updateTripMutation = useMutation({
    mutationFn: async (updates: { voteDeadline?: string | null }) => {
      return apiRequest("PATCH", `/api/trips/${tripId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Trip updated", description: "Decision deadline saved." });
    },
  });

  const cancelTripMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/trips/${tripId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Trip cancelled" });
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/trips/${tripId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      window.location.href = "/dashboard";
      toast({ title: "Trip deleted" });
    },
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/trips/${tripId}`, {
        isLocked: !data?.trip.isLocked,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({
        title: data?.trip.isLocked ? "Trip unlocked" : "Trip locked",
        description: data?.trip.isLocked
          ? "Members can now vote and comment"
          : "The itinerary is now locked",
      });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      const allMemberIds = data?.members.map((m) => m.id) || [];
      const splitAmong =
        expenseSplitMemberIds.length > 0
          ? expenseSplitMemberIds
          : allMemberIds.length > 0
          ? allMemberIds
          : user?.id
          ? [user.id]
          : [];

      return apiRequest("POST", `/api/trips/${tripId}/expenses`, {
        paidByUserId: user?.id,
        amount: Math.round(parseFloat(expenseForm.amount) || 0),
        currency: expenseForm.currency,
        description: expenseForm.description,
        location: expenseForm.location,
        itemId: expenseForm.itemId || undefined,
        receiptImageUrl: expenseForm.receiptImageUrl || undefined,
        splitAmong,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setNewExpenseOpen(false);
      setExpenseForm({ amount: "", currency: "USD", description: "", location: "", itemId: "", receiptImageUrl: "" });
      setExpenseSplitMemberIds([]);
      toast({
        title: "Expense added",
        description: "The expense has been recorded",
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/trips/${tripId}/regenerate-itinerary`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Regenerating itinerary", description: "AI is creating a new plan from everyone's preferences." });
    },
    onError: (error: Error & { upgradeUrl?: string }) => {
      if (error.upgradeUrl) {
        toast({ title: "Pro feature", description: error.message, variant: "destructive", action: <Link href="/pricing?checkout=pro"><a className="text-sm font-medium underline">Upgrade</a></Link> });
      } else {
        toast({ title: "Failed to regenerate", description: error.message, variant: "destructive" });
      }
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      return apiRequest("POST", `/api/trips/${tripId}/itinerary/reorder`, { itemIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Order updated", description: "Itinerary order saved." });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", `/api/trips/${tripId}/invites`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setInviteEmail("");
      toast({ title: "Invite sent", description: "The invite will be sent to the email address." });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => apiRequest("DELETE", `/api/trips/${tripId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Member removed" });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) =>
      apiRequest("PATCH", `/api/trips/${tripId}/members/${memberId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Role updated" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ itemId, commentId }: { itemId: string; commentId: string }) =>
      apiRequest("DELETE", `/api/trips/${tripId}/items/${itemId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Comment deleted" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => apiRequest("DELETE", `/api/trips/${tripId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Item deleted" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/trips/${tripId}/items`, {
        dayNumber: addItemForm.dayNumber,
        type: addItemForm.type,
        time: addItemForm.time,
        name: addItemForm.name,
        description: addItemForm.description,
        location: addItemForm.location,
        pricePerPerson: Math.round(parseFloat(addItemForm.pricePerPerson) || 0),
        bookingUrl: addItemForm.bookingUrl || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setAddItemOpen(false);
      setAddItemForm({ dayNumber: 1, type: "activity", time: "09:00", name: "", description: "", location: "", pricePerPerson: "0", bookingUrl: "" });
      toast({ title: "Item added", description: "Itinerary item added." });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/trips/${tripId}/chat`, {
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setChatInput("");
    },
  });

  const createPollMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/trips/${tripId}/polls`, {
        question: pollForm.question,
        options: pollForm.options.map((o) => o.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setPollForm({ question: "", options: ["", ""] });
      toast({ title: "Poll created", description: "Group can vote now." });
    },
  });

  const votePollMutation = useMutation({
    mutationFn: async ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => {
      return apiRequest("POST", `/api/trips/${tripId}/polls/${pollId}/vote`, { optionIndex });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }),
  });

  const addDocumentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/trips/${tripId}/documents`, {
        uploadedByUserId: user?.id,
        type: docForm.type,
        name: docForm.name,
        url: docForm.url,
        notes: docForm.notes || undefined,
        expiryDate: docForm.expiryDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setDocDialogOpen(false);
      setDocForm({ type: "boarding_pass", name: "", url: "", notes: "", expiryDate: "" });
      toast({ title: "Document added" });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ docId, updates }: { docId: string; updates: { name?: string; expiryDate?: string | null } }) =>
      apiRequest("PATCH", `/api/trips/${tripId}/documents/${docId}`, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => apiRequest("DELETE", `/api/trips/${tripId}/documents/${docId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }),
  });

  const addEmergencyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/trips/${tripId}/emergency-contacts`, {
        type: emergencyForm.type,
        name: emergencyForm.name,
        phone: emergencyForm.phone || undefined,
        url: emergencyForm.url || undefined,
        notes: emergencyForm.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setEmergencyDialogOpen(false);
      setEmergencyForm({ type: "embassy", name: "", phone: "", url: "", notes: "" });
      toast({ title: "Emergency contact added" });
    },
  });

  const updateEmergencyMutation = useMutation({
    mutationFn: async ({ contactId, updates }: { contactId: string; updates: { type?: string; name?: string; phone?: string | null; url?: string | null; notes?: string | null } }) =>
      apiRequest("PATCH", `/api/trips/${tripId}/emergency-contacts/${contactId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setEmergencyEditId(null);
      toast({ title: "Contact updated" });
    },
  });

  const deleteEmergencyMutation = useMutation({
    mutationFn: async (contactId: string) => apiRequest("DELETE", `/api/trips/${tripId}/emergency-contacts/${contactId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Contact removed" });
    },
  });

  const satisfactionMutation = useMutation({
    mutationFn: async (score: number) => {
      return apiRequest("POST", `/api/trips/${tripId}/satisfaction`, { score });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Thanks! Your rating was saved." });
    },
  });

  const addPackingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/trips/${tripId}/packing`, {
        name: packingForm.name,
        assignedToUserId: packingForm.assignedToUserId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setPackingForm({ name: "", assignedToUserId: "" });
      toast({ title: "Packing item added" });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => apiRequest("DELETE", `/api/trips/${tripId}/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Photo removed" });
    },
  });

  const deletePollMutation = useMutation({
    mutationFn: async (pollId: string) => apiRequest("DELETE", `/api/trips/${tripId}/polls/${pollId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Poll deleted" });
    },
  });

  const deleteTransportMutation = useMutation({
    mutationFn: async (entryId: string) => apiRequest("DELETE", `/api/trips/${tripId}/transportation/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Transportation removed" });
    },
  });

  const deletePackingMutation = useMutation({
    mutationFn: async (itemId: string) => apiRequest("DELETE", `/api/trips/${tripId}/packing/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Packing item removed" });
    },
  });

  const togglePackingMutation = useMutation({
    mutationFn: async ({ itemId, packed }: { itemId: string; packed: boolean }) =>
      apiRequest("PATCH", `/api/trips/${tripId}/packing/${itemId}`, { packed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }),
  });

  const addTransportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/trips/${tripId}/transportation`, {
        dayNumber: transportForm.dayNumber,
        type: transportForm.type,
        description: transportForm.description,
        driverUserId: transportForm.driverUserId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setTransportForm({ dayNumber: 1, type: "drive", description: "", driverUserId: "" });
      toast({ title: "Transportation added" });
    },
  });

  const setAvailabilityMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/trips/${tripId}/availability`, { availableDates: availabilityDates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Availability saved", description: "Find dates that work for everyone." });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ memberId, rsvpStatus }: { memberId: string; rsvpStatus: string }) => {
      return apiRequest("PATCH", `/api/trips/${tripId}/members/${memberId}`, { rsvpStatus });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] }),
  });

  const addPhotoMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/trips/${tripId}/photos`, {
        url: photoForm.url,
        caption: photoForm.caption || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setPhotoDialogOpen(false);
      setPhotoForm({ url: "", caption: "" });
      toast({ title: "Photo added", description: "Added to shared album." });
    },
    onError: (error: Error & { upgradeUrl?: string }) => {
      if (error.upgradeUrl) {
        toast({ title: "Photo limit reached", description: error.message, variant: "destructive", action: <Link href="/pricing?checkout=pro"><a className="text-sm font-medium underline">Upgrade</a></Link> });
      } else {
        toast({ title: "Failed to add photo", description: error.message, variant: "destructive" });
      }
    },
  });

  const addMoodBoardMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/trips/${tripId}/mood-board`, { url: moodBoardForm.url, label: moodBoardForm.label || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setMoodBoardForm({ url: "", label: "" });
      toast({ title: "Added to mood board", description: "Pin saved." });
    },
  });

  const deleteMoodBoardMutation = useMutation({
    mutationFn: async (itemId: string) => apiRequest("DELETE", `/api/trips/${tripId}/mood-board/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Removed", description: "Pin removed from mood board." });
    },
  });

  const generateRecapMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/generate-recap`, { method: "POST", headers: getAuthHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Recap generated", description: "Your trip recap is ready." });
    },
  });

  const generatePackingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/generate-packing-list`, { method: "POST", headers: getAuthHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate");
      return res.json();
    },
    onSuccess: (result: { items?: unknown[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Packing list generated", description: `${result?.items?.length ?? 0} items added.` });
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/trips/${tripId}/preferences`, {
        budgetBand: prefForm.budgetBand || null,
        pace: prefForm.pace || null,
        diet: prefForm.diet || null,
        budgetFlexibility: prefForm.budgetFlexibility || null,
        mustDoActivities: prefForm.mustDoActivities || null,
        accessibility: prefForm.accessibility || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Preferences saved", description: "Your preferences have been saved." });
    },
  });

  useEffect(() => {
    const prefs = data?.preferences?.find((p) => p.userId === user?.id);
    if (prefs) setPrefForm({
      budgetBand: (prefs as { budgetBand?: string }).budgetBand ?? "",
      pace: (prefs as { pace?: string }).pace ?? "",
      diet: prefs.diet ?? "",
      budgetFlexibility: prefs.budgetFlexibility ?? "",
      mustDoActivities: prefs.mustDoActivities ?? "",
      accessibility: (prefs as { accessibility?: string }).accessibility ?? "",
    });
  }, [data?.preferences, user?.id]);

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/join/${data?.trip.shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share this private join link with your group members.",
    });
  };

  const sharePublicTrip = () => {
    const publicUrl = `${window.location.origin}/t/${data?.trip.shareCode}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${data?.trip.destination} trip – planned in TripSync`,
          text: "Check out this itinerary I planned with TripSync.",
          url: publicUrl,
        })
        .catch(() => {
          // ignore
        });
    } else {
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Public link copied",
        description: "Share this link on social or with friends.",
      });
    }
  };

  const handlePlanningChat = async () => {
    if (!planningChatInput.trim()) return;
    setPlanningLoading(true);
    setPlanningSuggestion(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/planning-chat`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ userMessage: planningChatInput.trim() }),
      });
      const data = await res.json();
      setPlanningSuggestion(data.suggestion ?? "No suggestion.");
    } catch {
      setPlanningSuggestion("Something went wrong. Try again.");
    } finally {
      setPlanningLoading(false);
    }
  };

  const doPlaceSearch = async () => {
    const query = placeSearchQuery.trim() || trip.destination;
    if (!query) return;
    setPlaceSearchLoading(true);
    setPlaceSearchResults([]);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}&near=${encodeURIComponent(trip.destination)}`, { headers: getAuthHeaders(), credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && (data as { upgradeUrl?: string }).upgradeUrl) {
          toast({ title: "Pro feature", description: "Place discovery is included in TripSync Pro.", variant: "destructive", action: <Link href="/pricing?checkout=pro"><a className="text-sm font-medium underline">Upgrade</a></Link> });
        } else {
          toast({ title: "Search failed", description: (data as { error?: string }).error || "Could not search places.", variant: "destructive" });
        }
        setPlaceSearchResults([]);
      } else {
        setPlaceSearchResults(data.places ?? []);
      }
    } catch {
      toast({ title: "Search failed", description: "Could not search places.", variant: "destructive" });
    } finally {
      setPlaceSearchLoading(false);
    }
  };

  const addPlaceToItinerary = async (place: { id: string; name: string; lat: number; lng: number; type: string }) => {
    try {
      await apiRequest("POST", `/api/trips/${tripId}/items`, {
        dayNumber: 1,
        type: "activity",
        time: "12:00",
        name: place.name,
        description: "Discovered place – add details as needed",
        location: place.name,
        pricePerPerson: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Added to itinerary", description: `${place.name} added as Day 1 activity.` });
    } catch {
      toast({ title: "Failed to add", description: "You may need planner access.", variant: "destructive" });
    }
  };

  const doEmailImport = async () => {
    if (!emailImportText.trim()) return;
    setEmailImportLoading(true);
    setEmailSuggestions([]);
    try {
      const res = await fetch(`/api/trips/${tripId}/parse-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ emailText: emailImportText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && (data as { upgradeUrl?: string }).upgradeUrl) {
          toast({ title: "Pro feature", description: "Email import is included in TripSync Pro.", variant: "destructive", action: <Link href="/pricing?checkout=pro"><a className="text-sm font-medium underline">Upgrade</a></Link> });
        } else {
          toast({ title: "Import failed", description: (data as { error?: string }).error || "Import failed.", variant: "destructive" });
        }
      } else {
        setEmailSuggestions(data.suggestions ?? []);
        if ((data.suggestions ?? []).length === 0) toast({ title: "No items found", description: "Try pasting a confirmation email with flight/hotel details.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setEmailImportLoading(false);
    }
  };

  const addEmailSuggestionToItinerary = async (s: { name: string; description: string; location: string; type: string; dayNumber: number; time: string; pricePerPerson?: number }) => {
    try {
      await apiRequest("POST", `/api/trips/${tripId}/items`, {
        dayNumber: s.dayNumber,
        type: s.type,
        time: s.time,
        name: s.name,
        description: s.description,
        location: s.location,
        pricePerPerson: s.pricePerPerson ?? 0,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setEmailSuggestions((prev) => prev.filter((x) => x !== s));
      toast({ title: "Added", description: `${s.name} added to itinerary.` });
    } catch {
      toast({ title: "Failed to add", variant: "destructive" });
    }
  };

  // Sync satisfaction score with existing user rating (must be before any early returns)
  useEffect(() => {
    if (!data?.satisfaction || !currentUser?.id) return;
    const mine = data.satisfaction.find((s: { userId: string }) => s.userId === currentUser.id);
    if (mine) setSatisfactionScore((mine as { score: number }).score);
  }, [data?.satisfaction, currentUser?.id]);

  useEffect(() => {
    if (!data?.groupAvailability || !currentUser?.id) return;
    const mine = data.groupAvailability.find((a: { userId: string }) => a.userId === currentUser.id);
    if (mine && (mine as { availableDates?: string[] }).availableDates?.length) {
      setAvailabilityDates((mine as { availableDates: string[] }).availableDates);
    }
  }, [data?.groupAvailability, currentUser?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 glass-header">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show error only if query has completed and failed, or if user is loaded but no data
  if ((error || (!isLoading && !data)) && currentUser?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Trip not found</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || "This trip may have been deleted or you don't have access."}
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen bg-background" />;
  const { trip, items, comments, votes, voteDetails = {}, members, expenses, invites = [], chatMessages = [], preferences = [], photos = [], documents = [], emergencyContacts = [], moodBoard: moodBoardList = [], satisfaction = [], locationSharing = [], polls: pollsList = [], packing: packingList = [], transportation: transportationList = [], groupAvailability: groupAvailabilityList = [] } = data;

  // Unread chat count: compare last message id to stored lastRead
  const chatUnreadCount = (() => {
    if (typeof window === "undefined" || !tripId) return 0;
    const lastRead = localStorage.getItem(`chat-last-read-${tripId}`);
    const latestId = chatMessages[chatMessages.length - 1]?.id;
    if (!latestId) return 0;
    if (!lastRead) return chatMessages.length;
    const lastReadIdx = chatMessages.findIndex((m) => m.id === lastRead);
    if (lastReadIdx === -1) return chatMessages.length;
    return Math.max(0, chatMessages.length - lastReadIdx - 1);
  })();
  const isOrganizer = trip.organizerId === user?.id;
  const isPlanner = members.find((m) => m.id === user?.id)?.role === "planner";
  const hasPreferences = preferences.length > 0;
  const myPreference = preferences.find((p) => p.userId === user?.id);

  // Settlement: who owes whom
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m.id] = 0));
  expenses.forEach((e) => {
    const perPerson = e.amount / e.splitAmong.length;
    balances[e.paidByUserId] = (balances[e.paidByUserId] ?? 0) + e.amount;
    e.splitAmong.forEach((id: string) => {
      balances[id] = (balances[id] ?? 0) - perPerson;
    });
  });
  const settlementSummary: { from: string; to: string; amount: number }[] = [];
  const sortedIds = Object.keys(balances).filter((id) => Math.abs(balances[id]) > 0.01);
  const debtors = sortedIds.filter((id) => balances[id] < 0).sort((a, b) => balances[a] - balances[b]);
  const creditors = sortedIds.filter((id) => balances[id] > 0).sort((a, b) => balances[b] - balances[a]);
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const fromId = debtors[i];
    const toId = creditors[j];
    const amount = Math.min(-balances[fromId], balances[toId]);
    if (amount > 0.01) settlementSummary.push({ from: fromId, to: toId, amount });
    balances[fromId] += amount;
    balances[toId] -= amount;
    if (balances[fromId] >= -0.01) i++;
    if (balances[toId] <= 0.01) j++;
  }

  const itemsByDay = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    if (!acc[item.dayNumber]) acc[item.dayNumber] = [];
    acc[item.dayNumber].push(item);
    return acc;
  }, {});

  // Personalized daily agenda: filter items by current user's interests (mustDo, type)
  const personalizedItems = personalizedView && myPreference
    ? items.filter((item) => {
        const mustDo = (myPreference as { mustDoActivities?: string }).mustDoActivities?.toLowerCase() ?? "";
        const diet = myPreference.diet?.toLowerCase() ?? "";
        const matchMustDo = !mustDo || mustDo.split(/[\s,]+/).some((word) => word.length > 2 && (item.name.toLowerCase().includes(word) || item.description.toLowerCase().includes(word)));
        const matchDining = item.type === "dining" ? (!diet || diet.split(/[\s,]+/).some((w) => w.length > 2 && (item.name.toLowerCase().includes(w) || item.description.toLowerCase().includes(w)))) : true;
        return matchMustDo && matchDining;
      })
    : items;
  const personalizedItemsByDay = personalizedView
    ? personalizedItems.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
        if (!acc[item.dayNumber]) acc[item.dayNumber] = [];
        acc[item.dayNumber].push(item);
        return acc;
      }, {})
    : itemsByDay;

  // All trip day numbers (1..N) for itinerary + weather cards
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);
  const numTripDays = Math.max(1, Math.round((tripEnd.getTime() - tripStart.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  const allTripDayNumbers = Array.from({ length: numTripDays }, (_, i) => i + 1);

  const now = new Date();
  const todayDayNum =
    now >= tripStart && now <= tripEnd
      ? Math.floor((now.getTime() - tripStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
      : null;
  const todayItems = todayDayNum != null ? (itemsByDay[todayDayNum] ?? []).sort((a, b) => a.time.localeCompare(b.time)) : [];

  const bookedCount = items.filter((i) => i.bookingStatus === "booked").length;
  const progressPercent = items.length > 0 ? (bookedCount / items.length) * 100 : 0;

  const groupDiets = Array.from(new Set(preferences.map((p) => p.diet).filter(Boolean))) as string[];
  const groupDietSummary = groupDiets.length ? groupDiets.join(", ") : undefined;
  const hasAccessibilityPrefs = preferences.some((p) => (p as { accessibility?: string }).accessibility);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetTotal = trip.budgetPerPerson * trip.groupSize;
  const itineraryEstimatedTotal = items.reduce((sum, i) => sum + i.pricePerPerson * trip.groupSize, 0);
  const daysUntilTrip = Math.ceil((new Date(trip.startDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const unbookedCount = items.filter((i) => i.bookingStatus !== "booked" && i.bookingStatus !== "cancelled").length;
  const showBookingReminder = unbookedCount > 0 && daysUntilTrip >= 0 && daysUntilTrip <= 7;
  const showBudgetAlert = itineraryEstimatedTotal > budgetTotal;

  // Smart scheduling: same-day overlapping times (simple: same day, time A end > time B start)
  const schedulingConflicts: { day: number; a: ItineraryItem; b: ItineraryItem }[] = [];
  Object.entries(itemsByDay).forEach(([dayStr, dayItems]) => {
    const sorted = [...dayItems].sort((a, b) => a.time.localeCompare(b.time));
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const aEnd = (a as ItineraryItem & { endTime?: string }).endTime || a.time;
      if (aEnd.localeCompare(b.time) > 0) schedulingConflicts.push({ day: parseInt(dayStr, 10), a, b });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>

          <Link href="/" className="flex items-center gap-2 no-underline text-foreground hover:opacity-90 transition-opacity">
            <AppLogo className="h-8 w-8 object-contain" />
            <span className="font-semibold hidden sm:block">TripSync</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isOrganizer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => lockMutation.mutate()}
                data-testid="button-lock-trip"
              >
                {trip.isLocked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-1" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-1" />
                    Lock
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={copyShareLink} data-testid="button-share">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            {isOrganizer && trip.status !== "cancelled" && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700">Cancel trip</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
                      <AlertDialogDescription>Trips can be marked as cancelled. Members will be notified.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={() => cancelTripMutation.mutate()}>Cancel trip</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Delete trip</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this trip permanently?</AlertDialogTitle>
                      <AlertDialogDescription>This will remove the trip and all its data. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTripMutation.mutate()}>Delete permanently</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </header>

      <TripDestinationHero destination={trip.destination ?? ""} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-trip-destination">
                {(trip as Trip & { title?: string }).title || trip.destination}
              </h1>
              {(trip as Trip & { title?: string }).title && (
                <p className="text-sm text-muted-foreground mb-1">{trip.destination}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" - "}
                  {new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {members.length}/{trip.groupSize} members
                  <Badge variant="outline" className="text-xs font-normal">
                    {isOrganizer ? "Organizer" : isPlanner ? "Planner" : "Member"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ${trip.budgetPerPerson}/person
                </div>
              </div>
            </div>
            {trip.isLocked && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {trip.vibes.map((vibe) => (
              <Badge key={vibe} variant="outline">
                {vibe}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booking progress</span>
              <span className="font-medium">{bookedCount}/{items.length} items booked</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget vs actual</p>
                  <p className="text-xl font-bold">${totalSpent.toFixed(0)} of ${budgetTotal} spent</p>
                </div>
                <Progress value={Math.min(100, (totalSpent / budgetTotal) * 100)} className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>

          {showBookingReminder && (
            <Card className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Automatic booking reminder</p>
                  <p className="text-sm text-muted-foreground">You have {unbookedCount} unbooked item{unbookedCount !== 1 ? "s" : ""}, trip is in {daysUntilTrip} days.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => (document.querySelector('[data-testid="tab-itinerary"]') as HTMLElement)?.click()}>View itinerary</Button>
              </CardContent>
            </Card>
          )}

          {showBudgetAlert && (
            <Card className="mt-4 border-destructive/30 bg-destructive/10">
              <CardContent className="p-4">
                <p className="font-medium text-destructive">Budget alert</p>
                <p className="text-sm text-muted-foreground">Estimated itinerary total (${itineraryEstimatedTotal.toFixed(0)}) exceeds group budget (${budgetTotal}). Consider trimming or adjusting.</p>
              </CardContent>
            </Card>
          )}

          {schedulingConflicts.length > 0 && (
            <Card className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
              <CardContent className="p-4">
                <p className="font-medium">Smart scheduling: possible conflict</p>
                <p className="text-sm text-muted-foreground">Day {schedulingConflicts[0].day}: &quot;{schedulingConflicts[0].a.name}&quot; may overlap with &quot;{schedulingConflicts[0].b.name}&quot;. Check times.</p>
              </CardContent>
            </Card>
          )}

          <Card className="mt-4 border-muted">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Decision deadline</p>
              {trip.voteDeadline ? (
                <p className="text-sm text-muted-foreground">Voting auto-locks after {new Date(trip.voteDeadline).toLocaleDateString()}.</p>
              ) : (
                <p className="text-sm text-muted-foreground">Set a date to auto-lock voting and force decisions.</p>
              )}
              {isOrganizer && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    className="w-40"
                    value={voteDeadlineEdit || (trip.voteDeadline ?? "").slice(0, 10) || ""}
                    onChange={(e) => setVoteDeadlineEdit(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const val = voteDeadlineEdit || (trip.voteDeadline ?? "").slice(0, 10);
                      updateTripMutation.mutate({ voteDeadline: val || null });
                    }}
                    disabled={updateTripMutation.isPending}
                  >
                    {trip.voteDeadline ? "Update deadline" : "Set deadline"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="itinerary" onValueChange={(v) => { if (v === "chat" && data) { const latest = data.chatMessages?.[data.chatMessages.length - 1]; if (latest) localStorage.setItem(`chat-last-read-${tripId}`, latest.id); setChatTabActive(true); } else setChatTabActive(false); }}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="itinerary" data-testid="tab-itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map">Map</TabsTrigger>
            <TabsTrigger value="discover" data-testid="tab-discover">Discover</TabsTrigger>
            <TabsTrigger value="mood" data-testid="tab-mood">Mood Board</TabsTrigger>
            {todayDayNum != null && (
              <TabsTrigger value="today" data-testid="tab-today">Today</TabsTrigger>
            )}
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat" className="relative">
              Chat
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground px-1">
                  {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
            <TabsTrigger value="recap" data-testid="tab-recap">Recap & photos</TabsTrigger>
            <TabsTrigger value="coordination" data-testid="tab-coordination">Coordination</TabsTrigger>
            <TabsTrigger value="safety" data-testid="tab-safety">Safety & docs</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            {isPro ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Trip map
                  </CardTitle>
                  <CardDescription>
                    Destination and itinerary locations. Pins for items with a location may take a moment to load.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TripMap
                    destination={trip.destination}
                    items={items.map((i) => ({ name: i.name, location: i.location, dayNumber: i.dayNumber, time: i.time }))}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Trip map
                  </CardTitle>
                  <CardDescription>
                    Interactive map view is a Pro feature. Upgrade to see destinations and itinerary on the map.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/pricing?checkout=pro"><a className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />Upgrade to Pro</a></Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="discover" className="space-y-4">
            {isPro ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Place discovery
                </CardTitle>
                <CardDescription>
                  Search for restaurants, attractions, and places near your destination. Add them to your itinerary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder={`Search in ${trip.destination} (e.g. restaurants, museums)`}
                    value={placeSearchQuery}
                    onChange={(e) => setPlaceSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), doPlaceSearch())}
                    className="max-w-md"
                  />
                  <Button onClick={doPlaceSearch} disabled={placeSearchLoading}>
                    {placeSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </Button>
                </div>
                {placeSearchResults.length > 0 && (
                  <ul className="space-y-2 border rounded-lg p-3 divide-y">
                    {placeSearchResults.map((place) => (
                      <li key={place.id} className="flex items-center justify-between gap-2 pt-2 first:pt-0">
                        <div>
                          <p className="font-medium">{place.name}</p>
                          <p className="text-xs text-muted-foreground">{place.type}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addPlaceToItinerary(place)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to itinerary
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            ) : (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> Place discovery</CardTitle>
                  <CardDescription>Place discovery is a Pro feature. Upgrade to search and add places to your itinerary.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild><Link href="/pricing?checkout=pro"><a className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />Upgrade to Pro</a></Link></Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mood" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pin className="h-5 w-5 text-primary" />
                  Group mood board
                </CardTitle>
                <CardDescription>
                  Pin inspiration images and ideas. Pinterest-style visual planning for the group.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Input placeholder="Image URL" value={moodBoardForm.url} onChange={(e) => setMoodBoardForm((p) => ({ ...p, url: e.target.value }))} className="max-w-xs" />
                  <Input placeholder="Label (optional)" value={moodBoardForm.label} onChange={(e) => setMoodBoardForm((p) => ({ ...p, label: e.target.value }))} className="max-w-xs" />
                  <Button onClick={() => addMoodBoardMutation.mutate()} disabled={!moodBoardForm.url || addMoodBoardMutation.isPending}>
                    {addMoodBoardMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add pin
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {moodBoardList.map((pin: { id: string; url: string; label: string | null; addedBy?: User }) => (
                    <div key={pin.id} className="rounded-lg overflow-hidden border bg-muted/30 relative group">
                      <a href={pin.url} target="_blank" rel="noopener noreferrer" className="block aspect-square">
                        <img src={pin.url} alt={pin.label ?? "Mood pin"} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50' y='50' fill='%23999' text-anchor='middle' dy='.3em' font-size='10'%3EPin%3C/text%3E%3C/svg%3E"; }} />
                      </a>
                      {(pin.label || pin.addedBy?.name) && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs truncate">
                          {pin.label || `by ${pin.addedBy?.name}`}
                        </div>
                      )}
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMoodBoardMutation.mutate(pin.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                {moodBoardList.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No pins yet. Add an image URL to start the mood board.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-8">
            {(isOrganizer || isPlanner) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Import from email</CardTitle>
                  <CardDescription>Paste a confirmation email (flight, hotel, etc.) and we&apos;ll suggest itinerary items.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea placeholder="Paste your booking confirmation email here..." value={emailImportText} onChange={(e) => setEmailImportText(e.target.value)} className="min-h-[80px]" />
                  <Button size="sm" onClick={doEmailImport} disabled={!emailImportText.trim() || emailImportLoading}>
                    {emailImportLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}
                    Suggest items
                  </Button>
                  {emailSuggestions.length > 0 && (
                    <ul className="mt-3 space-y-2 border rounded-lg p-2 divide-y">
                      {emailSuggestions.map((s, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 pt-2 first:pt-0">
                          <span className="text-sm font-medium truncate">{s.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">{s.type}</span>
                          <Button size="sm" variant="outline" onClick={() => addEmailSuggestionToItinerary(s)}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                {(isOrganizer || isPlanner) && !trip.isLocked && (
                  <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add itinerary item</DialogTitle>
                        <CardDescription>Add a new activity, flight, hotel, or dining option.</CardDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Day</label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                              value={addItemForm.dayNumber}
                              onChange={(e) => setAddItemForm({ ...addItemForm, dayNumber: parseInt(e.target.value, 10) })}
                            >
                              {allTripDayNumbers.map((d) => (
                                <option key={d} value={d}>Day {d}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Type</label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                              value={addItemForm.type}
                              onChange={(e) => setAddItemForm({ ...addItemForm, type: e.target.value })}
                            >
                              <option value="flight">Flight</option>
                              <option value="hotel">Hotel</option>
                              <option value="dining">Dining</option>
                              <option value="activity">Activity</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Time</label>
                          <Input value={addItemForm.time} onChange={(e) => setAddItemForm({ ...addItemForm, time: e.target.value })} placeholder="09:00" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input value={addItemForm.name} onChange={(e) => setAddItemForm({ ...addItemForm, name: e.target.value })} placeholder="e.g. Louvre Museum" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea value={addItemForm.description} onChange={(e) => setAddItemForm({ ...addItemForm, description: e.target.value })} placeholder="Brief description" className="mt-1" rows={2} />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Location</label>
                          <Input value={addItemForm.location} onChange={(e) => setAddItemForm({ ...addItemForm, location: e.target.value })} placeholder="e.g. Paris, France" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Price per person ($)</label>
                          <Input type="number" value={addItemForm.pricePerPerson} onChange={(e) => setAddItemForm({ ...addItemForm, pricePerPerson: e.target.value })} placeholder="0" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Booking URL (optional)</label>
                          <Input value={addItemForm.bookingUrl} onChange={(e) => setAddItemForm({ ...addItemForm, bookingUrl: e.target.value })} placeholder="https://..." className="mt-1" />
                        </div>
                        <Button className="w-full" onClick={() => addItemMutation.mutate()} disabled={!addItemForm.name || !addItemForm.description || !addItemForm.location || addItemMutation.isPending}>
                          {addItemMutation.isPending ? "Adding..." : "Add item"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <span className="text-sm text-muted-foreground">Personalized daily agenda</span>
                <Button variant={personalizedView ? "default" : "outline"} size="sm" onClick={() => setPersonalizedView((v) => !v)}>
                  {personalizedView ? "On (based on your interests)" : "Off"}
                </Button>
                <Button variant={showAllDays ? "default" : "outline"} size="sm" onClick={() => setShowAllDays((v) => !v)} title={showAllDays ? "Currently showing all days including past" : "Include past days in view"}>
                  {showAllDays ? "All days" : "Show past days"}
                </Button>
              </div>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tripTitle = (trip as Trip & { title?: string }).title || trip.destination;
                    const start = new Date(trip.startDate);
                    const lines = [
                      "BEGIN:VCALENDAR",
                      "VERSION:2.0",
                      "PRODID:-//TripSync//Trip//EN",
                      ...items.flatMap((item) => {
                        const d = new Date(start);
                        d.setDate(d.getDate() + (item.dayNumber - 1));
                        const [h, m] = item.time.split(":").map(Number);
                        d.setHours(h || 0, m || 0, 0, 0);
                        const dtStart = d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
                        d.setHours(d.getHours() + 1, d.getMinutes(), 0, 0);
                        const dtEnd = d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
                        return [
                          "BEGIN:VEVENT",
                          `DTSTART:${dtStart}`,
                          `DTEND:${dtEnd}`,
                          `SUMMARY:${(item.name || "").replace(/\n/g, " ")}`,
                          `DESCRIPTION:${(item.description || "").replace(/\n/g, " ")}`,
                          `LOCATION:${(item.location || "").replace(/\n/g, " ")}`,
                          "END:VEVENT",
                        ];
                      }),
                      "END:VCALENDAR",
                    ];
                    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `tripsync-${trip.destination.replace(/\s+/g, "-")}-${trip.startDate}.ics`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                    toast({ title: "Calendar downloaded", description: "Add to Google Calendar, iCal, or Outlook." });
                  }}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>
              )}
              <Button
                variant={offlineEnabled ? "secondary" : "outline"}
                size="sm"
                onClick={async () => {
                  if (!tripId) return;
                  const next = !offlineEnabled;
                  setOfflineEnabled(next);
                  await setTripOfflineEnabled(tripId, next);
                  if (next && data) {
                    await saveOfflineTrip(tripId, data);
                    toast({
                      title: "Trip available offline",
                      description: "We’ll use saved data if you go offline on this device.",
                    });
                  } else if (!next) {
                    toast({
                      title: "Offline disabled",
                      description: "This trip will now rely on live updates only.",
                    });
                  }
                }}
              >
                {offlineEnabled ? "Offline ready" : "Make available offline"}
              </Button>
              {hasPreferences && isOrganizer && items.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending}>
                  {regenerateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Regenerate with group preferences
                </Button>
              )}
            </div>
            {schedulingConflicts.length > 0 && (
              <Card className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Scheduling conflicts
                  </CardTitle>
                  <CardDescription>These activities may overlap on the same day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {schedulingConflicts.map((c, i) => (
                    <div key={i} className="text-sm py-2 border-b last:border-0">
                      <span className="font-medium">Day {c.day}:</span>{" "}
                      <span>{c.a.name}</span> ({c.a.time} – {(c.a as ItineraryItem & { endTime?: string }).endTime || c.a.time}) overlaps with{" "}
                      <span>{c.b.name}</span> ({c.b.time})
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {allTripDayNumbers
              .filter((day) => {
                const dayItems = personalizedItemsByDay[day] ?? [];
                if (dayItems.length === 0) return false;
                if (showAllDays) return true;
                const dayDate = new Date(trip.startDate);
                dayDate.setDate(dayDate.getDate() + (day - 1));
                dayDate.setHours(0, 0, 0, 0);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const tripEnd = new Date(trip.endDate);
                tripEnd.setHours(23, 59, 59, 999);
                return dayDate >= now && dayDate <= tripEnd;
              })
              .map((day) => {
                const dayItems = personalizedItemsByDay[day] ?? [];
                const dayDate = new Date(trip.startDate);
                dayDate.setDate(dayDate.getDate() + (day - 1));
                const dateStr = dayDate.toISOString().slice(0, 10);
                return (
                <div key={day}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Day {day}
                  </h2>
                  <DayWeatherCard destination={trip.destination} date={dateStr} />
                  {isOrganizer && !trip.isLocked && dayItems.length > 1 ? (
                    <SortableItineraryDay
                      dayItems={dayItems}
                      tripId={tripId!}
                      isLocked={!!trip.isLocked}
                      isPlanner={isOrganizer || isPlanner}
                      comments={comments}
                      votes={votes}
                      voteDetails={voteDetails}
                      members={members}
                      groupDietSummary={groupDietSummary}
                      hasAccessibilityPrefs={hasAccessibilityPrefs}
                      onReorder={(ids) => reorderMutation.mutate(ids)}
                      onDeleteItem={(id) => deleteItemMutation.mutate(id)}
                      onDeleteComment={(itemId, commentId) => deleteCommentMutation.mutate({ itemId, commentId })}
                    />
                  ) : (
                    <div className="space-y-4">
                      {dayItems
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.time.localeCompare(b.time))
                        .map((item) => (
                          <ItineraryItemCard
                            key={item.id}
                            item={{ ...item, locked: item.locked ?? undefined } as ItineraryItem & { locked?: boolean; bookedByUserId?: string | null }}
                            comments={comments[item.id] || []}
                            votes={votes[item.id] || { up: 0, down: 0, abstain: 0 }}
                            voteDetails={voteDetails[item.id]}
                            tripId={tripId!}
                            isLocked={!!trip.isLocked}
                            isPlanner={isOrganizer || isPlanner}
                            members={members}
                            groupDietSummary={groupDietSummary}
                            hasAccessibilityPrefs={hasAccessibilityPrefs}
                            onDeleteItem={(isOrganizer || isPlanner) ? (id) => deleteItemMutation.mutate(id) : undefined}
                            onDeleteComment={(itemId, commentId) => deleteCommentMutation.mutate({ itemId, commentId })}
                          />
                        ))}
                    </div>
                  )}
                </div>
                );
              })}

            {items.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI is planning your trip...</h3>
                  <p className="text-muted-foreground max-w-sm">
                    This usually takes about 30 seconds. We're crafting the perfect itinerary for your group.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {todayDayNum != null && (
            <TabsContent value="today" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Daily itinerary — Day {todayDayNum}
                  </CardTitle>
                  <CardDescription>What&apos;s happening today. Event reminders below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items scheduled for today.</p>
                  ) : (
                    todayItems.map((item) => (
                      <ItineraryItemCard
                        key={item.id}
                        item={{ ...item, locked: item.locked ?? undefined } as ItineraryItem & { locked?: boolean; bookedByUserId?: string | null }}
                        comments={comments[item.id] || []}
                        votes={votes[item.id] || { up: 0, down: 0, abstain: 0 }}
                        voteDetails={voteDetails[item.id]}
                        tripId={tripId!}
                        isLocked={!!trip.isLocked}
                        isPlanner={isOrganizer || isPlanner}
                        members={members}
                        groupDietSummary={groupDietSummary}
                        hasAccessibilityPrefs={hasAccessibilityPrefs}
                        onDeleteItem={(isOrganizer || isPlanner) ? (id) => deleteItemMutation.mutate(id) : undefined}
                        onDeleteComment={(itemId, commentId) => deleteCommentMutation.mutate({ itemId, commentId })}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Event reminders
                  </CardTitle>
                  <CardDescription>Time-based reminders for today&apos;s activities.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {todayItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                      <span className="font-medium">{item.time}</span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                  {todayItems.length === 0 && <p className="text-sm text-muted-foreground">No events today.</p>}
                  <PushRemindersButton tripId={tripId!} toast={toast} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
                <CardDescription>Recent updates: expenses, chat, comments, itinerary, photos, polls, preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {(() => {
                  const itemNameMap = Object.fromEntries(items.map((i) => [i.id, i.name]));
                  const allComments = Object.entries(comments).flatMap(([itemId, arr]) => (arr ?? []).map((c) => ({ ...c, itemId, itemName: itemNameMap[itemId] ?? "an item" })));
                  const entries: { type: string; id: string; at: string; text: string }[] = [
                    ...expenses.map((e) => {
                      const payer = members.find((m) => m.id === e.paidByUserId);
                      return { type: "expense", id: e.id, at: e.createdAt, text: `${payer?.name ?? "Someone"} added expense: ${e.description} (${(e as { currency?: string }).currency ?? "USD"} ${e.amount})` };
                    }),
                    ...chatMessages.map((m) => ({ type: "chat", id: m.id, at: m.createdAt, text: `${m.user?.name ?? "Someone"}: ${m.content.slice(0, 80)}${m.content.length > 80 ? "…" : ""}` })),
                    ...allComments.map((c) => {
                      const author = members.find((m) => m.id === c.userId);
                      return { type: "comment", id: c.id, at: c.createdAt, text: `${author?.name ?? "Someone"} commented on "${c.itemName}": ${c.content.slice(0, 60)}${c.content.length > 60 ? "…" : ""}` };
                    }),
                    ...items.map((i) => ({ type: "itinerary", id: i.id, at: i.createdAt, text: `Itinerary item added: ${i.name} (Day ${i.dayNumber})` })),
                    ...photos.map((p) => ({ type: "photo", id: p.id, at: p.createdAt, text: `${p.user?.name ?? "Someone"} added a photo${p.caption ? `: ${p.caption}` : ""}` })),
                    ...(pollsList ?? []).map((p) => ({ type: "poll", id: p.id, at: (p as any).createdAt || new Date().toISOString(), text: `${p.createdBy?.name ?? "Someone"} created poll: ${p.question}` })),
                    ...(preferences ?? []).map((p) => {
                      const u = p.user ?? members.find((m) => m.id === p.userId);
                      return { type: "preference", id: p.id, at: (p as any).createdAt || new Date().toISOString(), text: `${u?.name ?? "Someone"} set trip preferences` };
                    }),
                  ];
                  const sorted = entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 30);
                  if (sorted.length === 0) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
                  return sorted.map((entry) => (
                    <div key={`${entry.type}-${entry.id}`} className="text-sm border-b pb-2 last:border-0">
                      <span className="text-muted-foreground text-xs">{new Date(entry.at).toLocaleString()}</span>
                      <p className="mt-0.5">{entry.text}</p>
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say hi to your group!</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {msg.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">{msg.user?.name}</span>
                          <p className="text-sm">
                            <ChatMessageContent content={msg.content} members={members.map((m) => ({ id: m.id, name: m.name }))} />
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t p-3 flex gap-2 relative">
                  <div className="flex-1 relative">
                    <Input
                      ref={chatInputRef}
                      placeholder="Message the group... Use @Name to tag someone"
                      value={chatInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        setChatInput(v);
                        const caret = (e.target as HTMLInputElement).selectionStart ?? v.length;
                        const beforeCaret = v.slice(0, caret);
                        const atIdx = beforeCaret.lastIndexOf("@");
                        if (atIdx >= 0 && (atIdx === 0 || /\s/.test(beforeCaret[atIdx - 1]))) {
                          const q = beforeCaret.slice(atIdx + 1);
                          setMentionQuery(q);
                          setMentionAnchor({ start: atIdx, end: caret });
                          setMentionSelectedIndex(0);
                        } else {
                          setMentionQuery(null);
                          setMentionAnchor(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (mentionQuery !== null && members.length > 0) {
                          const filtered = members.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5);
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setMentionSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
                            return;
                          }
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setMentionSelectedIndex((i) => Math.max(i - 1, 0));
                            return;
                          }
                          if (e.key === "Enter" && filtered[mentionSelectedIndex]) {
                            e.preventDefault();
                            if (mentionAnchor) {
                              const end = chatInputRef.current?.selectionStart ?? mentionAnchor.end;
                              const before = chatInput.slice(0, mentionAnchor.start);
                              const after = chatInput.slice(end);
                              const m = filtered[mentionSelectedIndex];
                              setChatInput(before + "@" + m.name + " " + after);
                              setMentionQuery(null);
                              setMentionAnchor(null);
                              setMentionSelectedIndex(0);
                            }
                            return;
                          }
                          if (e.key === "Escape") {
                            setMentionQuery(null);
                            setMentionAnchor(null);
                            setMentionSelectedIndex(0);
                            return;
                          }
                        }
                        if (e.key === "Enter" && !e.shiftKey && chatInput.trim()) {
                          if (mentionQuery !== null) {
                            setMentionQuery(null);
                            setMentionAnchor(null);
                          }
                          chatMutation.mutate(chatInput.trim());
                        }
                      }}
                      onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
                    />
                    {mentionQuery !== null && members.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border bg-popover p-1 shadow-md max-h-32 overflow-y-auto z-50">
                        <p className="text-xs text-muted-foreground px-2 py-1">Tag someone (↑↓ to select, Enter to insert)</p>
                        {members
                          .filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                          .slice(0, 5)
                          .map((m, i) => (
                            <button
                              key={m.id}
                              type="button"
                              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${i === mentionSelectedIndex ? "bg-accent" : ""}`}
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                if (mentionAnchor) {
                                  const end = chatInputRef.current?.selectionStart ?? mentionAnchor.end;
                                  const before = chatInput.slice(0, mentionAnchor.start);
                                  const after = chatInput.slice(end);
                                  setChatInput(before + "@" + m.name + " " + after);
                                  setMentionQuery(null);
                                  setMentionAnchor(null);
                                }
                              }}
                            >
                              @{m.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <Button
                    size="icon"
                    onClick={() => chatInput.trim() && chatMutation.mutate(chatInput.trim())}
                    disabled={!chatInput.trim() || chatMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Trip Concierge
                </CardTitle>
                <CardDescription>Chat to plan or modify your trip in plain language (e.g. &quot;Add a lunch at the pier on Day 2&quot;).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Add brunch on Day 1, move museum to afternoon..."
                    value={planningChatInput}
                    onChange={(e) => setPlanningChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && planningChatInput.trim() && handlePlanningChat()}
                  />
                  <Button
                    onClick={() => planningChatInput.trim() && handlePlanningChat()}
                    disabled={!planningChatInput.trim() || planningLoading}
                  >
                    {planningLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask AI"}
                  </Button>
                </div>
                {planningSuggestion != null && (
                  <p className="text-sm text-muted-foreground p-2 rounded bg-muted">{planningSuggestion}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-semibold">Expense Tracking</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm text-muted-foreground">
                    Total: ${totalSpent.toFixed(2)} / ${budgetTotal} budget
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Display in:</label>
                    <select
                      className="rounded border border-input bg-background px-2 py-1 text-sm"
                      value={expenseDisplayCurrency}
                      onChange={(e) => setExpenseDisplayCurrency(e.target.value)}
                    >
                      {["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "MXN", "THB", "INR"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {expenseDisplayCurrency !== "USD" && !ratesLoading && (() => {
                      const totalConverted = expenses.reduce((sum, e) => {
                        const cur = (e as { currency?: string }).currency ?? "USD";
                        const conv = convertCurrency(e.amount, cur, expenseDisplayCurrency);
                        return sum + (conv ?? e.amount);
                      }, 0);
                      return (
                        <span className="text-xs text-muted-foreground">≈ {expenseDisplayCurrency} {totalConverted.toFixed(2)}</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const rows: string[] = [
                      "Description,Amount,Currency,Paid By,Location,Split Count",
                      ...expenses.map((e) => {
                        const payer = members.find((m) => m.id === e.paidByUserId);
                        return `"${(e.description || "").replace(/"/g, '""')}",${e.amount},${(e as { currency?: string }).currency ?? "USD"},"${(payer?.name ?? "").replace(/"/g, '""')}","${(e.location || "").replace(/"/g, '""')}",${e.splitAmong.length}`;
                      }),
                    ];
                    if (settlementSummary.length > 0) {
                      rows.push("");
                      rows.push("Settlement,From,To,Amount");
                      settlementSummary.forEach((s) => {
                        const fromName = members.find((m) => m.id === s.from)?.name ?? "";
                        const toName = members.find((m) => m.id === s.to)?.name ?? "";
                        rows.push(`"${fromName} owes ${toName}","${fromName}","${toName}",${s.amount.toFixed(2)}`);
                      });
                    }
                    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `tripsync-expenses-${trip.destination.replace(/\s+/g, "-")}-${trip.startDate}.csv`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                    toast({ title: "CSV downloaded", description: "Expense summary saved." });
                  }}
                >
                  Export CSV
                </Button>
                <Dialog open={newExpenseOpen} onOpenChange={setNewExpenseOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-expense">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          data-testid="input-expense-amount"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Currency</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={expenseForm.currency}
                          onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CAD">CAD</option>
                          <option value="AUD">AUD</option>
                          <option value="JPY">JPY</option>
                          <option value="CHF">CHF</option>
                          <option value="MXN">MXN</option>
                          <option value="THB">THB</option>
                          <option value="INR">INR</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        placeholder="e.g., Dinner at the beach"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        data-testid="input-expense-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location (optional)</label>
                      <Input
                        placeholder="e.g., Seaside Restaurant"
                        value={expenseForm.location}
                        onChange={(e) => setExpenseForm({ ...expenseForm, location: e.target.value })}
                        data-testid="input-expense-location"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Split between</label>
                      <div className="flex flex-wrap gap-2">
                        {members.map((m) => {
                          const isSelected =
                            expenseSplitMemberIds.length === 0 || expenseSplitMemberIds.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() =>
                                setExpenseSplitMemberIds((prev) =>
                                  prev.includes(m.id)
                                    ? prev.filter((id) => id !== m.id)
                                    : [...prev, m.id]
                                )
                              }
                              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-muted"
                              }`}
                            >
                              <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-current">
                                {isSelected && <span className="h-2 w-2 rounded-full bg-current" />}
                              </span>
                              <span>{m.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Link to itinerary item (optional)</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={expenseForm.itemId}
                        onChange={(e) => setExpenseForm({ ...expenseForm, itemId: e.target.value })}
                      >
                        <option value="">None</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>Day {it.dayNumber} · {it.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Receipt photo (optional)</label>
                      <FileUpload
                        endpoint="/api/upload/receipt"
                        accept="image/*"
                        maxSizeMB={10}
                        onUploadComplete={(urls) => setExpenseForm((p) => ({ ...p, receiptImageUrl: urls[0] || p.receiptImageUrl }))}
                        buttonText="Upload receipt"
                        showPreview={false}
                      />
                      <Input
                        placeholder="Or paste URL"
                        value={expenseForm.receiptImageUrl}
                        onChange={(e) => setExpenseForm({ ...expenseForm, receiptImageUrl: e.target.value })}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => addExpenseMutation.mutate()}
                      disabled={
                        !expenseForm.amount ||
                        !expenseForm.description ||
                        addExpenseMutation.isPending
                      }
                      data-testid="button-submit-expense"
                    >
                      {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            <Progress value={(totalSpent / budgetTotal) * 100} className="h-3" />

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI budget optimization
                </CardTitle>
                <CardDescription>Get personalized tips to optimize spending on this trip.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={budgetOptimizeLoading}
                  onClick={async () => {
                    setBudgetOptimizeLoading(true);
                    setBudgetOptimizeResult(null);
                    try {
                      const res = await fetch(`/api/trips/${tripId}/budget-optimize`, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        credentials: "include",
                      });
                      const data = await res.json();
                      setBudgetOptimizeResult(data.suggestion || "No suggestions.");
                    } catch {
                      setBudgetOptimizeResult("Unable to get suggestions. Try again.");
                    } finally {
                      setBudgetOptimizeLoading(false);
                    }
                  }}
                >
                  {budgetOptimizeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Optimize budget
                </Button>
                {budgetOptimizeResult && (
                  <p className="mt-3 text-sm text-muted-foreground p-3 rounded bg-muted">{budgetOptimizeResult}</p>
                )}
              </CardContent>
            </Card>

            {settlementSummary.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Optimized settlement
                  </CardTitle>
                  <CardDescription>Minimum transactions — who pays whom to settle up at trip end</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {settlementSummary.map((s, i) => {
                    const fromName = members.find((m) => m.id === s.from)?.name ?? "Someone";
                    const toName = members.find((m) => m.id === s.to)?.name ?? "Someone";
                    const amountStr = s.amount.toFixed(2);
                    return (
                      <div key={i} className="flex flex-col gap-1 py-2 border-b last:border-0">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{fromName} owes {toName}</span>
                          <span className="font-medium">${amountStr}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <a href={`https://venmo.com/?txn=pay&amount=${amountStr}&recipient=${encodeURIComponent(toName)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Pay with Venmo</a>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">Zelle: Pay ${amountStr} to {toName}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {expenses.map((expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  members={members}
                  tripId={tripId!}
                  onUpdate={() => {}}
                  convert={convertCurrency}
                  displayCurrency={expenseDisplayCurrency}
                />
              ))}

              {expenses.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No expenses yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start tracking expenses during your trip
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Automatic trip recap
                </CardTitle>
                <CardDescription>AI-generated summary from your itinerary and photos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(trip as { recapText?: string | null }).recapText ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground">{(trip as { recapText?: string }).recapText}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recap yet. Generate one from your itinerary and photos.</p>
                )}
                <Button onClick={() => generateRecapMutation.mutate()} disabled={generateRecapMutation.isPending}>
                  {generateRecapMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate recap
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Trip recap & shared photos
                </CardTitle>
                <CardDescription>Group photo album and memories from the trip.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isPro && photos.length >= 5 && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm">Free plan limited to 5 photos per trip. Upgrade to Pro for unlimited photos.</p>
                    <Button size="sm" variant="outline" asChild><Link href="/pricing?checkout=pro"><a className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />Upgrade</a></Link></Button>
                  </div>
                )}
                <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!isPro && photos.length >= 5}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add photo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add photo to album</DialogTitle>
                      <CardDescription>Upload photos or paste image URL.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Upload or paste URL</label>
                        <FileUpload
                          endpoint="/api/upload/photo"
                          accept="image/*"
                          maxSizeMB={25}
                          onUploadComplete={(urls) => setPhotoForm((p) => ({ ...p, url: urls[0] || p.url }))}
                          buttonText="Upload photo"
                          showPreview={true}
                        />
                        <Input
                          placeholder="Or paste URL: https://..."
                          value={photoForm.url}
                          onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <label className="text-sm font-medium">Upload multiple photos</label>
                        <p className="text-xs text-muted-foreground">
                          Great for dropping in a whole album at once. Each uploaded file becomes a photo in this trip.
                        </p>
                        <BatchPhotoUpload
                          onUploadComplete={async (urls) => {
                            if (!urls.length) return;
                            try {
                              await Promise.all(
                                urls.map((url) =>
                                  apiRequest("POST", `/api/trips/${tripId}/photos`, {
                                    url,
                                    caption: null,
                                  }),
                                ),
                              );
                              queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
                              toast({
                                title: "Photos added",
                                description: `${urls.length} photo${urls.length === 1 ? "" : "s"} added to the album.`,
                              });
                            } catch (e) {
                              const err = e as Error & { upgradeUrl?: string };
                              if (err.upgradeUrl) {
                                toast({ title: "Photo limit reached", description: err.message, variant: "destructive", action: <Link href="/pricing?checkout=pro"><a className="text-sm font-medium underline">Upgrade</a></Link> });
                              } else {
                                toast({ title: "Error", description: err?.message || "Some photos could not be saved.", variant: "destructive" });
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Caption (optional)</label>
                        <Input
                          placeholder="e.g. Dinner at Morton's"
                          value={photoForm.caption}
                          onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                        />
                      </div>
                      <Button onClick={() => addPhotoMutation.mutate()} disabled={!photoForm.url || addPhotoMutation.isPending}>
                        Add photo
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((p) => (
                    <div key={p.id} className="rounded-lg overflow-hidden border bg-muted/50 relative group">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="block aspect-square">
                        <img src={p.url} alt={p.caption ?? "Trip photo"} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50' y='50' fill='%23999' text-anchor='middle' dy='.3em' font-size='12'%3EPhoto%3C/text%3E%3C/svg%3E"; }} />
                      </a>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove photo?</AlertDialogTitle>
                            <AlertDialogDescription>This photo will be removed from the album.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletePhotoMutation.mutate(p.id)}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {(p.caption || p.user?.name) && (
                        <div className="p-2 text-xs text-muted-foreground truncate">
                          {p.caption && <span>{p.caption}</span>}
                          {p.caption && p.user?.name && " · "}
                          {p.user?.name && <span>by {p.user.name}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {photos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No photos yet. Add one to start the shared album.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Rate this trip
                </CardTitle>
                <CardDescription>How was the trip? Your rating helps the group and improves future planning.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant={satisfactionScore === star ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setSatisfactionScore(star); satisfactionMutation.mutate(star); }}
                      disabled={satisfactionMutation.isPending}
                    >
                      {star} ★
                    </Button>
                  ))}
                </div>
                {satisfaction.length > 0 && (
                  <p className="text-xs text-muted-foreground">Average: {(satisfaction.reduce((s, e) => s + e.score, 0) / satisfaction.length).toFixed(1)} from {satisfaction.length} rating(s).</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  Weather for trip dates
                </CardTitle>
                <CardDescription>Hourly forecast for {trip.destination} via Open-Meteo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const start = new Date(trip.startDate);
                  const end = new Date(trip.endDate);
                  const days: string[] = [];
                  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(d.toISOString().slice(0, 10));
                  return days.slice(0, 5).map((date) => <DayWeatherCard key={date} destination={trip.destination} date={date} />);
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Local tips & guides
                </CardTitle>
                <CardDescription>Best times to visit, crowd levels, and local recommendations for {trip.destination}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RecapLocalTips destination={trip.destination} startDate={trip.startDate} endDate={trip.endDate} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coordination" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Polls</CardTitle>
                <CardDescription>Fast voting on group decisions (e.g. Beach, hiking, or museum?).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Question"
                      value={pollForm.question}
                      onChange={(e) => setPollForm((p) => ({ ...p, question: e.target.value }))}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    {pollForm.options.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2 max-w-xs">
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          value={opt}
                          onChange={(e) =>
                            setPollForm((p) => {
                              const next = [...p.options];
                              next[index] = e.target.value;
                              return { ...p, options: next };
                            })
                          }
                        />
                        {pollForm.options.length > 2 && index >= 2 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              setPollForm((p) => ({
                                ...p,
                                options: p.options.filter((_, i) => i !== index),
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPollForm((p) => ({
                          ...p,
                          options: p.options.length >= 6 ? p.options : [...p.options, ""],
                        }))
                      }
                      disabled={pollForm.options.length >= 6}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add option
                    </Button>
                  </div>
                  <Button
                    onClick={() => createPollMutation.mutate()}
                    disabled={
                      !pollForm.question ||
                      pollForm.options.map((o) => o.trim()).filter(Boolean).length < 2 ||
                      createPollMutation.isPending
                    }
                  >
                    {createPollMutation.isPending ? "Creating..." : "Create poll"}
                  </Button>
                </div>
                {pollsList?.map((poll) => (
                  <div key={poll.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{poll.question}</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 text-xs">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete poll?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the poll and its votes.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletePollMutation.mutate(poll.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(poll.options as string[]).map((opt, i) => (
                        <Button key={i} size="sm" variant="outline" onClick={() => votePollMutation.mutate({ pollId: poll.id, optionIndex: i })}>
                          {opt} ({poll.voteCounts?.[i] ?? 0})
                        </Button>
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary" onClick={async () => {
                      try {
                        const res = await fetch(`/api/trips/${tripId}/suggest-resolution`, { method: "POST", headers: getAuthHeaders(), credentials: "include", body: JSON.stringify({ question: poll.question, options: poll.options as string[], voteCounts: poll.voteCounts ?? [] }) });
                        const j = await res.json();
                        toast({ title: "AI suggestion", description: j.suggestion });
                      } catch { toast({ title: "Error", description: "Could not get suggestion", variant: "destructive" }); }
                    }}>
                      <Sparkles className="h-4 w-4 mr-1" /> Suggest compromise
                    </Button>
                  </div>
                ))}
                {(!pollsList || pollsList.length === 0) && <p className="text-sm text-muted-foreground">No polls yet.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Packing List</CardTitle>
                <CardDescription>Shared packing list; assign items to members. Use AI to generate from your trip details.</CardDescription>
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => generatePackingMutation.mutate()} disabled={generatePackingMutation.isPending}>
                    {generatePackingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Generate with AI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Item name" value={packingForm.name} onChange={(e) => setPackingForm((p) => ({ ...p, name: e.target.value }))} />
                  <select className="rounded border px-2" value={packingForm.assignedToUserId} onChange={(e) => setPackingForm((p) => ({ ...p, assignedToUserId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <Button onClick={() => addPackingMutation.mutate()} disabled={!packingForm.name}>Add</Button>
                </div>
                <ul className="text-sm space-y-1">
                  {packingList?.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={(p as { packed?: boolean }).packed ?? false}
                        onCheckedChange={(checked) => togglePackingMutation.mutate({ itemId: p.id, packed: !!checked })}
                        disabled={togglePackingMutation.isPending}
                      />
                      <span className={(p as { packed?: boolean }).packed ? "line-through text-muted-foreground" : ""}>{p.name}</span>
                      {p.assignedTo ? <span className="text-muted-foreground">→ {p.assignedTo.name}</span> : ""}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 text-destructive hover:text-destructive text-xs ml-auto">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove packing item?</AlertDialogTitle>
                            <AlertDialogDescription>Remove &quot;{p.name}&quot; from the list?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletePackingMutation.mutate(p.id)}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Transportation</CardTitle><CardDescription>Who&apos;s driving, car assignments, ride shares.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Input type="number" min={1} placeholder="Day" value={transportForm.dayNumber} onChange={(e) => setTransportForm((p) => ({ ...p, dayNumber: Number(e.target.value) || 1 }))} className="w-20" />
                  <select className="rounded border px-2" value={transportForm.type} onChange={(e) => setTransportForm((p) => ({ ...p, type: e.target.value }))}><option value="drive">Drive</option><option value="rideshare">Rideshare</option><option value="pickup">Pickup</option></select>
                  <Input placeholder="Description" value={transportForm.description} onChange={(e) => setTransportForm((p) => ({ ...p, description: e.target.value }))} />
                  <select className="rounded border px-2" value={transportForm.driverUserId} onChange={(e) => setTransportForm((p) => ({ ...p, driverUserId: e.target.value }))}><option value="">No driver</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                  <Button onClick={() => addTransportMutation.mutate()} disabled={!transportForm.description}>Add</Button>
                </div>
                <ul className="text-sm space-y-1">
                  {transportationList?.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span>Day {t.dayNumber}: {t.description} {t.driver ? `(${t.driver.name})` : ""}</span>
                      <div className="flex gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove transportation entry?</AlertDialogTitle>
                              <AlertDialogDescription>Day {t.dayNumber}: {t.description}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTransportMutation.mutate(t.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Group Availability</CardTitle><CardDescription>Find dates that work for everyone.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Add your available dates, then save.</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    type="date"
                    className="max-w-xs"
                    value={availabilityDateToAdd}
                    onChange={(e) => setAvailabilityDateToAdd(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (availabilityDateToAdd) {
                        setAvailabilityDates((prev) =>
                          prev.includes(availabilityDateToAdd) ? prev : [...prev, availabilityDateToAdd].sort()
                        );
                        setAvailabilityDateToAdd("");
                      }
                    }}
                  >
                    Add date
                  </Button>
                  <Button size="sm" onClick={() => setAvailabilityMutation.mutate()} disabled={setAvailabilityMutation.isPending}>Save availability</Button>
                </div>
                {availabilityDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm text-muted-foreground mr-1">Selected:</span>
                    {availabilityDates.map((d) => (
                      <Badge key={d} variant="secondary" className="flex items-center gap-1">
                        {new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        <button
                          type="button"
                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          onClick={() => setAvailabilityDates((prev) => prev.filter((x) => x !== d))}
                          aria-label={`Remove ${d}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {groupAvailabilityList.length > 0 && (() => {
                  const dates: string[] = [];
                  const start = new Date(trip.startDate);
                  const end = new Date(trip.endDate);
                  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    dates.push(d.toISOString().slice(0, 10));
                  }
                  const maxCount = groupAvailabilityList.length;
                  const dateCounts = dates.map((d) => ({
                    date: d,
                    count: groupAvailabilityList.filter((a) => (a.availableDates ?? []).includes(d)).length,
                  }));
                  return (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Availability heatmap — darker = more people available</p>
                      <div className="flex flex-wrap gap-1">
                        {dateCounts.map(({ date, count }) => {
                          const intensity = maxCount > 0 ? count / maxCount : 0;
                          return (
                            <div
                              key={date}
                              className="h-8 min-w-[2rem] rounded flex items-center justify-center text-xs font-medium"
                              style={{ backgroundColor: `hsl(var(--primary) / ${0.2 + intensity * 0.8})`, color: intensity > 0.5 ? "white" : "inherit" }}
                              title={`${date}: ${count}/${maxCount} available`}
                            >
                              {count}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        {dateCounts.slice(0, 7).map(({ date }) => (
                          <span key={date}>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        ))}
                        {dateCounts.length > 7 && <span>…</span>}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">RSVP</CardTitle><CardDescription>Who&apos;s in, who hasn&apos;t responded.</CardDescription></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <span>{m.name}</span>
                      <Badge variant="outline">{(m as { rsvpStatus?: string }).rsvpStatus ?? "pending"}</Badge>
                      {isOrganizer && (
                        <select
                          className="rounded border text-xs"
                          value={(m as { rsvpStatus?: string }).rsvpStatus}
                          onChange={(e) => {
                            const memberId = (m as { memberId?: string }).memberId ?? m.id;
                            if (memberId) {
                              rsvpMutation.mutate({ memberId, rsvpStatus: e.target.value });
                            } else {
                              toast({
                                title: "Error",
                                description: "Could not update RSVP.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                        </select>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Emergency SOS Hub</CardTitle>
                <CardDescription>Quick access to embassy, medical, and police. Save contacts below for your destination.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {emergencyContacts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {emergencyContacts.filter((c) => c.type === "embassy" || c.type === "medical" || c.type === "police").map((c) => (
                      <a key={c.id} href={c.phone ? `tel:${c.phone}` : c.url || "#"} target={c.url ? "_blank" : undefined} rel={c.url ? "noopener noreferrer" : undefined} className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <Phone className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Add embassy, medical, and police contacts below for quick access during your trip.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Visa & entry requirements</CardTitle>
                <CardDescription>Check visa requirements for your destination and nationality. Compare travel insurance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Destination: <strong>{trip.destination}</strong>. For official requirements, check your government travel site or use a visa checker (e.g. Sherpa°, iVisa).</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`https://www.google.com/search?q=visa+requirements+${encodeURIComponent(trip.destination)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Search visa requirements</a>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">Travel insurance comparison</CardTitle>
                <CardDescription>Compare quotes from providers before your trip.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Based on your current budget, TripSync can help you research travel insurance options tailored to this trip.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/trips/${tripId}/insurance-quote`, { credentials: "include" });
                      if (!res.ok) throw new Error();
                      const info = await res.json() as { suggestionUrl?: string; totalBudget?: number };
                      if (info.suggestionUrl) {
                        window.open(info.suggestionUrl, "_blank", "noopener,noreferrer");
                      } else {
                        window.open(
                          `https://www.google.com/search?q=${encodeURIComponent(
                            `travel insurance for trip costing $${info.totalBudget ?? trip.budgetPerPerson * trip.groupSize} to ${trip.destination}`
                          )}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    } catch {
                      window.open(
                        `https://www.google.com/search?q=${encodeURIComponent(
                          `travel insurance for trip to ${trip.destination}`
                        )}`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }}
                >
                  Get insurance suggestions
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Document storage</CardTitle>
                <CardDescription>Boarding passes, hotel confirmations, vaccination records. Upload a file or paste a URL.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add document</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add document</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <select className="w-full rounded border px-2 py-1" value={docForm.type} onChange={(e) => setDocForm((p) => ({ ...p, type: e.target.value }))}>
                        <option value="boarding_pass">Boarding pass</option><option value="hotel_confirmation">Hotel confirmation</option><option value="vaccination">Vaccination</option><option value="insurance">Insurance</option><option value="other">Other</option>
                      </select>
                      <label className="text-sm font-medium">Name</label>
                      <Input value={docForm.name} onChange={(e) => setDocForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Flight to Miami" />
                      <label className="text-sm font-medium">Upload or paste URL</label>
                      <FileUpload
                        endpoint="/api/upload/document"
                        accept="application/pdf,image/*"
                        maxSizeMB={10}
                        onUploadComplete={(urls) => setDocForm((p) => ({ ...p, url: urls[0] || p.url }))}
                        buttonText="Upload file"
                        showPreview={false}
                      />
                      <Input value={docForm.url} onChange={(e) => setDocForm((p) => ({ ...p, url: e.target.value }))} placeholder="Or paste URL: https://..." />
                      <label className="text-sm font-medium">Notes (optional)</label>
                      <Input value={docForm.notes} onChange={(e) => setDocForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                      <div>
                        <label className="text-sm font-medium">Expiry date (optional) — for boarding passes, visas</label>
                        <Input type="date" value={docForm.expiryDate} onChange={(e) => setDocForm((p) => ({ ...p, expiryDate: e.target.value }))} className="mt-1" />
                      </div>
                      <Button className="w-full" onClick={() => addDocumentMutation.mutate()} disabled={!docForm.name || !docForm.url || addDocumentMutation.isPending}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {documents.some((d) => (d as { expiryDate?: string | null }).expiryDate && new Date((d as { expiryDate?: string }).expiryDate!) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) && (
                  <div className="mb-4 p-3 rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50">
                    <p className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Document expiry warning</p>
                    <p className="text-xs text-muted-foreground mt-1">Some documents are expiring within 14 days. Review and update.</p>
                  </div>
                )}
                <ul className="space-y-2 text-sm">
                  {documents.map((d) => {
                    const expiry = (d as { expiryDate?: string | null }).expiryDate;
                    const isExpiringSoon = expiry && new Date(expiry) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                    const isExpired = expiry && new Date(expiry) < new Date();
                    return (
                      <li key={d.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <span>{d.name} <Badge variant="outline">{d.type}</Badge></span>
                          {expiry && (
                            <span className={`text-xs ml-2 ${isExpired ? "text-destructive" : isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                              Expires {new Date(expiry).toLocaleDateString()}{isExpired ? " (expired)" : isExpiringSoon ? " (soon)" : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs">Open</a>
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive text-xs">Remove</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove document?</AlertDialogTitle>
                              <AlertDialogDescription>Remove &quot;{d.name}&quot; from the list?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteDocumentMutation.mutate(d.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {documents.length === 0 && <p className="text-muted-foreground text-sm">No documents yet.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Emergency contacts</CardTitle>
                <CardDescription>Embassy, medical, police. Shared for the group.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add contact</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add emergency contact</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                      <select className="w-full rounded border px-2 py-1" value={emergencyForm.type} onChange={(e) => setEmergencyForm((p) => ({ ...p, type: e.target.value }))}>
                        <option value="embassy">Embassy</option><option value="medical">Medical</option><option value="police">Police</option><option value="other">Other</option>
                      </select>
                      <Input value={emergencyForm.name} onChange={(e) => setEmergencyForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name / place" />
                      <Input value={emergencyForm.phone} onChange={(e) => setEmergencyForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                      <Input value={emergencyForm.url} onChange={(e) => setEmergencyForm((p) => ({ ...p, url: e.target.value }))} placeholder="URL (optional)" />
                      <Button className="w-full" onClick={() => addEmergencyMutation.mutate()} disabled={!emergencyForm.name || addEmergencyMutation.isPending}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <ul className="space-y-2 text-sm">
                  {emergencyContacts.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span><span className="font-medium">{c.name}</span> <Badge variant="outline">{c.type}</Badge> {c.phone && <a href={`tel:${c.phone}`} className="text-primary text-xs ml-1">{c.phone}</a>}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setEmergencyEditId(c.id); setEmergencyEditForm({ type: c.type, name: c.name, phone: c.phone ?? "", url: c.url ?? "", notes: c.notes ?? "" }); }}>Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive text-xs">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete emergency contact?</AlertDialogTitle>
                              <AlertDialogDescription>Remove {c.name} from the list?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteEmergencyMutation.mutate(c.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
                {emergencyEditId && (
                  <Dialog open={!!emergencyEditId} onOpenChange={(open) => !open && setEmergencyEditId(null)}>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit emergency contact</DialogTitle></DialogHeader>
                      <div className="space-y-2">
                        <select className="w-full rounded border px-2 py-1" value={emergencyEditForm.type} onChange={(e) => setEmergencyEditForm((p) => ({ ...p, type: e.target.value }))}>
                          <option value="embassy">Embassy</option><option value="medical">Medical</option><option value="police">Police</option><option value="other">Other</option>
                        </select>
                        <Input value={emergencyEditForm.name} onChange={(e) => setEmergencyEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                        <Input value={emergencyEditForm.phone} onChange={(e) => setEmergencyEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                        <Input value={emergencyEditForm.url} onChange={(e) => setEmergencyEditForm((p) => ({ ...p, url: e.target.value }))} placeholder="URL (optional)" />
                        <Input value={emergencyEditForm.notes} onChange={(e) => setEmergencyEditForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" />
                        <Button className="w-full" onClick={() => emergencyEditId && updateEmergencyMutation.mutate({ contactId: emergencyEditId, updates: emergencyEditForm })} disabled={!emergencyEditForm.name}>Save</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {emergencyContacts.length === 0 && <p className="text-muted-foreground text-sm">No emergency contacts yet.</p>}
              </CardContent>
            </Card>
            <LocationSharingCard tripId={tripId!} locationSharing={locationSharing} currentUserId={user?.id ?? ""} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Cloud className="h-5 w-5 text-primary" /> Carbon footprint estimate</CardTitle>
                <CardDescription>Rough CO₂ estimate from your itinerary (flights vs other activities).</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const flightCount = items.filter((i) => i.type === "flight").length;
                  const otherCount = items.length - flightCount;
                  const flightKg = flightCount * 200;
                  const otherKg = otherCount * 5;
                  const totalKg = flightKg + otherKg;
                  return (
                    <div className="space-y-2">
                      <p className="text-2xl font-semibold">{totalKg.toLocaleString()} kg CO₂e</p>
                      <p className="text-sm text-muted-foreground">{flightCount} flight(s) ≈ {flightKg} kg · other activities ≈ {otherKg} kg. Offset or reduce flights to lower impact.</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Plane className="h-5 w-5 text-primary" /> Flight price watch</CardTitle>
                <CardDescription>Flag your flights so you remember to check prices later.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.filter((i) => i.type === "flight").length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add at least one flight to your itinerary to enable flight watch.</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Select a flight in your itinerary and click “Watch price” to record it. TripSync will support automatic alerts in a future update.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const firstFlight = items.find((i) => i.type === "flight");
                        if (!firstFlight) return;
                        try {
                          const res = await fetch(`/api/trips/${tripId}/flight-watch`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              flight: {
                                from: trip.destination,
                                to: firstFlight.location,
                                date: trip.startDate,
                                airline: firstFlight.name,
                              },
                            }),
                          });
                          if (!res.ok) throw new Error();
                          toast({
                            title: "Flight watch noted",
                            description: "We’ve recorded this flight. Price alerts will be available in a future release.",
                          });
                        } catch {
                          toast({
                            title: "Could not record flight watch",
                            description: "Please try again later.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Watch price for first flight
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Trip analytics</CardTitle>
                <CardDescription>Cost per person, activity breakdown, satisfaction.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Total spent</p><p className="text-xl font-semibold">${totalSpent.toFixed(0)}</p></div>
                  <div><p className="text-muted-foreground">Cost per person</p><p className="text-xl font-semibold">${members.length > 0 ? (totalSpent / members.length).toFixed(0) : "0"}</p></div>
                  <div><p className="text-muted-foreground">Budget per person</p><p className="text-xl font-semibold">${trip.budgetPerPerson}</p></div>
                  <div><p className="text-muted-foreground">Satisfaction</p><p className="text-xl font-semibold">{satisfaction.length > 0 ? (satisfaction.reduce((s, e) => s + e.score, 0) / satisfaction.length).toFixed(1) : "—"} / 5</p></div>
                </div>

                {members.length > 0 && expenses.length > 0 && (() => {
                  const perPersonSpent: Record<string, number> = {};
                  members.forEach((m) => (perPersonSpent[m.id] = 0));
                  expenses.forEach((e) => {
                    const perPerson = e.amount / e.splitAmong.length;
                    e.splitAmong.forEach((id: string) => { perPersonSpent[id] = (perPersonSpent[id] ?? 0) + perPerson; });
                  });
                  const barData = members.map((m) => ({ name: m.name, spent: Math.round(perPersonSpent[m.id] ?? 0) }));
                  return (
                    <div>
                      <p className="text-sm font-medium mb-2">Spending per person</p>
                      <ChartContainer config={{ spent: { label: "Spent ($)", color: "hsl(var(--primary))" } }} className="h-[200px]">
                        <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  );
                })()}

                {items.length > 0 && (() => {
                  const statusCounts = items.reduce<Record<string, number>>((acc, i) => { const s = i.bookingStatus ?? "not_started"; acc[s] = (acc[s] ?? 0) + 1; return acc; }, {});
                  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name: bookingStatusLabel[name] ?? name, value }));
                  const STATUS_COLORS: Record<string, string> = { not_started: "hsl(var(--muted-foreground))", suggested: "hsl(var(--primary) / 0.5)", in_progress: "hsl(var(--primary) / 0.8)", booked: "hsl(var(--primary))", cancelled: "hsl(var(--destructive))" };
                  if (statusData.length > 0) {
                    return (
                      <div>
                        <p className="text-sm font-medium mb-2">Booking status</p>
                        <ChartContainer config={Object.fromEntries(statusData.map((d, i) => [d.name, { label: d.name, color: Object.values(STATUS_COLORS)[i % 5] }]))} className="h-[200px]">
                          <PieChart>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {statusData.map((_, i) => <Cell key={i} fill={Object.values(STATUS_COLORS)[i % 5]} />)}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                      </div>
                    );
                  }
                  return null;
                })()}

                {items.length > 0 && (() => {
                  const typeCounts = items.reduce<Record<string, number>>((acc, i) => { acc[i.type] = (acc[i.type] ?? 0) + 1; return acc; }, {});
                  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
                  const COLORS = ["hsl(var(--primary))", "hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.6)", "hsl(var(--primary) / 0.4)"];
                  return (
                    <div>
                      <p className="text-sm font-medium mb-2">Activity types</p>
                      <ChartContainer config={Object.fromEntries(pieData.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]))} className="h-[200px]">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </div>
                  );
                })()}

                {Object.keys(votes).length > 0 && (() => {
                  const votedUp = Object.values(votes).reduce((s, v) => s + (v.up ?? 0), 0);
                  const votedDown = Object.values(votes).reduce((s, v) => s + (v.down ?? 0), 0);
                  const votedAbstain = Object.values(votes).reduce((s, v) => s + (v.abstain ?? 0), 0);
                  const total = votedUp + votedDown + votedAbstain;
                  if (total === 0) return null;
                  const voteData = [
                    { name: "Yes", value: votedUp, color: "hsl(var(--primary))" },
                    { name: "No", value: votedDown, color: "hsl(var(--destructive))" },
                    { name: "Abstain", value: votedAbstain, color: "hsl(var(--muted-foreground))" },
                  ].filter((d) => d.value > 0);
                  return (
                    <div>
                      <p className="text-sm font-medium mb-2">Voting participation</p>
                      <ChartContainer config={Object.fromEntries(voteData.map((d) => [d.name, { label: d.name, color: d.color }]))} className="h-[180px]">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie data={voteData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                            {voteData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </div>
                  );
                })()}

                <div>
                  <p className="text-sm font-medium mb-2">Rate this trip (1–5)</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Button key={n} size="sm" variant={satisfactionScore === n ? "default" : "outline"} onClick={() => { setSatisfactionScore(n); satisfactionMutation.mutate(n); }}>{n}</Button>
                    ))}
                  </div>
                  {satisfaction.length > 0 && <p className="text-xs text-muted-foreground mt-2">Average: {(satisfaction.reduce((s, e) => s + e.score, 0) / satisfaction.length).toFixed(1)} from {satisfaction.length} rating(s).</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Trip Members</h2>
                <Button variant="outline" onClick={copyShareLink} data-testid="button-invite">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy share link
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Copy the link to share via any app, or use the email form below to send invites directly.</p>
            </div>

            {!isPro && members.length >= 6 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="py-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">Free plan limited to 6 members per trip. Upgrade to Pro for unlimited members.</p>
                  <Button size="sm" asChild><Link href="/pricing?checkout=pro"><a className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />Upgrade</a></Link></Button>
                </CardContent>
              </Card>
            )}

            {isOrganizer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invite & share</CardTitle>
                  <CardDescription>Invite people directly, or share a public read‑only version of this trip.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={() => inviteEmail && createInviteMutation.mutate(inviteEmail)} disabled={!inviteEmail || createInviteMutation.isPending || (!isPro && members.length >= 6)}>
                      {createInviteMutation.isPending ? "Sending..." : "Send invite"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={copyShareLink}>
                      Copy join link
                    </Button>
                    <Button variant="outline" size="sm" onClick={sharePublicTrip}>
                      Share public trip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {invites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pending invites</CardTitle>
                  <CardDescription>Invites awaiting response.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {invites.filter((i) => i.status === "pending").map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-muted-foreground">{inv.email}</span>
                        <Badge variant="outline">Pending</Badge>
                      </li>
                    ))}
                  </ul>
                  {invites.filter((i) => i.status === "pending").length === 0 && (
                    <p className="text-sm text-muted-foreground">No pending invites.</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your preferences</CardTitle>
                <CardDescription>Three quick answers help the group plan. AI will use these when generating or updating the itinerary.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Budget band</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={prefForm.budgetBand}
                    onChange={(e) => setPrefForm((p) => ({ ...p, budgetBand: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Pace</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={prefForm.pace}
                    onChange={(e) => setPrefForm((p) => ({ ...p, pace: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="chill">Chill</option>
                    <option value="packed">Packed</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Diet / food constraints</label>
                  <Input
                    placeholder="e.g. Vegetarian, no shellfish, allergies..."
                    value={prefForm.diet}
                    onChange={(e) => setPrefForm((p) => ({ ...p, diet: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Accessibility (optional)</label>
                  <Input
                    placeholder="e.g. Wheelchair access, mobility considerations, step-free"
                    value={prefForm.accessibility ?? ""}
                    onChange={(e) => setPrefForm((p) => ({ ...p, accessibility: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">One must-do or non-negotiable</label>
                  <Input
                    placeholder="e.g. Sunset cruise, one fancy brunch, museum morning"
                    value={prefForm.mustDoActivities}
                    onChange={(e) => setPrefForm((p) => ({ ...p, mustDoActivities: e.target.value }))}
                  />
                </div>
                <Button onClick={() => preferencesMutation.mutate()} disabled={preferencesMutation.isPending}>
                  Save preferences
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => {
                const pref = preferences.find((p) => p.userId === member.id);
                const memberId = (member as { memberId?: string }).memberId ?? member.id;
                const isOrganizerMember = member.role === "organizer";
                const isCurrentUser = member.id === user?.id;
                return (
                  <Card key={member.id} data-testid={`card-member-${member.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{member.name}</div>
                          <div className="text-sm text-muted-foreground truncate">{member.email}</div>
                        </div>
                        <Badge variant="secondary">{member.role === "organizer" ? "Organizer" : member.role === "planner" ? "Planner" : "Member"}</Badge>
                      </div>
                      {isOrganizer && !isOrganizerMember && (
                        <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
                          <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            value={member.role}
                            onChange={(e) => changeRoleMutation.mutate({ memberId, role: e.target.value })}
                            disabled={changeRoleMutation.isPending}
                          >
                            <option value="member">Member</option>
                            <option value="planner">Planner</option>
                          </select>
                          {!isCurrentUser && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs" disabled={removeMemberMutation.isPending}>
                                  Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                  <AlertDialogDescription>Remove {member.name} from this trip? They will lose access.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => removeMemberMutation.mutate(memberId)}>Remove</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                      {pref && ((pref as { budgetBand?: string }).budgetBand || (pref as { pace?: string }).pace || pref.diet || pref.budgetFlexibility || pref.mustDoActivities || (pref as { accessibility?: string }).accessibility) && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                          {(pref as { budgetBand?: string }).budgetBand && <div>Budget band: {(pref as { budgetBand?: string }).budgetBand}</div>}
                          {(pref as { pace?: string }).pace && <div>Pace: {(pref as { pace?: string }).pace}</div>}
                          {pref.diet && <div>Diet: {pref.diet}</div>}
                          {pref.budgetFlexibility && <div>Budget: {pref.budgetFlexibility}</div>}
                          {pref.mustDoActivities && <div>Must-do: {pref.mustDoActivities}</div>}
                          {(pref as { accessibility?: string }).accessibility && <div>Accessibility: {(pref as { accessibility?: string }).accessibility}</div>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {trip.shareCode && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">Share Link</div>
                      <code className="text-sm text-muted-foreground">
                        {window.location.origin}/join/{trip.shareCode}
                      </code>
                    </div>
                    <Button variant="outline" size="icon" onClick={copyShareLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
