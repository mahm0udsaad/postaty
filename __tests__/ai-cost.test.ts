import {
  calculateExactAiCost,
  isPricingActiveAt,
} from "@/lib/ai-cost";

describe("calculateExactAiCost", () => {
  it("calculates token-based pricing for direct provider rows", () => {
    const result = calculateExactAiCost(
      {
        inputTokens: 2_000,
        outputTokens: 5_000,
        imagesGenerated: 0,
      },
      {
        input_cost_per_1m_usd: 0.3,
        output_cost_per_1m_usd: 12,
        output_pricing_mode: "token",
      }
    );

    expect(result).toEqual({
      inputCostUsd: 0.0006,
      outputCostUsd: 0.06,
      imageCostUsd: 0,
      gatewayCostUsd: 0,
      totalCostUsd: 0.0606,
    });
  });

  it("calculates image-based pricing and gateway surcharge", () => {
    const result = calculateExactAiCost(
      {
        inputTokens: 560,
        outputTokens: 1_120,
        imagesGenerated: 1,
      },
      {
        input_cost_per_1m_usd: 2,
        output_pricing_mode: "image",
        image_cost_per_unit_usd: 0.134,
        gateway_cost_per_image_usd: 0.01,
      }
    );

    expect(result).toEqual({
      inputCostUsd: 0.00112,
      outputCostUsd: 0,
      imageCostUsd: 0.134,
      gatewayCostUsd: 0.01,
      totalCostUsd: 0.14512,
    });
  });

  it("falls back to legacy per-1k pricing columns", () => {
    const result = calculateExactAiCost(
      {
        inputTokens: 1_000,
        outputTokens: 2_000,
        imagesGenerated: 3,
      },
      {
        input_token_cost_per_1k: 0.001,
        output_token_cost_per_1k: 0.002,
        output_pricing_mode: "image",
        image_generation_cost: 0.1,
      }
    );

    expect(result.totalCostUsd).toBe(0.301);
  });
});

describe("isPricingActiveAt", () => {
  it("honors effective date windows", () => {
    expect(
      isPricingActiveAt(
        {
          effective_from: 100,
          effective_to: 200,
        },
        150
      )
    ).toBe(true);

    expect(
      isPricingActiveAt(
        {
          effective_from: 100,
          effective_to: 200,
        },
        250
      )
    ).toBe(false);
  });
});
