import { useEffect, useState } from 'react';

export type ProactiveTriggerType =
  | 'empty_itinerary'
  | 'budget_overrun'
  | 'vote_stuck'
  | 'confusion'
  | 'incomplete_trip';

export type ProactiveTriggerPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProactiveTrigger {
  type: ProactiveTriggerType;
  priority: ProactiveTriggerPriority;
  message: string;
}

export interface AtlasContext {
  destination: string;
  tripDays: number | null;
  itineraryItems: number;
  overBudget: boolean;
  overAmount: number;
  largestExpenseTitle?: string;
  largestExpenseAmount?: number;
  stuckVotes: number;
  daysUntilTrip: number | null;
  completionPercentage: number;
  backButtonClicks: number;
  timeOnPage: number;
}

export function useProactiveTriggers(context: AtlasContext | null) {
  const [triggers, setTriggers] = useState<ProactiveTrigger[]>([]);

  useEffect(() => {
    if (!context) {
      setTriggers([]);
      return;
    }

    const detected: ProactiveTrigger[] = [];

    // 1. Empty itinerary for too long
    if (context.itineraryItems === 0 && context.timeOnPage > 20) {
      detected.push({
        type: 'empty_itinerary',
        priority: 'high',
        message: `Your ${context.destination} itinerary is empty. I can generate a full ${
          context.tripDays ?? 3
        }‑day plan with activities, dining, and transport. Ask Atlas to “generate a full itinerary for this trip.”`,
      });
    }

    // 2. Over budget
    if (context.overBudget && context.overAmount > 100) {
      detected.push({
        type: 'budget_overrun',
        priority: 'critical',
        message: `Heads up: you're about $${context.overAmount} over budget. Ask Atlas to “find cheaper alternatives for our priciest activities.”`,
      });
    }

    // 3. Group stuck on vote
    if (context.stuckVotes > 0) {
      detected.push({
        type: 'vote_stuck',
        priority: 'medium',
        message:
          'Your group has at least one tied decision. Ask Atlas to “suggest a compromise or tiebreaker for our stuck votes.”',
      });
    }

    // 4. Confusion signals (back button spam)
    if (context.backButtonClicks >= 2 && context.timeOnPage < 60) {
      detected.push({
        type: 'confusion',
        priority: 'medium',
        message:
          'It looks like you might be hunting for something. Ask Atlas to “show me around this trip page.”',
      });
    }

    // 5. Incomplete trip nearing start date
    if (
      context.daysUntilTrip !== null &&
      context.daysUntilTrip < 7 &&
      context.daysUntilTrip >= 0 &&
      context.completionPercentage < 50
    ) {
      detected.push({
        type: 'incomplete_trip',
        priority: 'high',
        message: `Your trip starts in ${context.daysUntilTrip} days but is only ${context.completionPercentage}% planned. Ask Atlas to “help me quickly fill in the remaining gaps.”`,
      });
    }

    setTriggers(detected);
  }, [context]);

  return triggers;
}
