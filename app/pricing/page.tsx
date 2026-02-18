import { getPricing } from "@/lib/country-pricing";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const pricing = getPricing();
  return <PricingClient fallbackPricing={pricing} />;
}
