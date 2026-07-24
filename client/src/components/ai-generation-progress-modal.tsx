import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, MapPin, Hotel, Utensils, Activity, Check } from "lucide-react";

interface AIGenerationProgressModalProps {
  isOpen: boolean;
  destination: string;
  onComplete?: () => void;
}

interface GenerationStep {
  id: string;
  label: string;
  icon: typeof Sparkles;
  duration: number; // ms
}

const GENERATION_STEPS: GenerationStep[] = [
  { id: "analyzing", label: "Analyzing preferences", icon: Sparkles, duration: 5000 },
  { id: "researching", label: "Researching activities in destination", icon: MapPin, duration: 12000 },
  { id: "hotels", label: "Finding accommodation options", icon: Hotel, duration: 8000 },
  { id: "dining", label: "Curating dining experiences", icon: Utensils, duration: 10000 },
  { id: "activities", label: "Planning daily activities", icon: Activity, duration: 15000 },
  { id: "optimizing", label: "Optimizing itinerary", icon: Sparkles, duration: 8000 },
];

export function AIGenerationProgressModal({
  isOpen,
  destination,
  onComplete
}: AIGenerationProgressModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCurrentStepIndex(0);
      setProgress(0);
      setCompletedSteps(new Set());
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let startTime = Date.now();
    const totalDuration = GENERATION_STEPS.reduce((sum, step) => sum + step.duration, 0);

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Update current step
      let cumulativeDuration = 0;
      for (let i = 0; i < GENERATION_STEPS.length; i++) {
        cumulativeDuration += GENERATION_STEPS[i].duration;
        if (elapsed < cumulativeDuration) {
          setCurrentStepIndex(i);
          break;
        } else {
          setCompletedSteps(prev => new Set([...prev, GENERATION_STEPS[i].id]));
        }
      }

      if (elapsed < totalDuration) {
        timeoutId = setTimeout(updateProgress, 100);
      } else {
        // Mark all steps complete
        setCompletedSteps(new Set(GENERATION_STEPS.map(s => s.id)));
        setCurrentStepIndex(GENERATION_STEPS.length - 1);
        setProgress(100);

        // Trigger completion callback after a brief delay
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    };

    timeoutId = setTimeout(updateProgress, 100);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, onComplete]);

  const currentStep = GENERATION_STEPS[currentStepIndex];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            Creating Your Trip
          </DialogTitle>
          <DialogDescription>
            AI is planning the perfect itinerary for {destination}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Generation Steps */}
          <div className="space-y-3">
            {GENERATION_STEPS.map((step, index) => {
              const isComplete = completedSteps.has(step.id);
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : isComplete
                      ? "bg-muted/50"
                      : "opacity-50"
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/20"
                      : "bg-muted"
                  }`}>
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <StepIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isCurrent ? "font-medium" : ""
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Fun Fact */}
          <div className="rounded-lg bg-muted/50 p-4 border border-border">
            <p className="text-sm text-muted-foreground italic">
              💡 Did you know? Our AI analyzes thousands of travel recommendations
              to create a personalized itinerary just for your group.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
