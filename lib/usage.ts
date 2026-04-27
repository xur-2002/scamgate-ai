import { createHash } from "crypto";

import { getUsageCountToday, recordUsageEvent } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Plan } from "@/lib/entitlements";
import type { UsageStatus } from "@/lib/types";

const FREE_DAILY_LIMIT = 3;
const PRO_DAILY_LIMIT = 100;
const memoryUsage = new Map<string, { resetDate: string; count: number }>();

type Identity = {
  userId?: string;
  anonymousId?: string;
  ipHash?: string;
};

export function hashIpAddress(ipAddress: string | null): string | undefined {
  if (!ipAddress) {
    return undefined;
  }

  return createHash("sha256").update(ipAddress).digest("hex");
}

export function getClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return headers.get("x-real-ip");
}

function getTodayResetDate(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function getMemoryKey(identity: Identity): string {
  return identity.userId ? `user:${identity.userId}` : (identity.anonymousId ?? identity.ipHash ?? "anonymous");
}

function isForceProEnabled(): boolean {
  return process.env.SCAMGATE_FORCE_PRO === "true";
}

export async function getUsageStatus(identity: Identity, plan: Plan): Promise<UsageStatus> {
  const resetDate = getTodayResetDate();
  const limit = plan === "pro" ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

  if (isForceProEnabled() || plan === "pro") {
    return {
      allowed: true,
      count: 0,
      remaining: limit,
      limit,
      resetDate,
    };
  }

  let count: number | null = null;

  if (isSupabaseConfigured()) {
    count = await getUsageCountToday({ ...identity, resetDate });
  }

  if (count === null) {
    const key = getMemoryKey(identity);
    const current = memoryUsage.get(key);
    count = current?.resetDate === resetDate ? current.count : 0;
  }

  return {
    allowed: count < limit,
    count,
    remaining: Math.max(0, limit - count),
    limit,
    resetDate,
  };
}

export async function recordSuccessfulUsage(identity: Identity, plan: Plan): Promise<void> {
  if (isForceProEnabled()) {
    return;
  }

  if (isSupabaseConfigured()) {
    await recordUsageEvent({
      userId: identity.userId,
      anonymousId: identity.anonymousId,
      ipHash: identity.ipHash,
      eventType: "check_completed",
    });
    return;
  }

  if (plan === "pro") {
    return;
  }

  const resetDate = getTodayResetDate();
  const key = getMemoryKey(identity);
  const current = memoryUsage.get(key);
  const count = current?.resetDate === resetDate ? current.count : 0;

  memoryUsage.set(key, {
    resetDate,
    count: count + 1,
  });
}
