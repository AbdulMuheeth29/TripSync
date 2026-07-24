import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MessageCircle, Sparkles, X, Minus, MapPin, Calendar, Users } from 'lucide-react';
import { useProactiveTriggers, type AtlasContext } from '@/hooks/atlas/useProactiveTriggers';

type AtlasRole = 'atlas' | 'user' | 'system';

type AtlasMessage = {
  id: string;
  role: AtlasRole;
  text: string;
  createdAt: string;
  kind?: 'proactive' | 'reply' | 'note';
  meta?: {
    source?: 'trip-detail' | 'dashboard' | 'landing' | 'unknown';
  };
};

type AtlasAgentState = {
  inactivitySeconds: number;
  timeOnPageSeconds: number;
  pathname: string;
  tripId: string | null;
};

type AtlasTripSummary = {
  id: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  groupSize: number | null;
  status?: string | null;
  isLocked?: boolean;
  vibes?: string[] | null;
  itineraryItems: number;
  totalBudget: number;
  totalExpenses: number;
  overBudget: boolean;
  overAmount: number;
  daysUntilTrip: number | null;
  completionPercentage: number;
  stuckVotes: number;
};

type AtlasQuickPrompt = {
  id: string;
  label: string;
  text: string;
};

const INACTIVITY_THRESHOLD = 45; // seconds before we consider the user "stuck"

function createInitialGreeting(pathname: string): AtlasMessage {
  const isTripPage = /^\/trip\/[^/]+/.test(pathname);
  const text = isTripPage
    ? "Hey, I'm Atlas. I can help you tune this itinerary, resolve group conflicts, or suggest quick changes. What are you trying to decide?"
    : "Hey, I'm Atlas. I help you plan smarter group trips, from first idea to final recap. Where are you in your planning right now?";

  return {
    id: 'atlas-welcome',
    role: 'atlas',
    text,
    createdAt: new Date().toISOString(),
    kind: 'reply',
    meta: {
      source: isTripPage ? 'trip-detail' : 'unknown',
    },
  };
}

export function AtlasAgent() {
  const { user } = useAuth();
  const [pathname] = useLocation();

  // Only show Atlas for authenticated users for now
  if (!user) return null;

  return <AtlasAgentInner pathname={pathname} />;
}

