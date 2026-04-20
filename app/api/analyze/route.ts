import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeScam } from "@/lib/ai-analyzer";
import { saveCheck } from "@/lib/db";
import { analyzeRiskRules } from "@/lib/risk-rules";
import { getClientIp, getUsageStatus, hashIpAddress, recordSuccessfulUsage } from "@/lib/usage";
import { inputTypes } from "@/lib/types";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_CONTENT_LENGTH = 12000;
const screenshotDataUrlPattern = /^data:image\/(png|jpe?g|webp);base64,/i;

const analyzeRequestSchema = z.object({
  inputType: z.enum(inputTypes),
  content: z.string().default(""),
  imageBase64: z.string().optional(),
  anonymousId: z.string().max(128).optional(),
});

function getDataUrlSizeBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function validateScreenshotDataUrl(imageBase64?: string): string | null {
  if (!imageBase64) {
    return "Please upload a PNG, JPG, JPEG, or WEBP screenshot.";
  }

  if (!screenshotDataUrlPattern.test(imageBase64)) {
    return "Unsupported image type. Please upload a PNG, JPG, JPEG, or WEBP screenshot.";
  }

  if (getDataUrlSizeBytes(imageBase64) > MAX_IMAGE_BYTES) {
    return "Screenshot is too large. Please upload an image under 5MB.";
  }

  return null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const payload = {
      ...parsed.data,
      content: parsed.data.content.trim(),
    };

    if (payload.inputType !== "screenshot" && !payload.content) {
      return NextResponse.json({ message: "Please enter something to check." }, { status: 400 });
    }

    if (payload.content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { message: "Please shorten this input before checking. The local demo accepts up to 12,000 characters." },
        { status: 400 },
      );
    }

    if (payload.inputType === "url" && !isValidHttpUrl(payload.content)) {
      return NextResponse.json(
        { message: "Please enter a valid URL that starts with http:// or https://." },
        { status: 400 },
      );
    }

    if (payload.inputType === "screenshot") {
      const screenshotError = validateScreenshotDataUrl(payload.imageBase64);

      if (screenshotError) {
        return NextResponse.json({ message: screenshotError }, { status: 400 });
      }
    }

    const clientIp = getClientIp(request.headers);
    const ipHash = hashIpAddress(clientIp);
    const identity = {
      anonymousId: payload.anonymousId,
      ipHash,
    };
    const usageStatus = await getUsageStatus(identity);

    if (!usageStatus.allowed) {
      return NextResponse.json(
        {
          message: "You've used your 3 free checks today. Upgrade for more scam checks.",
          usage: usageStatus,
        },
        { status: 429 },
      );
    }

    const ruleResult = analyzeRiskRules(payload.inputType, payload.content);
    const result = await analyzeScam(payload, ruleResult);

    await saveCheck({ request: payload, result, ruleResult });
    await recordSuccessfulUsage(identity);

    return NextResponse.json(result);
  } catch (error) {
    console.error("ScamGate analyze API error.", error);
    return NextResponse.json(
      {
        message: "ScamGate could not complete this check. Please try again.",
      },
      { status: 500 },
    );
  }
}
