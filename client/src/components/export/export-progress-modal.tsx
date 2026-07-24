import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ExportFormat } from './export-format-selector';

interface ExportProgressModalProps {
  isOpen: boolean;
  format: ExportFormat;
  tripName: string;
  onComplete?: () => void;
}

interface ProgressStep {
  id: string;
  label: string;
  progress: number;
  isComplete: boolean;
}

const EXPORT_STEPS = [
  { id: 'collecting', label: 'Collecting expense data', duration: 1000 },
  { id: 'formatting', label: 'Formatting content', duration: 1500 },
  { id: 'calculations', label: 'Running calculations', duration: 1000 },
  { id: 'generating', label: 'Generating file', duration: 2000 },
  { id: 'finalizing', label: 'Finalizing export', duration: 1000 },
];

export function ExportProgressModal({
  isOpen,
  format,
  tripName,
  onComplete,
}: ExportProgressModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProgressStep[]>(
    EXPORT_STEPS.map((step, index) => ({
      id: step.id,
      label: step.label,
      progress: 0,
      isComplete: false,
    }))
  );

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setCurrentStepIndex(0);
      setProgress(0);
      setSteps(
        EXPORT_STEPS.map((step) => ({
          id: step.id,
          label: step.label,
          progress: 0,
          isComplete: false,
        }))
      );
      return;
    }

    // Simulate export progress
    let totalProgress = 0;
    let stepIndex = 0;

    const progressInterval = setInterval(
      () => {
        if (stepIndex >= EXPORT_STEPS.length) {
          clearInterval(progressInterval);
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
          return;
        }

        const step = EXPORT_STEPS[stepIndex];
        const stepProgress = totalProgress + 100 / EXPORT_STEPS.length;

        setProgress(Math.min(stepProgress, 100));
        setCurrentStepIndex(stepIndex);

        // Mark current step as complete
        setSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            isComplete: i < stepIndex,
            progress: i === stepIndex ? 100 : i < stepIndex ? 100 : 0,
          }))
        );

        totalProgress = stepProgress;
        stepIndex++;
      },
      EXPORT_STEPS.reduce((sum, s) => sum + s.duration, 0) / EXPORT_STEPS.length
    );

    return () => clearInterval(progressInterval);
  }, [isOpen, onComplete]);

  const currentStep = EXPORT_STEPS[currentStepIndex];
  const formatName = format.toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <FileText className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <DialogTitle className="text-center">Generating {formatName} Export</DialogTitle>
          <DialogDescription className="text-center">
            Preparing your expense report for <strong>{tripName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          {currentStep && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-blue-900">{currentStep.label}...</p>
              </div>
            </Card>
          )}

          {/* Steps Breakdown */}
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-md transition-all ${
                  index === currentStepIndex
                    ? 'bg-blue-50'
                    : step.isComplete
                      ? 'bg-green-50'
                      : 'bg-muted/30'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : index === currentStepIndex ? (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <p
                  className={`text-sm flex-1 ${
                    step.isComplete
                      ? 'text-green-700 font-medium'
                      : index === currentStepIndex
                        ? 'text-blue-900 font-medium'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            ))}
          </div>

          {/* Info */}
          <p className="text-xs text-center text-muted-foreground">
            This may take a few moments depending on the size of your trip data
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
