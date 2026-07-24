import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Check, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
}

interface UserBalance {
  userId: string;
  userName: string;
  netBalance: number;
  totalPaid: number;
  totalOwed: number;
}

interface SettlementData {
  settlements: Settlement[];
  balances: UserBalance[];
}

export function SettlementSummary({ tripId }: { tripId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBalances, setShowBalances] = useState(false);

  // Fetch settlements from backend
  const { data, isLoading, error } = useQuery<SettlementData>({
    queryKey: ['/api/trips', tripId, 'settlements'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/trips/${tripId}/expenses/settlements`);
      return response.json();
    },
  });

  // Mark all expenses as settled
  const settleAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/trips/${tripId}/expenses/settle-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId, 'settlements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      toast({
        title: 'All expenses settled',
        description: 'All expenses have been marked as settled',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to settle expenses',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Optimized settlement
          </CardTitle>
          <CardDescription>Loading settlement calculations...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Settlement calculation failed
          </CardTitle>
          <CardDescription>
            Unable to calculate settlements. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || data.settlements.length === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="h-5 w-5" />
            All settled up!
          </CardTitle>
          <CardDescription>No outstanding balances between members</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { settlements, balances } = data;

  // Calculate total outstanding
  const totalOutstanding = settlements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Optimized settlement
              </CardTitle>
              <CardDescription>Minimum transactions — who pays whom to settle up</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBalances(!showBalances)}>
                {showBalances ? 'Hide' : 'Show'} balances
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => settleAllMutation.mutate()}
                disabled={settleAllMutation.isPending}
              >
                {settleAllMutation.isPending ? 'Settling...' : 'Mark all settled'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Settlement transactions */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              {settlements.length} transaction{settlements.length !== 1 ? 's' : ''} to settle $
              {totalOutstanding.toFixed(2)}
            </div>
            {settlements.map((s, i) => {
              const amountStr = (s.amount / 100).toFixed(2); // Convert from cents
              return (
                <div key={i} className="flex flex-col gap-1 py-2 border-b last:border-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {s.fromName} owes {s.toName}
                    </span>
                    <span className="font-medium">${amountStr}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={`https://venmo.com/?txn=pay&amount=${amountStr}&recipient=${encodeURIComponent(
                        s.toName
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Pay with Venmo
                    </a>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      Zelle: Pay ${amountStr} to {s.toName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User balances (collapsible) */}
          {showBalances && balances && balances.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <div className="text-sm font-medium mb-2">Member balances</div>
              <div className="grid gap-2">
                {balances
                  .filter((b) => Math.abs(b.netBalance) > 0)
                  .sort((a, b) => b.netBalance - a.netBalance)
                  .map((balance) => {
                    const isOwed = balance.netBalance > 0;
                    const absBalance = Math.abs(balance.netBalance / 100);
                    return (
                      <div
                        key={balance.userId}
                        className="flex items-center justify-between p-2 rounded bg-background/50"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{balance.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            Paid: ${(balance.totalPaid / 100).toFixed(2)} · Owes: $
                            {(balance.totalOwed / 100).toFixed(2)}
                          </span>
                        </div>
                        <Badge variant={isOwed ? 'default' : 'secondary'}>
                          {isOwed ? '+' : '-'}${absBalance.toFixed(2)}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Positive balances are owed money, negative balances owe money
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
