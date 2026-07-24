import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Percent, DollarSign, User } from 'lucide-react';

export type SplitMethod = 'equal' | 'percentage' | 'custom' | 'self';

interface SplitMethodSelectorProps {
  value: SplitMethod;
  onChange: (method: SplitMethod) => void;
  peopleCount: number;
}

const SPLIT_METHODS: Array<{
  id: SplitMethod;
  label: string;
  icon: typeof Users;
  description: string;
}> = [
  {
    id: 'equal',
    label: 'Equal Split',
    icon: Users,
    description: 'Split evenly among all members',
  },
  {
    id: 'percentage',
    label: 'Percentage Split',
    icon: Percent,
    description: 'Assign custom percentages to each person',
  },
  {
    id: 'custom',
    label: 'Custom Amounts',
    icon: DollarSign,
    description: 'Enter specific amounts for each person',
  },
  {
    id: 'self',
    label: 'Paid for Self Only',
    icon: User,
    description: 'You paid for yourself only',
  },
];

export function SplitMethodSelector({ value, onChange, peopleCount }: SplitMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>How should this expense be split?</Label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as SplitMethod)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SPLIT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = value === method.id;

            return (
              <Card
                key={method.id}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary border-2 bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => onChange(method.id)}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-primary" />
                      <Label htmlFor={method.id} className="font-semibold cursor-pointer">
                        {method.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                    {method.id === 'equal' && peopleCount > 0 && (
                      <p className="text-xs text-primary mt-2">
                        Each person pays 1/{peopleCount} of the total
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
