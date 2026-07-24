import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/app-logo';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'wouter';

function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  return { score, label: labels[score] };
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('tripsync_remember') === 'true';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const pwStrength = useMemo(() => passwordStrength(password), [password]);
  const [, setLocation] = useLocation();
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Missing information',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      toast({
        title: 'Welcome back!',
        description: "Let's plan your next adventure",
      });
      const params = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : ''
      );
      const redirect = params.get('redirect');
      setLocation(redirect && redirect.startsWith('/') ? redirect : '/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name || !password || !confirmPassword) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Weak password',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: 'Please make sure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: 'Please accept the Terms of Service',
        description:
          'You must agree to the Terms of Service and Privacy Policy to create an account.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(email, name, password, rememberMe);
      toast({
        title: 'Account created!',
        description: 'Welcome to TripSync',
      });
      const params = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : ''
      );
      const redirect = params.get('redirect');
      // After signup, default to AI demo onboarding on the dashboard
      setLocation(
        redirect && redirect.startsWith('/') ? redirect : '/dashboard?onboarding=ai-demo'
      );
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 no-underline text-foreground hover:opacity-90 transition-opacity"
        data-testid="link-logo-home"
      >
        <AppLogo className="h-10 w-10 object-contain" />
        <span className="text-2xl font-bold">TripSync</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to TripSync</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one to start planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(c) => {
                          setRememberMe(!!c);
                          localStorage.setItem('tripsync_remember', c ? 'true' : 'false');
                        }}
                      />
                      Remember me
                    </label>
                    <Link href="/forgot-password">
                      <button type="button" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </button>
                    </Link>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-submit-login"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  disabled={isLoading}
                  onClick={async () => {
                    setEmail('demo@tripsync.com');
                    setPassword('password123');
                    setIsLoading(true);
                    try {
                      await login('demo@tripsync.com', 'password123', rememberMe);
                      toast({
                        title: 'Welcome back!',
                        description: "Let's plan your next adventure",
                      });
                      const params = new URLSearchParams(
                        typeof window !== 'undefined' ? window.location.search : ''
                      );
                      const redirect = params.get('redirect');
                      setLocation(redirect && redirect.startsWith('/') ? redirect : '/dashboard');
                    } catch (err) {
                      toast({
                        title: 'Login failed',
                        description: err instanceof Error ? err.message : 'Invalid credentials',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  data-testid="button-demo-login"
                >
                  Try Demo Account
                </Button>
                <div className="relative mt-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      New to TripSync?
                    </span>
                  </div>
                </div>
                <Link href="/register" className="block mt-4">
                  <Button type="button" variant="outline" className="w-full" disabled={isLoading}>
                    Create New Account
                  </Button>
                </Link>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <div className="py-8 text-center space-y-4">
                <p className="text-muted-foreground">
                  We've moved registration to a dedicated page for a better experience.
                </p>
                <Link href="/register">
                  <Button className="w-full" size="lg">
                    Go to Registration Page
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
