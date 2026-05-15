import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { AppFooter } from "@/components/app-footer";
import { CookieConsentBanner } from "@/components/cookie-consent";
import { AtlasAgent } from "@/components/atlas/AtlasAgent";
import { AddToHomePrompt } from "@/components/add-to-home-prompt";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import PricingPage from "@/pages/pricing";
import DashboardPage from "@/pages/dashboard";
import CreateTripPage from "@/pages/create-trip";
import TripDetailPage from "@/pages/trip-detail";
import JoinTripPage from "@/pages/join-trip";
import InviteRespondPage from "@/pages/invite-respond";
import ForgotPasswordPage from "@/pages/forgot-password";
import ContactPage from "@/pages/contact";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import BillingPage from "@/pages/billing";
import HelpPage from "@/pages/help";
import NotFound from "@/pages/not-found";
import MetricsDashboard from "@/admin/MetricsDashboard";
import { CommandPalette } from "@/components/command-palette";
import PublicTripPage from "@/pages/public-trip";

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

function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <Component />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <CommandPalette />
      <CookieConsentBanner />
      <AddToHomePrompt />
      <AtlasAgent />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login">{() => <PublicOnlyRoute component={LoginPage} />}</Route>
        <Route path="/pricing" component={PricingPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/help" component={HelpPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/dashboard">
          {() => <ProtectedRoute component={DashboardPage} />}
        </Route>
        <Route path="/dashboard/billing">
          {() => <ProtectedRoute component={BillingPage} />}
        </Route>
        <Route path="/create">
          {() => <ProtectedRoute component={CreateTripPage} />}
        </Route>
        <Route path="/trip/:id">
          {() => <ProtectedRoute component={TripDetailPage} />}
        </Route>
        <Route path="/join/:code" component={JoinTripPage} />
        <Route path="/invite/:inviteId" component={InviteRespondPage} />
        <Route path="/t/:code" component={PublicTripPage} />
        <Route path="/admin/metrics">
          {() => <ProtectedRoute component={MetricsDashboard} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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
