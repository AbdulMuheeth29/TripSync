import { useState } from "react";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
} from "lucide-react";
import type { Trip, ItineraryItem, Comment, Vote, Expense, User } from "@shared/schema";

const typeIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Hotel,
  dining: Utensils,
  activity: Activity,
};

const typeColors: Record<string, string> = {
  flight: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  hotel: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  dining: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  activity: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const statusBadgeColors: Record<string, string> = {
  suggested: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  booking_in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  booked: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface TripDetailData {
  trip: Trip;
  items: ItineraryItem[];
  comments: Record<string, Comment[]>;
  votes: Record<string, { up: number; down: number; userVote?: string }>;
  members: (User & { role: string })[];
  expenses: Expense[];
}

function ItineraryItemCard({
  item,
  comments,
  votes,
  tripId,
  isLocked,
}: {
  item: ItineraryItem;
  comments: Comment[];
  votes: { up: number; down: number; userVote?: string };
  tripId: string;
  isLocked: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const Icon = typeIcons[item.type] || Activity;

  const voteMutation = useMutation({
    mutationFn: async (voteType: "up" | "down") => {
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
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/trips/${tripId}/items/${item.id}`, {
        bookingStatus: status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({
        title: "Status updated",
        description: "Item status has been updated",
      });
    },
  });

  const getBookingUrl = () => {
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
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-medium truncate">{item.name}</h3>
              <Badge variant="outline" className={statusBadgeColors[item.bookingStatus]}>
                {item.bookingStatus === "booking_in_progress" ? "In Progress" : item.bookingStatus}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {item.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.time}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {item.location}
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
                  className={`h-8 px-2 ${votes.userVote === "up" ? "text-green-600" : ""}`}
                  onClick={() => voteMutation.mutate("up")}
                  disabled={isLocked}
                  data-testid={`button-vote-up-${item.id}`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {votes.up}
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${votes.userVote === "down" ? "text-red-600" : ""}`}
                  onClick={() => voteMutation.mutate("down")}
                  disabled={isLocked}
                  data-testid={`button-vote-down-${item.id}`}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {votes.down}
                </Button>
              </div>

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

              {item.bookingStatus !== "booked" && !isLocked && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => updateStatusMutation.mutate(item.bookingStatus === "suggested" ? "booking_in_progress" : "booked")}
                  data-testid={`button-status-${item.id}`}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {item.bookingStatus === "suggested" ? "Mark In Progress" : "Mark Booked"}
                </Button>
              )}
            </div>

            {showComments && (
              <div className="mt-4 pt-4 border-t space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <span className="font-medium">{comment.userId}</span>
                    <span className="text-muted-foreground ml-2">{comment.content}</span>
                  </div>
                ))}
                {!isLocked && (
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

function ExpenseItem({ expense, members }: { expense: Expense; members: User[] }) {
  const payer = members.find((m) => m.id === expense.paidByUserId);
  const splitCount = expense.splitAmong.length;
  const perPerson = expense.amount / splitCount;

  return (
    <Card data-testid={`card-expense-${expense.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-medium">{expense.description}</div>
            <div className="text-sm text-muted-foreground">
              {payer?.name || "Unknown"} paid ${expense.amount.toFixed(2)}
              {expense.location && ` at ${expense.location}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Split among {splitCount} people (${perPerson.toFixed(2)}/person)
            </div>
          </div>
          <Badge variant={expense.isSettled ? "outline" : "default"}>
            {expense.isSettled ? "Settled" : "Pending"}
          </Badge>
        </div>
      </CardContent>
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
    description: "",
    location: "",
  });

  const { data, isLoading, error } = useQuery<TripDetailData>({
    queryKey: ["/api/trips", tripId],
    enabled: !!tripId,
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
      return apiRequest("POST", `/api/trips/${tripId}/expenses`, {
        paidByUserId: user?.id,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        location: expenseForm.location,
        splitAmong: data?.members.map((m) => m.id) || [user?.id],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      setNewExpenseOpen(false);
      setExpenseForm({ amount: "", description: "", location: "" });
      toast({
        title: "Expense added",
        description: "The expense has been recorded",
      });
    },
  });

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/join/${data?.trip.shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share this link with your group members",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Trip not found</h2>
            <p className="text-muted-foreground mb-4">
              This trip may have been deleted or you don't have access.
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { trip, items, comments, votes, members, expenses } = data;
  const isOrganizer = trip.organizerId === user?.id;

  const itemsByDay = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    if (!acc[item.dayNumber]) acc[item.dayNumber] = [];
    acc[item.dayNumber].push(item);
    return acc;
  }, {});

  const bookedCount = items.filter((i) => i.bookingStatus === "booked").length;
  const progressPercent = items.length > 0 ? (bookedCount / items.length) * 100 : 0;

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetTotal = trip.budgetPerPerson * trip.groupSize;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Plane className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold hidden sm:block">TripSync</span>
          </div>

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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-trip-destination">
                {trip.destination}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" - "}
                  {new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {members.length}/{trip.groupSize} members
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
        </div>

        <Tabs defaultValue="itinerary">
          <TabsList className="mb-6">
            <TabsTrigger value="itinerary" data-testid="tab-itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="space-y-8">
            {Object.entries(itemsByDay)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([day, dayItems]) => (
                <div key={day}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Day {day}
                  </h2>
                  <div className="space-y-4">
                    {dayItems
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((item) => (
                        <ItineraryItemCard
                          key={item.id}
                          item={item}
                          comments={comments[item.id] || []}
                          votes={votes[item.id] || { up: 0, down: 0 }}
                          tripId={tripId!}
                          isLocked={!!trip.isLocked}
                        />
                      ))}
                  </div>
                </div>
              ))}

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

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Expense Tracking</h2>
                <p className="text-sm text-muted-foreground">
                  Total: ${totalSpent.toFixed(2)} / ${budgetTotal} budget
                </p>
              </div>
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount ($)</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        data-testid="input-expense-amount"
                      />
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
                    <Button
                      className="w-full"
                      onClick={() => addExpenseMutation.mutate()}
                      disabled={!expenseForm.amount || !expenseForm.description || addExpenseMutation.isPending}
                      data-testid="button-submit-expense"
                    >
                      {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Progress value={(totalSpent / budgetTotal) * 100} className="h-3" />

            <div className="space-y-4">
              {expenses.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} members={members} />
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

          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Trip Members</h2>
              <Button variant="outline" onClick={copyShareLink} data-testid="button-invite">
                <Share2 className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
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
                      {member.role === "organizer" && (
                        <Badge variant="secondary">Organizer</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
