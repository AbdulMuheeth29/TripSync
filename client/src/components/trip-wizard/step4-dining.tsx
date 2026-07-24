import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Wine, IceCream, Sparkles } from 'lucide-react';

export type DiningPreference = 'fine_dining' | 'casual' | 'mix';

interface Step4DiningProps {
  onNext: (dining: DiningPreference) => void;
  onBack: () => void;
  defaultValue?: DiningPreference;
}

const DINING_OPTIONS: Array<{
  id: DiningPreference;
  name: string;
  icon: typeof Wine;
  description: string;
  examples: string[];
  priceRange: string;
}> = [
  {
    id: 'fine_dining',
    name: 'Fine Dining',
    icon: Wine,
    description: 'Upscale restaurants with refined cuisine and ambiance',
    examples: [
      'Michelin-starred restaurants',
      'Tasting menus',
      'Wine pairings',
      'Celebrity chef venues',
    ],
    priceRange: '$$$-$$$$',
  },
  {
    id: 'casual',
    name: 'Casual & Street Food',
    icon: IceCream,
    description: 'Local eateries, food markets, and authentic street food',
    examples: ['Night markets', 'Food trucks', 'Local cafes', 'Street vendors'],
    priceRange: '$-$$',
  },
  {
    id: 'mix',
    name: 'Mix of Both',
    icon: Sparkles,
    description: 'Balance of special dining experiences and casual local eats',
    examples: [
      'Fine dining for special nights',
      'Street food for lunch',
      'Local restaurants',
      'Variety of experiences',
    ],
    priceRange: '$$-$$$',
  },
];

export function Step4Dining({ onNext, onBack, defaultValue }: Step4DiningProps) {
  const [selectedType, setSelectedType] = useState<DiningPreference | undefined>(defaultValue);

  const handleSubmit = () => {
    if (selectedType) {
      onNext(selectedType);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">How do you like to dine?</h2>
        <p className="text-muted-foreground">Choose your preferred dining experience</p>
      </div>

      <div className="space-y-4">
        {DINING_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.id;

          return (
            <Card
              key={option.id}
              className={cn(
                'p-5 cursor-pointer transition-all hover:border-primary hover:shadow-md',
                isSelected && 'border-primary border-2 bg-primary/5'
              )}
              onClick={() => setSelectedType(option.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'rounded-lg p-3',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{option.name}</h3>
                      <span className="text-sm text-muted-foreground">{option.priceRange}</span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        Selected
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {option.examples.map((example, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            ✨ We'll include{' '}
            {selectedType === 'mix'
              ? 'a variety of dining experiences'
              : DINING_OPTIONS.find((o) => o.id === selectedType)?.name.toLowerCase() +
                ' options'}{' '}
            in your itinerary.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedType}
          className="flex-1"
          size="lg"
        >
          Continue to Invites
        </Button>
      </div>
    </div>
  );
}
