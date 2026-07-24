import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export interface ItineraryFilters {
  type: string;
  bookingStatus: string;
  votingStatus: string;
  searchQuery: string;
  sortBy: 'time' | 'price' | 'votes' | 'name';
  sortOrder: 'asc' | 'desc';
}

interface ItineraryFiltersProps {
  filters: ItineraryFilters;
  onFiltersChange: (filters: ItineraryFilters) => void;
  activeFilterCount: number;
}

export function ItineraryFiltersComponent({
  filters,
  onFiltersChange,
  activeFilterCount,
}: ItineraryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof ItineraryFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      type: 'all',
      bookingStatus: 'all',
      votingStatus: 'all',
      searchQuery: '',
      sortBy: 'time',
      sortOrder: 'asc',
    });
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search itinerary..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="pl-9"
          />
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => updateFilter('searchQuery', '')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
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

              {/* Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type-filter">Item Type</Label>
                <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                  <SelectTrigger id="type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="flight">Flights</SelectItem>
                    <SelectItem value="hotel">Hotels</SelectItem>
                    <SelectItem value="dining">Dining</SelectItem>
                    <SelectItem value="activity">Activities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Booking Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="booking-filter">Booking Status</Label>
                <Select
                  value={filters.bookingStatus}
                  onValueChange={(value) => updateFilter('bookingStatus', value)}
                >
                  <SelectTrigger id="booking-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="researching">Researching</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Voting Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="voting-filter">Voting Status</Label>
                <Select
                  value={filters.votingStatus}
                  onValueChange={(value) => updateFilter('votingStatus', value)}
                >
                  <SelectTrigger id="voting-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="pending">Pending Votes</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="tied">Tied Votes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Options */}
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-') as [
              typeof filters.sortBy,
              typeof filters.sortOrder,
            ];
            onFiltersChange({ ...filters, sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time-asc">Time (Earliest First)</SelectItem>
            <SelectItem value="time-desc">Time (Latest First)</SelectItem>
            <SelectItem value="price-asc">Price (Low to High)</SelectItem>
            <SelectItem value="price-desc">Price (High to Low)</SelectItem>
            <SelectItem value="votes-desc">Most Votes</SelectItem>
            <SelectItem value="votes-asc">Least Votes</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.type}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('type', 'all')} />
            </Badge>
          )}
          {filters.bookingStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Booking: {filters.bookingStatus.replace('_', ' ')}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('bookingStatus', 'all')}
              />
            </Badge>
          )}
          {filters.votingStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Voting: {filters.votingStatus}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('votingStatus', 'all')}
              />
            </Badge>
          )}
          {filters.searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.searchQuery}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('searchQuery', '')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to apply filters to itinerary items
export function applyItineraryFilters<
  T extends {
    type: string;
    bookingStatus?: string;
    name: string;
    startTime?: string;
    pricePerPerson?: number;
    votes?: Array<{ voteType: string }>;
  },
>(items: T[], filters: ItineraryFilters): T[] {
  let filtered = [...items];

  // Apply type filter
  if (filters.type !== 'all') {
    filtered = filtered.filter((item) => item.type === filters.type);
  }

  // Apply booking status filter
  if (filters.bookingStatus !== 'all') {
    filtered = filtered.filter((item) => item.bookingStatus === filters.bookingStatus);
  }

  // Apply voting status filter
  if (filters.votingStatus !== 'all') {
    filtered = filtered.filter((item) => {
      const votes = item.votes || [];
      const upVotes = votes.filter((v) => v.voteType === 'up').length;
      const downVotes = votes.filter((v) => v.voteType === 'down').length;

      switch (filters.votingStatus) {
        case 'pending':
          return votes.length === 0;
        case 'approved':
          return upVotes > downVotes;
        case 'rejected':
          return downVotes > upVotes;
        case 'tied':
          return upVotes === downVotes && votes.length > 0;
        default:
          return true;
      }
    });
  }

  // Apply search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter((item) => item.name.toLowerCase().includes(query));
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'time':
        comparison = (a.startTime || '').localeCompare(b.startTime || '');
        break;
      case 'price':
        comparison = (a.pricePerPerson || 0) - (b.pricePerPerson || 0);
        break;
      case 'votes':
        const aVotes = (a.votes || []).length;
        const bVotes = (b.votes || []).length;
        comparison = aVotes - bVotes;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }

    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}

// Helper to count active filters
export function getActiveFilterCount(filters: ItineraryFilters): number {
  let count = 0;
  if (filters.type !== 'all') count++;
  if (filters.bookingStatus !== 'all') count++;
  if (filters.votingStatus !== 'all') count++;
  if (filters.searchQuery) count++;
  return count;
}
