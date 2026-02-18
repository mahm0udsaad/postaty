import HomeClient from "./components/home-client";
import { getPricing } from "@/lib/country-pricing";

export default async function HomePage() {
  const pricing = getPricing();

  return <HomeClient pricing={pricing} />;
}
