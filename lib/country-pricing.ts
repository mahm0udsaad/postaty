export type PlanPricing = {
  monthly: number;
  firstMonth: number;
};

export type PricingSet = {
  currency: "USD";
  symbol: "$";
  starter: PlanPricing;
  growth: PlanPricing;
  dominant: PlanPricing;
};

/** Default USD pricing (used when no country-specific override exists) */
const USD_PRICING: PricingSet = {
  currency: "USD",
  symbol: "$",
  starter: { monthly: 7, firstMonth: 5 },
  growth: { monthly: 14, firstMonth: 10 },
  dominant: { monthly: 27, firstMonth: 19 },
};

/**
 * Regional pricing overrides by country group.
 * Each group maps a set of country codes to custom prices.
 * Easy to extend — just add another entry.
 */
const REGIONAL_PRICING: Record<
  string,
  { countries: string[]; pricing: PricingSet }
> = {
  mena_local: {
    countries: ["JO", "PS", "IL"],
    pricing: {
      currency: "USD",
      symbol: "$",
      starter: { monthly: 13, firstMonth: 13 },
      growth: { monthly: 22, firstMonth: 22 },
      dominant: { monthly: 37, firstMonth: 37 },
    },
  },
};

export function normalizeCountry(country?: string | null) {
  if (!country) return "US";
  return country.toUpperCase();
}

/**
 * Returns the region key (e.g. "mena_local") for a country code,
 * or null if the country uses default pricing.
 */
export function getRegionForCountry(
  country?: string | null
): string | null {
  if (!country) return null;
  const code = country.toUpperCase();
  for (const [regionKey, config] of Object.entries(REGIONAL_PRICING)) {
    if (config.countries.includes(code)) return regionKey;
  }
  return null;
}

/** Returns the pricing set for a given country code. */
export function getPricingForCountry(country?: string | null): PricingSet {
  const region = getRegionForCountry(country);
  if (region) return REGIONAL_PRICING[region].pricing;
  return USD_PRICING;
}

export function formatPrice(value: number) {
  if (Number.isInteger(value)) return `$${value}`;
  return `$${value.toFixed(1)}`;
}
