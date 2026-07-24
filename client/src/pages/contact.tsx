import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/app-logo';
import { AppHero } from '@/components/app-hero';
import { MessageCircle, Send } from 'lucide-react';
import { spacing } from '@/lib/spacing-tokens';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      toast({ title: 'Email and message are required', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || 'Contact form',
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        toast({
          title: 'Message sent',
          description: data.message || "We'll get back to you soon.",
        });
      } else {
        toast({
          title: data.error || 'Failed to send',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Could not send message',
        description: 'Please try again or email us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline text-foreground hover:opacity-90 transition-opacity"
          >
            <AppLogo className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold">TripSync</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
            </Link>
            <Link href="/pricing">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
            </Link>
            <Link href="/contact">
              <a className="text-sm font-medium text-foreground">Contact</a>
            </Link>
          </nav>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Log in
            </Button>
          </Link>
        </div>
      </header>

      <AppHero />

      <main className={`container mx-auto px-4 ${spacing.section.md} max-w-xl`}>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Get in touch</CardTitle>
            <CardDescription>
              Have questions about TripSync? Need help planning your trip? Our team typically
              responds within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <p className="text-muted-foreground">
                  Thank you for contacting TripSync. We've received your message and will respond
                  within 24 hours.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name (optional)</Label>
                  <Input
                    id="contact-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-subject">Subject (optional)</Label>
                  <Input
                    id="contact-subject"
                    type="text"
                    placeholder="How can we help?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={300}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message *</Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="resize-none"
                    maxLength={10000}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  <Send className="h-4 w-4" />
                  {isLoading ? 'Sending…' : 'Send message'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
