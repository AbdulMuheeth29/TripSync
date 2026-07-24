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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

interface Poll {
  id: string;
  question: string;
  options: string[];
  deadline?: string | null;
  status: string;
  voteCounts: number[];
  createdBy: { id: string; name: string };
  createdAt: string;
  userVote?: number;
}

interface TripMember {
  id: string;
  name: string;
}

interface PollManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  polls: Poll[];
  members: TripMember[];
  currentUserId: string;
  onCreatePoll: (poll: { question: string; options: string[]; deadline?: string }) => Promise<void>;
  onVote: (pollId: string, optionIndex: number) => Promise<void>;
  onClosePoll: (pollId: string) => Promise<void>;
  onDeletePoll: (pollId: string) => Promise<void>;
}

export function PollManagerModal({
  isOpen,
  onClose,
  polls,
  members,
  currentUserId,
  onCreatePoll,
  onVote,
  onClosePoll,
  onDeletePoll,
}: PollManagerModalProps) {
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    deadline: '',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll((prev) => ({ ...prev, options: [...prev.options, ''] }));
    }
  };

  const handleRemoveOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const handleUpdateOption = (index: number, value: string) => {
    setNewPoll((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const handleCreatePoll = async () => {
    const validOptions = newPoll.options.filter((o) => o.trim().length > 0);
    if (!newPoll.question.trim() || validOptions.length < 2) return;

    await onCreatePoll({
      question: newPoll.question,
      options: validOptions,
      deadline: newPoll.deadline || undefined,
    });

    setNewPoll({ question: '', options: ['', ''], deadline: '' });
  };

  const activePollsCount = polls.filter((p) => p.status === 'open').length;
  const closedPollsCount = polls.filter((p) => p.status === 'closed').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <DialogTitle>Group Polls</DialogTitle>
          </div>
          <DialogDescription>Create polls and gather group input on decisions</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active ({activePollsCount})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({closedPollsCount})</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          {/* Active Polls */}
          <TabsContent value="active" className="space-y-4 mt-4">
            {polls.filter((p) => p.status === 'open').length === 0 ? (
              <Card className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No active polls</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a poll to gather group input
                </p>
              </Card>
            ) : (
              polls
                .filter((p) => p.status === 'open')
                .map((poll) => {
                  const totalVotes = poll.voteCounts.reduce((sum, count) => sum + count, 0);
                  const hasVoted = poll.userVote !== undefined;
                  const isCreator = poll.createdBy.id === currentUserId;

                  return (
                    <Card key={poll.id} className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{poll.question}</h4>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>By {poll.createdBy.name}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            {poll.deadline && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Deadline: {format(new Date(poll.deadline), 'MMM d')}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasVoted && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Voted
                            </Badge>
                          )}
                          {isCreator && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  Close Poll
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Close poll?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will prevent further voting and lock in the results.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onClosePoll(poll.id)}>
                                    Close Poll
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {poll.options.map((option, index) => {
                          const voteCount = poll.voteCounts[index] || 0;
                          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                          const isSelected = poll.userVote === index;

                          return (
                            <button
                              key={index}
                              onClick={() => !hasVoted && onVote(poll.id, index)}
                              disabled={hasVoted}
                              className={`w-full text-left p-3 rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : hasVoted
                                    ? 'border-muted cursor-not-allowed'
                                    : 'border-muted hover:border-primary/50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  {isSelected ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                                    {option}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{voteCount} votes</span>
                                  <span className="text-sm text-muted-foreground">
                                    ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                              </div>
                              <Progress value={percentage} className="h-1.5" />
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} •{' '}
                          {members.length - totalVotes} pending
                        </p>
                        {isCreator && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete poll?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Permanently delete this poll and all votes?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeletePoll(poll.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </Card>
                  );
                })
            )}
          </TabsContent>

          {/* Closed Polls */}
          <TabsContent value="closed" className="space-y-4 mt-4">
            {polls.filter((p) => p.status === 'closed').length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No closed polls</p>
              </Card>
            ) : (
              polls
                .filter((p) => p.status === 'closed')
                .map((poll) => {
                  const totalVotes = poll.voteCounts.reduce((sum, count) => sum + count, 0);
                  const winningIndex = poll.voteCounts.indexOf(Math.max(...poll.voteCounts));

                  return (
                    <Card key={poll.id} className="p-4 bg-muted/30">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{poll.question}</h4>
                            <Badge variant="outline">Closed</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            By {poll.createdBy.name} •{' '}
                            {format(new Date(poll.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {poll.options.map((option, index) => {
                          const voteCount = poll.voteCounts[index] || 0;
                          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                          const isWinner = index === winningIndex;

                          return (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                isWinner ? 'border-green-500 bg-green-50' : 'border-muted'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`text-sm ${isWinner ? 'font-semibold text-green-900' : ''}`}
                                >
                                  {isWinner && '🏆 '}
                                  {option}
                                </span>
                                <span className="text-sm font-medium">
                                  {voteCount} votes ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                              <Progress value={percentage} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">{totalVotes} total votes</p>
                    </Card>
                  );
                })
            )}
          </TabsContent>

          {/* Create New Poll */}
          <TabsContent value="create" className="space-y-4 mt-4">
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-4">Create New Poll</h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Question *</Label>
                  <Input
                    placeholder="What's your question?"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll((prev) => ({ ...prev, question: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Options (2-6)</Label>
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleUpdateOption(index, e.target.value)}
                      />
                      {newPoll.options.length > 2 && index >= 2 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {newPoll.options.length < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Deadline (Optional)</Label>
                  <Input
                    type="date"
                    value={newPoll.deadline}
                    onChange={(e) => setNewPoll((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleCreatePoll}
                  disabled={
                    !newPoll.question.trim() || newPoll.options.filter((o) => o.trim()).length < 2
                  }
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Create Poll
                </Button>
              </div>
            </Card>

            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-900">
                <strong>Tips:</strong> Use polls for quick decisions like restaurant choices,
                activity preferences, or timing questions. Keep options clear and concise.
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
