import { env } from "../env";

export interface TokenPrice {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
}

// Configurable pricing table per 1,000,000 tokens (USD)
export const MODEL_PRICING: Record<string, TokenPrice> = {
  "claude-3-5-sonnet-20241022": {
    inputPerMillionUsd: 3.0,
    outputPerMillionUsd: 15.0,
  },
  "claude-3-haiku-20240307": {
    inputPerMillionUsd: 0.25,
    outputPerMillionUsd: 1.25,
  },
  "claude-3-opus-20240229": {
    inputPerMillionUsd: 15.0,
    outputPerMillionUsd: 75.0,
  },
};

// Default fallback pricing if unrecognized model string
const DEFAULT_PRICING: TokenPrice = {
  inputPerMillionUsd: 3.0,
  outputPerMillionUsd: 15.0,
};

export interface TokenCostResult {
  costUsd: number;
  costKes: number;
  formattedUsd: string;
  formattedKes: string;
}

export function calculateTokenCost(params: {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  usdToKesRate?: number;
}): TokenCostResult {
  const { modelId, inputTokens, outputTokens } = params;
  const rate = params.usdToKesRate || env.USD_TO_KES_RATE || 130.0;
  const pricing = MODEL_PRICING[modelId] || DEFAULT_PRICING;

  const inputCostUsd = (inputTokens / 1_000_000) * pricing.inputPerMillionUsd;
  const outputCostUsd =
    (outputTokens / 1_000_000) * pricing.outputPerMillionUsd;
  const totalCostUsd = inputCostUsd + outputCostUsd;
  const totalCostKes = totalCostUsd * rate;

  return {
    costUsd: Number(totalCostUsd.toFixed(6)),
    costKes: Number(totalCostKes.toFixed(4)),
    formattedUsd: formatUsd(totalCostUsd),
    formattedKes: formatKes(totalCostKes),
  };
}

export function formatKes(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  })}`;
}

export { formatKes as formatKES, formatUsd as formatUSD };
