import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Eye,
  Users,
  BarChart3,
  Cookie,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showActiveTrips: boolean;
  allowSearchByEmail: boolean;
  allowFriendRequests: boolean;
  shareAnalytics: boolean;
  personalizedAds: boolean;
  cookiePreferences: 'all' | 'essential' | 'none';
  dataSharing: {
    analytics: boolean;
    improvements: boolean;
    marketing: boolean;
  };
  activityStatus: boolean;
  readReceipts: boolean;
  onlineStatus: boolean;
}

interface PrivacySettingsPanelProps {
  initialSettings: PrivacySettings;
  onSave: (settings: PrivacySettings) => Promise<void>;
  onDeleteAccount: () => void;
}

export function PrivacySettingsPanel({
  initialSettings,
  onSave,
  onDeleteAccount,
}: PrivacySettingsPanelProps) {
  const [settings, setSettings] = useState<PrivacySettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleDataSharingChange = (key: keyof PrivacySettings['dataSharing'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      dataSharing: { ...prev.dataSharing, [key]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setHasChanges(false);
  };

  const getVisibilityLabel = (visibility: string) => {
    const labels = {
      public: 'Public',
      friends: 'Friends Only',
      private: 'Private',
    };
    return labels[visibility as keyof typeof labels];
  };

  const getCookieLabel = (preference: string) => {
    const labels = {
      all: 'All Cookies',
      essential: 'Essential Only',
      none: 'Reject All',
    };
    return labels[preference as keyof typeof labels];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Privacy & Security</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Control who can see your information and how your data is used
          </p>
        </div>
        {hasChanges && (
          <Badge variant="outline" className="bg-blue-50">
            Unsaved Changes
          </Badge>
        )}
      </div>

      <Separator />

      {/* Profile Privacy */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Profile Privacy</h3>
        </div>

        <div className="space-y-4">
          {/* Profile Visibility */}
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Profile Visibility</Label>
            <Select
              value={settings.profileVisibility}
              onValueChange={(value) => handleChange('profileVisibility', value as any)}
            >
              <SelectTrigger id="profile-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{getVisibilityLabel('public')}</SelectItem>
                <SelectItem value="friends">{getVisibilityLabel('friends')}</SelectItem>
                <SelectItem value="private">{getVisibilityLabel('private')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.profileVisibility === 'public' && 'Anyone can view your profile'}
              {settings.profileVisibility === 'friends' &&
                'Only your trip members can view your profile'}
              {settings.profileVisibility === 'private' && 'Your profile is hidden from searches'}
            </p>
          </div>

          <Separator />

          {/* Show Email */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="show-email">Show Email Address</Label>
              <p className="text-xs text-muted-foreground">
                Allow others to see your email on your profile
              </p>
            </div>
            <Switch
              id="show-email"
              checked={settings.showEmail}
              onCheckedChange={(checked) => handleChange('showEmail', checked)}
            />
          </div>

          <Separator />

          {/* Show Active Trips */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="show-trips">Show Active Trips</Label>
              <p className="text-xs text-muted-foreground">
                Display your current trips on your profile
              </p>
            </div>
            <Switch
              id="show-trips"
              checked={settings.showActiveTrips}
              onCheckedChange={(checked) => handleChange('showActiveTrips', checked)}
            />
          </div>

          <Separator />

          {/* Allow Search */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="allow-search">Allow Search by Email</Label>
              <p className="text-xs text-muted-foreground">
                Let others find you by searching your email address
              </p>
            </div>
            <Switch
              id="allow-search"
              checked={settings.allowSearchByEmail}
              onCheckedChange={(checked) => handleChange('allowSearchByEmail', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Activity & Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Activity & Status</h3>
        </div>

        <div className="space-y-4">
          {/* Online Status */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="online-status">Show Online Status</Label>
              <p className="text-xs text-muted-foreground">
                Display when you're actively using TripSync
              </p>
            </div>
            <Switch
              id="online-status"
              checked={settings.onlineStatus}
              onCheckedChange={(checked) => handleChange('onlineStatus', checked)}
            />
          </div>

          <Separator />

          {/* Activity Status */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="activity-status">Activity Status</Label>
              <p className="text-xs text-muted-foreground">
                Show "typing..." and other activity indicators
              </p>
            </div>
            <Switch
              id="activity-status"
              checked={settings.activityStatus}
              onCheckedChange={(checked) => handleChange('activityStatus', checked)}
            />
          </div>

          <Separator />

          {/* Read Receipts */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="read-receipts">Read Receipts</Label>
              <p className="text-xs text-muted-foreground">
                Let others know when you've read their messages
              </p>
            </div>
            <Switch
              id="read-receipts"
              checked={settings.readReceipts}
              onCheckedChange={(checked) => handleChange('readReceipts', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Data & Analytics */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Data & Analytics</h3>
        </div>

        <div className="space-y-4">
          {/* Analytics Sharing */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="share-analytics">Share Usage Analytics</Label>
              <p className="text-xs text-muted-foreground">
                Help us improve TripSync by sharing anonymous usage data
              </p>
            </div>
            <Switch
              id="share-analytics"
              checked={settings.dataSharing.analytics}
              onCheckedChange={(checked) => handleDataSharingChange('analytics', checked)}
            />
          </div>

          <Separator />

          {/* Product Improvements */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="improvements">Product Improvement Data</Label>
              <p className="text-xs text-muted-foreground">
                Share data to help identify bugs and improve features
              </p>
            </div>
            <Switch
              id="improvements"
              checked={settings.dataSharing.improvements}
              onCheckedChange={(checked) => handleDataSharingChange('improvements', checked)}
            />
          </div>

          <Separator />

          {/* Marketing */}
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="marketing">Marketing Communications</Label>
              <p className="text-xs text-muted-foreground">
                Receive personalized tips, offers, and feature announcements
              </p>
            </div>
            <Switch
              id="marketing"
              checked={settings.dataSharing.marketing}
              onCheckedChange={(checked) => handleDataSharingChange('marketing', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Cookies */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cookie className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Cookie Preferences</h3>
        </div>

        <div className="space-y-2">
          <Select
            value={settings.cookiePreferences}
            onValueChange={(value) => handleChange('cookiePreferences', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{getCookieLabel('all')}</SelectItem>
              <SelectItem value="essential">{getCookieLabel('essential')}</SelectItem>
              <SelectItem value="none">{getCookieLabel('none')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="p-3 bg-muted rounded-lg text-xs">
            {settings.cookiePreferences === 'all' && (
              <p>All cookies enabled including analytics and marketing</p>
            )}
            {settings.cookiePreferences === 'essential' && (
              <p>Only essential cookies for core functionality</p>
            )}
            {settings.cookiePreferences === 'none' && (
              <p className="text-amber-600">Warning: Some features may not work properly</p>
            )}
          </div>
        </div>
      </Card>

      {/* GDPR Compliance */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900">
            <p className="font-medium mb-1">Your Privacy Rights</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Request a copy of your data at any time</li>
              <li>• Delete your account and all associated data</li>
              <li>• Opt out of data collection and processing</li>
              <li>• Update or correct your personal information</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-semibold text-red-900">Danger Zone</h3>
        </div>

        <Alert variant="destructive" className="mb-4">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-sm">
            These actions are permanent and cannot be undone. Please proceed with caution.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="text-sm font-medium text-red-900">Delete Account</p>
              <p className="text-xs text-red-700">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm" onClick={onDeleteAccount}>
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isSaving}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
