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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Share2,
  Copy,
  Check,
  Link2,
  Mail,
  MessageSquare,
  RefreshCw,
  Lock,
  Globe,
  Calendar,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { format, addDays } from 'date-fns';

interface ShareTripLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    memberCount: number;
  };
  shareLink: string;
  onRegenerateLink: () => Promise<string>;
  onTogglePublicAccess: (enabled: boolean) => Promise<void>;
  initialPublicAccess: boolean;
}

export function ShareTripLinkModal({
  isOpen,
  onClose,
  trip,
  shareLink,
  onRegenerateLink,
  onTogglePublicAccess,
  initialPublicAccess,
}: ShareTripLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [publicAccess, setPublicAccess] = useState(initialPublicAccess);
  const [isTogglingAccess, setIsTogglingAccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleRegenerateLink = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateLink();
    } catch (error) {
      console.error('Failed to regenerate link:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTogglePublicAccess = async (enabled: boolean) => {
    setIsTogglingAccess(true);
    try {
      await onTogglePublicAccess(enabled);
      setPublicAccess(enabled);
    } catch (error) {
      console.error('Failed to toggle public access:', error);
    } finally {
      setIsTogglingAccess(false);
    }
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(`Join my trip: ${trip.name}`);
    const body = encodeURIComponent(
      `I'd like to invite you to join my trip "${trip.name}"!\n\n` +
        `Dates: ${format(trip.startDate, 'MMM d')} - ${format(trip.endDate, 'MMM d, yyyy')}\n\n` +
        `Click this link to join:\n${shareLink}\n\n` +
        `See you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShareViaSMS = () => {
    const message = encodeURIComponent(
      `Join my trip "${trip.name}" (${format(trip.startDate, 'MMM d')} - ${format(trip.endDate, 'MMM d')}): ${shareLink}`
    );
    window.open(`sms:?body=${message}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <DialogTitle>Share Trip</DialogTitle>
          </div>
          <DialogDescription>Invite others to join {trip.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip Summary */}
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(trip.startDate, 'MMM d')} - {format(trip.endDate, 'MMM d')}
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{trip.memberCount} members</span>
              </div>
            </div>
          </Card>

          {/* Public Access Toggle */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {publicAccess ? (
                    <Globe className="h-4 w-4 text-green-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="public-access" className="font-semibold">
                    Public Link Access
                  </Label>
                  <Badge variant={publicAccess ? 'secondary' : 'outline'} className="text-xs">
                    {publicAccess ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {publicAccess
                    ? 'Anyone with the link can request to join this trip'
                    : 'Link sharing is disabled. Use email invites instead.'}
                </p>
              </div>
              <Switch
                id="public-access"
                checked={publicAccess}
                onCheckedChange={handleTogglePublicAccess}
                disabled={isTogglingAccess}
              />
            </div>
          </Card>

          {publicAccess && (
            <>
              {/* Share Link */}
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly className="flex-1 font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Link copied to clipboard!
                  </p>
                )}
              </div>

              <Separator />

              {/* Share Options */}
              <div className="space-y-2">
                <Label>Quick Share</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleShareViaEmail}
                    className="flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShareViaSMS}
                    className="flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Link Management */}
              <Card className="p-3 bg-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-0.5">Regenerate Link</p>
                    <p className="text-xs text-muted-foreground">
                      Create a new link and invalidate the old one
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateLink}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </Card>

              {/* Security Notice */}
              <Card className="p-3 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-900">
                    <p className="font-medium mb-1">Link Security</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>• People with the link can request to join</li>
                      <li>• Trip admins must approve all join requests</li>
                      <li>• You can disable or regenerate the link anytime</li>
                      <li>• The link expires 30 days after trip end date</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Expiration Notice */}
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Link expires on {format(addDays(trip.endDate, 30), 'MMM d, yyyy')}
                </p>
              </div>
            </>
          )}

          {/* Disabled State Info */}
          {!publicAccess && (
            <Card className="p-4 bg-muted">
              <p className="text-sm text-muted-foreground mb-3">
                Public link sharing is disabled. You can still invite members by:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Sending email invitations from the Members page</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Adding members directly by email address</span>
                </li>
              </ul>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{publicAccess && copied ? 'Done' : 'Close'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
