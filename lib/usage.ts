import { createHash } from "crypto";

import { getUsageCountToday, recordUsageEvent } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { UsageStatus } from "@/lib/types";

const FREE_DAILY_LIMIT = 3;
const memoryUsage = new Map<string, { resetDate: string; count: number }>();

type Identity = {
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
  return identity.anonymousId ?? identity.ipHash ?? "anonymous";
}

function isForceProEnabled(): boolean {
  return process.env.SCAMGATE_FORCE_PRO === "true";
}

export async function getUsageStatus(identity: Identity): Promise<UsageStatus> {
  const resetDate = getTodayResetDate();

  if (isForceProEnabled()) {
    return {
      allowed: true,
      count: 0,
      remaining: FREE_DAILY_LIMIT,
      limit: FREE_DAILY_LIMIT,
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
    allowed: count < FREE_DAILY_LIMIT,
    count,
    remaining: Math.max(0, FREE_DAILY_LIMIT - count),
    limit: FREE_DAILY_LIMIT,
    resetDate,
  };
}

export async function recordSuccessfulUsage(identity: Identity): Promise<void> {
  if (isForceProEnabled()) {
    return;
  }

  if (isSupabaseConfigured()) {
    await recordUsageEvent({
      anonymousId: identity.anonymousId,
      ipHash: identity.ipHash,
      eventType: "check_completed",
    });
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
