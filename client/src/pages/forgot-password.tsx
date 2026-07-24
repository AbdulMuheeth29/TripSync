import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/app-logo';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Email required', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        toast({
          title: 'Check your email',
          description: data.message || 'If an account exists, we sent reset instructions.',
        });
      } else {
        toast({ title: data.error || 'Failed', variant: 'destructive' });
      }
    } catch {
      toast({
        title: 'Password reset not configured',
        description: 'Please contact us or register a new account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/login">
        <Button variant="ghost" className="absolute top-4 left-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 no-underline text-foreground hover:opacity-90 transition-opacity"
      >
        <AppLogo className="h-10 w-10 object-contain" />
        <span className="text-2xl font-bold">TripSync</span>
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you instructions to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                If an account exists for {email}, you&apos;ll receive password reset instructions
                shortly.
              </p>
              <Link href="/login">
                <Button variant="outline">Back to login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Password reset requires email service to be configured. If you don&apos;t receive an
                email,{' '}
                <Link href="/contact">
                  <a className="text-primary hover:underline">contact us</a>
                </Link>
                .
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
