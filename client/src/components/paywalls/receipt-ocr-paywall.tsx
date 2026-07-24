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
import { Badge } from '@/components/ui/badge';
import { Scan, FileImage, Sparkles, Check, Zap } from 'lucide-react';

interface ReceiptOCRPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onManualEntry: () => void;
}

const OCR_FEATURES = [
  'Instant receipt scanning with AI',
  'Auto-extract amount, date, and merchant',
  'Detect line items and categories',
  'Support for 15+ currencies',
  'Batch upload multiple receipts',
  'Cloud storage for all receipts',
];

const TIME_SAVINGS = [
  { task: 'Manual entry', time: '~2 min per receipt' },
  { task: 'With OCR', time: '~5 seconds' },
  { task: 'Time saved', time: '115 seconds' },
];

export function ReceiptOCRPaywall({
  isOpen,
  onClose,
  onUpgrade,
  onManualEntry,
}: ReceiptOCRPaywallProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
            <Scan className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <DialogTitle className="text-center text-2xl">Receipt OCR</DialogTitle>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600">
              <Sparkles className="h-3 w-3 mr-1" />
              Pro Feature
            </Badge>
          </div>
          <DialogDescription className="text-center">
            Automatically extract expense data from receipt photos using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Demo */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <FileImage className="h-12 w-12 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-1">Snap & Done</p>
                <p className="text-sm text-green-700">
                  Take a photo → AI extracts data → Auto-fills expense form
                </p>
              </div>
            </div>
          </Card>

          {/* Time Savings */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              Time Savings per Receipt
            </h4>
            <div className="space-y-2">
              {TIME_SAVINGS.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.task}</span>
                  <span className={`font-medium ${index === 2 ? 'text-green-600' : ''}`}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">What OCR includes:</h4>
            <div className="grid grid-cols-2 gap-2">
              {OCR_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-0.5 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Example:</strong> Upload a restaurant receipt → AI detects: "$45.50, Dinner,
              Italian Bistro, April 15, 2024" → Click save!
            </p>
          </Card>

          {/* Pricing */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Upgrade to Pro</p>
              <p className="text-3xl font-bold text-primary mb-1">
                $4.99<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground">14-day free trial • Cancel anytime</p>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button onClick={onUpgrade} className="w-full" size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
          <Button onClick={onManualEntry} variant="outline" className="w-full">
            Enter Manually Instead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
