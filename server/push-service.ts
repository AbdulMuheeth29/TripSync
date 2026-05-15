import webpush from "web-push";
import { storage } from "./storage";

type PushSubscription = webpush.PushSubscription & { endpoint: string; keys: { p256dh: string; auth: string } };

interface StoredSubscription {
  userId: string;
  tripId: string;
  subscription: PushSubscription;
  createdAt: number;
}

let vapidKeys: { publicKey: string; privateKey: string } | null = null;
const subscriptions: Map<string, StoredSubscription> = new Map();
const sentReminders: Set<string> = new Set();

export function getVapidPublicKey(): string {
  if (!vapidKeys) {
    vapidKeys = webpush.generateVAPIDKeys();
  }
  return vapidKeys!.publicKey;
}

export function setVapidKeys(publicKey: string, privateKey: string) {
  vapidKeys = { publicKey, privateKey };
  webpush.setVapidDetails("mailto:support@tripsync.app", publicKey, privateKey);
}

function ensureVapid() {
  if (!vapidKeys) {
    vapidKeys = webpush.generateVAPIDKeys();
    webpush.setVapidDetails("mailto:support@tripsync.app", vapidKeys!.publicKey, vapidKeys!.privateKey);
  }
}

export function addSubscription(userId: string, tripId: string, subscription: PushSubscription): void {
  ensureVapid();
  const key = `${userId}:${tripId}:${subscription.endpoint}`;
  subscriptions.set(key, { userId, tripId, subscription, createdAt: Date.now() });
}

export function removeSubscription(userId: string, tripId: string, endpoint: string): void {
  const key = `${userId}:${tripId}:${endpoint}`;
  subscriptions.delete(key);
}

export async function sendPushToUser(userId: string, tripId: string, payload: { title: string; body?: string }): Promise<void> {
  ensureVapid();
  const toSend: StoredSubscription[] = [];
  for (const sub of Array.from(subscriptions.values())) {
    if (sub.userId === userId && sub.tripId === tripId) toSend.push(sub);
  }
  for (const sub of toSend) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (e) {
      if ((e as { statusCode?: number }).statusCode === 410 || (e as { statusCode?: number }).statusCode === 404) {
        subscriptions.delete(`${sub.userId}:${sub.tripId}:${sub.subscription.endpoint}`);
      }
    }
  }
}

export async function runReminderCheck(): Promise<void> {
  try {
    const tripIds = Array.from(new Set(Array.from(subscriptions.values()).map((s) => s.tripId)));
    if (tripIds.length === 0) return;
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);
    for (const tripId of tripIds) {
      const trip = await storage.getTrip(tripId);
      if (!trip) continue;
      const items = await storage.getItineraryItems(tripId);
      const members = await storage.getTripMembers(tripId);
      for (const item of items) {
        const itemDate = new Date(trip.startDate);
        itemDate.setDate(itemDate.getDate() + (item.dayNumber - 1));
        const [h, m] = (item.time || "09:00").split(":").map(Number);
        itemDate.setHours(h || 9, m || 0, 0, 0);
        if (itemDate >= now && itemDate <= windowEnd) {
          const subscribedUserIds = new Set(Array.from(subscriptions.values()).filter((s) => s.tripId === tripId).map((s) => s.userId));
          for (const member of members) {
            if (!subscribedUserIds.has(member.userId)) continue;
            const key = `${tripId}:${item.id}:${member.userId}`;
            if (sentReminders.has(key)) continue;
            try {
              await sendPushToUser(member.userId, tripId, {
                title: "Trip reminder",
                body: `${item.name} at ${item.time} — ${trip.destination}`,
              });
              sentReminders.add(key);
            } catch {
              // Skip failed sends
            }
          }
        }
      }
    }
  } catch {
    // Ignore
  }
}

let reminderInterval: ReturnType<typeof setInterval> | null = null;

export function startReminderScheduler(): void {
  if (reminderInterval) return;
  runReminderCheck();
  reminderInterval = setInterval(runReminderCheck, 5 * 60 * 1000);
}
