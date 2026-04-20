import type { InputType, RuleResult, ScamType } from "@/lib/types";

const HIGH_RISK_PATTERNS: Array<{ label: string; pattern: RegExp; score: number }> = [
  { label: "Asks for gift cards", pattern: /\bgift cards?\b/i, score: 35 },
  { label: "Asks for a wire transfer", pattern: /\bwire transfer\b/i, score: 35 },
  { label: "Asks for Zelle", pattern: /\bzelle\b/i, score: 30 },
  { label: "Asks for Venmo", pattern: /\bvenmo\b/i, score: 25 },
  { label: "Asks for Cash App", pattern: /\bcash app\b/i, score: 25 },
  {
    label: "Asks for PayPal Friends and Family",
    pattern: /\bpaypal friends (and|&) family\b/i,
    score: 30,
  },
  { label: "Mentions crypto", pattern: /\bcrypto(?:currency)?\b/i, score: 30 },
  { label: "Mentions Bitcoin", pattern: /\bbitcoin\b/i, score: 30 },
  { label: "Mentions a Bitcoin ATM", pattern: /\bbitcoin atm\b/i, score: 40 },
  { label: "Requests a verification code", pattern: /\bverification code\b/i, score: 35 },
  { label: "Requests an OTP", pattern: /\botp\b/i, score: 35 },
  { label: "Mentions password reset", pattern: /\bpassword reset\b/i, score: 25 },
  { label: "Claims an account is locked", pattern: /\baccount locked\b/i, score: 25 },
  { label: "Demands urgent payment", pattern: /\burgent payment\b/i, score: 35 },
  { label: "Uses final notice pressure", pattern: /\bfinal notice\b/i, score: 25 },
  { label: "Uses act-now pressure", pattern: /\bact now\b/i, score: 25 },
  { label: "Mentions remote access", pattern: /\bremote access\b/i, score: 40 },
  { label: "Mentions AnyDesk", pattern: /\banydesk\b/i, score: 40 },
  { label: "Mentions TeamViewer", pattern: /\bteamviewer\b/i, score: 40 },
  { label: "Asks for secrecy", pattern: /\b(?:do not|don't)\s+tell\s+(?:anyone|mom|dad|family|parents?)\b/i, score: 40 },
  { label: "Asks to keep it secret", pattern: /\bkeep this secret\b/i, score: 40 },
  { label: "Uses family emergency language", pattern: /\b(grandma|grandpa|mom|dad|lost my phone|new number|emergency)\b/i, score: 25 },
  { label: "Claims a romance emergency", pattern: /\bromance emergency\b/i, score: 35 },
  { label: "Promotes an investment opportunity", pattern: /\binvestment opportunity\b/i, score: 35 },
  { label: "Promises guaranteed returns", pattern: /\bguaranteed returns?\b/i, score: 35 },
];

const BRAND_OR_AGENCY_PATTERNS: Array<{ label: string; pattern: RegExp; type: ScamType }> = [
  { label: "Mentions IRS", pattern: /\birs\b/i, type: "government" },
  { label: "Mentions Social Security", pattern: /\bsocial security\b/i, type: "government" },
  { label: "Mentions Medicare", pattern: /\bmedicare\b/i, type: "government" },
  { label: "Mentions USPS", pattern: /\busps\b/i, type: "delivery" },
  { label: "Mentions FedEx", pattern: /\bfedex\b/i, type: "delivery" },
  { label: "Mentions UPS", pattern: /\bups\b/i, type: "delivery" },
  { label: "Mentions Amazon", pattern: /\bamazon\b/i, type: "shopping" },
  { label: "Mentions PayPal", pattern: /\bpaypal\b/i, type: "phishing" },
  { label: "Mentions Microsoft", pattern: /\bmicrosoft\b/i, type: "tech_support" },
  { label: "Mentions Apple", pattern: /\bapple\b/i, type: "phishing" },
  { label: "Mentions Norton", pattern: /\bnorton\b/i, type: "tech_support" },
  { label: "Mentions McAfee", pattern: /\bmcafee\b/i, type: "tech_support" },
];

const URGENCY_PATTERNS = [
  /\burgent\b/i,
  /\bimmediately\b/i,
  /\bright now\b/i,
  /\bnow\b/i,
  /\bact now\b/i,
  /\bfinal notice\b/i,
  /\bwill be returned\b/i,
  /\bsuspended\b/i,
  /\blocked\b/i,
  /\bpay\b/i,
];

const SHORT_LINK_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
]);

const OFFICIAL_DOMAINS: Record<string, string[]> = {
  usps: ["usps.com"],
  amazon: ["amazon.com"],
  paypal: ["paypal.com"],
  chase: ["chase.com"],
  bankofamerica: ["bankofamerica.com"],
  wellsfargo: ["wellsfargo.com"],
  fedex: ["fedex.com"],
  ups: ["ups.com"],
  microsoft: ["microsoft.com"],
  apple: ["apple.com"],
};

const URL_PATTERN =
  /\bhttps?:\/\/[^\s<>"')]+|\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly|cutt\.ly)\/[^\s<>"')]+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|gov|info|co|us|io|ly|me)(?:\/[^\s<>"')]+)?/gi;

export function extractUrls(content: string): string[] {
  const matches = content.match(URL_PATTERN) ?? [];
  return Array.from(new Set(matches.map((match) => match.replace(/[.,!?;:]+$/, ""))));
}

