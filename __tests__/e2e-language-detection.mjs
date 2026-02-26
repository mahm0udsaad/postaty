/**
 * E2E Test: Language Detection in Poster & Marketing Content
 *
 * Part 1: Prompt builder unit tests (no auth needed)
 * Part 2: UI tests via Puppeteer (requires auth cookies)
 *
 * Run: npx tsx __tests__/e2e-language-detection.mjs
 * Or:  node --import tsx __tests__/e2e-language-detection.mjs
 */

// ── Test Helpers ──────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

function assert(condition, testName) {
  if (condition) {
    passed++;
    results.push({ name: testName, status: "PASS" });
    log("✅", testName);
  } else {
    failed++;
    results.push({ name: testName, status: "FAIL" });
    log("❌", testName);
  }
}

// ── Test Data ─────────────────────────────────────────────────────

const HEBREW_RESTAURANT = {
  category: "restaurant",
  campaignType: "standard",
  format: "instagram-square",
  restaurantName: "נגריית סמיר",
  logo: "",
  mealImage: "",
  postType: "meal-offer",
  mealName: "מטבח יוקרה",
  description: "ספריות חדרי ארונות",
  newPrice: "1100 ₪",
  oldPrice: "2000 ₪",
  deliveryType: "free",
  whatsapp: "+970528924384",
  cta: "הזמן עכשיו",
};

const ARABIC_RESTAURANT = {
  category: "restaurant",
  campaignType: "standard",
  format: "instagram-square",
  restaurantName: "مطعم الشام",
  logo: "",
  mealImage: "",
  postType: "meal-offer",
  mealName: "شاورما دجاج",
  description: "شاورما مع بطاطس ومشروب",
  newPrice: "25 ر.س",
  oldPrice: "40 ر.س",
  deliveryType: "free",
  whatsapp: "+966501234567",
  cta: "اطلب الآن",
};

const HEBREW_SERVICES = {
  category: "services",
  campaignType: "standard",
  format: "instagram-square",
  businessName: "שירותי ניקיון מקצועי",
  logo: "",
  serviceImage: "",
  serviceType: "cleaning",
  serviceName: "ניקוי שטיחים",
  serviceDetails: "ניקוי מקצועי לכל סוגי השטיחים",
  price: "150 ₪",
  priceType: "fixed",
  executionTime: "שעה אחת",
  coverageArea: "תל אביב",
  whatsapp: "+972501234567",
  cta: "הזמן שירות",
};

const HEBREW_BEAUTY = {
  category: "beauty",
  campaignType: "standard",
  format: "instagram-square",
  salonName: "סלון היופי של דנה",
  logo: "",
  serviceImage: "",
  postType: "salon-service",
  serviceName: "טיפול פנים מרגיע",
  benefit: "לחות וזוהר",
  newPrice: "200 ₪",
  oldPrice: "350 ₪",
  sessionDuration: "60 דקות",
  suitableFor: "כל סוגי העור",
  bookingCondition: "advance",
  whatsapp: "+972501234567",
  cta: "הזמני תור",
};

const FRENCH_ECOMMERCE = {
  category: "ecommerce",
  campaignType: "standard",
  format: "instagram-square",
  shopName: "Boutique Élégance",
  logo: "",
  productImage: "",
  postType: "product",
  productName: "Écouteurs Bluetooth",
  features: "Réduction de bruit, 30h de batterie",
  newPrice: "199 €",
  oldPrice: "349 €",
  colorSize: "Noir / Taille unique",
  availability: "in-stock",
  shippingDuration: "2-3 jours",
  whatsapp: "+33612345678",
  cta: "Acheter maintenant",
};

