import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';

const FAQ_ITEMS = [
  {
    question: 'Can I try Pro before paying?',
    answer:
      'Yes! We offer a 14-day free trial for Pro. No credit card required to start. You can cancel anytime during the trial with no charges.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      "Absolutely. You can cancel your subscription at any time from your billing settings. You'll continue to have Pro access until the end of your billing period.",
  },
  {
    question: 'What happens if I downgrade from Pro to Free?',
    answer:
      "Your existing trips remain intact, but you'll be limited to 1 active trip. Additional trips will be archived (view-only) until you upgrade again or delete trips to stay within the Free plan limit.",
  },
  {
    question: 'Do you offer refunds?',
    answer:
      "We offer a 30-day money-back guarantee. If you're not satisfied with Pro within the first 30 days, contact support for a full refund.",
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards through our secure payment processor, Stripe.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Yes. We use Stripe, an industry-leading payment processor. We never store your credit card information on our servers.',
  },
  {
    question: 'Can I change my plan later?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the end of your current billing cycle.',
  },
  {
    question: "What's included in the Teams plan?",
    answer:
      'Teams includes everything in Pro plus advanced analytics, custom branding, API access, 50 GB storage, and a dedicated account manager. Contact our sales team for a custom quote.',
  },
  {
    question: 'Do you offer student or nonprofit discounts?',
    answer:
      'Yes! We offer 50% off Pro for students and registered nonprofit organizations. Contact support with verification to receive your discount code.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'Your data remains accessible for 90 days after cancellation. After that, trips are archived. You can re-subscribe anytime to regain full access to all your trips.',
  },
];

export function PricingFAQSection() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
        <p className="text-muted-foreground">
          Everything you need to know about TripSync pricing and plans
        </p>
      </div>

      <Card className="p-6">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Still have questions?{' '}
          <a href="/contact" className="text-primary hover:underline font-medium">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
