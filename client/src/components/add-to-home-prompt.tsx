import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'tripsync_pwa_prompt_dismissed_at';
const DISMISS_TTL_DAYS = 180;

function shouldShowPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return ageDays > DISMISS_TTL_DAYS;
  } catch {
    return true;
  }
}

export function AddToHomePrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 768;
    if (!isMobile || !shouldShowPrompt()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler as any);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
    };
  }, []);

  if (!event || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed bottom-4 inset-x-4 z-40 md:max-w-sm md:left-auto md:right-4">
      <div className="rounded-2xl border bg-background/95 shadow-lg shadow-black/20 px-4 py-3 flex items-center gap-3">
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-sm">Add TripSync to your home screen</span>
          <span className="text-muted-foreground">
            Open your trips instantly while traveling. Works great as a mobile app.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={dismiss}>
            Not now
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={async () => {
              try {
                await event.prompt();
                await event.userChoice;
              } finally {
                dismiss();
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
