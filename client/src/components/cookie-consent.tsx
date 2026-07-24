import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const CONSENT_STORAGE_KEY = 'tripsync_cookie_consent_v1';
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

type CookieConsent = {
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  updatedAt: string;
};

function loadConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (!parsed || typeof parsed.updatedAt !== 'string') return null;
    const updatedAt = new Date(parsed.updatedAt).getTime();
    if (Number.isNaN(updatedAt)) return null;
    const now = Date.now();
    if (now - updatedAt > CONSENT_MAX_AGE_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean, preferences: boolean) {
  if (typeof window === 'undefined') return;
  const payload: CookieConsent = {
    necessary: true,
    analytics,
    preferences,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    // Optional: notify other parts of the app that consent changed.
    window.dispatchEvent(new CustomEvent('tripsync-cookie-consent', { detail: payload }));
  } catch {
    // Ignore storage errors
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [preferencesEnabled, setPreferencesEnabled] = useState(false);

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) {
      setVisible(true);
      return;
    }
    setAnalyticsEnabled(existing.analytics);
    setPreferencesEnabled(existing.preferences);
  }, []);

  const handleAcceptAll = () => {
    setAnalyticsEnabled(true);
    setPreferencesEnabled(true);
    saveConsent(true, true);
    setVisible(false);
    setSettingsOpen(false);
  };

  const handleRejectOptional = () => {
    setAnalyticsEnabled(false);
    setPreferencesEnabled(false);
    saveConsent(false, false);
    setVisible(false);
    setSettingsOpen(false);
  };

  const handleSaveSettings = () => {
    saveConsent(analyticsEnabled, preferencesEnabled);
    setVisible(false);
    setSettingsOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="container mx-auto px-4 pb-4">
          <div className="rounded-2xl border bg-background/95 backdrop-blur shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Cookie preferences</p>
              <p className="text-muted-foreground">
                We use cookies to provide essential functionality and improve your experience.
                Strictly necessary cookies are always active. You can customize optional cookies
                below. See our{' '}
                <a href="/privacy" className="underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                Customize
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRejectOptional}>
                Reject optional
              </Button>
              <Button size="sm" onClick={handleAcceptAll}>
                Accept all
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie settings</DialogTitle>
            <DialogDescription>
              Choose which optional cookies you want to allow. Strictly necessary cookies are always
              active because they&apos;re required for TripSync to function securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/60 px-3 py-2.5">
              <div className="space-y-1">
                <p className="text-sm font-medium">Strictly necessary</p>
                <p className="text-xs text-muted-foreground">
                  Required for TripSync to work securely, including authentication, session
                  management, and CSRF protection. These cookies are always on.
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground mt-1">Always on</span>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5">
              <div className="space-y-1">
                <label className="text-sm font-medium">Analytics</label>
                <p className="text-xs text-muted-foreground">
                  Helps us understand how TripSync is used so we can fix issues and improve
                  features. Analytics data is aggregated and not used to show you ads.
                </p>
              </div>
              <Switch
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
                className="mt-1"
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5">
              <div className="space-y-1">
                <label className="text-sm font-medium">Preferences</label>
                <p className="text-xs text-muted-foreground">
                  Stores your theme, language, and other settings so we can remember your
                  preferences between visits.
                </p>
              </div>
              <Switch
                checked={preferencesEnabled}
                onCheckedChange={setPreferencesEnabled}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={handleRejectOptional}>
              Reject optional
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={handleAcceptAll}>
              Accept all
            </Button>
            <Button size="sm" type="button" onClick={handleSaveSettings}>
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
