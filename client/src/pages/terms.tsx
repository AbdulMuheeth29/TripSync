import { Link } from 'wouter';
import { AppLogo } from '@/components/app-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { spacing } from '@/lib/spacing-tokens';

export default function TermsPage() {
  const effectiveDate = 'February 24, 2026';

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
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className={`container mx-auto px-4 ${spacing.section.md} max-w-3xl`}>
        <section className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Terms of Service
            </p>
            <h1 className="text-3xl font-bold tracking-tight">TripSync Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Effective date: {effectiveDate}</p>
          </header>

          <p className="text-sm text-muted-foreground">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of TripSync, a
            group trip planning software-as-a-service (SaaS) platform provided by TripSync
            (&quot;TripSync&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating
            an account or using TripSync, you agree to be bound by these Terms. If you do not agree,
            please do not use the Service.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            You must be at least 13 years old (or 16 in the EU/EEA) to use TripSync. If you are
            under the age of 18 or the age of majority in your jurisdiction, you may only use the
            Service with the consent and supervision of a parent or legal guardian who agrees to be
            bound by these Terms. If you use TripSync on behalf of a company or organization, you
            represent that you are authorized to bind that entity to these Terms.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">2. Account Registration and Security</h2>
          <p>
            To use most features, you must create an account and provide accurate, current, and
            complete information. You are responsible for maintaining the confidentiality of your
            login credentials and for all activities that occur under your account. You must notify
            us immediately of any unauthorized access or security breach. We reserve the right to
            suspend or terminate accounts that violate these Terms or pose a risk to TripSync or
            other users.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">3. Subscription Plans and Billing</h2>
          <p>
            TripSync offers Free, Pro, and Teams plans with different limits and features, including
            trip and member limits, AI usage, map views, and support levels. Paid subscriptions are
            billed via Stripe or other approved payment processors on a recurring monthly or annual
            basis, depending on your selection. Free trials may be offered and will convert to a
            paid subscription unless canceled before the trial ends.
          </p>
          <p>
            Unless otherwise stated or required by law, subscription fees are non-refundable,
            including for partial months or unused features. Subscriptions auto-renew unless
            canceled prior to the renewal date. You can manage or cancel your plan in your billing
            settings. Downgrading to the Free plan may result in restrictions (for example, making
            trips above the free limit read-only).
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">4. User Content and Intellectual Property</h2>
          <p>
            You retain ownership of the content you upload, including trip details, comments,
            photos, and other data (&quot;User Content&quot;). By using TripSync, you grant us a
            worldwide, non-exclusive, royalty-free license to host, store, display, process, and
            distribute your User Content as necessary to operate and improve the Service and enable
            collaboration with your invited users.
          </p>
          <p>
            You represent that you have the rights to upload and share all User Content you provide
            and that it does not violate any law or third-party rights. TripSync, the TripSync logo,
            the underlying software, design, and all related intellectual property are owned by
            TripSync or its licensors. You may not copy, modify, reverse engineer, or create
            derivative works of the Service except as permitted by law.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
          <p>
            You agree not to misuse TripSync. Prohibited activities include, without limitation:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Using the Service for illegal, fraudulent, or harmful purposes.</li>
            <li>Harassing, threatening, or impersonating others.</li>
            <li>Uploading illegal, infringing, defamatory, or hateful content.</li>
            <li>Uploading malware, viruses, or other malicious code.</li>
            <li>Scraping, hacking, or attempting to circumvent security or technical limits.</li>
            <li>Sharing or reselling accounts without authorization.</li>
            <li>Sending spam or unauthorized marketing via the Service.</li>
            <li>Abusing AI features in a way that disrupts the Service or harms others.</li>
          </ul>
          <p>
            We may remove content, limit access, or suspend/terminate accounts that violate this
            policy or applicable law.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">6. AI-Generated Content</h2>
          <p>
            TripSync includes AI-powered features (e.g., itinerary suggestions) powered by
            third-party AI providers such as Anthropic Claude. AI outputs may be inaccurate,
            incomplete, or inappropriate. You must verify all AI-generated recommendations and use
            your own judgment and external sources before making travel decisions. TripSync is not
            responsible for harm or loss arising from reliance on AI-generated content.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">7. Third-Party Services</h2>
          <p>
            TripSync integrates with third-party services such as Stripe (payments), mapping APIs,
            weather APIs, cloud storage, and AI providers. Your use of these services may be
            governed by separate terms and privacy policies. We are not responsible for the acts or
            omissions of third-party providers or for changes to their services.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">8. Data and Privacy</h2>
          <p>
            Your use of TripSync is also governed by our Privacy Policy, which explains how we
            collect, use, and protect personal data and describes your privacy rights (including
            under GDPR and CCPA/CPRA where applicable). By using the Service, you consent to our
            data practices as described in that Policy.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">9. Service Availability and Changes</h2>
          <p>
            We aim for high availability but do not guarantee that TripSync will be uninterrupted or
            error-free. The Service may be unavailable due to maintenance, outages, or factors
            beyond our control. We may add, modify, or remove features at any time. Where feasible,
            we will provide notice of material changes.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">10. Termination</h2>
          <p>
            You may cancel your subscription or delete your account at any time via your account or
            billing settings. We may suspend or terminate your access if you violate these Terms,
            misuse the Service, or if we discontinue the Service. Upon termination, your right to
            use TripSync ceases, and we may delete or restrict access to your content consistent
            with our data retention practices and legal obligations.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">11. Disclaimers and Limitation of Liability</h2>
          <p>
            TripSync is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without
            warranties of any kind, whether express, implied, or statutory. We do not guarantee the
            accuracy or suitability of any content (including AI-generated suggestions), nor that
            the Service will be uninterrupted, secure, or error-free.
          </p>
          <p>
            To the maximum extent permitted by law, TripSync and its affiliates are not liable for
            indirect, incidental, special, consequential, or punitive damages, or for loss of data,
            profits, or business, or for travel issues, cancellations, or safety incidents arising
            from use of the Service. Our total liability for all claims is limited to the amount you
            paid in the 12 months preceding the claim, or US $100 if you only use the Free plan.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless TripSync, its affiliates, and their officers,
            directors, employees, and agents from any claims, damages, losses, or expenses
            (including reasonable legal fees) arising from your use of the Service, your User
            Content, or your breach of these Terms or applicable law.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">13. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, USA, without regard to
            conflict of laws principles. You agree that any disputes will be brought in the state
            and federal courts located in Delaware, USA, unless otherwise required by applicable
            law.
          </p>
          <p>
            Where permitted by law, you agree to resolve disputes with TripSync on an individual
            basis and not as part of a class, consolidated, or representative action.
          </p>
        </section>

        <section className="mt-6 space-y-4 text-sm leading-relaxed mb-12">
          <h2 className="text-xl font-semibold">14. Changes and Contact</h2>
          <p>
            We may update these Terms from time to time. When we do, we will update the effective
            date and may provide additional notice. Your continued use of TripSync after changes
            take effect constitutes acceptance of the revised Terms.
          </p>
          <p>
            If you have questions about these Terms, you can contact us at{' '}
            <a href="mailto:legal@tripsync.app" className="underline">
              legal@tripsync.app
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