const TURKISH_FASHION = {
  category: "fashion",
  campaignType: "standard",
  format: "instagram-square",
  brandName: "Zarif Moda",
  logo: "",
  productImage: "",
  postType: "discount",
  itemName: "Gece Elbisesi",
  description: "Payetli zarif gece elbisesi",
  newPrice: "299 ₺",
  oldPrice: "599 ₺",
  availableSizes: "S, M, L, XL",
  availableColors: "Siyah, Kırmızı",
  whatsapp: "+905551234567",
  cta: "Şimdi Satın Al",
};

// Arabic chars regex (excludes common Arabic punctuation)
const ARABIC_TEXT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Allowed Arabic: category labels and seasonal greetings in style guidance (not poster text)
const ALLOWED_ARABIC = [
  "مطاعم", "وكافيهات", "سوبر ماركت", "متجر إلكتروني", "متاجر إلكترونية",
  "خدمات", "أزياء", "وموضة", "جمال وعناية", "تجميل وعناية",
  "عروض رمضان", "رمضان كريم", "رمضان مبارك",
  "عروض العيد", "عيد مبارك", "كل عام وأنتم بخير", "كل عام وانتم بخير",
];

function stripAllowedArabic(text) {
  let cleaned = text;
  for (const pattern of ALLOWED_ARABIC) {
    cleaned = cleaned.replaceAll(pattern, "");
  }
  return cleaned;
}

function hasArabicLeak(text) {
  return ARABIC_TEXT_RE.test(stripAllowedArabic(text));
}

// ── Prompt Unit Tests ─────────────────────────────────────────────

