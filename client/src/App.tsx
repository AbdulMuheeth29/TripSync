import { lazy, Suspense } from 'react';
import { Switch, Route, Redirect } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-provider';
import { AppFooter } from '@/components/app-footer';
import { CookieConsentBanner } from '@/components/cookie-consent';
import { AtlasAgent } from '@/components/atlas/AtlasAgent';
import { AddToHomePrompt } from '@/components/add-to-home-prompt';
import { CommandPalette } from '@/components/command-palette';

// Lazy load all page components for code splitting
const LandingPage = lazy(() => import('@/pages/landing'));
const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const PricingPage = lazy(() => import('@/pages/pricing'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const CreateTripPage = lazy(() => import('@/pages/create-trip'));
const TripDetailPage = lazy(() => import('@/pages/trip-detail'));
const JoinTripPage = lazy(() => import('@/pages/join-trip'));
const InviteRespondPage = lazy(() => import('@/pages/invite-respond'));
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('@/pages/reset-password'));
const ContactPage = lazy(() => import('@/pages/contact'));
const PrivacyPage = lazy(() => import('@/pages/privacy'));
const TermsPage = lazy(() => import('@/pages/terms'));
const BillingPage = lazy(() => import('@/pages/billing'));
const HelpPage = lazy(() => import('@/pages/help'));
const NotFound = lazy(() => import('@/pages/not-found'));
const MetricsDashboard = lazy(() => import('@/admin/MetricsDashboard'));
const PublicTripPage = lazy(() => import('@/pages/public-trip'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

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
      <div className="flex-1">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </div>
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
        <Route path="/register">{() => <PublicOnlyRoute component={RegisterPage} />}</Route>
        <Route path="/pricing" component={PricingPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/help" component={HelpPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/dashboard">{() => <ProtectedRoute component={DashboardPage} />}</Route>
        <Route path="/dashboard/billing">{() => <ProtectedRoute component={BillingPage} />}</Route>
        <Route path="/create">{() => <ProtectedRoute component={CreateTripPage} />}</Route>
        <Route path="/trip/:id">{() => <ProtectedRoute component={TripDetailPage} />}</Route>
        <Route path="/join/:code" component={JoinTripPage} />
        <Route path="/invite/:inviteId" component={InviteRespondPage} />
        <Route path="/t/:code" component={PublicTripPage} />
        <Route path="/admin/metrics">{() => <ProtectedRoute component={MetricsDashboard} />}</Route>
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
