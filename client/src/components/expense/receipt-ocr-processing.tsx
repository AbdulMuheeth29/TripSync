import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Loader2, Scan, FileText, DollarSign, Calendar, Store } from 'lucide-react';

interface ReceiptOCRProcessingProps {
  isOpen: boolean;
  fileName: string;
}

const EXTRACTION_STEPS = [
  { icon: FileText, label: 'Reading receipt image', delay: 0 },
  { icon: Store, label: 'Extracting merchant name', delay: 1000 },
  { icon: DollarSign, label: 'Identifying amount', delay: 2000 },
  { icon: Calendar, label: 'Finding date and time', delay: 3000 },
  { icon: Scan, label: 'Detecting line items', delay: 4000 },
];

export function ReceiptOCRProcessing({ isOpen, fileName }: ReceiptOCRProcessingProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const timers = EXTRACTION_STEPS.map((step, index) => {
      return setTimeout(() => {
        setCurrentStep(index + 1);
      }, step.delay);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [isOpen]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <DialogTitle className="text-center">Processing Receipt with AI</DialogTitle>
          <DialogDescription className="text-center">
            Extracting information from {fileName}
          </DialogDescription>
        </DialogHeader>

        <Card className="p-4 space-y-3">
          {EXTRACTION_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 transition-opacity ${
                  isActive || isComplete ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`rounded-full p-2 ${
                    isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-muted'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isComplete
                        ? 'text-green-600'
                        : isActive
                          ? 'text-blue-600 animate-pulse'
                          : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>{step.label}</span>
                {isActive && <Loader2 className="h-3 w-3 ml-auto text-blue-600 animate-spin" />}
              </div>
            );
          })}
        </Card>

        <p className="text-xs text-center text-muted-foreground">This usually takes 5-10 seconds</p>
      </DialogContent>
    </Dialog>
  );
}
