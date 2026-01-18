import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Plane, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast({
        title: "Missing information",
        description: "Please enter both your email and name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, name);
      toast({
        title: "Welcome to TripSync!",
        description: "Let's plan your next adventure",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/">
        <Button variant="ghost" className="absolute top-4 left-4 gap-2" data-testid="button-back-home">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <div className="flex items-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
          <Plane className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold">TripSync</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            Enter your details to get started with trip planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-login">
              {isLoading ? "Signing in..." : "Continue"}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing, you agree to TripSync's Terms of Service and Privacy Policy.
            This is a demo app - no actual authentication is performed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
