export type PlanPricing = {
  monthly: number;
  firstMonth: number;
};

export type PricingSet = {
  currency: "USD";
  symbol: string;
  starter: PlanPricing;
  growth: PlanPricing;
  dominant: PlanPricing;
};

const USD_PRICING: PricingSet = {
  currency: "USD",
  symbol: "$",
  starter: { monthly: 7, firstMonth: 5 },
  growth: { monthly: 14, firstMonth: 10 },
  dominant: { monthly: 27, firstMonth: 19 },
};

export function getPricing(): PricingSet {
  return USD_PRICING;
}

export function formatPrice(value: number, symbol: string) {
  if (Number.isInteger(value)) return `${symbol}${value}`;
  return `${symbol}${value.toFixed(1)}`;
}
