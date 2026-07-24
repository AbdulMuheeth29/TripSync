import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { AppLogo } from "@/components/app-logo";
import { Eye, EyeOff, Check, X, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function validatePassword(pw: string): {
  requirements: PasswordRequirement[];
  score: number;
  isValid: boolean;
} {
  const requirements: PasswordRequirement[] = [
    { label: "At least 8 characters", met: pw.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(pw) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(pw) },
    { label: "Contains number", met: /\d/.test(pw) },
    { label: "Contains special character", met: /[^a-zA-Z0-9]/.test(pw) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const isValid = metCount >= 4; // At least 4 out of 5 requirements

  return {
    requirements,
    score: metCount,
    isValid,
  };
}

function getPasswordStrengthColor(score: number): string {
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-500";
  if (score <= 3) return "bg-yellow-500";
  if (score <= 4) return "bg-lime-500";
  return "bg-green-500";
}

function getPasswordStrengthLabel(score: number): string {
  if (score <= 1) return "Very Weak";
  if (score <= 2) return "Weak";
  if (score <= 3) return "Fair";
  if (score <= 4) return "Good";
  return "Strong";
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();

  const passwordValidation = useMemo(
    () => validatePassword(formData.password),
    [formData.password]
  );

  const emailIsValid = useMemo(() => {
    if (!formData.email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.email);
  }, [formData.email]);

  const passwordsMatch = formData.password === formData.confirmPassword;
  const canSubmit =
    formData.name.trim().length >= 2 &&
    emailIsValid &&
    formData.email.length > 0 &&
    passwordValidation.isValid &&
    passwordsMatch &&
    formData.confirmPassword.length > 0 &&
    termsAccepted;

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast({
        title: "Please complete all fields",
        description: "Make sure all requirements are met before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.name, formData.password, true);
      toast({
        title: "Welcome to TripSync!",
        description: "Your account has been created successfully",
      });

      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      const redirect = params.get("redirect");
      setLocation(redirect && redirect.startsWith("/") ? redirect : "/dashboard?onboarding=welcome");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header with logo and back button */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline text-foreground hover:opacity-90 transition-opacity">
            <AppLogo className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold">TripSync</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>

        {/* Main registration card */}
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Start planning amazing trips with your friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange("name")}
                  disabled={isLoading}
                  autoComplete="name"
                  data-testid="input-name"
                />
                {formData.name.length > 0 && formData.name.length < 2 && (
                  <p className="text-xs text-destructive">Name must be at least 2 characters</p>
                )}
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange("email")}
                  disabled={isLoading}
                  autoComplete="email"
                  data-testid="input-email"
                />
                {formData.email.length > 0 && !emailIsValid && (
                  <p className="text-xs text-destructive">Please enter a valid email address</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange("password")}
                    disabled={isLoading}
                    autoComplete="new-password"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= passwordValidation.score
                              ? getPasswordStrengthColor(passwordValidation.score)
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium">
                      Password strength: {getPasswordStrengthLabel(passwordValidation.score)}
                    </p>

                    {/* Password requirements checklist */}
                    <div className="space-y-1 pt-1">
                      {passwordValidation.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {req.met ? (
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    disabled={isLoading}
                    autoComplete="new-password"
                    data-testid="input-confirm-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
                {formData.confirmPassword && passwordsMatch && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Terms and conditions */}
              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                  disabled={isLoading}
                  data-testid="checkbox-terms"
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="underline text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isLoading}
                data-testid="button-submit-register"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Login link */}
              <Link href="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Sign In Instead
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>

        {/* Security notice */}
        <Alert>
          <AlertDescription className="text-xs text-center text-muted-foreground">
            Your data is encrypted and secure. We'll never share your information with third parties.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