async function runPromptTests() {
  console.log("\n── Part 1: Poster Prompt Tests (poster-prompts.ts) ─────\n");

  const {
    getImageDesignSystemPrompt,
    getImageDesignUserMessage,
    buildMarketingContentSystemPrompt,
    buildMarketingContentUserMessage,
  } = await import("../lib/poster-prompts.ts");

  // ── System Prompt Tests ──

  const sysPH = getImageDesignSystemPrompt(HEBREW_RESTAURANT);
  assert(!sysPH.includes("MUST be in Arabic"), "[poster-sys] No 'MUST be in Arabic' for Hebrew input");
  assert(sysPH.includes("Detect the language"), "[poster-sys] Contains language detection instruction");
  assert(sysPH.includes("SAME language"), "[poster-sys] Contains 'SAME language' rule");
  assert(sysPH.includes("Hebrew"), "[poster-sys] Mentions Hebrew as an example");
  assert(sysPH.includes("RTL"), "[poster-sys] Contains RTL direction guidance");

  const sysAR = getImageDesignSystemPrompt(ARABIC_RESTAURANT);
  assert(sysAR.includes("Detect the language"), "[poster-sys] Arabic input also gets language detection");
  assert(!sysAR.includes("MUST be in Arabic"), "[poster-sys] No hardcoded Arabic force even for Arabic input");

  // ── User Message Tests — No Arabic Leaks ──

  console.log("\n── User Message Tests — Arabic Leak Check ─────────────\n");

  const categories = [
    { data: HEBREW_RESTAURANT, label: "restaurant (Hebrew)" },
    { data: HEBREW_SERVICES, label: "services (Hebrew)" },
    { data: HEBREW_BEAUTY, label: "beauty (Hebrew)" },
    { data: FRENCH_ECOMMERCE, label: "ecommerce (French)" },
    { data: TURKISH_FASHION, label: "fashion (Turkish)" },
  ];

  for (const { data, label } of categories) {
    const userMsg = getImageDesignUserMessage(data);
    const leaked = hasArabicLeak(userMsg);
    assert(!leaked, `[user-msg] ${label}: No hardcoded Arabic in user message`);

    if (leaked) {
      // Show which lines have leaks
      const lines = stripAllowedArabic(userMsg).split("\n");
      lines.forEach((line, i) => {
        if (ARABIC_TEXT_RE.test(line)) {
          log("  →", `Line ${i + 1}: "${line.trim()}"`);
        }
      });
    }
  }

  // ── Specific Hardcoded String Tests ──

  console.log("\n── Specific Hardcoded String Tests ─────────────────────\n");

  const servicesMsg = getImageDesignUserMessage(HEBREW_SERVICES);
  assert(servicesMsg.includes("Fixed price"), '[services] Price type shows "Fixed price" not Arabic');
  assert(!servicesMsg.includes("سعر ثابت"), '[services] No "سعر ثابت" in output');

  const beautyMsg = getImageDesignUserMessage(HEBREW_BEAUTY);
  assert(beautyMsg.includes("Advance booking"), '[beauty] Booking shows "Advance booking" not Arabic');
  assert(!beautyMsg.includes("حجز مسبق"), '[beauty] No "حجز مسبق" in output');

  const restaurantMsg = getImageDesignUserMessage(HEBREW_RESTAURANT);
  assert(restaurantMsg.includes("Free"), '[restaurant] Delivery shows "Free" not Arabic');
  assert(!restaurantMsg.includes("مجاني"), '[restaurant] No "مجاني" in output');

  // ── Marketing Content Prompt Tests ──

  console.log("\n── Part 2: Marketing Content Prompts ───────────────────\n");

  // Auto mode
  const mktAuto = buildMarketingContentSystemPrompt(HEBREW_RESTAURANT, "auto");
  assert(mktAuto.includes("Detect the language"), '[mkt-auto] Contains language detection');
  assert(!mktAuto.includes("MUST be in Arabic"), '[mkt-auto] No forced Arabic');
  assert(!mktAuto.includes("MUST be in English"), '[mkt-auto] No forced English');

  const mktAutoUser = buildMarketingContentUserMessage(HEBREW_RESTAURANT, "auto");
  assert(
    mktAutoUser.includes("same language as the user"),
    '[mkt-auto-user] User message references detected language'
  );

  // Arabic mode
  const mktAr = buildMarketingContentSystemPrompt(HEBREW_RESTAURANT, "ar");
  assert(mktAr.includes("MUST be in Arabic"), '[mkt-ar] Correctly forces Arabic when explicit');

  // English mode
  const mktEn = buildMarketingContentSystemPrompt(HEBREW_RESTAURANT, "en");
  assert(mktEn.includes("MUST be in English"), '[mkt-en] Correctly forces English when explicit');

  // Unknown language fallback
  const mktOther = buildMarketingContentSystemPrompt(HEBREW_RESTAURANT, "he");
  assert(
    mktOther.includes("same language as the user"),
    '[mkt-other] Fallback language instruction works'
  );
}

async function runPromptsFileTests() {
  console.log("\n── Part 3: Secondary Prompt File (prompts.ts) ──────────\n");

  const { getSystemPrompt, buildUserMessage } = await import("../lib/prompts.ts");

  // System prompt tests
  const sysPH = getSystemPrompt(HEBREW_RESTAURANT);
  assert(!sysPH.includes("MUST be in Arabic"), "[prompts-sys] No forced Arabic");
  assert(sysPH.includes("Detect the language"), "[prompts-sys] Has language detection");
  assert(sysPH.includes("SAME language"), "[prompts-sys] Has 'SAME language' rule");

  // User message — no Arabic leaks
  const categories = [
    { data: HEBREW_RESTAURANT, label: "restaurant" },
    { data: HEBREW_SERVICES, label: "services" },
    { data: HEBREW_BEAUTY, label: "beauty" },
    { data: FRENCH_ECOMMERCE, label: "ecommerce" },
    { data: TURKISH_FASHION, label: "fashion" },
  ];

  for (const { data, label } of categories) {
    const userMsg = buildUserMessage(data);
    const leaked = hasArabicLeak(userMsg);
    assert(!leaked, `[prompts-user] ${label}: No hardcoded Arabic`);
  }

  // Specific strings
  const svcMsg = buildUserMessage(HEBREW_SERVICES);
  assert(svcMsg.includes("Fixed price"), '[prompts-services] "Fixed price" not Arabic');

  const beautyMsg = buildUserMessage(HEBREW_BEAUTY);
  assert(beautyMsg.includes("Advance booking"), '[prompts-beauty] "Advance booking" not Arabic');

  const restMsg = buildUserMessage(HEBREW_RESTAURANT);
  assert(restMsg.includes("Free"), '[prompts-restaurant] "Free" not Arabic');
}

