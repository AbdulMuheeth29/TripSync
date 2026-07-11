import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Copy, MessageSquare, CheckCircle2, X, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Step5InviteMembersProps {
  onSubmit: (invites: string[], skipInvites: boolean) => void;
  onBack: () => void;
  defaultInvites?: string[];
  shareLink?: string;
}

export function Step5InviteMembers({ onSubmit, onBack, defaultInvites = [], shareLink }: Step5InviteMembersProps) {
  const [emails, setEmails] = useState<string[]>(defaultInvites);
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    const trimmedEmail = currentEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError("Please enter an email address");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setEmailError("This email has already been added");
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setCurrentEmail("");
    setEmailError("");
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
    }
  };

  const handleSkip = () => {
    onSubmit([], true);
  };

  const handleSubmitInvites = () => {
    onSubmit(emails, false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Invite your travel companions</h2>
        <p className="text-muted-foreground">
          Add friends and family to start planning together (you can skip this for now)
        </p>
      </div>

      {/* Email Invitation */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Invite by Email</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={currentEmail}
                onChange={(e) => {
                  setCurrentEmail(e.target.value);
                  setEmailError("");
                }}
                onKeyDown={handleKeyDown}
                className={emailError ? "border-red-500" : ""}
              />
              <Button type="button" onClick={handleAddEmail}>
                Add
              </Button>
            </div>
            {emailError && (
              <p className="text-sm text-red-500">{emailError}</p>
            )}
          </div>

          {/* Email List */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Invited Members ({emails.length})</Label>
              <div className="flex flex-wrap gap-2">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="pl-3 pr-1 py-1">
                    <span className="text-sm">{email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Share Link */}
      {shareLink && (
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Or Share a Link</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="bg-muted"
                />
                <Button type="button" variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.location.href = `mailto:?subject=Join my trip on TripSync&body=Join our trip! ${shareLink}`;
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Join my trip on TripSync",
                        text: "Join our trip!",
                        url: shareLink
                      });
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {emails.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Ready to send {emails.length} {emails.length === 1 ? "invitation" : "invitations"}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your friends will receive an email invitation to join your trip
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          className="flex-1"
        >
          Skip for Now
        </Button>
        <Button
          type="button"
          onClick={handleSubmitInvites}
          className="flex-1"
          size="lg"
        >
          {emails.length > 0 ? `Send ${emails.length} Invites & Create Trip` : "Create Trip"}
        </Button>
      </div>
    </div>
  );
}
