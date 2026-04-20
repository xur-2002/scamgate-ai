export const inputTypes = ["text", "url", "screenshot"] as const;
export type InputType = (typeof inputTypes)[number];

export const riskLevels = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof riskLevels)[number];

export const scamTypes = [
  "delivery",
  "bank",
  "tech_support",
  "investment",
  "romance",
  "marketplace",
  "government",
  "shopping",
  "crypto",
  "phishing",
  "unknown",
] as const;
export type ScamType = (typeof scamTypes)[number];

export const confidenceLevels = ["low", "medium", "high"] as const;
export type Confidence = (typeof confidenceLevels)[number];

export type AnalyzeRequest = {
  inputType: InputType;
  content: string;
  imageBase64?: string;
  anonymousId?: string;
};

export type AnalysisResult = {
  risk_score: number;
  risk_level: RiskLevel;
  scam_type: ScamType;
  red_flags: string[];
  plain_english_explanation: string;
  recommended_action: string;
  safe_next_step: string;
  confidence: Confidence;
  provider_used?: "groq" | "openai" | "fallback";
};

export type RuleResult = {
  ruleScore: number;
  matchedRules: string[];
  extractedUrls: string[];
  invalidUrl: boolean;
};

export type UsageStatus = {
  allowed: boolean;
  count: number;
  remaining: number;
  limit: number;
  resetDate: string;
};
