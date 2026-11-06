export interface SanitizedInput {
  sanitizedTopic: string;
  sanitizedContext: string;
  hasInjectionAttempt: boolean;
  injectionWarnings: string[];
}

export interface ModerationResult {
  flagged: boolean;
  category?: "hate_speech" | "violence" | "illicit" | "harmful" | "injection";
  reason?: string;
}

// Patterns commonly used in LLM prompt injection and jailbreaking
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|rules)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(rules|instructions)/i,
  /system\s*:\s*/i,
  /<system>/i,
  /<\/system>/i,
  /<instructions>/i,
  /<\/instructions>/i,
  /you\s+are\s+now\s+(an?\s+)?unfiltered/i,
  /you\s+must\s+bypass\s+all\s+safety/i,
  /developer\s+mode\s+enabled/i,
  /DAN\s+mode/i,
];

// Content length caps per content type (in maximum allowed tokens)
export const CONTENT_LENGTH_CAPS: Record<string, number> = {
  social: 400,
  blog: 2500,
  grant_proposal: 4000,
};

// Sanitizes user-provided topic and context to neutralize prompt injection
export function sanitizeUserContext(
  topic: string,
  context: string,
): SanitizedInput {
  const warnings: string[] = [];
  let hasInjection = false;

  let cleanTopic = topic;
  let cleanContext = context;

  // Check for known prompt injection phrases
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleanTopic) || pattern.test(cleanContext)) {
      hasInjection = true;
      warnings.push(
        `Detected injection signature matching pattern: ${pattern.source}`,
      );
      cleanTopic = cleanTopic.replace(pattern, "[redacted-override]");
      cleanContext = cleanContext.replace(pattern, "[redacted-override]");
    }
  }

  // Escape prompt delimiter tags and template syntax to prevent escaping sandbox
  cleanTopic = cleanTopic
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{/g, "{")
    .replace(/\}\}/g, "}")
    .trim();

  cleanContext = cleanContext
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{/g, "{")
    .replace(/\}\}/g, "}")
    .trim();

  return {
    sanitizedTopic: cleanTopic,
    sanitizedContext: cleanContext,
    hasInjectionAttempt: hasInjection,
    injectionWarnings: warnings,
  };
}

// Formats user context inside untrusted delimiter boundaries
export function wrapInUntrustedBoundary(sanitizedContext: string): string {
  if (!sanitizedContext.trim()) return "";
  return `\n<untrusted_user_context>\n${sanitizedContext}\n</untrusted_user_context>\n`;
}

// Content Moderation Hook checking English and Swahili inputs
export function moderateContent(text: string): ModerationResult {
  const normalized = text.toLowerCase();

  // Basic moderation rule set for illicit / harmful content
  const prohibitedKeywords = [
    "malware",
    "ransomware",
    "ddos attack",
    "credit card fraud",
    "m-pesa fraud",
    "wizi wa m-pesa",
    "ugaidi",
    "kuunda bomu",
  ];

  for (const keyword of prohibitedKeywords) {
    if (normalized.includes(keyword)) {
      return {
        flagged: true,
        category: "illicit",
        reason: `Content contains prohibited keyword: "${keyword}"`,
      };
    }
  }

  return {
    flagged: false,
  };
}

// Resolves maximum allowed tokens capped strictly by content type
export function resolveOutputTokenCap(
  contentType: string,
  requestedLength: "short" | "medium" | "long",
): number {
  const hardCap = CONTENT_LENGTH_CAPS[contentType] || 2500;

  let targetTokens = 1200;
  if (requestedLength === "short") {
    targetTokens = 400;
  } else if (requestedLength === "long") {
    targetTokens = 2500;
  }

  return Math.min(targetTokens, hardCap);
}
