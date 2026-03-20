import { Link } from "wouter";
import { AppLogo } from "@/components/app-logo";

const footerLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
  { label: "Log in", href: "/login" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/80 bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <AppLogo className="h-8 w-8 object-contain" />
              <span className="font-semibold text-foreground tracking-tight">TripSync</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Group trip planning, simplified. Plan, collaborate, and keep everyone in sync.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Product</h4>
            <nav className="flex flex-col gap-1 text-sm text-muted-foreground">
              <Link href="/#features" className="hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Legal</h4>
            <nav className="flex flex-col gap-1 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Support</h4>
            <nav className="flex flex-col gap-1 text-sm text-muted-foreground">
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border/70 mt-8 pt-6 text-center text-sm text-muted-foreground">
          &copy; {year} TripSync. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
