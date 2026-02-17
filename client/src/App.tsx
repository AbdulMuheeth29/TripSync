import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-provider";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CreateTripPage from "@/pages/create-trip";
import TripDetailPage from "@/pages/trip-detail";
import JoinTripPage from "@/pages/join-trip";
import InviteRespondPage from "@/pages/invite-respond";
import ForgotPasswordPage from "@/pages/forgot-password";
import NotFound from "@/pages/not-found";
import MetricsDashboard from "@/admin/MetricsDashboard";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/create">
        {() => <ProtectedRoute component={CreateTripPage} />}
      </Route>
      <Route path="/trip/:id">
        {() => <ProtectedRoute component={TripDetailPage} />}
      </Route>
      <Route path="/join/:code" component={JoinTripPage} />
      <Route path="/invite/:inviteId" component={InviteRespondPage} />
      <Route path="/admin/metrics">
        {() => <ProtectedRoute component={MetricsDashboard} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
