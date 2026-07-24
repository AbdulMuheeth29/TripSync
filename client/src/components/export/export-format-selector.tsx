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
import { FileText, Table, Code, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export type ExportFormat = 'csv' | 'pdf' | 'json';

interface ExportFormatSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormat: (format: ExportFormat) => void;
  tripName: string;
}

interface FormatOption {
  id: ExportFormat;
  name: string;
  icon: typeof FileText;
  description: string;
  bestFor: string;
  features: string[];
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'pdf',
    name: 'PDF Document',
    icon: FileText,
    description: 'Professional formatted report with charts and summaries',
    bestFor: 'Sharing with group members or for records',
    features: [
      'Beautiful formatting with charts',
      'Includes trip summary and breakdown',
      'Ready to print or email',
      'Best for presentations',
    ],
  },
  {
    id: 'csv',
    name: 'CSV Spreadsheet',
    icon: Table,
    description: 'Raw data in spreadsheet format for analysis',
    bestFor: 'Importing into Excel or Google Sheets',
    features: [
      'Opens in any spreadsheet app',
      'Easy to analyze and manipulate',
      'Includes all transaction details',
      'Best for custom reporting',
    ],
  },
  {
    id: 'json',
    name: 'JSON Data',
    icon: Code,
    description: 'Machine-readable format for developers',
    bestFor: 'Integration with other apps or services',
    features: [
      'Complete data export',
      'Developer-friendly format',
      'Easy to parse and process',
      'Best for automation',
    ],
  },
];

export function ExportFormatSelector({
  isOpen,
  onClose,
  onSelectFormat,
  tripName,
}: ExportFormatSelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');

  const handleContinue = () => {
    onSelectFormat(selectedFormat);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Trip Expenses</DialogTitle>
          <DialogDescription>
            Choose a format to export expenses for <strong>{tripName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {FORMAT_OPTIONS.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.id;

            return (
              <Card
                key={format.id}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary border-2 bg-primary/5'
                    : 'border hover:border-primary/50'
                }`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{format.name}</h4>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">{format.description}</p>

                    <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 mb-3">
                      <p className="text-xs text-blue-900">
                        <strong>Best for:</strong> {format.bestFor}
                      </p>
                    </div>

                    <ul className="space-y-1">
                      {format.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <span className="text-primary mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleContinue}>
            Continue with {FORMAT_OPTIONS.find((f) => f.id === selectedFormat)?.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