export function parsePossiblyBareUrl(value: string): URL | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function hostnameMatchesOfficial(hostname: string, officialDomain: string): boolean {
  return hostname === officialDomain || hostname.endsWith(`.${officialDomain}`);
}

export function isKnownOfficialUrl(value: string): boolean {
  const parsedUrl = parsePossiblyBareUrl(value);

  if (!parsedUrl) {
    return false;
  }

  const normalizedHostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

  return Object.values(OFFICIAL_DOMAINS).some((officialDomains) =>
    officialDomains.some((domain) => hostnameMatchesOfficial(normalizedHostname, domain)),
  );
}

function findDomainImpersonation(hostname: string): string[] {
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, "");
  const matched: string[] = [];

  for (const [brand, officialDomains] of Object.entries(OFFICIAL_DOMAINS)) {
    const mentionsBrand = normalizedHostname.includes(brand);
    const isOfficial = officialDomains.some((domain) =>
      hostnameMatchesOfficial(normalizedHostname, domain),
    );

    if (mentionsBrand && !isOfficial) {
      matched.push(`Possible fake ${brand} domain: ${hostname}`);
    }
  }

  return matched;
}

function hasUrgentLanguage(content: string): boolean {
  return URGENCY_PATTERNS.some((pattern) => pattern.test(content));
}

export function inferScamType(content: string, matchedRules: string[]): ScamType {
  const normalized = content.toLowerCase();

  if (/\b(usps|fedex|ups|package|delivery|redelivery)\b/i.test(normalized)) {
    return "delivery";
  }

  if (/\b(bank|chase|wells fargo|bank of america|account locked|password reset)\b/i.test(normalized)) {
    return "bank";
  }

  if (/\b(microsoft|norton|mcafee|anydesk|teamviewer|remote access|computer infected)\b/i.test(normalized)) {
    return "tech_support";
  }

  if (/\b(investment|guaranteed returns|profit)\b/i.test(normalized)) {
    return "investment";
  }

  if (/\b(crypto|bitcoin|bitcoin atm)\b/i.test(normalized)) {
    return "crypto";
  }

  if (/\b(irs|social security|medicare|government)\b/i.test(normalized)) {
    return "government";
  }

  if (/\b(amazon|order|refund)\b/i.test(normalized)) {
    return "shopping";
  }

  if (/\b(marketplace|facebook marketplace|item available)\b/i.test(normalized)) {
    return "marketplace";
  }

  if (matchedRules.some((rule) => rule.toLowerCase().includes("fake") || rule.toLowerCase().includes("link"))) {
    return "phishing";
  }

  return "unknown";
}

export function analyzeRiskRules(inputType: InputType, content: string): RuleResult {
  const matchedRules: string[] = [];
  let score = 0;
  let invalidUrl = false;
  const urls = inputType === "url" ? [content.trim()] : extractUrls(content);

  if (inputType === "url" && isKnownOfficialUrl(content)) {
    const parsedUrl = parsePossiblyBareUrl(content);

    return {
      ruleScore: 0,
      matchedRules: ["Known official domain"],
      extractedUrls: parsedUrl ? [parsedUrl.toString()] : [content.trim()],
      invalidUrl: false,
    };
  }

  for (const rule of HIGH_RISK_PATTERNS) {
    if (rule.pattern.test(content)) {
      matchedRules.push(rule.label);
      score += rule.score;
    }
  }

  const brandMatches = BRAND_OR_AGENCY_PATTERNS.filter((rule) => rule.pattern.test(content));
  for (const match of brandMatches) {
    matchedRules.push(match.label);
    score += 8;
  }

  const urgent = hasUrgentLanguage(content);
  if (urgent) {
    matchedRules.push("Uses urgent or pressure language");
    score += 15;
  }

  const parsedUrls: string[] = [];

  for (const rawUrl of urls) {
    const parsedUrl = parsePossiblyBareUrl(rawUrl);

    if (!parsedUrl) {
      invalidUrl = true;
      matchedRules.push("Invalid or hard-to-read URL");
      score = Math.max(score, 50);
      continue;
    }

    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
    parsedUrls.push(parsedUrl.toString());

    if (SHORT_LINK_HOSTS.has(hostname)) {
      matchedRules.push(`Uses a shortened link: ${hostname}`);
      score += 30;
    }

    const impersonationRules = findDomainImpersonation(hostname);
    matchedRules.push(...impersonationRules);
    score += impersonationRules.length * 40;
  }

  if (brandMatches.length > 0 && urls.length > 0) {
    matchedRules.push("Uses a brand or agency name with a link");
    score += 15;
  }

  if (brandMatches.length > 0 && urls.length > 0 && urgent) {
    matchedRules.push("Brand or agency message combines urgency with a link");
    score = Math.max(score, 65);
  }

  const directHighRisk = matchedRules.some((rule) =>
    [
      "gift",
      "wire",
      "zelle",
      "crypto",
      "bitcoin atm",
      "remote access",
      "verification code",
      "otp",
      "secrecy",
      "secret",
    ].some((term) => rule.toLowerCase().includes(term)),
  );

  if (directHighRisk) {
    score = Math.max(score, 75);
  }

  return {
    ruleScore: Math.min(100, score),
    matchedRules: Array.from(new Set(matchedRules)),
    extractedUrls: Array.from(new Set(parsedUrls.length > 0 ? parsedUrls : urls.filter(Boolean))),
    invalidUrl,
  };
}

export function riskLevelFromScore(score: number) {
  if (score >= 70) {
    return "high";
  }

  if (score >= 35) {
    return "medium";
  }

  return "low";
}
