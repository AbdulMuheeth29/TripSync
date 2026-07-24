import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageCircle, Users, Send, AtSign } from 'lucide-react';
import { useState } from 'react';

interface TripMember {
  id: string;
  name: string;
  email: string;
  role?: 'organizer' | 'member';
}

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: SendMessageData) => void | Promise<void>;
  tripMembers: TripMember[];
  currentUserId: string;
  tripName: string;
  preSelectedMemberId?: string;
}

export interface SendMessageData {
  recipientIds: string[];
  message: string;
  notifyByEmail: boolean;
}

export function SendMessageModal({
  isOpen,
  onClose,
  onSend,
  tripMembers,
  currentUserId,
  tripName,
  preSelectedMemberId,
}: SendMessageModalProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(preSelectedMemberId ? [preSelectedMemberId] : [])
  );
  const [message, setMessage] = useState('');
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const availableMembers = tripMembers.filter((m) => m.id !== currentUserId);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedMembers(new Set(availableMembers.map((m) => m.id)));
  };

  const handleDeselectAll = () => {
    setSelectedMembers(new Set());
  };

  const handleMention = (memberName: string) => {
    setMessage((prev) => prev + `@${memberName} `);
  };

  const handleSend = async () => {
    if (selectedMembers.size === 0 || !message.trim()) {
      return;
    }

    setIsSending(true);

    const messageData: SendMessageData = {
      recipientIds: Array.from(selectedMembers),
      message: message.trim(),
      notifyByEmail,
    };

    await onSend(messageData);

    // Reset form
    setSelectedMembers(new Set());
    setMessage('');
    setNotifyByEmail(true);
    setIsSending(false);
  };

  const selectedCount = selectedMembers.size;
  const selectedMemberNames = availableMembers
    .filter((m) => selectedMembers.has(m.id))
    .map((m) => m.name);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <DialogTitle>Send Direct Message</DialogTitle>
          </div>
          <DialogDescription>
            Send a message to trip members for <strong>{tripName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients ({selectedCount} selected)
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={selectedCount === availableMembers.length}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={selectedCount === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableMembers.map((member) => {
                const isSelected = selectedMembers.has(member.id);

                return (
                  <Card
                    key={member.id}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary border-2 bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleToggleMember(member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleMember(member.id)}
                      />

                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{member.name}</p>
                          {member.role === 'organizer' && (
                            <Badge variant="secondary" className="text-xs">
                              Organizer
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMention(member.name);
                        }}
                      >
                        <AtSign className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Selected Recipients Summary */}
          {selectedCount > 0 && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Sending to:</strong> {selectedMemberNames.join(', ')}
              </p>
            </Card>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here... Use @Name to mention someone"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters • Use @ to mention members
            </p>
          </div>

          {/* Email Notification */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="emailNotify"
                checked={notifyByEmail}
                onCheckedChange={(checked) => setNotifyByEmail(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="emailNotify" className="text-sm font-medium cursor-pointer">
                  Send email notification
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Recipients will receive an email in addition to an in-app notification
                </p>
              </div>
            </div>
          </Card>

          {/* Info */}
          <Card className="p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This message will appear in the trip's coordination tab. All
              trip members can see messages sent through this feature.
            </p>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedCount === 0 || !message.trim() || isSending}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending
              ? 'Sending...'
              : `Send to ${selectedCount} ${selectedCount === 1 ? 'person' : 'people'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
