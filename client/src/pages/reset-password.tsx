import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/app-logo';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const { toast } = useToast();

  // Extract token from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');

    if (!tokenParam) {
      setTokenError('No reset token provided. Please check your email for the reset link.');
      setIsValidating(false);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, []);

  const validateToken = async (tokenValue: string) => {
    setIsValidating(true);
    setTokenError(null);

    try {
      const res = await fetch(`/api/auth/validate-token/${encodeURIComponent(tokenValue)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setIsTokenValid(true);
      } else {
        setTokenError(data.error || 'This reset link is invalid or has expired.');
        setIsTokenValid(false);
      }
    } catch (error) {
      setTokenError('Failed to validate reset link. Please try again.');
      setIsTokenValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password || !confirmPassword) {
      toast({
        title: 'All fields required',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: 'Please ensure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    if (!token) {
      toast({
        title: 'Invalid reset token',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetComplete(true);
        toast({
          title: 'Password reset successful',
          description: 'You can now log in with your new password',
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast({
          title: data.error || 'Failed to reset password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'An error occurred',
        description: 'Please try again or request a new reset link',
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
          Back to login
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
            {isValidating
              ? 'Validating your reset link...'
              : isTokenValid
                ? 'Enter your new password below'
                : "There's an issue with your reset link"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Loading state while validating token */}
          {isValidating && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Checking reset link...</p>
            </div>
          )}

          {/* Token validation error */}
          {!isValidating && !isTokenValid && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{tokenError}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Reset links expire after 1 hour for security.
                </p>
                <Link href="/forgot-password">
                  <Button variant="outline" className="w-full">
                    Request a new reset link
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Success state after password reset */}
          {!isValidating && isTokenValid && resetComplete && (
            <div className="space-y-4 text-center py-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Password Reset Complete!</h3>
                <p className="text-sm text-muted-foreground">Redirecting you to login...</p>
              </div>
            </div>
          )}

          {/* Password reset form */}
          {!isValidating && isTokenValid && !resetComplete && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  'Reset password'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Password must be at least 8 characters long
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
