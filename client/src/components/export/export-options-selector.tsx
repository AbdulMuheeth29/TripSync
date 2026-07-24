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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Receipt, Users, DollarSign, TrendingUp, FileImage, Calendar, Info } from 'lucide-react';
import { useState } from 'react';
import type { ExportFormat } from './export-format-selector';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: typeof Receipt;
  defaultChecked: boolean;
  recommended?: boolean;
}

interface ExportOptionsSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onExport: (options: ExportOptions) => void;
  format: ExportFormat;
  tripName: string;
}

export interface ExportOptions {
  includeExpenses: boolean;
  includeSplitDetails: boolean;
  includeSettlements: boolean;
  includeBudgetOverview: boolean;
  includeReceipts: boolean;
  includeDateRange: boolean;
  includeParticipants: boolean;
  includeCharts: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'includeExpenses',
    label: 'All Expenses',
    description: 'Complete list of all expenses with amounts and categories',
    icon: Receipt,
    defaultChecked: true,
    recommended: true,
  },
  {
    id: 'includeSplitDetails',
    label: 'Split Details',
    description: 'How each expense was divided among group members',
    icon: Users,
    defaultChecked: true,
    recommended: true,
  },
  {
    id: 'includeSettlements',
    label: 'Settlement Summary',
    description: 'Who owes whom and payment status',
    icon: DollarSign,
    defaultChecked: true,
    recommended: true,
  },
  {
    id: 'includeBudgetOverview',
    label: 'Budget Overview',
    description: 'Total budget vs. actual spending comparison',
    icon: TrendingUp,
    defaultChecked: true,
  },
  {
    id: 'includeReceipts',
    label: 'Receipt Images',
    description: 'Attached receipt photos (PDF only, increases file size)',
    icon: FileImage,
    defaultChecked: false,
  },
  {
    id: 'includeDateRange',
    label: 'Date Range & Trip Info',
    description: 'Trip dates, destination, and timeline',
    icon: Calendar,
    defaultChecked: true,
  },
  {
    id: 'includeParticipants',
    label: 'Participant List',
    description: 'Names and emails of all trip members',
    icon: Users,
    defaultChecked: true,
  },
  {
    id: 'includeCharts',
    label: 'Visual Charts',
    description: 'Spending breakdown and category charts (PDF only)',
    icon: TrendingUp,
    defaultChecked: true,
  },
];

export function ExportOptionsSelector({
  isOpen,
  onClose,
  onBack,
  onExport,
  format,
  tripName,
}: ExportOptionsSelectorProps) {
  const [options, setOptions] = useState<ExportOptions>(
    EXPORT_OPTIONS.reduce(
      (acc, option) => ({
        ...acc,
        [option.id]: option.defaultChecked,
      }),
      {} as ExportOptions
    )
  );

  const handleToggle = (optionId: keyof ExportOptions) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = EXPORT_OPTIONS.reduce(
      (acc, option) => ({
        ...acc,
        [option.id]: true,
      }),
      {} as ExportOptions
    );
    setOptions(allSelected);
  };

  const handleSelectNone = () => {
    const noneSelected = EXPORT_OPTIONS.reduce(
      (acc, option) => ({
        ...acc,
        [option.id]: false,
      }),
      {} as ExportOptions
    );
    setOptions(noneSelected);
  };

  const handleExport = () => {
    onExport(options);
  };

  const selectedCount = Object.values(options).filter(Boolean).length;
  const isPdfFormat = format === 'pdf';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Export</DialogTitle>
          <DialogDescription>
            Select what to include in your {format.toUpperCase()} export for{' '}
            <strong>{tripName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCount} of {EXPORT_OPTIONS.length} options selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectNone}>
                Clear All
              </Button>
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            {EXPORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isChecked = options[option.id as keyof ExportOptions];

              // Disable certain options for non-PDF formats
              const isDisabled =
                (option.id === 'includeReceipts' && !isPdfFormat) ||
                (option.id === 'includeCharts' && !isPdfFormat);

              return (
                <Card
                  key={option.id}
                  className={`p-4 transition-all ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isChecked
                        ? 'border-primary bg-primary/5'
                        : 'cursor-pointer hover:border-primary/50'
                  }`}
                  onClick={() => !isDisabled && handleToggle(option.id as keyof ExportOptions)}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={() => handleToggle(option.id as keyof ExportOptions)}
                      className="mt-1"
                    />

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isChecked ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label
                          htmlFor={option.id}
                          className={`font-semibold ${isDisabled ? 'text-muted-foreground' : ''}`}
                        >
                          {option.label}
                        </Label>
                        {option.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                        {isDisabled && (
                          <Badge variant="outline" className="text-xs">
                            PDF Only
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Info Box */}
          {!isPdfFormat && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 mb-1">
                    <strong>Note:</strong> Receipt images and charts are only available in PDF
                    exports
                  </p>
                  <p className="text-xs text-blue-700">
                    Switch to PDF format if you need visual elements in your export
                  </p>
                </div>
              </div>
            </Card>
          )}

          {options.includeReceipts && (
            <Card className="p-3 bg-amber-50 border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Large file size:</strong> Including receipt images will significantly
                increase the export file size
              </p>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleExport} disabled={selectedCount === 0}>
            {selectedCount === 0 ? 'Select at least one option' : `Export ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
