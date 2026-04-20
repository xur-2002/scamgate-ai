import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ResponseInput, ResponseInputMessageContentList } from "openai/resources/responses/responses";
import { z } from "zod";

import { inferScamType, isKnownOfficialUrl, riskLevelFromScore } from "@/lib/risk-rules";
import { confidenceLevels, riskLevels, scamTypes, type AnalysisResult, type AnalyzeRequest, type RuleResult } from "@/lib/types";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const SYSTEM_PROMPT = `You are ScamGate AI, a scam-risk classifier for everyday internet users and families in the United States.

Analyze the submitted text, URL, or screenshot content. Your job is to identify scam risk signals and explain them in simple plain English.

Return JSON only with this shape:
{
"risk_score": 0-100,
"risk_level": "low" | "medium" | "high",
"scam_type": "delivery" | "bank" | "tech_support" | "investment" | "romance" | "marketplace" | "government" | "shopping" | "crypto" | "phishing" | "unknown",
"red_flags": ["..."],
"plain_english_explanation": "...",
"recommended_action": "...",
"safe_next_step": "...",
"confidence": "low" | "medium" | "high"
}

Rules:

* Never say something is definitely safe. Use "low risk" instead.
* If the message asks for gift cards, crypto, wire transfer, Zelle, verification codes, remote access, urgent payment, or secrecy from family, classify as high risk.
* If the sender claims to be USPS, IRS, Medicare, Social Security, Amazon, PayPal, Microsoft, Apple, Norton, McAfee, or a bank and uses urgent language or suspicious links, classify as medium or high.
* Keep the explanation simple enough for a 70-year-old user.
* Do not provide legal, financial, or investment advice.
* Do not help the user contact scammers or continue suspicious conversations.
* Recommend verifying through official websites or phone numbers typed manually, not links in the message.`;

const rawAnalysisSchema = z.object({
  risk_score: z.union([z.number(), z.string()]).optional(),
  risk_level: z.string().optional(),
  scam_type: z.string().optional(),
  red_flags: z.array(z.string()).optional(),
  plain_english_explanation: z.string().optional(),
  recommended_action: z.string().optional(),
  safe_next_step: z.string().optional(),
  confidence: z.string().optional(),
});

const analysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "risk_score",
    "risk_level",
    "scam_type",
    "red_flags",
    "plain_english_explanation",
    "recommended_action",
    "safe_next_step",
    "confidence",
  ],
  properties: {
    risk_score: { type: "integer", minimum: 0, maximum: 100 },
    risk_level: { type: "string", enum: riskLevels },
    scam_type: { type: "string", enum: scamTypes },
    red_flags: {
      type: "array",
      items: { type: "string" },
    },
    plain_english_explanation: { type: "string" },
    recommended_action: { type: "string" },
    safe_next_step: { type: "string" },
    confidence: { type: "string", enum: confidenceLevels },
  },
} satisfies Record<string, unknown>;

function mergeRuleFlags(result: AnalysisResult, ruleResult: RuleResult, request: AnalyzeRequest): AnalysisResult {
  const redFlags = Array.from(new Set([...ruleResult.matchedRules, ...result.red_flags]));
  const riskScore = Math.max(result.risk_score, ruleResult.ruleScore);

  if (request.inputType === "url" && isKnownOfficialUrl(request.content)) {
    return {
      ...result,
      risk_score: Math.min(result.risk_score, 25),
      risk_level: "low",
      scam_type: "unknown",
      red_flags: ["Known official domain", "No major scam signals were found in this standalone link check."],
      plain_english_explanation:
        "This appears low risk because the link uses a known official domain. Still, ScamGate does not guarantee safety, and you should type official websites manually when anything involves money or personal information.",
      recommended_action: "Low risk. Avoid sharing private information unless you are sure you meant to visit this site.",
      safe_next_step: "If you need to use the service, type the official website address yourself in the browser.",
    };
  }

  return {
    ...result,
    risk_score: riskScore,
    risk_level: riskLevelFromScore(riskScore),
    red_flags: redFlags.length > 0 ? redFlags : result.red_flags,
  };
}

function withProvider(result: AnalysisResult, provider: NonNullable<AnalysisResult["provider_used"]>): AnalysisResult {
  if (process.env.NODE_ENV !== "development") {
    return result;
  }

  return {
    ...result,
    provider_used: provider,
  };
}

function isOneOf<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

function clampScore(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, Math.round(fallback)));
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeModelAnalysis(raw: unknown, request: AnalyzeRequest, ruleResult: RuleResult): AnalysisResult {
  const parsed = rawAnalysisSchema.parse(raw);
  const riskScore = clampScore(parsed.risk_score, ruleResult.ruleScore);
  const riskLevel = parsed.risk_level && isOneOf(riskLevels, parsed.risk_level)
    ? parsed.risk_level
    : riskLevelFromScore(riskScore);
  const scamType = parsed.scam_type && isOneOf(scamTypes, parsed.scam_type)
    ? parsed.scam_type
    : inferScamType(request.content, ruleResult.matchedRules);
  const confidence = parsed.confidence && isOneOf(confidenceLevels, parsed.confidence) ? parsed.confidence : "medium";

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    scam_type: scamType,
    red_flags: parsed.red_flags ?? [],
    plain_english_explanation:
      parsed.plain_english_explanation ||
      "ScamGate found scam-risk signals and recommends verifying through an official channel.",
    recommended_action: parsed.recommended_action || "Do not click or pay until you verify the message.",
    safe_next_step:
      parsed.safe_next_step ||
      "Type the official website address yourself or call a verified phone number before taking action.",
    confidence: confidence,
  };
}

