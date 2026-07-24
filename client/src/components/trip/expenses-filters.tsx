import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Filter, X, CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";

export interface ExpensesFilters {
  category: string;
  paidBy: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  settlementStatus: string;
  sortBy: "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category";
}

interface ExpensesFiltersProps {
  filters: ExpensesFilters;
  onFiltersChange: (filters: ExpensesFilters) => void;
  members: Array<{ id: string; name: string }>;
  onExport?: (format: "csv" | "pdf") => void;
  canExport?: boolean;
}

export function ExpensesFiltersComponent({
  filters,
  onFiltersChange,
  members,
  onExport,
  canExport = false,
}: ExpensesFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDateFromOpen, setIsDateFromOpen] = useState(false);
  const [isDateToOpen, setIsDateToOpen] = useState(false);

  const updateFilter = (key: keyof ExpensesFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: "all",
      paidBy: "all",
      dateFrom: null,
      dateTo: null,
      settlementStatus: "all",
      sortBy: "date-desc",
    });
  };

  const activeFilterCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.paidBy !== "all" ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.settlementStatus !== "all" ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter Popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 px-1 min-w-[1.25rem]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-8 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => updateFilter("category", value)}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="food">Food & Dining</SelectItem>
                    <SelectItem value="activities">Activities</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Paid By Filter */}
              <div className="space-y-2">
                <Label htmlFor="paidby-filter">Paid By</Label>
                <Select
                  value={filters.paidBy}
                  onValueChange={(value) => updateFilter("paidBy", value)}
                >
                  <SelectTrigger id="paidby-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filters */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid gap-2">
                  <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "PPP") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom || undefined}
                        onSelect={(date) => {
                          updateFilter("dateFrom", date || null);
                          setIsDateFromOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover open={isDateToOpen} onOpenChange={setIsDateToOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "PPP") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo || undefined}
                        onSelect={(date) => {
                          updateFilter("dateTo", date || null);
                          setIsDateToOpen(false);
                        }}
                        disabled={(date) =>
                          filters.dateFrom ? date < filters.dateFrom : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Settlement Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="settlement-filter">Settlement Status</Label>
                <Select
                  value={filters.settlementStatus}
                  onValueChange={(value) => updateFilter("settlementStatus", value)}
                >
                  <SelectTrigger id="settlement-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="unsettled">Unsettled</SelectItem>
                    <SelectItem value="partially">Partially Settled</SelectItem>
                    <SelectItem value="settled">Fully Settled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Select */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) => updateFilter("sortBy", value as ExpensesFilters["sortBy"])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (Newest First)</SelectItem>
            <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
            <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
            <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Options */}
        {canExport && onExport && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onExport("csv")}
                >
                  Export as CSV
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onExport("pdf")}
                >
                  Export as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.category !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Category: {filters.category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("category", "all")}
              />
            </Badge>
          )}
          {filters.paidBy !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Paid by: {members.find(m => m.id === filters.paidBy)?.name || filters.paidBy}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("paidBy", "all")}
              />
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {format(filters.dateFrom, "MMM d, yyyy")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("dateFrom", null)}
              />
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {format(filters.dateTo, "MMM d, yyyy")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("dateTo", null)}
              />
            </Badge>
          )}
          {filters.settlementStatus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Settlement: {filters.settlementStatus}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("settlementStatus", "all")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to apply filters to expenses
export function applyExpensesFilters<T extends {
  paidByUserId: string;
  amount: number;
  createdAt: Date | string;
  isSettled: boolean | null;
  description?: string;
}>(
  expenses: T[],
  filters: ExpensesFilters
): T[] {
  let filtered = [...expenses];

  // Apply category filter - Disabled: expenses schema doesn't have category field
  // TODO: Add category field to expenses schema to enable this
  // if (filters.category !== "all") {
  //   filtered = filtered.filter(exp => exp.category === filters.category);
  // }

  // Apply paid by filter
  if (filters.paidBy !== "all") {
    filtered = filtered.filter(exp => exp.paidByUserId === filters.paidBy);
  }

  // Apply date range filters
  if (filters.dateFrom) {
    filtered = filtered.filter(exp => new Date(exp.createdAt) >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    const endOfDay = new Date(filters.dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter(exp => new Date(exp.createdAt) <= endOfDay);
  }

  // Apply settlement status filter
  if (filters.settlementStatus !== "all") {
    filtered = filtered.filter(exp => {
      if (filters.settlementStatus === "settled") {
        return exp.isSettled === true;
      } else if (filters.settlementStatus === "unsettled") {
        return !exp.isSettled;
      }
      return true;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      // Category sorting disabled since schema doesn't have category
      // case "category":
      //   return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  return filtered;
}
