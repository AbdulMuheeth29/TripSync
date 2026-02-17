/**
 * Admin metrics dashboard – separate from main app.
 * Toggle between Web, iOS, and Android. Per-metric toggles to show/hide.
 * Access: /admin/metrics (backend validates ADMIN_EMAILS).
 */

import { useState, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  Users,
  Plane,
  Calendar,
  MessageSquare,
  UserPlus,
  Monitor,
  Smartphone,
  TabletSmartphone,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  ALL_SECTIONS,
  getMetricToggles,
  setMetricToggle,
  type MetricDef,
  type MetricSection,
} from "./metrics-config";

type MetricsPlatform = "web" | "ios" | "android";

const PLATFORM_OPTIONS: { value: MetricsPlatform; label: string; icon: typeof Monitor }[] = [
  { value: "web", label: "Web", icon: Monitor },
  { value: "ios", label: "iOS", icon: Smartphone },
  { value: "android", label: "Android", icon: TabletSmartphone },
];

interface AdminMetrics {
  platform: MetricsPlatform;
  totalUsers: number;
  totalTrips: number;
  totalItineraryItems: number;
  totalChatMessages: number;
  totalMembers: number;
}

function formatValue(value: number | string | undefined, format?: string): string {
  if (value === undefined || value === null) return "—";
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(n)) return String(value);
  switch (format) {
    case "percent":
      return `${n.toFixed(1)}%`;
    case "currency":
      return `$${n.toLocaleString()}`;
    case "time":
      return n < 60 ? `${n}s` : `${(n / 60).toFixed(1)}m`;
    case "ratio":
      return `${n.toFixed(1)}:1`;
    default:
      return n.toLocaleString();
  }
}

function getMetricValue(id: string, data: AdminMetrics | null): number | string | undefined {
  if (!data) return undefined;
  const map: Record<string, number> = {
    "total-users": data.totalUsers,
    "total-trips": data.totalTrips,
    "trips-per-week": data.totalTrips,
    "completed-trips": data.totalTrips,
    "p-completed-trips": data.totalTrips,
    "ns-signups": data.totalUsers,
    "p-signups": data.totalUsers,
    "total-members": data.totalMembers,
    "p-trip-creators": data.totalTrips,
    "ns-trip-creators": data.totalTrips,
    "ns-invites-accepted": data.totalMembers,
    "ns-itineraries-generated": data.totalItineraryItems,
    "expenses-per-trip": 0,
    "docs-per-trip": 0,
    "votes-per-item": 0,
  };
  return map[id];
}

function ToggleableMetricRow({
  metric,
  data,
  toggles,
  onToggle,
}: {
  metric: MetricDef;
  data: AdminMetrics | null;
  toggles: Record<string, boolean>;
  onToggle: (id: string, on: boolean) => void;
}) {
  const isOn = toggles[metric.id] ?? metric.defaultOn ?? true;
  const displayValue = getMetricValue(metric.id, data);

  return (
    <div
      className={`flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 group ${
        !isOn ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label htmlFor={metric.id} className="text-sm font-medium cursor-pointer truncate">
            {metric.label}
          </Label>
          {metric.description && (
            <span className="text-xs text-muted-foreground truncate">({metric.description})</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isOn && (
          <span className="text-sm font-mono tabular-nums text-muted-foreground min-w-[4rem] text-right">
            {formatValue(displayValue as number, metric.format)}
          </span>
        )}
        <Switch
          id={metric.id}
          checked={isOn}
          onCheckedChange={(checked) => onToggle(metric.id, checked)}
          className="opacity-60 group-hover:opacity-100"
        />
      </div>
    </div>
  );
}

function MetricSectionCard({
  section,
  data,
  toggles,
  onToggle,
  defaultOpen,
}: {
  section: MetricSection;
  data: AdminMetrics | null;
  toggles: Record<string, boolean>;
  onToggle: (id: string, on: boolean) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const visibleCount = section.metrics.filter((m) => toggles[m.id] ?? m.defaultOn ?? true).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {open ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <CardTitle className="text-base">{section.title}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  ({visibleCount}/{section.metrics.length} shown)
                </span>
              </div>
            </div>
            {section.description && (
              <CardDescription className="text-left mt-1">{section.description}</CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-0 divide-y divide-border/50">
              {section.metrics.map((metric) => (
                <ToggleableMetricRow
                  key={metric.id}
                  metric={metric}
                  data={data ?? null}
                  toggles={toggles}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function MetricsDashboard() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<MetricsPlatform>("web");
  const [toggles, setTogglesState] = useState<Record<string, boolean>>(getMetricToggles);

  const onToggle = useCallback((id: string, on: boolean) => {
    setMetricToggle(id, on);
    setTogglesState((prev) => ({ ...prev, [id]: on }));
  }, []);

  const { data, isLoading, error } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics", platform, user?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/metrics?userId=${encodeURIComponent(user!.id)}&platform=${platform}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Sign in to access the admin dashboard.</p>
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to app
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Admin</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-semibold">Metrics Dashboard</h1>
          <CardDescription className="mt-1">
            Track app metrics across Web, iOS, and Android. Toggle each metric on/off — preferences are saved.
          </CardDescription>
        </div>

        {/* Platform toggle */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Platform</CardTitle>
            <CardDescription>Select which platform to view metrics for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = platform === opt.value;
                return (
                  <Button
                    key={opt.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlatform(opt.value)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="p-6">
              <p className="text-destructive font-medium">Access denied or error</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(error as Error).message}. Set ADMIN_EMAILS (your email) in the server environment.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Platform: <strong>{platform}</strong> — Values shown from live data where available; others are placeholders (—) until wired.
            </p>

            {/* Core metrics row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              <Card className="card-3d">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Users</p>
                      <p className="text-xl font-bold">{data?.totalUsers ?? "—"}</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-3d">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Trips</p>
                      <p className="text-xl font-bold">{data?.totalTrips ?? "—"}</p>
                    </div>
                    <Plane className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-3d">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Itinerary items</p>
                      <p className="text-xl font-bold">{data?.totalItineraryItems ?? "—"}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-3d">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Chat messages</p>
                      <p className="text-xl font-bold">{data?.totalChatMessages ?? "—"}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-3d">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="text-xl font-bold">{data?.totalMembers ?? "—"}</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature KPIs & Dashboards */}
            {ALL_SECTIONS.map((section, i) => (
              <MetricSectionCard
                key={section.id}
                section={section}
                data={data ?? null}
                toggles={toggles}
                onToggle={onToggle}
                defaultOpen={i < 3}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
