import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface AtlasTypingIndicatorProps {
  message?: string;
  variant?: 'default' | 'compact';
}

export function AtlasTypingIndicator({
  message = 'Atlas is thinking',
  variant = 'default',
}: AtlasTypingIndicatorProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center gap-1 py-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4 max-w-md bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-primary mb-2">{message}...</p>

          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </Card>
  );
}
