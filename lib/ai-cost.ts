import { createAdminClient } from "@/lib/supabase/server";

export type AiProvider = "google_direct" | "vercel_gateway";
export type AiCostMode = "exact" | "legacy";
export type AiGenerationType =
  | "poster"
  | "menu"
  | "reel"
  | "marketing-content"
  | "gift"
  | "edit";

export type ExactAiUsageInput = {
  userAuthId: string;
  generationId?: string | null;
  generationType: AiGenerationType;
  route: AiGenerationType;
  model: string;
  provider: AiProvider;
  providerModelId: string;
  inputTokens: number;
  outputTokens: number;
  imagesGenerated: number;
  durationMs: number;
  success: boolean;
  error?: string | null;
  createdAt?: number;
};

type AiPricingRow = {
  id?: string;
  provider?: AiProvider;
  provider_model_id?: string;
  model?: string;
  effective_from?: number | string | null;
  effective_to?: number | string | null;
  input_cost_per_1m_usd?: number | string | null;
  output_cost_per_1m_usd?: number | string | null;
  output_pricing_mode?: "token" | "image" | string | null;
  image_cost_per_unit_usd?: number | string | null;
  gateway_cost_per_1m_input_usd?: number | string | null;
  gateway_cost_per_1m_output_usd?: number | string | null;
  gateway_cost_per_image_usd?: number | string | null;
  input_token_cost_per_1k?: number | string | null;
  output_token_cost_per_1k?: number | string | null;
  image_generation_cost?: number | string | null;
  created_at?: number | string | null;
};

export type ExactAiCostBreakdown = {
  inputCostUsd: number;
  outputCostUsd: number;
  imageCostUsd: number;
  gatewayCostUsd: number;
  totalCostUsd: number;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toTimestamp(value: unknown): number | null {
  const parsed = toNumber(value);
  return parsed > 0 ? parsed : null;
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function getPerMillionCost(
  perMillionValue: unknown,
  legacyPer1kValue: unknown
): number {
  const perMillion = toNumber(perMillionValue);
  if (perMillion > 0) return perMillion;
  const per1k = toNumber(legacyPer1kValue);
  return per1k > 0 ? per1k * 1000 : 0;
}

export function calculateExactAiCost(
  usage: Pick<
    ExactAiUsageInput,
    "inputTokens" | "outputTokens" | "imagesGenerated"
  >,
  pricing: AiPricingRow
): ExactAiCostBreakdown {
  const inputPer1MUsd = getPerMillionCost(
    pricing.input_cost_per_1m_usd,
    pricing.input_token_cost_per_1k
  );
  const outputPer1MUsd = getPerMillionCost(
    pricing.output_cost_per_1m_usd,
    pricing.output_token_cost_per_1k
  );
  const outputPricingMode =
    pricing.output_pricing_mode === "image" ? "image" : "token";
  const imageCostPerUnitUsd =
    toNumber(pricing.image_cost_per_unit_usd) ||
    toNumber(pricing.image_generation_cost);
  const gatewayInputPer1MUsd = toNumber(pricing.gateway_cost_per_1m_input_usd);
  const gatewayOutputPer1MUsd = toNumber(pricing.gateway_cost_per_1m_output_usd);
  const gatewayImagePerUnitUsd = toNumber(pricing.gateway_cost_per_image_usd);

  const inputCostUsd = (usage.inputTokens / 1_000_000) * inputPer1MUsd;
  const outputCostUsd =
    outputPricingMode === "token"
      ? (usage.outputTokens / 1_000_000) * outputPer1MUsd
      : 0;
  const imageCostUsd =
    outputPricingMode === "image"
      ? usage.imagesGenerated * imageCostPerUnitUsd
      : 0;
  const gatewayCostUsd =
    (usage.inputTokens / 1_000_000) * gatewayInputPer1MUsd +
    (usage.outputTokens / 1_000_000) * gatewayOutputPer1MUsd +
    usage.imagesGenerated * gatewayImagePerUnitUsd;

  return {
    inputCostUsd: roundUsd(inputCostUsd),
    outputCostUsd: roundUsd(outputCostUsd),
    imageCostUsd: roundUsd(imageCostUsd),
    gatewayCostUsd: roundUsd(gatewayCostUsd),
    totalCostUsd: roundUsd(
      inputCostUsd + outputCostUsd + imageCostUsd + gatewayCostUsd
    ),
  };
}

export function isPricingActiveAt(pricing: AiPricingRow, at: number): boolean {
  const effectiveFrom = toTimestamp(pricing.effective_from ?? pricing.created_at);
  const effectiveTo = toTimestamp(pricing.effective_to);

  if (effectiveFrom != null && effectiveFrom > at) return false;
  if (effectiveTo != null && effectiveTo <= at) return false;
  return true;
}

export async function resolveExactAiPricing(input: {
  provider: AiProvider;
  providerModelId: string;
  model: string;
  at: number;
}): Promise<AiPricingRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_pricing_config")
    .select("*")
    .order("effective_from", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to resolve AI pricing: ${error.message}`);
  }

  const rows = (data ?? []) as AiPricingRow[];
  const exactMatch = rows.find(
    (row) =>
      row.provider === input.provider &&
      row.provider_model_id === input.providerModelId &&
      isPricingActiveAt(row, input.at)
  );
  if (exactMatch) return exactMatch;

  const legacyMatch = rows.find(
    (row) => row.model === input.model && isPricingActiveAt(row, input.at)
  );
  if (legacyMatch) return legacyMatch;

  throw new Error(
    `Missing active AI pricing config for ${input.provider}:${input.providerModelId}`
  );
}

export async function persistExactAiUsageEvent(
  input: ExactAiUsageInput
): Promise<void> {
  const createdAt = input.createdAt ?? Date.now();
  const pricing = await resolveExactAiPricing({
    provider: input.provider,
    providerModelId: input.providerModelId,
    model: input.model,
    at: createdAt,
  });
  const costs = calculateExactAiCost(input, pricing);
  const admin = createAdminClient();

  const { error } = await admin.from("ai_usage_events").insert({
    user_auth_id: input.userAuthId,
    generation_id: input.generationId ?? null,
    generation_type: input.generationType,
    route: input.route,
    model: input.model,
    provider: input.provider,
    provider_model_id: input.providerModelId,
    pricing_version_id: pricing.id ?? null,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
    images_generated: input.imagesGenerated,
    duration_ms: input.durationMs,
    success: input.success,
    error: input.error ?? null,
    input_cost_usd: costs.inputCostUsd,
    output_cost_usd: costs.outputCostUsd,
    image_cost_usd: costs.imageCostUsd,
    gateway_cost_usd: costs.gatewayCostUsd,
    total_cost_usd: costs.totalCostUsd,
    estimated_cost_usd: costs.totalCostUsd,
    cost_mode: "exact" satisfies AiCostMode,
    created_at: createdAt,
  });

  if (error) {
    throw new Error(`Failed to persist exact AI usage event: ${error.message}`);
  }
}