function AtlasAgentInner({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [state, setState] = useState<AtlasAgentState>(() => ({
    inactivitySeconds: 0,
    timeOnPageSeconds: 0,
    pathname,
    tripId: extractTripId(pathname),
  }));
  const [messages, setMessages] = useState<AtlasMessage[]>(() => [createInitialGreeting(pathname)]);
  const [hasFiredInactivityNudge, setHasFiredInactivityNudge] = useState(false);
  const [tripSummary, setTripSummary] = useState<AtlasTripSummary | null>(null);
  const [tripSummaryLoading, setTripSummaryLoading] = useState(false);
  const [tripSummaryError, setTripSummaryError] = useState<string | null>(null);
  const [hasAnnouncedTripContext, setHasAnnouncedTripContext] = useState(false);
  const [backButtonClicks, setBackButtonClicks] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastActionRef = useRef<string | undefined>(undefined);

  // Load persisted Atlas conversation (per-trip, per-user) when trip changes
  useEffect(() => {
    const loadConversation = async () => {
      if (!state.tripId) return;
      try {
        const res = await fetch(
          `/api/trips/${encodeURIComponent(state.tripId)}/atlas/conversation`,
          {
            credentials: 'include',
          }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: AtlasMessage[] };
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      } catch {
        // Ignore conversation loading errors; Atlas still functions without memory.
      }
    };
    loadConversation();
  }, [state.tripId]);

  async function saveMessage(message: AtlasMessage) {
    if (!state.tripId) return;
    try {
      await fetch(`/api/trips/${encodeURIComponent(state.tripId)}/atlas/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message }),
      });
    } catch {
      // Non-fatal; Atlas continues even if memory persistence fails.
    }
  }

  // Keep derived state in sync with route changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      pathname,
      tripId: extractTripId(pathname),
      timeOnPageSeconds: 0,
      inactivitySeconds: 0,
    }));
    setTripSummary(null);
    setTripSummaryError(null);
    setTripSummaryLoading(false);
    setHasAnnouncedTripContext(false);
    setHasFiredInactivityNudge(false);
  }, [pathname]);

  // Fetch a lightweight trip summary once Atlas is opened on a trip page
  useEffect(() => {
    if (!isOpen || !state.tripId) return;

    let cancelled = false;
    async function loadTripSummary() {
      try {
        setTripSummaryLoading(true);
        setTripSummaryError(null);
        const res = await fetch(`/api/trips/${encodeURIComponent(state.tripId!)}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to load trip');
        }
        const data = await res.json();
        const t = data?.trip;
        if (!cancelled && t) {
          const items = Array.isArray(data?.items) ? (data.items as any[]) : [];
          const expenses = Array.isArray(data?.expenses) ? (data.expenses as any[]) : [];
          const votesRecord = (data?.votes ?? {}) as Record<
            string,
            { up?: number; down?: number; abstain?: number }
          >;
          const voteValues = Object.values(votesRecord);
          const stuckVotes = voteValues.filter((v) => {
            const up = typeof v.up === 'number' ? v.up : 0;
            const down = typeof v.down === 'number' ? v.down : 0;
            return up === down && up + down > 0;
          }).length;
          const start = t.startDate ? new Date(t.startDate) : null;
          const end = t.endDate ? new Date(t.endDate) : null;
          const tripDays =
            start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
              ? Math.max(
                  1,
                  Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                )
              : null;
          const daysUntilTrip =
            start && !Number.isNaN(start.getTime())
              ? Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
          const groupSize = typeof t.groupSize === 'number' ? t.groupSize : null;
          const budgetPerPerson = typeof t.budgetPerPerson === 'number' ? t.budgetPerPerson : 0;
          const computedGroupSize =
            groupSize && groupSize > 0 ? groupSize : (data?.members?.length ?? 0);
          const totalBudget = budgetPerPerson * (computedGroupSize || 0);
          const totalExpenses = expenses.reduce(
            (sum, e: any) => sum + (typeof e.amount === 'number' ? e.amount : 0),
            0
          );
          const overBudget = totalBudget > 0 && totalExpenses > totalBudget;
          const overAmount = overBudget ? totalExpenses - totalBudget : 0;
          const completionBase = tripDays && tripDays > 0 ? tripDays * 3 : 6;
          const completionPercentage =
            completionBase > 0
              ? Math.min(100, Math.round((items.length / completionBase) * 100))
              : 0;

          setTripSummary({
            id: t.id,
            destination: t.destination,
            startDate: t.startDate ?? null,
            endDate: t.endDate ?? null,
            groupSize,
            status: t.status ?? null,
            isLocked: Boolean(t.isLocked),
            vibes: Array.isArray(t.vibes) ? t.vibes : null,
            itineraryItems: items.length,
            totalBudget,
            totalExpenses,
            overBudget,
            overAmount,
            daysUntilTrip,
            completionPercentage,
            stuckVotes,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setTripSummaryError('Couldn’t load trip context.');
        }
      } finally {
        if (!cancelled) {
          setTripSummaryLoading(false);
        }
      }
    }

    loadTripSummary();

    return () => {
      cancelled = true;
    };
  }, [isOpen, state.tripId]);

  // Track inactivity & time on page
  useEffect(() => {
    function markActivity() {
      lastActivityRef.current = Date.now();
      setState((prev) => ({
        ...prev,
        inactivitySeconds: 0,
      }));
    }

    window.addEventListener('click', markActivity);
    window.addEventListener('keydown', markActivity);
    window.addEventListener('scroll', markActivity, { passive: true });

    const handlePopState = () => {
      setBackButtonClicks((prev) => prev + 1);
    };
    window.addEventListener('popstate', handlePopState);

    idleTimerRef.current = window.setInterval(() => {
      const now = Date.now();
      const sinceLast = Math.floor((now - lastActivityRef.current) / 1000);
      setState((prev) => ({
        ...prev,
        inactivitySeconds: sinceLast,
        timeOnPageSeconds: prev.timeOnPageSeconds + 1,
      }));
    }, 1000);

    return () => {
      window.removeEventListener('click', markActivity);
      window.removeEventListener('keydown', markActivity);
      window.removeEventListener('scroll', markActivity);
      window.removeEventListener('popstate', handlePopState);
      if (idleTimerRef.current != null) {
        window.clearInterval(idleTimerRef.current);
      }
    };
  }, []);

  const tripId = state.tripId;
  const isTripPage = Boolean(tripId);
  const tripDatesLabel = tripSummary
    ? formatDateRange(tripSummary.startDate, tripSummary.endDate)
    : null;

  const atlasContext: AtlasContext | null =
    isTripPage && tripSummary
      ? {
          destination: tripSummary.destination,
          tripDays:
            tripSummary.startDate && tripSummary.endDate
              ? Math.max(
                  1,
                  Math.round(
                    (new Date(tripSummary.endDate).getTime() -
                      new Date(tripSummary.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1
                )
              : null,
          itineraryItems: tripSummary.itineraryItems,
          overBudget: tripSummary.overBudget,
          overAmount: tripSummary.overAmount,
          largestExpenseTitle: undefined,
          largestExpenseAmount: undefined,
          stuckVotes: tripSummary.stuckVotes,
          daysUntilTrip: tripSummary.daysUntilTrip,
          completionPercentage: tripSummary.completionPercentage,
          backButtonClicks,
          timeOnPage: state.timeOnPageSeconds,
        }
      : null;

  const proactiveTriggers = useProactiveTriggers(atlasContext);

  // Announce trip context once, when we know which trip this is
  useEffect(() => {
    if (!tripSummary || hasAnnouncedTripContext) return;

    const pieces: string[] = [];
    if (tripSummary.destination) pieces.push(tripSummary.destination);
    if (tripDatesLabel) pieces.push(tripDatesLabel);

    const base = pieces.length ? pieces.join(' · ') : 'this trip';
    const groupPart =
      typeof tripSummary.groupSize === 'number' && tripSummary.groupSize > 0
        ? ` with ${tripSummary.groupSize} travelers`
        : '';

    const text = `I’m looking at ${base}${groupPart}. Tell me what feels unclear or where the plan isn’t quite right yet.`;

    const msg: AtlasMessage = {
      id: `atlas-context-${Date.now()}`,
      role: 'atlas',
      text,
      createdAt: new Date().toISOString(),
      kind: 'proactive',
      meta: { source: 'trip-detail' },
    };

    setMessages((prev) => [...prev, msg]);
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
    setHasAnnouncedTripContext(true);
  }, [tripSummary, hasAnnouncedTripContext, tripDatesLabel, isOpen]);

  // Proactive nudge when user seems stuck on a trip page
  useEffect(() => {
    if (hasFiredInactivityNudge) return;
    if (!state.tripId) return;
    if (state.inactivitySeconds < INACTIVITY_THRESHOLD) return;

    const nudge: AtlasMessage = {
      id: `atlas-nudge-${Date.now()}`,
      role: 'atlas',
      text: 'Not sure what to do next on this trip? I can suggest quick changes like adding meals, rebalancing days, or resolving voting deadlocks. Ask me something like “spread out our activities more” or “help us pick a dinner spot for night two.”',
      createdAt: new Date().toISOString(),
      kind: 'proactive',
      meta: { source: 'trip-detail' },
    };

    setMessages((prev) => [...prev, nudge]);
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
    setHasFiredInactivityNudge(true);
  }, [state.tripId, state.inactivitySeconds, hasFiredInactivityNudge, isOpen]);
  // Auto-scroll chat when new messages arrive and panel is open
  useEffect(() => {
    if (!isOpen) return;
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, isOpen]);

  const placeholder = useMemo(() => {
    if (isTripPage) {
      return 'Ask Atlas to tweak this itinerary or fix a trip problem…';
    }
    return 'Ask Atlas anything about planning a group trip…';
  }, [isTripPage]);

  const quickPrompts: AtlasQuickPrompt[] = useMemo(() => {
    if (isTripPage) {
      return [
        {
          id: 'rebalance-days',
          label: 'Rebalance busy days',
          text: 'Our itinerary feels too packed on some days. Suggest how to rebalance activities across days to make the trip feel more relaxed.',
        },
        {
          id: 'add-local-food',
          label: 'Add local food',
          text: 'Suggest 2-3 local food spots we should add to this itinerary and which days they best fit on.',
        },
        {
          id: 'resolve-decision',
          label: 'Resolve a decision',
          text: 'We’re stuck deciding between a few activities. Ask me a couple of questions and then propose a fair resolution for the group.',
        },
      ];
    }
    return [
      {
        id: 'plan-first-trip',
        label: 'Plan my first trip',
        text: 'Help me plan my first group trip in TripSync, step by step, using the main features that will save us the most time.',
      },
      {
        id: 'get-more-value',
        label: 'Make trips better',
        text: 'Explain how to get the most value from TripSync with my group, from first idea to post-trip recap.',
      },
    ];
  }, [isTripPage]);

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    const userMessage: AtlasMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
      kind: 'reply',
    };
    setMessages((prev) => [...prev, userMessage]);
    void saveMessage(userMessage);
    setInput('');
    setIsSending(true);
    lastActionRef.current = 'atlas_message';

    try {
      if (!tripId) {
        const fallback: AtlasMessage = {
          id: `atlas-fallback-${Date.now()}`,
          role: 'atlas',
          text: 'Right now I’m best at helping on specific trips. Open a trip detail page and ask me to adjust the itinerary, rebalance days, or help with decisions there.',
          createdAt: new Date().toISOString(),
          kind: 'note',
        };
        setMessages((prev) => [...prev, fallback]);
        return;
      }

      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/planning-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userMessage: text,
          currentPage: pathname,
          timeOnPage: state.timeOnPageSeconds,
          lastAction: lastActionRef.current ?? 'atlas_message',
          inactivityTime: state.inactivitySeconds,
        }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const data = (await res.json()) as { suggestion: string; action?: string };
      const reply: AtlasMessage = {
        id: `atlas-reply-${Date.now()}`,
        role: 'atlas',
        text: data.suggestion || 'Got it. You can also adjust items directly in the Itinerary tab.',
        createdAt: new Date().toISOString(),
        kind: 'reply',
        meta: { source: 'trip-detail' },
      };
      setMessages((prev) => [...prev, reply]);
      void saveMessage(reply);
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (err) {
      const errorMessage: AtlasMessage = {
        id: `atlas-error-${Date.now()}`,
        role: 'system',
        text: 'Atlas ran into a connection issue. Try again in a moment, or use the usual trip actions while I reconnect.',
        createdAt: new Date().toISOString(),
        kind: 'note',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }

  function handleToggleOpen() {
    setIsOpen((prev) => !prev);
    if (!hasEverOpened) {
      setHasEverOpened(true);
    }
    if (!isOpen) {
      setUnreadCount(0);
    }
  }

  function handleMinimize() {
    setIsOpen(false);
  }

  return (
    <>
      {/* Floating launcher */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
        {!isOpen && (
          <button
            type="button"
            onClick={handleToggleOpen}
            className={cn(
              'relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
            aria-label="Open Atlas, your trip planning assistant"
          >
            <Sparkles className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-medium">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-popover shadow-xl shadow-black/15 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2.5 bg-muted/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">Atlas</span>
                  <span className="text-[11px] rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600">
                    Live
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  Your proactive trip co‑planner
                </p>
                {isTripPage && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    {tripSummary && (
                      <>
                        {tripSummary.destination && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 border border-border/60">
                            <MapPin className="h-3 w-3" />
                            <span>{tripSummary.destination}</span>
                          </span>
                        )}
                        {tripDatesLabel && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 border border-border/60">
                            <Calendar className="h-3 w-3" />
                            <span>{tripDatesLabel}</span>
                          </span>
                        )}
                        {typeof tripSummary.groupSize === 'number' && tripSummary.groupSize > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 border border-border/60">
                            <Users className="h-3 w-3" />
                            <span>{tripSummary.groupSize} travelers</span>
                          </span>
                        )}
                        {tripSummary.status && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 border border-border/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="capitalize">
                              {tripSummary.isLocked ? 'Locked' : tripSummary.status}
                            </span>
                          </span>
                        )}
                      </>
                    )}
                    {tripSummaryLoading && !tripSummary && (
                      <span className="text-[11px] text-muted-foreground">Loading trip…</span>
                    )}
                    {tripSummaryError && !tripSummary && (
                      <span className="text-[11px] text-amber-600">{tripSummaryError}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleMinimize}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                aria-label="Minimize Atlas"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleToggleOpen}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                aria-label="Close Atlas"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <ScrollArea className="h-[260px]">
              <div ref={scrollRef} className="px-3 py-3 space-y-2 text-sm">
                {proactiveTriggers.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {proactiveTriggers.map((t) => (
                      <div
                        key={t.type}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900"
                      >
                        {t.message}
                      </div>
                    ))}
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                        m.role === 'user' && 'bg-primary text-primary-foreground rounded-br-sm',
                        m.role === 'atlas' &&
                          'bg-muted text-foreground rounded-bl-sm border border-border/60',
                        m.role === 'system' && 'bg-amber-50 text-amber-900 border border-amber-200'
                      )}
                    >
                      {m.role === 'atlas' && (
                        <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                          <Sparkles className="h-3 w-3" />
                          <span>Atlas</span>
                        </div>
                      )}
                      <p>{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t bg-background px-3 py-2.5">
              {quickPrompts.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {quickPrompts.map((qp) => (
                    <Button
                      key={qp.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      disabled={isSending}
                      onClick={() => handleSend(qp.text)}
                    >
                      {qp.label}
                    </Button>
                  ))}
                </div>
              )}
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  className="resize-none text-xs leading-normal"
                  disabled={isSending}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    <span>
                      {tripId
                        ? 'Atlas is tuned to this trip’s itinerary.'
                        : 'Atlas works best on specific trips.'}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isSending}
                    className="h-7 px-3 text-xs"
                  >
                    {isSending ? 'Thinking…' : 'Ask Atlas'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function extractTripId(pathname: string): string | null {
  const match = pathname.match(/^\/trip\/([^/]+)/);
  return match ? match[1] : null;
}

function formatShortDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
): string | null {
  const startLabel = formatShortDate(start);
  const endLabel = formatShortDate(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel ?? endLabel;
}
