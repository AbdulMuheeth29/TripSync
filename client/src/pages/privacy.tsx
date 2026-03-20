import { Link } from "wouter";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { spacing } from "@/lib/spacing-tokens";

export default function PrivacyPage() {
  const effectiveDate = "February 24, 2026";

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
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Privacy Policy</p>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy for TripSync</h1>
            <p className="text-sm text-muted-foreground">Effective date: {effectiveDate}</p>
          </header>

          <p className="text-sm text-muted-foreground">
            TripSync (&quot;TripSync&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a
            collaborative trip planning platform that allows groups to plan trips together, manage itineraries,
            split expenses, vote on decisions, chat in real time, and use AI-powered trip planning features.
            This Privacy Policy explains how we collect, use, disclose, and protect your information when you
            use TripSync and describes your rights under data protection laws including the GDPR, CCPA, and
            CalOPPA.
          </p>

          <p className="text-sm text-muted-foreground">
            By using TripSync, you agree to the practices described in this Privacy Policy. If you do not agree,
            please do not use the service.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">1. Company and Contact Information</h2>
          <p>
            <strong>Product Name:</strong> TripSync
            <br />
            <strong>Website:</strong> https://tripsync.app
            <br />
            <strong>Company Name (Controller):</strong> TripSync
            <br />
            <strong>Company Address:</strong> 123 Example Street, Example City, Example Country
            <br />
            <strong>Privacy Email:</strong> privacy@tripsync.app
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">2. What TripSync Is</h2>
          <p>
            TripSync is a group trip planning software-as-a-service (SaaS) platform. It enables you and your group
            to collaboratively: plan trips, create and manage itineraries, split expenses, vote on decisions, chat
            in real time, upload photos and documents, and use AI-powered features to generate and refine trip
            plans.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">3. Information We Collect</h2>

          <h3 className="font-semibold mt-4">3.1 Account Information</h3>
          <p>When you create or update an account, we collect:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>Password (stored using industry-standard hashing; never in plain text)</li>
            <li>Profile photo (optional)</li>
            <li>Account preferences (e.g., theme, notification settings)</li>
          </ul>

          <h3 className="font-semibold mt-4">3.2 Trip Data</h3>
          <p>To power trip planning and collaboration, we process:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Trip names, descriptions, and destinations</li>
            <li>Start and end dates</li>
            <li>Budget information (e.g., per-person budgets)</li>
            <li>Itinerary items (activities, accommodations, transportation, reservations)</li>
            <li>Location data (destinations, city/country, map coordinates)</li>
            <li>Weather preferences and similar trip options</li>
            <li>Notes and custom fields you choose to add</li>
          </ul>

          <h3 className="font-semibold mt-4">3.3 User-Generated Content</h3>
          <p>When you use TripSync collaboratively, we store:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Photos uploaded to trips</li>
            <li>Comments, chat messages, polls, and vote choices</li>
            <li>Expense records (amounts, categories, payers/payees, attached receipts)</li>
            <li>Trip invitations, invitee email addresses you provide, and responses</li>
          </ul>

          <h3 className="font-semibold mt-4">3.4 Usage and Device Data</h3>
          <p>We collect certain information automatically when you use TripSync, such as:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Login timestamps and session identifiers</li>
            <li>Pages visited and features used</li>
            <li>Browser type and version, device type, operating system</li>
            <li>IP address and approximate location (city / country level)</li>
            <li>Referring URLs and basic performance/diagnostic data</li>
          </ul>

          <h3 className="font-semibold mt-4">3.5 Payment and Subscription Data (via Stripe)</h3>
          <p>
            For paid plans, we use Stripe as our payment processor. Stripe collects and stores your card details.
            We do not store full card numbers ourselves.
          </p>
          <p>We receive and/or process:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Billing address</li>
            <li>Subscription tier (Free, Pro, Teams) and plan type (monthly/annual)</li>
            <li>High-level transaction history (e.g., successful/failed payments)</li>
          </ul>

          <h3 className="font-semibold mt-4">3.6 Data Used with AI (Anthropic Claude)</h3>
          <p>
            To generate and refine trip itineraries, we may send trip-related context to Anthropic Claude AI, such
            as:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Trip destinations and high-level location information</li>
            <li>Travel dates and duration</li>
            <li>Group size and general preferences (e.g., &quot;foodie&quot;, &quot;adventure&quot;)</li>
            <li>Budget ranges and itinerary structure</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            We design these features so that we do not intentionally send personally identifiable information (such
            as your full name or email address) to the AI provider. You should avoid including sensitive personal
            information in free-form text fields that you share with AI features.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">4. How We Use Your Information</h2>

          <h3 className="font-semibold mt-4">4.1 Core Service Delivery</h3>
          <p>We use your data to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Create and manage your account</li>
            <li>Allow you to create, edit, and manage trips and itineraries</li>
            <li>Enable collaboration features like invites, comments, chat, votes, and shared expenses</li>
            <li>Store and display your photos and other uploaded content</li>
          </ul>

          <h3 className="font-semibold mt-4">4.2 AI Trip Planning</h3>
          <p>
            We use trip context with Anthropic Claude AI to generate suggested itineraries, summaries, packing lists,
            and similar content. You can choose whether or not to use these AI features.
          </p>

          <h3 className="font-semibold mt-4">4.3 Communications</h3>
          <p>We may use your email and in-app notifications to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Send trip invitations, updates, and reminders</li>
            <li>Send account or security alerts (e.g., login notifications)</li>
            <li>Send product updates or feature announcements (you can opt out of non-essential emails)</li>
          </ul>

          <h3 className="font-semibold mt-4">4.4 Payments and Subscriptions</h3>
          <p>
            With Stripe, we process subscription payments, manage billing, and comply with tax and financial
            regulations.
          </p>

          <h3 className="font-semibold mt-4">4.5 Analytics and Product Improvement</h3>
          <p>
            We analyze aggregated and pseudonymized usage data to understand how TripSync is used, improve the
            experience, and develop new features.
          </p>

          <h3 className="font-semibold mt-4">4.6 Security and Abuse Prevention</h3>
          <p>
            We use information like IP addresses and usage patterns to detect suspicious activity, prevent fraud,
            protect accounts, and enforce our Terms of Service.
          </p>

          <h3 className="font-semibold mt-4">4.7 Legal Compliance</h3>
          <p>
            We may process and retain certain data to comply with legal obligations, resolve disputes, and enforce
            our agreements.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
          <p>We share data with third parties only as needed to operate TripSync or as required by law.</p>

          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Stripe</strong> – Payment processing for Pro and Teams subscriptions.
              <br />
              <span className="text-muted-foreground">
                Data shared: email, billing address, payment information. Privacy policy:{" "}
                <a href="https://stripe.com/privacy" className="underline" target="_blank" rel="noreferrer">
                  https://stripe.com/privacy
                </a>
                .
              </span>
            </li>
            <li>
              <strong>AWS S3 / Cloudflare R2</strong> – Cloud storage for user-uploaded photos and files.
              <br />
              <span className="text-muted-foreground">
                Data shared: uploaded files and metadata. Privacy:{" "}
                <a href="https://aws.amazon.com/privacy/" className="underline" target="_blank" rel="noreferrer">
                  AWS
                </a>{" "}
                /{" "}
                <a
                  href="https://www.cloudflare.com/privacypolicy/"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Cloudflare
                </a>
                .
              </span>
            </li>
            <li>
              <strong>Anthropic Claude AI</strong> – AI-powered trip planning and itinerary generation.
              <br />
              <span className="text-muted-foreground">
                Data shared: trip destinations, dates, preferences, budgets, and itinerary context (no intentional
                PII). Privacy:{" "}
                <a
                  href="https://www.anthropic.com/privacy"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://www.anthropic.com/privacy
                </a>
                .
              </span>
            </li>
            <li>
              <strong>Google Maps API (optional)</strong> – Interactive maps and place details.
              <br />
              <span className="text-muted-foreground">
                Data shared: location coordinates, destination names. Privacy:{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://policies.google.com/privacy
                </a>
                .
              </span>
            </li>
            <li>
              <strong>Open-Meteo Weather API</strong> – Weather forecasts for trip destinations.
              <br />
              <span className="text-muted-foreground">
                Data shared: location coordinates and dates. Terms/privacy:{" "}
                <a
                  href="https://open-meteo.com/en/terms"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://open-meteo.com/en/terms
                </a>
                .
              </span>
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">6. Cookies and Tracking</h2>
          <p>TripSync uses cookies and similar technologies for:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Authentication and session management</li>
            <li>Security (e.g., CSRF protection, rate limiting)</li>
            <li>Optional analytics and product improvement (with consent where required)</li>
          </ul>

          <h3 className="font-semibold mt-4">Essential Cookies</h3>
          <p>These are required for TripSync to function, such as:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Authentication tokens (e.g., keeping you logged in)</li>
            <li>Session cookies and security tokens</li>
          </ul>

          <h3 className="font-semibold mt-4">Optional Cookies</h3>
          <p>
            With your consent where required, we may use analytics and preference cookies to understand how TripSync
            is used and remember settings like dark/light mode. You can manage these via your browser and any cookie
            banner we provide.
          </p>

          <h3 className="font-semibold mt-4">Do Not Track</h3>
          <p>
            Some browsers send a &quot;Do Not Track&quot; (DNT) signal. There is currently no industry standard
            for responding to DNT, and TripSync does not respond to these signals at this time.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">7. Data Retention</h2>
          <p>We retain your data only as long as necessary for the purposes described above or as required by law.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Active accounts: data retained while your account remains active.</li>
            <li>Deleted accounts: data deleted or anonymized within ~30 days of confirmed deletion.</li>
            <li>Backups: removed from backups on our normal backup rotation schedule (typically within 90 days).</li>
            <li>Legal holds: certain data may be retained longer if required by law.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">8. Your Rights</h2>
          <p>
            Your privacy rights depend on your location, but we aim to honor core rights wherever practical. These
            may include:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Access – request a copy of your personal data.</li>
            <li>Rectification – correct inaccurate or incomplete data.</li>
            <li>Deletion – request deletion of your account and associated data.</li>
            <li>Export/Portability – export your data in a machine-readable format.</li>
            <li>Objection – object to certain processing such as marketing or analytics.</li>
            <li>Withdrawal of consent – where processing is based on consent.</li>
          </ul>
          <p>
            To exercise your rights, contact us at{" "}
            <a href="mailto:privacy@tripsync.app" className="underline">
              privacy@tripsync.app
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">9. Legal Bases (GDPR)</h2>
          <p>Where the GDPR applies, we rely on the following legal bases:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Contract – to provide and maintain TripSync.</li>
            <li>Consent – for non-essential cookies/analytics and certain communications.</li>
            <li>Legitimate interest – security, fraud prevention, and product improvement.</li>
            <li>Legal obligation – tax, accounting, and regulatory compliance.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">10. International Data Transfers</h2>
          <p>
            Our servers are located in the United States. If you access TripSync from
            outside this region, your data may be transferred to and processed in this location. Where required, we
            use appropriate safeguards such as Standard Contractual Clauses (SCCs).
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">11. Data Security</h2>
          <p>We use a combination of technical and organizational measures, including:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Passwords stored using strong one-way hashing (e.g., bcrypt)</li>
            <li>HTTPS/TLS for data in transit</li>
            <li>Database and infrastructure protections (including encryption at rest where supported)</li>
            <li>JWT-based authentication with token expiration</li>
            <li>Access controls and limited employee access to user data</li>
            <li>Rate limiting and monitoring for abuse</li>
          </ul>
          <p>
            No system is completely secure, and we cannot guarantee absolute security. If we become aware of a data
            breach that may affect you, we will notify you where required by law.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">12. Children&apos;s Privacy</h2>
          <p>
            TripSync is not intended for children under 13 years old (or 16 in the EU/EEA). We do not knowingly
            collect personal data from children. If you believe a child has provided us with data, please contact
            us so we can take appropriate action.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make material changes, we will update the
            effective date and, where appropriate, provide additional notice (for example, via email or in-app
            notification). Your continued use of TripSync after changes take effect constitutes acceptance.
          </p>
        </section>

        <section className="mt-8 mb-12 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">14. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or your data, you can contact us at:</p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:privacy@tripsync.app" className="underline">
              privacy@tripsync.app
            </a>
            <br />
            <strong>Mail:</strong> 123 Example Street, Example City, Example Country
          </p>
          <p className="text-xs text-muted-foreground">
            If required by law, details of our GDPR representative and/or Data Protection Officer (DPO) will be
            provided here once designated.
          </p>
        </section>
      </main>
    </div>
  );
}

