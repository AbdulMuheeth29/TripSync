import { useState } from "react";
import { Link } from "wouter";
import {
  HelpCircle,
  Users,
  Calendar,
  DollarSign,
  Bot,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  MessageCircle,
  Shield,
  CreditCard,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

type FAQCategory = {
  id: string;
  title: string;
  icon: React.ElementType;
  questions: {
    question: string;
    answer: string;
  }[];
};

const faqCategories: FAQCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: HelpCircle,
    questions: [
      {
        question: "How do I create my first trip?",
        answer:
          'Click the "Create Trip" button on your dashboard → Enter your destination, dates, and any other details → Click "Create Trip". You can optionally have AI generate an itinerary for you!',
      },
      {
        question: "How do I invite people to my trip?",
        answer:
          'Open your trip → Click "Invite Members" → Enter their email addresses or share the join link. You can also assign roles like "Planner" or "Member" when inviting.',
      },
      {
        question: "Can I use TripSync offline?",
        answer:
          "Yes! TripSync is a Progressive Web App (PWA). Install it on your device (Add to Home Screen on mobile) and you can view trip details offline. Changes will sync when you're back online.",
      },
      {
        question: "How do I install TripSync on my phone?",
        answer:
          'On iOS: Open Safari → Visit tripsync.app → Tap the Share button → Select "Add to Home Screen". On Android: Open Chrome → Visit tripsync.app → Tap the menu (⋮) → Select "Install app" or "Add to Home Screen".',
      },
    ],
  },
  {
    id: "trips",
    title: "Managing Trips",
    icon: MapPin,
    questions: [
      {
        question: "How many trips can I create?",
        answer:
          "Free users can create up to 3 active trips. Pro users get unlimited trips. Team plan members also get unlimited trips with additional collaboration features.",
      },
      {
        question: "Can I change the trip destination after creating it?",
        answer:
          'Yes! Open your trip → Click the edit icon → Update the destination or any other details. Only Planners and Organizers can edit trip details.',
      },
      {
        question: "What\'s the difference between trip roles?",
        answer:
          "Organizer: Full control (can delete trip, remove members). Planner: Can edit itinerary and invite members. Member: Can view, comment, and vote on activities.",
      },
      {
        question: "How do I make a trip public?",
        answer:
          'Go to your trip → Settings → Enable "Public Trip". This generates a shareable link that anyone can view (read-only). Great for sharing your travel plans with family!',
      },
      {
        question: "Can I duplicate a trip?",
        answer:
          "Not directly yet, but you can use the AI feature to generate a similar itinerary based on a previous trip's details. This feature is on our roadmap!",
      },
    ],
  },
  {
    id: "collaboration",
    title: "Collaboration & Members",
    icon: Users,
    questions: [
      {
        question: "How many people can join a trip?",
        answer:
          "Free users: 8 members per trip. Pro users: 25 members per trip. Teams plan: Unlimited members per trip.",
      },
      {
        question: "Do trip members need to create an account?",
        answer:
          "Yes, members need to create a free TripSync account to join a trip. This ensures everyone can collaborate and receive notifications.",
      },
      {
        question: "How does voting work?",
        answer:
          "Any trip member can vote on itinerary items. Click the thumbs up/down on any activity. The organizer can see vote counts to make group decisions easier.",
      },
      {
        question: "Can I chat with my trip members?",
        answer:
          "Yes! Every trip has a built-in chat. Open your trip and click the Chat tab to discuss plans in real-time with all members.",
      },
      {
        question: "What if someone can't make certain dates?",
        answer:
          'Use the "Availability" feature! Each member can mark their available dates, and the system will highlight conflicts. You can also create polls to vote on dates.',
      },
    ],
  },
  {
    id: "itinerary",
    title: "Itinerary & Planning",
    icon: Calendar,
    questions: [
      {
        question: "How do I add activities to my itinerary?",
        answer:
          'Open your trip → Go to Itinerary tab → Click "Add Activity" → Fill in details like title, date, time, location, and cost. You can also let AI suggest activities!',
      },
      {
        question: "Can I reorder itinerary items?",
        answer:
          "Yes! Drag and drop items to reorder them. This works on both desktop and mobile (long-press to drag on mobile).",
      },
      {
        question: "What types of itinerary items can I add?",
        answer:
          "You can add: Activities (sightseeing, events), Accommodation (hotels, Airbnb), Transportation (flights, trains), Meals (restaurants, reservations), and Free time blocks.",
      },
      {
        question: "How do I mark an activity as confirmed?",
        answer:
          'Click on any itinerary item → Change status from "Pending" to "Confirmed". This helps everyone know what\'s locked in vs. still flexible.',
      },
    ],
  },
  {
    id: "expenses",
    title: "Expenses & Budget",
    icon: DollarSign,
    questions: [
      {
        question: "How does expense splitting work?",
        answer:
          "Add an expense → Select who paid → Select who should split the cost → TripSync automatically calculates who owes what. You can split equally or enter custom amounts.",
      },
      {
        question: "Can I use different currencies?",
        answer:
          "Yes! Each expense can be in a different currency. However, the split calculation works per-currency (no automatic conversion yet). Set a trip default currency for consistency.",
      },
      {
        question: "How do I track who has paid me back?",
        answer:
          'Mark expenses as "Settled" once payment is complete. You can also add notes about how payment was made (Venmo, cash, etc.).',
      },
      {
        question: "Can I attach receipts?",
        answer:
          "Yes! When adding an expense, you can upload a photo of the receipt. This requires configuring cloud storage (S3 or Cloudflare R2).",
      },
      {
        question: "How do I set a trip budget?",
        answer:
          'Edit your trip details and set a total budget amount. The dashboard will show spending vs. budget and warn you if you\'re over. Use AI "Budget Optimize" for suggestions!',
      },
    ],
  },
  {
    id: "ai-features",
    title: "AI Features",
    icon: Bot,
    questions: [
      {
        question: "What can the AI do?",
        answer:
          "TripSync AI (powered by Claude) can: Generate complete trip itineraries, suggest activities based on your interests, create packing lists, optimize your budget, parse booking confirmation emails, and answer travel questions via Atlas AI assistant.",
      },
      {
        question: "How many AI generations do I get?",
        answer:
          "Free users: 10 AI generations per month. Pro users: 100 per month. Teams plan: Unlimited. Each generation counts as one AI request (itinerary, packing list, etc.).",
      },
      {
        question: "Can AI update my itinerary?",
        answer:
          "AI can generate suggestions, but you have to approve them. AI won't automatically change your itinerary without your confirmation.",
      },
      {
        question: "What is Atlas AI?",
        answer:
          "Atlas AI is your personal travel assistant. Ask it questions about your trip, get recommendations, resolve planning conflicts, and get real-time travel advice. It has context about your whole trip!",
      },
      {
        question: "Can I regenerate the itinerary if I don't like it?",
        answer:
          'Yes! Click "Regenerate Itinerary" and AI will create a new one. You can also give feedback like "make it more relaxed" or "focus on food experiences".',
      },
    ],
  },
  {
    id: "account",
    title: "Account & Billing",
    icon: CreditCard,
    questions: [
      {
        question: "How much does TripSync cost?",
        answer:
          "TripSync has three tiers: Free (3 trips, 8 members, 10 AI/month), Pro ($9.99/month: unlimited trips, 25 members, 100 AI/month), and Teams ($29.99/month: unlimited everything + priority support).",
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer:
          "Yes! Cancel anytime from Settings → Billing. You'll keep Pro features until the end of your billing period, then automatically downgrade to Free.",
      },
      {
        question: "What happens to my trips if I downgrade?",
        answer:
          "Your trips remain accessible (read-only) but you can't create new ones until you're back under the free plan limits (3 active trips). No data is deleted.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "We offer a 7-day money-back guarantee on annual plans. For monthly plans, you can cancel anytime and won't be charged next month. Contact support for special cases.",
      },
      {
        question: "How do I change my email or password?",
        answer:
          'Go to Settings → Account → Update your email or password. For password reset, use the "Forgot Password" link on the login page.',
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    icon: Shield,
    questions: [
      {
        question: "Is my data secure?",
        answer:
          "Yes! All data is encrypted in transit (HTTPS) and at rest. We use industry-standard security practices and never share your data with third parties without consent.",
      },
      {
        question: "Can I delete my account?",
        answer:
          'Yes. Go to Settings → Account → Delete Account. This permanently deletes all your data. Trip data is only deleted if you\'re the organizer. If you\'re a member, you\'ll just be removed.',
      },
      {
        question: "What data does TripSync collect?",
        answer:
          "We collect: Account info (email, username), trip data (destinations, dates, itineraries), usage analytics (anonymized), and payment info (processed by Stripe, not stored by us). See our Privacy Policy for details.",
      },
      {
        question: "Is TripSync GDPR compliant?",
        answer:
          "Yes! We're GDPR compliant. You can request your data export, deletion, or correction anytime. EU users have additional rights outlined in our Privacy Policy.",
      },
      {
        question: "Who can see my trips?",
        answer:
          'Only trip members can see your private trips. Public trips (if you enable sharing) can be viewed by anyone with the link but they can\'t edit. We never show your trips publicly without your permission.',
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: MessageCircle,
    questions: [
      {
        question: "I forgot my password. What do I do?",
        answer:
          'Click "Forgot Password" on the login page → Enter your email → Check your inbox for a reset link (check spam folder). The link expires in 1 hour.',
      },
      {
        question: "I'm not receiving emails from TripSync",
        answer:
          "Check your spam/junk folder. Add noreply@tripsync.app to your contacts. If still not receiving, try a different email address or contact support.",
      },
      {
        question: "The AI feature isn't working",
        answer:
          "The AI feature requires an API key to be configured by the site admin. If you're self-hosting, add ANTHROPIC_API_KEY to your .env file. On our hosted version, it should work - contact support if not.",
      },
      {
        question: "Photos aren't uploading",
        answer:
          "Photo uploads require cloud storage (S3/R2) configuration. If you're using the hosted version and having issues, try: 1) Check file size (max 25MB), 2) Use supported formats (JPG, PNG, HEIC, WebP), 3) Clear browser cache.",
      },
      {
        question: "The app is slow or not loading",
        answer:
          "Try: 1) Refresh the page (Ctrl+R or Cmd+R), 2) Clear browser cache, 3) Check your internet connection, 4) Try a different browser, 5) Check status.tripsync.app for outages (if available).",
      },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter FAQs based on search
  const filteredCategories = searchQuery
    ? faqCategories
        .map((category) => ({
          ...category,
          questions: category.questions.filter(
            (q) =>
              q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              q.answer.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((category) => category.questions.length > 0)
    : faqCategories;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/">
              <a className="text-blue-600 hover:text-blue-700 text-sm">
                ← Back to Home
              </a>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Help Center
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about TripSync
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Category Grid */}
      {!searchQuery && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Browse by Topic
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === category.id ? null : category.id
                    )
                  }
                  className={`p-6 rounded-lg border-2 transition-all ${
                    activeCategory === category.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`h-8 w-8 mb-3 ${
                      activeCategory === category.id
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  />
                  <h3 className="font-semibold text-gray-900 text-left">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-500 text-left mt-1">
                    {category.questions.length} articles
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQs */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {filteredCategories.map((category) => {
            // Show category if: 1) no filter active, 2) this is the active category, or 3) searching
            const shouldShow =
              !activeCategory ||
              activeCategory === category.id ||
              searchQuery;

            if (!shouldShow) return null;

            const Icon = category.icon;

            return (
              <div key={category.id} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Icon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {category.title}
                  </h2>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                  {category.questions.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`${category.id}-${index}`}
                      className="bg-white border rounded-lg px-6"
                    >
                      <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-blue-600 hover:no-underline py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 pb-4 leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                No results found for "{searchQuery}"
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Try different keywords or contact support below
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white border-t">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Still need help?
              </h3>
              <p className="text-gray-600 mb-6">
                Can't find what you're looking for? Our support team is here to
                help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg">Contact Support</Button>
                </Link>
                <a
                  href="mailto:abdulmuheethmd29@gmail.com"
                  className="inline-flex items-center justify-center"
                >
                  <Button size="lg" variant="outline">
                    Email Us Directly
                  </Button>
                </a>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Average response time: 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
