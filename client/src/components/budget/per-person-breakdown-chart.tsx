import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface PersonSpending {
  id: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = owed money, negative = owes money
  expenseCount: number;
}

interface PerPersonBreakdownChartProps {
  data: PersonSpending[];
  currency: string;
}

type SortBy = 'name' | 'paid' | 'owed' | 'balance';

export function PerPersonBreakdownChart({
  data,
  currency
}: PerPersonBreakdownChartProps) {
  const [sortBy, setSortBy] = useState<SortBy>('paid');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'paid':
        return b.totalPaid - a.totalPaid;
      case 'owed':
        return b.totalOwed - a.totalOwed;
      case 'balance':
        return b.netBalance - a.netBalance;
      default:
        return 0;
    }
  });

  const maxPaid = Math.max(...data.map(d => d.totalPaid));
  const totalPaid = data.reduce((sum, d) => sum + d.totalPaid, 0);

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Spending by Person</h3>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No expenses yet. Add expenses to see breakdown by person.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Spending by Person</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-sm border rounded-md px-2 py-1 bg-background"
          >
            <option value="paid">Amount Paid</option>
            <option value="owed">Amount Owed</option>
            <option value="balance">Net Balance</option>
            <option value="name">Name</option>
          </select>
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-4">
        {sortedData.map((person) => {
          const paidPercentage = maxPaid > 0 ? (person.totalPaid / maxPaid) * 100 : 0;
          const owedPercentage = maxPaid > 0 ? (person.totalOwed / maxPaid) * 100 : 0;

          return (
            <Card key={person.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="text-sm font-semibold">
                    {getInitials(person.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{person.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {person.expenseCount} {person.expenseCount === 1 ? 'expense' : 'expenses'}
                      </p>
                    </div>

                    {/* Net Balance Badge */}
                    {person.netBalance !== 0 && (
                      <Badge
                        variant={person.netBalance > 0 ? "default" : "secondary"}
                        className={person.netBalance > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                      >
                        {person.netBalance > 0 ? "Owed " : "Owes "}{formatCurrency(person.netBalance)}
                      </Badge>
                    )}

                    {person.netBalance === 0 && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Settled
                      </Badge>
                    )}
                  </div>

                  {/* Paid Amount */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-semibold">{formatCurrency(person.totalPaid)}</span>
                    </div>
                    <Progress value={paidPercentage} className="h-2" />
                  </div>

                  {/* Owed Amount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount Owed</span>
                      <span className="font-semibold">{formatCurrency(person.totalOwed)}</span>
                    </div>
                    <Progress
                      value={owedPercentage}
                      className="h-2"
                      indicatorClassName="bg-amber-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
          <p className="text-lg font-bold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Average per Person</p>
          <p className="text-lg font-bold">{formatCurrency(totalPaid / data.length)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Group Size</p>
          <p className="text-lg font-bold">{data.length} people</p>
        </div>
      </div>

      {/* Insight */}
      {sortedData[0] && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>{sortedData[0].name}</strong> has paid the most ({formatCurrency(sortedData[0].totalPaid)})
          </p>
        </div>
      )}
    </Card>
  );
}
