import Stripe from "stripe";
import { env } from "./env";
import { storage } from "./storage";

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = env.stripeSecretKey;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" });
  }
  return stripe;
}

export function isStripeEnabled(): boolean {
  return !!env.stripeSecretKey;
}

export type CheckoutParams = { tier: "pro" | "teams"; isAnnual: boolean; userId: string; userEmail: string };

export async function createCheckoutSession(params: CheckoutParams): Promise<{ url: string | null }> {
  const { tier, isAnnual, userId, userEmail } = params;
  const priceId = isAnnual
    ? (tier === "pro" ? env.stripePriceIdProAnnual : env.stripePriceIdTeamsAnnual)
    : (tier === "pro" ? env.stripePriceIdProMonthly : env.stripePriceIdTeamsMonthly);
  if (!priceId) throw new Error("Stripe price not configured for this plan");
  const stripeApi = getStripe();
  const session = await stripeApi.checkout.sessions.create({
    mode: "subscription",
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.appUrl}/dashboard?upgrade=success`,
    cancel_url: `${env.appUrl}/pricing?upgrade=canceled`,
    metadata: { userId, tier },
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId, tier },
    },
  });
  return { url: session.url };
}

export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
  const stripeApi = getStripe();
  const session = await stripeApi.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

export async function handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean; error?: string }> {
  const secret = env.stripeWebhookSecret;
  if (!secret) return { received: false, error: "STRIPE_WEBHOOK_SECRET not set" };
  const stripeApi = getStripe();
  let event: Stripe.Event;
  try {
    event = stripeApi.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    return { received: false, error: message };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = (session.metadata?.tier as string) || "pro";
      if (userId && session.subscription) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripeApi.subscriptions.retrieve(subId);
        const periodEnd = (subscription as any).current_period_end;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        await storage.updateUser(userId, {
          subscriptionTier: tier,
          subscriptionExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
          stripeCustomerId: customerId ?? undefined,
        } as Partial<import("@shared/schema").User>);
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        const periodEnd = (subscription as any).current_period_end;
        const tier = (subscription.metadata?.tier as string) || "pro";
        const active = subscription.status === "active" || subscription.status === "trialing";
        await storage.updateUser(userId, {
          subscriptionTier: active ? tier : "free",
          subscriptionExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await storage.updateUser(userId, { subscriptionTier: "free", subscriptionExpiresAt: null });
      }
      break;
    }
    default:
      break;
  }

  return { received: true };
}
