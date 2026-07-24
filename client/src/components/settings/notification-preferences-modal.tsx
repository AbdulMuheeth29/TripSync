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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

interface NotificationChannel {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface NotificationPreferences {
  expenses: NotificationChannel;
  activities: NotificationChannel;
  chat: NotificationChannel;
  votes: NotificationChannel;
  payments: NotificationChannel;
  atlas: NotificationChannel;
  tripUpdates: NotificationChannel;
}

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPreferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
}

export function NotificationPreferencesModal({
  isOpen,
  onClose,
  initialPreferences,
  onSave,
}: NotificationPreferencesModalProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (
    category: keyof NotificationPreferences,
    channel: keyof NotificationChannel
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const handleToggleAll = (category: keyof NotificationPreferences, enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        email: enabled,
        push: enabled,
        sms: enabled,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(preferences);
      onClose();
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isAllEnabled = (category: keyof NotificationPreferences) => {
    const cat = preferences[category];
    return cat.email && cat.push && cat.sms;
  };

  const isAnyEnabled = (category: keyof NotificationPreferences) => {
    const cat = preferences[category];
    return cat.email || cat.push || cat.sms;
  };

  const notificationCategories = [
    {
      key: 'expenses' as keyof NotificationPreferences,
      icon: DollarSign,
      label: 'Expenses',
      description: 'New expenses, splits, and settlements',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      key: 'activities' as keyof NotificationPreferences,
      icon: Calendar,
      label: 'Activities',
      description: 'Itinerary updates and activity changes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'chat' as keyof NotificationPreferences,
      icon: MessageSquare,
      label: 'Chat Messages',
      description: 'New messages and @mentions',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      key: 'votes' as keyof NotificationPreferences,
      icon: Users,
      label: 'Votes & Decisions',
      description: 'New votes and voting deadlines',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      key: 'payments' as keyof NotificationPreferences,
      icon: TrendingUp,
      label: 'Payments',
      description: 'Payment reminders and confirmations',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      key: 'atlas' as keyof NotificationPreferences,
      icon: Sparkles,
      label: 'Atlas AI Insights',
      description: 'Smart recommendations and alerts',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      key: 'tripUpdates' as keyof NotificationPreferences,
      icon: Bell,
      label: 'Trip Updates',
      description: 'Members joining, trip changes, and reminders',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <DialogTitle>Notification Preferences</DialogTitle>
          </div>
          <DialogDescription>
            Choose how you want to be notified about updates to your trips
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel Headers */}
          <div className="grid grid-cols-4 gap-4 px-4">
            <div></div>
            <div className="flex flex-col items-center">
              <Mail className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-xs font-medium">Email</span>
            </div>
            <div className="flex flex-col items-center">
              <Smartphone className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-xs font-medium">Push</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageSquare className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-xs font-medium">SMS</span>
            </div>
          </div>

          <Separator />

          {/* Notification Categories */}
          <div className="space-y-3">
            {notificationCategories.map((category) => {
              const Icon = category.icon;
              const categoryPrefs = preferences[category.key];

              return (
                <Card key={category.key} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${category.bgColor}`}
                        >
                          <Icon className={`h-5 w-5 ${category.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-semibold">{category.label}</Label>
                            {isAnyEnabled(category.key) && (
                              <span className="text-xs text-green-600 font-medium">Active</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAll(category.key, !isAllEnabled(category.key))}
                        className="text-xs"
                      >
                        {isAllEnabled(category.key) ? 'Disable All' : 'Enable All'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pl-13">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={categoryPrefs.email}
                          onCheckedChange={() => handleToggle(category.key, 'email')}
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={categoryPrefs.push}
                          onCheckedChange={() => handleToggle(category.key, 'push')}
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={categoryPrefs.sms}
                          onCheckedChange={() => handleToggle(category.key, 'sms')}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Info Card */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-900">
                <p className="font-medium mb-1">About Notifications</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Email: Detailed summaries sent to your inbox</li>
                  <li>• Push: Instant notifications on your devices</li>
                  <li>• SMS: Text messages for urgent updates (standard rates apply)</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
