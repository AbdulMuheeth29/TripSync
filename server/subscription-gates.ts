import { storage } from "./storage";

const FREE_ACTIVE_TRIPS_LIMIT = 3;
const FREE_MEMBERS_PER_TRIP_LIMIT = 6;
const FREE_PHOTOS_PER_TRIP_LIMIT = 5;

export type Tier = "free" | "pro" | "teams";

export function isProOrTeams(tier: string | undefined | null): boolean {
  return tier === "pro" || tier === "teams";
}

export async function getEffectiveTier(userId: string): Promise<{ tier: Tier; expiresAt: Date | null }> {
  const user = await storage.getUserById(userId);
  const tier = (user as { subscriptionTier?: string })?.subscriptionTier ?? "free";
  const expiresAt = (user as { subscriptionExpiresAt?: Date | null })?.subscriptionExpiresAt ?? null;
  const isExpired = expiresAt && new Date(expiresAt) <= new Date();
  const effectiveTier: Tier = isProOrTeams(tier) && !isExpired ? (tier as Tier) : "free";
  return { tier: effectiveTier, expiresAt };
}

export async function canCreateTrip(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { tier } = await getEffectiveTier(userId);
  if (isProOrTeams(tier)) return { allowed: true };
  const trips = await storage.getTripsByUserId(userId);
  const active = trips.filter((t) =>
    ["planning", "booking", "active"].includes(t.status)
  );
  if (active.length >= FREE_ACTIVE_TRIPS_LIMIT) {
    return { allowed: false, reason: `Free plan limited to ${FREE_ACTIVE_TRIPS_LIMIT} active trips. Upgrade to Pro for unlimited.` };
  }
  return { allowed: true };
}

export async function canAddMemberToTrip(tripId: string): Promise<{ allowed: boolean; reason?: string }> {
  const trip = await storage.getTrip(tripId);
  if (!trip) return { allowed: false, reason: "Trip not found" };
  const organizerId = trip.organizerId;
  const { tier } = await getEffectiveTier(organizerId);
  if (isProOrTeams(tier)) return { allowed: true };
  const members = await storage.getTripMembers(tripId);
  if (members.length >= FREE_MEMBERS_PER_TRIP_LIMIT) {
    return { allowed: false, reason: `Free plan limited to ${FREE_MEMBERS_PER_TRIP_LIMIT} members per trip. Upgrade to Pro for unlimited.` };
  }
  return { allowed: true };
}

export async function canAddPhotoToTrip(tripId: string): Promise<{ allowed: boolean; reason?: string }> {
  const trip = await storage.getTrip(tripId);
  if (!trip) return { allowed: false, reason: "Trip not found" };
  const { tier } = await getEffectiveTier(trip.organizerId);
  if (isProOrTeams(tier)) return { allowed: true };
  const photos = await storage.getPhotosByTrip(tripId);
  if (photos.length >= FREE_PHOTOS_PER_TRIP_LIMIT) {
    return { allowed: false, reason: `Free plan limited to ${FREE_PHOTOS_PER_TRIP_LIMIT} photos per trip. Upgrade to Pro for unlimited.` };
  }
  return { allowed: true };
}

export async function canUseMapView(userId: string): Promise<boolean> {
  const { tier } = await getEffectiveTier(userId);
  return isProOrTeams(tier);
}

export async function canUsePlaceDiscovery(userId: string): Promise<boolean> {
  const { tier } = await getEffectiveTier(userId);
  return isProOrTeams(tier);
}

export async function canUseEmailImport(userId: string): Promise<boolean> {
  const { tier } = await getEffectiveTier(userId);
  return isProOrTeams(tier);
}

export async function canUseCalendarExport(userId: string): Promise<boolean> {
  const { tier } = await getEffectiveTier(userId);
  return isProOrTeams(tier);
}

export async function canUseAIGeneration(userId: string, tripId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { tier } = await getEffectiveTier(userId);
  if (isProOrTeams(tier)) return { allowed: true };
  const items = await storage.getItineraryItems(tripId);
  const hasExistingAI = items.length > 0;
  if (hasExistingAI) {
    return { allowed: false, reason: "Free plan includes 1 AI-generated itinerary per trip. Upgrade to Pro for unlimited AI generations." };
  }
  return { allowed: true };
}
