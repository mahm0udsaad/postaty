import { cookies, headers } from "next/headers";
import { normalizeCountry, getPricingForCountry } from "@/lib/country-pricing";
import PricingClient from "./pricing-client";

const COUNTRY_COOKIE = "pst_country";

async function getDetectedCountry() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieCountry = cookieStore.get(COUNTRY_COOKIE)?.value;
  const headerCountry = headerStore.get("x-vercel-ip-country");
  return normalizeCountry(cookieCountry ?? headerCountry);
}

export default async function PricingPage() {
  const country = await getDetectedCountry();
  const fallbackPricing = getPricingForCountry(country);
  return <PricingClient countryCode={country} fallbackPricing={fallbackPricing} />;
}