export function mockAnalyze(request: AnalyzeRequest, ruleResult: RuleResult, reason?: string): AnalysisResult {
  const fallbackForScreenshot = request.inputType === "screenshot" && !process.env.OPENAI_API_KEY;
  const score = fallbackForScreenshot ? Math.max(35, ruleResult.ruleScore) : Math.max(10, ruleResult.ruleScore);
  const riskLevel = riskLevelFromScore(score);
  const scamType = inferScamType(request.content, ruleResult.matchedRules);
  const redFlags =
    ruleResult.matchedRules.length > 0
      ? ruleResult.matchedRules
      : ["No major scam signals were found by the local rule check."];

  if (fallbackForScreenshot) {
    redFlags.unshift(
      "Screenshot AI analysis requires an API key. In demo mode, ScamGate can only provide limited analysis.",
    );
  }

  if (ruleResult.invalidUrl) {
    redFlags.unshift("The URL could not be parsed cleanly.");
  }

  const baseExplanation =
    riskLevel === "high"
      ? "This looks high risk because it contains common scam pressure signals or unsafe payment requests."
      : riskLevel === "medium"
        ? "This is suspicious. It has some warning signs, so you should verify it through an official channel before doing anything."
        : "This appears low risk based on the local rule check, but you should still be careful and verify anything involving money, passwords, or personal information.";

  return withProvider({
    risk_score: score,
    risk_level: riskLevel,
    scam_type: fallbackForScreenshot ? "unknown" : scamType,
    red_flags: reason ? [...redFlags, reason] : redFlags,
    plain_english_explanation: fallbackForScreenshot
      ? "ScamGate cannot read screenshots in demo mode without an OpenAI API key. If the screenshot asks for money, codes, passwords, remote access, or secrecy, treat it as suspicious."
      : baseExplanation,
    recommended_action:
      riskLevel === "high"
        ? "Do not click. Do not pay. Do not share codes or passwords."
        : "Do not use links or phone numbers inside the message until you verify them.",
    safe_next_step:
      riskLevel === "high"
        ? "Verify through the official website or phone number you type yourself, and ask a trusted family member before responding."
        : "Open the official website manually or call a verified phone number if you need to check the message.",
    confidence: ruleResult.matchedRules.length > 0 ? "medium" : "low",
  }, "fallback");
}

function buildUserPrompt(request: AnalyzeRequest, ruleResult: RuleResult): string {
  return [
    `Input type: ${request.inputType}`,
    `Local rule score: ${ruleResult.ruleScore}`,
    `Local matched rules: ${ruleResult.matchedRules.join(", ") || "none"}`,
    `Extracted URLs: ${ruleResult.extractedUrls.join(", ") || "none"}`,
    "Submitted content:",
    request.content || "(No text was provided with this screenshot.)",
  ].join("\n");
}

function extractJsonObject(text: string): unknown {
  const withoutFence = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("No JSON object found in model output.");
    }

    return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
  }
}

async function callGroq(request: AnalyzeRequest, ruleResult: RuleResult): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return mockAnalyze(request, ruleResult, "Groq API key is not configured. Running in demo mode.");
  }

  if (request.inputType === "screenshot") {
    return callOpenAI(request, ruleResult);
  }

  console.info("ScamGate AI provider_used=groq model=%s", process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL);

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.GROQ_BASE_URL || DEFAULT_GROQ_BASE_URL,
  });
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}

Return a single valid JSON object only. Do not wrap it in markdown. Do not include commentary before or after the JSON.`,
    },
    {
      role: "user",
      content: buildUserPrompt(request, ruleResult),
    },
  ];

  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    messages,
    temperature: 0.1,
    max_completion_tokens: 900,
  });

  const output = completion.choices[0]?.message?.content;

  if (!output) {
    return mockAnalyze(request, ruleResult, "Groq returned no text output. Running fallback analysis.");
  }

  const parsed = normalizeModelAnalysis(extractJsonObject(output), request, ruleResult);
  return withProvider(mergeRuleFlags(parsed, ruleResult, request), "groq");
}

async function callOpenAI(request: AnalyzeRequest, ruleResult: RuleResult): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return mockAnalyze(request, ruleResult, "OpenAI API key is not configured. Running in demo mode.");
  }

  const client = new OpenAI({ apiKey });
  const content: ResponseInputMessageContentList = [
    {
      type: "input_text",
      text: buildUserPrompt(request, ruleResult),
    },
  ];

  if (request.inputType === "screenshot" && request.imageBase64) {
    content.push({
      type: "input_image",
      image_url: request.imageBase64,
      detail: "low",
    });
  }

  const input: ResponseInput = [
    {
      role: "user",
      content,
    },
  ];

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    instructions: SYSTEM_PROMPT,
    input,
    text: {
      format: {
        type: "json_schema",
        name: "scam_analysis",
        description: "A scam risk analysis result for ScamGate AI.",
        schema: analysisJsonSchema,
        strict: true,
      },
      verbosity: "low",
    },
    max_output_tokens: 900,
    temperature: 0.1,
    store: false,
  });

  const output = response.output_text;

  if (!output) {
    return mockAnalyze(request, ruleResult, "OpenAI returned no text output. Running fallback analysis.");
  }

  const parsed = normalizeModelAnalysis(JSON.parse(output), request, ruleResult);
  return withProvider(mergeRuleFlags(parsed, ruleResult, request), "openai");
}

export async function analyzeScam(request: AnalyzeRequest, ruleResult: RuleResult): Promise<AnalysisResult> {
  try {
    if (process.env.AI_PROVIDER === "groq") {
      return await callGroq(request, ruleResult);
    }

    return await callOpenAI(request, ruleResult);
  } catch (error) {
    console.warn("ScamGate AI analysis fell back to local rules.", error);
    return mockAnalyze(request, ruleResult, "AI analysis failed. Running local fallback analysis.");
  }
}
