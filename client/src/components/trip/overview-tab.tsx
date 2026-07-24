import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Calendar,
  Vote,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  ThumbsUp,
  Plus,
  Settings,
} from 'lucide-react';
import type { Trip, ItineraryItem, Expense, Comment, Vote as VoteType } from '@shared/schema';

interface OverviewTabProps {
  trip: Trip;
  itineraryItems: ItineraryItem[];
  expenses: Expense[];
  comments: Comment[];
  votes: VoteType[];
  members: any[];
  onGenerateItinerary?: () => void;
  onSetPreferences?: () => void;
  onReviewVotes?: () => void;
  onAddExpense?: () => void;
}

interface TripHealthMetrics {
  score: number;
  status: 'excellent' | 'good' | 'needs-attention' | 'critical';
  factors: {
    itinerary: { score: number; message: string };
    budget: { score: number; message: string };
    voting: { score: number; message: string };
    participation: { score: number; message: string };
  };
}

function calculateTripHealth(
  trip: Trip,
  itineraryItems: ItineraryItem[],
  expenses: Expense[],
  votes: VoteType[],
  members: any[]
): TripHealthMetrics {
  const factors = {
    itinerary: { score: 0, message: '' },
    budget: { score: 0, message: '' },
    voting: { score: 0, message: '' },
    participation: { score: 0, message: '' },
  };

  // Itinerary completeness (0-25 points)
  const daysUntilTrip = Math.floor(
    (new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const tripDuration = Math.floor(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const itemsPerDay = itineraryItems.length / Math.max(tripDuration, 1);

  if (itineraryItems.length === 0) {
    factors.itinerary.score = 0;
    factors.itinerary.message = 'No itinerary items yet';
  } else if (itemsPerDay >= 3) {
    factors.itinerary.score = 25;
    factors.itinerary.message = 'Comprehensive itinerary';
  } else if (itemsPerDay >= 2) {
    factors.itinerary.score = 18;
    factors.itinerary.message = 'Good itinerary coverage';
  } else {
    factors.itinerary.score = 10;
    factors.itinerary.message = 'Needs more planning';
  }

  // Budget tracking (0-25 points)
  const totalBudget = trip.budgetPerPerson * trip.groupSize;
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (expenses.length === 0) {
    factors.budget.score = 15;
    factors.budget.message = 'No expenses tracked yet';
  } else if (budgetUsed <= 90) {
    factors.budget.score = 25;
    factors.budget.message = 'On track';
  } else if (budgetUsed <= 110) {
    factors.budget.score = 18;
    factors.budget.message = 'Near budget limit';
  } else {
    factors.budget.score = 10;
    factors.budget.message = 'Over budget';
  }

  // Voting participation (0-25 points)
  const itemsNeedingVotes = itineraryItems.filter((item) => !item.locked).length;
  const votesPerItem = itemsNeedingVotes > 0 ? votes.length / itemsNeedingVotes : 0;
  const memberCount = members.length;
  const votingParticipation = memberCount > 0 ? (votesPerItem / memberCount) * 100 : 0;

  if (itemsNeedingVotes === 0) {
    factors.voting.score = 20;
    factors.voting.message = 'All items decided';
  } else if (votingParticipation >= 80) {
    factors.voting.score = 25;
    factors.voting.message = 'High participation';
  } else if (votingParticipation >= 50) {
    factors.voting.score = 15;
    factors.voting.message = 'Moderate participation';
  } else {
    factors.voting.score = 8;
    factors.voting.message = 'Low participation';
  }

  // Member participation (0-25 points)
  const activeMembers = members.filter((m) => m.rsvpStatus === 'accepted').length;
  const participationRate = memberCount > 0 ? (activeMembers / memberCount) * 100 : 0;

  if (participationRate >= 90) {
    factors.participation.score = 25;
    factors.participation.message = 'Everyone engaged';
  } else if (participationRate >= 70) {
    factors.participation.score = 18;
    factors.participation.message = 'Good engagement';
  } else if (participationRate >= 50) {
    factors.participation.score = 12;
    factors.participation.message = 'Some pending RSVPs';
  } else {
    factors.participation.score = 5;
    factors.participation.message = 'Many pending RSVPs';
  }

  const totalScore =
    factors.itinerary.score +
    factors.budget.score +
    factors.voting.score +
    factors.participation.score;

  let status: 'excellent' | 'good' | 'needs-attention' | 'critical';
  if (totalScore >= 85) status = 'excellent';
  else if (totalScore >= 70) status = 'good';
  else if (totalScore >= 50) status = 'needs-attention';
  else status = 'critical';

  return { score: totalScore, status, factors };
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'excellent':
      return 'text-green-600 dark:text-green-400';
    case 'good':
      return 'text-blue-600 dark:text-blue-400';
    case 'needs-attention':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'critical':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-neutral-600 dark:text-neutral-400';
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'excellent':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'good':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'needs-attention':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
  }
}

export function OverviewTab({
  trip,
  itineraryItems,
  expenses,
  comments,
  votes,
  members,
  onGenerateItinerary,
  onSetPreferences,
  onReviewVotes,
  onAddExpense,
}: OverviewTabProps) {
  const health = calculateTripHealth(trip, itineraryItems, expenses, votes, members);

  // Calculate statistics
  const daysUntilTrip = Math.floor(
    (new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const totalBudget = trip.budgetPerPerson * trip.groupSize;
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budgetRemaining = totalBudget - totalSpent;
  const bookedItems = itineraryItems.filter((item) => item.bookingStatus === 'booked').length;
  const bookingProgress =
    itineraryItems.length > 0 ? (bookedItems / itineraryItems.length) * 100 : 0;

  // Recent activity (last 5 activities)
  const recentActivity = [
    ...comments.map((c) => ({
      type: 'comment',
      time: c.createdAt,
      user: c.userId,
      content: 'commented',
    })),
    ...votes.map((v) => ({
      type: 'vote',
      time: v.createdAt,
      user: v.userId,
      content: v.voteType === 'up' ? 'voted yes' : 'voted no',
    })),
    ...expenses.map((e) => ({
      type: 'expense',
      time: e.createdAt,
      user: e.paidByUserId,
      content: `added expense: $${e.amount}`,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  // Note: Category breakdown removed - expenses schema doesn't have category field
  // To re-enable, add 'category' field to expenses table in schema

  // Upcoming deadlines
  const upcomingDeadlines = [];
  if (trip.voteDeadline) {
    const voteDaysUntil = Math.floor(
      (new Date(trip.voteDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (voteDaysUntil >= 0) {
      upcomingDeadlines.push({
        title: 'Voting Deadline',
        date: new Date(trip.voteDeadline).toLocaleDateString(),
        daysUntil: voteDaysUntil,
        urgent: voteDaysUntil <= 3,
      });
    }
  }
  if (daysUntilTrip >= 0) {
    upcomingDeadlines.push({
      title: 'Trip Starts',
      date: new Date(trip.startDate).toLocaleDateString(),
      daysUntil: daysUntilTrip,
      urgent: daysUntilTrip <= 7,
    });
  }

  return (
    <div className="space-y-6">
      {/* Trip Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Trip Health Score
          </CardTitle>
          <CardDescription>AI-powered assessment of your trip planning progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-4xl font-bold ${getStatusColor(health.status)}`}>
                  {health.score}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Badge className={`mt-2 ${getStatusBadge(health.status)}`}>
                  {health.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="text-right space-y-2">
                {health.status === 'excellent' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Trip is well-planned!</span>
                  </div>
                )}
                {health.status === 'critical' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Needs attention</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Itinerary Completeness</span>
                  <span className="text-muted-foreground">{health.factors.itinerary.message}</span>
                </div>
                <Progress value={(health.factors.itinerary.score / 25) * 100} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Budget Management</span>
                  <span className="text-muted-foreground">{health.factors.budget.message}</span>
                </div>
                <Progress value={(health.factors.budget.score / 25) * 100} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Voting Participation</span>
                  <span className="text-muted-foreground">{health.factors.voting.message}</span>
                </div>
                <Progress value={(health.factors.voting.score / 25) * 100} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Member Engagement</span>
                  <span className="text-muted-foreground">
                    {health.factors.participation.message}
                  </span>
                </div>
                <Progress value={(health.factors.participation.score / 25) * 100} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={onGenerateItinerary}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">Generate Itinerary</h3>
              <p className="text-sm text-muted-foreground">Use AI to create your trip plan</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={onSetPreferences}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Settings className="h-8 w-8 text-purple-600" />
              <h3 className="font-semibold">Set Preferences</h3>
              <p className="text-sm text-muted-foreground">Update your travel preferences</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onReviewVotes}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Vote className="h-8 w-8 text-green-600" />
              <h3 className="font-semibold">Review Votes</h3>
              <p className="text-sm text-muted-foreground">See voting results</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onAddExpense}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Plus className="h-8 w-8 text-orange-600" />
              <h3 className="font-semibold">Add Expense</h3>
              <p className="text-sm text-muted-foreground">Track a new expense</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${deadline.urgent ? 'bg-red-50 dark:bg-red-950' : 'bg-neutral-50 dark:bg-neutral-900'}`}
                  >
                    <div>
                      <p className="font-medium">{deadline.title}</p>
                      <p className="text-sm text-muted-foreground">{deadline.date}</p>
                    </div>
                    <div
                      className={`text-right ${deadline.urgent ? 'text-red-600 dark:text-red-400' : ''}`}
                    >
                      <p className="font-bold">{deadline.daysUntil}</p>
                      <p className="text-xs">days</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-bold text-lg">${totalBudget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-bold text-lg">${totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Remaining</span>
                <span
                  className={`font-bold text-lg ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  ${budgetRemaining.toFixed(2)}
                </span>
              </div>
              <Progress
                value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                  >
                    <div className="mt-1">
                      {activity.type === 'comment' && (
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      )}
                      {activity.type === 'vote' && <ThumbsUp className="h-4 w-4 text-green-600" />}
                      {activity.type === 'expense' && (
                        <DollarSign className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">User</span> {activity.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.time).toLocaleDateString()} at{' '}
                        {new Date(activity.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atlas AI Insights */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Atlas AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.status === 'critical' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your trip needs attention. Consider generating an AI itinerary to get started,
                    or invite more members to help with planning.
                  </AlertDescription>
                </Alert>
              )}
              {daysUntilTrip > 0 && daysUntilTrip <= 14 && bookingProgress < 50 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your trip is in {daysUntilTrip} days and only {bookingProgress.toFixed(0)}% of
                    items are booked. Consider locking in your accommodations soon.
                  </AlertDescription>
                </Alert>
              )}
              {totalSpent > totalBudget * 1.1 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You're over budget by ${(totalSpent - totalBudget).toFixed(2)}. Review your
                    expenses in the Expenses tab.
                  </AlertDescription>
                </Alert>
              )}
              {itineraryItems.length === 0 && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Ready to start planning? Use the "Generate Itinerary" button to let AI create a
                    personalized trip plan based on your preferences.
                  </AlertDescription>
                </Alert>
              )}
              {health.status === 'excellent' && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Great job! Your trip is well-planned and on track. Keep monitoring the budget
                    and ensure all bookings are confirmed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
