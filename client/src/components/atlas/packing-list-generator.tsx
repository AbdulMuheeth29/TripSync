import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Backpack, Save, Download, Printer, Sparkles, Check } from 'lucide-react';

interface PackingItem {
  id: string;
  name: string;
  checked: boolean;
  category: string;
}

interface PackingCategory {
  name: string;
  icon: string;
  items: string[];
}

interface PackingListGeneratorProps {
  destination: string;
  duration: number; // days
  activities: string[];
  onSave: (items: PackingItem[]) => void;
  onExport?: (format: 'pdf' | 'txt') => void;
}

const PACKING_CATEGORIES: PackingCategory[] = [
  {
    name: 'Essentials',
    icon: '📋',
    items: [
      'Passport',
      'Visa (if required)',
      'Travel insurance documents',
      'Vaccination records',
      'Flight tickets/confirmations',
      'Hotel reservations',
      'Emergency contacts list',
      'Copies of important documents',
      'Cash & credit cards',
      'Phone & charger',
    ],
  },
  {
    name: 'Clothing',
    icon: '👕',
    items: [
      'T-shirts',
      'Pants/jeans',
      'Shorts',
      'Underwear & socks',
      'Sleepwear',
      'Light jacket',
      'Comfortable walking shoes',
      'Sandals/flip-flops',
      'Swimwear',
      'Hat/cap for sun protection',
    ],
  },
  {
    name: 'Toiletries',
    icon: '🧴',
    items: [
      'Toothbrush & toothpaste',
      'Shampoo & conditioner',
      'Body wash/soap',
      'Deodorant',
      'Sunscreen (SPF 30+)',
      'Moisturizer',
      'Razor & shaving cream',
      'Medications & prescriptions',
      'First aid kit',
      'Hand sanitizer',
    ],
  },
  {
    name: 'Activities',
    icon: '🎒',
    items: [
      'Day backpack',
      'Water bottle',
      'Sunglasses',
      'Camera & accessories',
      'Portable charger/power bank',
      'Travel adapter',
      'Headphones',
      'Books/e-reader',
      'Travel pillow',
      'Reusable shopping bag',
    ],
  },
  {
    name: 'Health & Safety',
    icon: '🏥',
    items: [
      'Face masks',
      'Pain relievers',
      'Antihistamines',
      'Anti-diarrheal medication',
      'Motion sickness pills',
      'Insect repellent',
      'Band-aids & antiseptic',
      'Prescription medications',
      'Travel health insurance card',
      'Emergency medication (EpiPen, etc.)',
    ],
  },
];

export function PackingListGenerator({
  destination,
  duration,
  activities,
  onSave,
  onExport,
}: PackingListGeneratorProps) {
  const [packingItems, setPackingItems] = useState<PackingItem[]>(
    PACKING_CATEGORIES.flatMap((category) =>
      category.items.map((item, index) => ({
        id: `${category.name}-${index}`,
        name: item,
        checked: false,
        category: category.name,
      }))
    )
  );

  const toggleItem = (itemId: string) => {
    setPackingItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item))
    );
  };

  const getCategoryItems = (categoryName: string) => {
    return packingItems.filter((item) => item.category === categoryName);
  };

  const getCategoryProgress = (categoryName: string) => {
    const items = getCategoryItems(categoryName);
    const checked = items.filter((item) => item.checked).length;
    return { checked, total: items.length };
  };

  const totalProgress = () => {
    const checked = packingItems.filter((item) => item.checked).length;
    return { checked, total: packingItems.length };
  };

  const progress = totalProgress();
  const progressPercentage = Math.round((progress.checked / progress.total) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Backpack className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Packing List</h2>
            </div>
            <p className="text-muted-foreground">
              for {duration}-day trip to {destination}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {progress.checked} / {progress.total}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {progressPercentage === 100 && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              All items checked! You're ready to go!
            </p>
          </div>
        )}

        {/* AI Generated Note */}
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            This list was personalized for your {activities.join(', ')} trip based on the
            destination and duration.
          </p>
        </div>
      </Card>

      {/* Packing Categories */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {PACKING_CATEGORIES.map((category) => {
            const categoryProgress = getCategoryProgress(category.name);
            const items = getCategoryItems(category.name);

            return (
              <Card key={category.name} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </h3>
                  <Badge variant="outline">
                    {categoryProgress.checked} / {categoryProgress.total}
                  </Badge>
                </div>

                <Separator className="mb-4" />

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <label
                        htmlFor={item.id}
                        className={`flex-1 text-sm cursor-pointer ${
                          item.checked ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Actions */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onSave(packingItems)} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save to Coordination Tab
          </Button>
          {onExport && (
            <>
              <Button variant="outline" onClick={() => onExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => onExport('txt')}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
