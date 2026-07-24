import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Users,
  Vote,
  DollarSign,
  MessageSquare,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface WelcomeTourModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userName?: string;
}

interface TourStep {
  title: string;
  description: string;
  icon: typeof Sparkles;
  features: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to TripSync! 🎉',
    description:
      'Plan group trips effortlessly with AI-powered itineraries and smart collaboration tools.',
    icon: Sparkles,
    features: [
      'AI generates personalized itineraries in 60 seconds',
      'Collaborative planning with your entire group',
      'Smart expense tracking and settlements',
      'Real-time chat with Atlas, your AI travel assistant',
    ],
  },
  {
    title: 'Create Your First Trip',
    description:
      'Get started by creating a trip with our 5-step wizard. AI will handle the heavy lifting!',
    icon: Sparkles,
    features: [
      'Choose your destination, dates, and budget',
      'Select your trip vibe and preferences',
      'Invite your travel buddies',
      'AI generates a complete itinerary automatically',
    ],
  },
  {
    title: 'Democratic Decision Making',
    description:
      'Everyone gets a voice! Vote on activities, chat in real-time, and make decisions together.',
    icon: Vote,
    features: [
      'Upvote or downvote any activity',
      'Auto-approve when 70%+ of group agrees',
      'Atlas AI helps resolve deadlocks',
      'Real-time group chat with @mentions',
    ],
  },
  {
    title: 'Smart Expense Tracking',
    description: 'Split bills fairly and see who owes what with our intelligent settlement system.',
    icon: DollarSign,
    features: [
      'Add expenses with receipt photos',
      'AI extracts data from receipts (Pro)',
      'Automatic "who owes whom" calculations',
      'Quick payment links for Venmo/Zelle',
    ],
  },
  {
    title: 'Meet Atlas, Your AI Assistant',
    description:
      'Chat with Atlas anytime for recommendations, packing lists, budget tips, and more.',
    icon: MessageSquare,
    features: [
      'Context-aware travel recommendations',
      '24/7 proactive trip monitoring',
      'Generates packing lists and trip recaps',
      'Helps optimize your budget and itinerary',
    ],
  },
];

export function WelcomeTourModal({ isOpen, onComplete, userName }: WelcomeTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {currentStep === 0 && userName ? `Welcome, ${userName}!` : step.title}
          </DialogTitle>
          <DialogDescription className="text-center">{step.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Features List */}
          <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border">
            {step.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip} className="sm:w-auto w-full">
            Skip Tour
          </Button>

          <div className="flex gap-2 w-full sm:w-auto">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            <Button onClick={handleNext} className="flex-1 sm:flex-none">
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
