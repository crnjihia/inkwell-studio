// Regex patterns for sensitive Kenyan PII and secrets
const PII_PATTERNS = {
  // Kenyan Phone Numbers: +254 7XX, +254 1XX, 07XX, 01XX (with or without spaces)
  kenyanPhone: /(?:\+?254|0)\s*(?:7\d{2}|1\d{2})\s*\d{3}\s*\d{3}/g,

  // M-Pesa Receipt Codes: 10 alphanumeric chars (e.g. NL51X9J8P2)
  mpesaCode: /\b[A-Z0-9]{10}\b/g,

  // Email Addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Kenyan National ID numbers (6 to 8 consecutive digits preceded by ID keyword or boundary)
  nationalId: /\b(?:id|kitambulisho|natid)[:\s]*(\d{6,8})\b/gi,

  // Anthropic API keys and Bearer JWTs
  apiKey: /sk-ant-[a-zA-Z0-9_-]{16,}/g,
  bearerToken: /Bearer\s+ey[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
};

// Redacts sensitive PII from string inputs before logging
export function redactPii(message: string): string {
  if (!message || typeof message !== "string") return message;

  return message
    .replace(PII_PATTERNS.apiKey, "[REDACTED_API_KEY]")
    .replace(PII_PATTERNS.bearerToken, "Bearer [REDACTED_JWT]")
    .replace(PII_PATTERNS.kenyanPhone, "[REDACTED_PHONE_KE]")
    .replace(PII_PATTERNS.mpesaCode, (match) => {
      // Keep prefix and suffix, redact middle: NL****8P2
      return `${match.slice(0, 2)}****${match.slice(-3)}`;
    })
    .replace(PII_PATTERNS.email, (match) => {
      const [local, domain] = match.split("@");
      return `${local[0]}***@${domain}`;
    })
    .replace(PII_PATTERNS.nationalId, "[REDACTED_NATIONAL_ID]");
}

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  requestId?: string;
  message: string;
  context?: Record<string, unknown>;
}

// Structured PII-safe logger for production and local environments
export const piiSafeLogger = {
  info(message: string, context?: Record<string, unknown>, requestId?: string) {
    emitLog("info", message, context, requestId);
  },
  warn(message: string, context?: Record<string, unknown>, requestId?: string) {
    emitLog("warn", message, context, requestId);
  },
  error(message: string, context?: Record<string, unknown>, requestId?: string) {
    emitLog("error", message, context, requestId);
  },
  debug(message: string, context?: Record<string, unknown>, requestId?: string) {
    if (process.env.NODE_ENV !== "production") {
      emitLog("debug", message, context, requestId);
    }
  },
};

function emitLog(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  requestId?: string
) {
  const sanitizedMessage = redactPii(message);

  let sanitizedContext: Record<string, unknown> | undefined;
  if (context) {
    sanitizedContext = JSON.parse(
      redactPii(JSON.stringify(context))
    );
  }

  const logEntry: LogEntry = {
    timestamp: new Intl.DateTimeFormat("en-KE", {
      timeZone: "Africa/Nairobi",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date()),
    level,
    requestId,
    message: sanitizedMessage,
    context: sanitizedContext,
  };

  const output = `[${logEntry.timestamp} EAT] [${level.toUpperCase()}] ${logEntry.message}${
    sanitizedContext ? ` | ${JSON.stringify(sanitizedContext)}` : ""
  }`;

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

