import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

export interface DashboardFilters {
  status: string;
  role: string;
  searchQuery: string;
  sortBy: "date-upcoming" | "date-recent" | "name-asc" | "name-desc" | "status";
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function DashboardFiltersComponent({
  filters,
  onFiltersChange,
}: DashboardFiltersProps) {
  const updateFilter = (key: keyof DashboardFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: "all",
      role: "all",
      searchQuery: "",
      sortBy: "date-upcoming",
    });
  };

  const hasActiveFilters = filters.status !== "all" || filters.role !== "all" || filters.searchQuery;
  const activeFilterCount = (filters.status !== "all" ? 1 : 0) +
    (filters.role !== "all" ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trips by name or destination..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="pl-9 pr-9"
          />
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => updateFilter("searchQuery", "")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Role Filter */}
        <Select value={filters.role} onValueChange={(value) => updateFilter("role", value)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trips</SelectItem>
            <SelectItem value="organizing">Organizing</SelectItem>
            <SelectItem value="participating">Participating</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value as DashboardFilters["sortBy"])}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-upcoming">Date (Upcoming First)</SelectItem>
            <SelectItem value="date-recent">Date (Recent First)</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 min-w-[1.25rem]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("status", "all")}
              />
            </Badge>
          )}
          {filters.role !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Role: {filters.role}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("role", "all")}
              />
            </Badge>
          )}
          {filters.searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.searchQuery}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("searchQuery", "")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to apply filters and sorting to trips
export function applyDashboardFilters<T extends {
  title: string | null;
  destination: string;
  status: string;
  startDate: string;
  organizerId: string;
  members?: Array<{ userId: string; role: string }>;
}>(
  trips: T[],
  filters: DashboardFilters,
  currentUserId: string | undefined
): T[] {
  let filtered = [...trips];

  // Apply status filter
  if (filters.status !== "all") {
    filtered = filtered.filter(trip => trip.status === filters.status);
  }

  // Apply role filter
  if (filters.role !== "all" && currentUserId) {
    filtered = filtered.filter(trip => {
      const isOrganizer = trip.organizerId === currentUserId;
      const isMember = trip.members?.some(m => m.userId === currentUserId && m.role !== "organizer");

      if (filters.role === "organizing") {
        return isOrganizer;
      } else if (filters.role === "participating") {
        return isMember;
      }
      return true;
    });
  }

  // Apply search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(trip =>
      (trip.title?.toLowerCase() || trip.destination.toLowerCase()).includes(query) ||
      trip.destination.toLowerCase().includes(query)
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "date-upcoming":
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case "date-recent":
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case "name-asc":
        return (a.title || a.destination).localeCompare(b.title || b.destination);
      case "name-desc":
        return (b.title || b.destination).localeCompare(a.title || a.destination);
      case "status":
        const statusOrder = { planning: 0, booking: 1, active: 2, completed: 3, cancelled: 4 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 99) -
          (statusOrder[b.status as keyof typeof statusOrder] || 99);
      default:
        return 0;
    }
  });

  return filtered;
}