async function runConstantsTests() {
  console.log("\n── Part 4: Constants (negative prompts) ────────────────\n");

  const { DEFAULT_NEGATIVE_PROMPTS } = await import("../lib/constants.ts");

  const noEnglishRule = DEFAULT_NEGATIVE_PROMPTS.find((p) => p.includes("English text"));
  assert(!noEnglishRule, '[constants] No "no English text" negative prompt');

  const hasConsistentLang = DEFAULT_NEGATIVE_PROMPTS.some((p) => p.includes("consistent language"));
  assert(hasConsistentLang, '[constants] Has "consistent language" negative prompt');
}

async function runUIComponentTests() {
  console.log("\n── Part 5: UI Component Checks ─────────────────────────\n");

  // Check the marketing-content-hub source for the Auto button
  const fs = await import("fs");
  const hubSource = fs.readFileSync(
    new URL("../app/components/marketing-content-hub.tsx", import.meta.url),
    "utf-8"
  );

  assert(hubSource.includes('"auto"'), "[hub] Has 'auto' language option");
  assert(hubSource.includes("تلقائي"), "[hub] Has Arabic label for Auto");
  assert(hubSource.includes("RTL_LANGUAGES"), "[hub] Has RTL language detection");
  assert(hubSource.includes('"he"'), "[hub] Includes Hebrew in RTL detection");
  assert(hubSource.includes('"fa"'), "[hub] Includes Farsi in RTL detection");
  assert(hubSource.includes('"ur"'), "[hub] Includes Urdu in RTL detection");
  assert(hubSource.includes("RTL_CHAR_RE"), "[hub] Has RTL character regex for auto-detection");

  // Check types
  const typesSource = fs.readFileSync(
    new URL("../lib/types.ts", import.meta.url),
    "utf-8"
  );
  assert(
    typesSource.includes('language: string') && !typesSource.includes('language: "ar" | "en"'),
    "[types] MarketingContentHub.language is string (not ar|en)"
  );

  // Check server action
  const actionsSource = fs.readFileSync(
    new URL("../app/actions-v2.ts", import.meta.url),
    "utf-8"
  );
  assert(
    actionsSource.includes('language: string') && !actionsSource.includes('language: "ar" | "en" = "ar"'),
    "[actions] generateMarketingContentAction accepts string language"
  );

  // Check create page
  const createSource = fs.readFileSync(
    new URL("../app/create/page.tsx", import.meta.url),
    "utf-8"
  );
  assert(
    createSource.includes('useState<string>("auto")'),
    "[create] Default marketing language is 'auto'"
  );
}

// ── Main Runner ───────────────────────────────────────────────────

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("  Language Detection — Full Test Suite");
  console.log("═".repeat(60));

  const startTime = Date.now();

  try {
    await runPromptTests();
    await runPromptsFileTests();
    await runConstantsTests();
    await runUIComponentTests();
  } catch (err) {
    console.error("\n💥 Unexpected error:", err.message, "\n", err.stack);
    failed++;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // ── Summary ───────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  RESULTS");
  console.log("═".repeat(60));
  console.log(`  Total:    ${passed + failed}`);
  console.log(`  Passed:   ${passed}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Duration: ${duration}s`);
  console.log("═".repeat(60));

  if (failed > 0) {
    console.log("\n  Failed tests:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => console.log(`    ❌ ${r.name}`));
  }

  console.log(`\n  ${failed === 0 ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
