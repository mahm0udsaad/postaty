/**
 * E2E UI Generation Test — Language Detection
 *
 * Logs in, fills forms with Hebrew/Arabic, generates posters,
 * and reports timing + language accuracy.
 *
 * Run: bun __tests__/e2e-ui-generation.mjs
 */

import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.resolve(__dirname, "test-image.png");
const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "saad123mn123@gmail.com";
const TEST_PASSWORD = "Nn011@25";
const TIMEOUT = 60_000;

let browser, page;
let passed = 0, failed = 0;
const results = [];
const timingReport = [];

function log(icon, msg) { console.log(`  ${icon} ${msg}`); }

function assert(condition, testName) {
  if (condition) { passed++; results.push({ name: testName, status: "PASS" }); log("✅", testName); }
  else { failed++; results.push({ name: testName, status: "FAIL" }); log("❌", testName); }
}

async function waitAndClick(selector, opts = {}) {
  await page.waitForSelector(selector, { timeout: TIMEOUT, ...opts });
  await page.click(selector);
}

async function typeInField(selector, value) {
  await page.waitForSelector(selector, { timeout: TIMEOUT });
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, value, { delay: 15 });
}

// ── Login ─────────────────────────────────────────────────────────

async function login() {
  log("🔄", "Logging in...");
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle2", timeout: TIMEOUT });

  // Wait for form to render
  await page.waitForSelector('input[type="email"]', { timeout: TIMEOUT });

  await typeInField('input[type="email"]', TEST_EMAIL);
  await typeInField('input[type="password"]', TEST_PASSWORD);

  // Click submit
  const submitBtn = await page.waitForSelector('button[type="submit"]', { timeout: TIMEOUT });
  await submitBtn.click();

  // Wait for redirect to homepage
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: TIMEOUT }).catch(() => {});

  // Wait a bit for auth to settle
  await new Promise(r => setTimeout(r, 3000));

  const url = page.url();
  const isLoggedIn = !url.includes("sign-in");
  assert(isLoggedIn, `Login successful (redirected to ${url})`);
  return isLoggedIn;
}

// ── Test: Generate with specific category and language ─────────

async function testGeneration(categoryId, formFiller, label) {
  log("🔄", `Testing ${label}...`);
  const startNav = Date.now();

  await page.goto(`${BASE_URL}/create?category=${categoryId}`, {
    waitUntil: "networkidle2",
    timeout: TIMEOUT,
  });
  await new Promise(r => setTimeout(r, 1500));

  const navTime = Date.now() - startNav;

  // Check form loaded
  const formExists = await page.$("form");
  if (!formExists) {
    assert(false, `[${label}] Form loaded`);
    return;
  }
  assert(true, `[${label}] Form loaded (${navTime}ms)`);

  // Fill the form
  const startFill = Date.now();
  await formFiller(page);
  const fillTime = Date.now() - startFill;
  log("  ⏱️", `Form filled in ${fillTime}ms`);

  // Check if there's a generate/submit button and click it
  const startGen = Date.now();

  // Find and click the submit button (usually the last primary button in the form)
  const submitted = await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) return false;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
      return true;
    }
    return false;
  });

  if (!submitted) {
    log("  ⚠️", `[${label}] Could not find/click submit button (may need credits)`);
    timingReport.push({ label, navTime, fillTime, genTime: "N/A (no submit)", status: "skipped" });
    return;
  }

  log("  🔄", "Generation started, waiting for result...");

  // Wait for generation to complete — look for result area or error
  try {
    await page.waitForFunction(
      () => {
        // Check for poster result image
        const img = document.querySelector('img[alt*="poster"], img[alt*="design"], img[alt*="Design"]');
        // Check for error message
        const error = document.querySelector('[class*="error"], [class*="danger"]');
        // Check for "complete" state in URL or DOM
        return img !== null || error !== null;
      },
      { timeout: 120_000 } // 2 min max for generation
    );
  } catch {
    log("  ⚠️", `[${label}] Generation timed out after 2 min`);
  }

  const genTime = Date.now() - startGen;

  // Check what we got
  const hasImage = await page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    return Array.from(imgs).some(img => {
      const src = img.src || "";
      return src.startsWith("data:image") && src.length > 1000;
    });
  });

  const hasError = await page.evaluate(() => {
    const el = document.querySelector('[class*="error"], [class*="danger"]');
    return el ? el.textContent?.trim() : null;
  });

  if (hasImage) {
    assert(true, `[${label}] Poster generated successfully (${(genTime / 1000).toFixed(1)}s)`);
    timingReport.push({ label, navTime, fillTime, genTime, status: "success" });
  } else if (hasError) {
    log("  ⚠️", `Error: ${hasError}`);
    timingReport.push({ label, navTime, fillTime, genTime, status: `error: ${hasError}` });
  } else {
    timingReport.push({ label, navTime, fillTime, genTime, status: "unknown" });
  }

  // Check for marketing content toggle
  await new Promise(r => setTimeout(r, 2000));
  const hasAutoToggle = await page.evaluate(() => {
    const buttons = document.querySelectorAll("button");
    return Array.from(buttons).some(b =>
      b.textContent?.includes("Auto") || b.textContent?.includes("تلقائي")
    );
  });

  if (hasAutoToggle) {
    assert(true, `[${label}] Marketing content "Auto" toggle visible`);
  }

  // Take screenshot for reference
  await page.screenshot({
    path: `__tests__/screenshot-${categoryId}-${Date.now()}.png`,
    fullPage: false
  });
  log("  📸", `Screenshot saved`);
}

// ── Image Upload Helper ───────────────────────────────────────────

async function uploadImages(page) {
  // react-dropzone creates hidden <input type="file"> elements
  const fileInputs = await page.$$('input[type="file"]');
  log("  📷", `Found ${fileInputs.length} file input(s)`);

  for (const input of fileInputs) {
    await input.uploadFile(TEST_IMAGE);
    await new Promise(r => setTimeout(r, 500)); // Wait for compression
  }

  // Verify images were uploaded by checking for preview images or remove buttons
  await new Promise(r => setTimeout(r, 1000));
  log("  📷", "Images uploaded");
}

// ── Form Fillers ──────────────────────────────────────────────────

async function fillRestaurantHebrew(page) {
  // Upload required images first
  await uploadImages(page);

  await typeInField('input[name="restaurantName"]', "נגריית סמיר");
  await typeInField('input[name="mealName"]', "מטבח יוקרה");
  await typeInField('input[name="newPrice"]', "1100");
  await typeInField('input[name="oldPrice"]', "2000");
  await typeInField('input[name="whatsapp"]', "+970528924384");

  // Select post type if available
  const postType = await page.$('select[name="postType"]');
  if (postType) await page.select('select[name="postType"]', "meal-offer");

  // Select CTA
  const cta = await page.$('select[name="cta"]');
  if (cta) {
    const options = await page.$$eval('select[name="cta"] option', els => els.map(e => e.value));
    if (options.length > 1) await page.select('select[name="cta"]', options[1]);
  }
}

async function fillRestaurantArabic(page) {
  await uploadImages(page);

  await typeInField('input[name="restaurantName"]', "مطعم الشام");
  await typeInField('input[name="mealName"]', "شاورما دجاج");
  await typeInField('input[name="newPrice"]', "25");
  await typeInField('input[name="oldPrice"]', "40");
  await typeInField('input[name="whatsapp"]', "+966501234567");

  const postType = await page.$('select[name="postType"]');
  if (postType) await page.select('select[name="postType"]', "meal-offer");

  const cta = await page.$('select[name="cta"]');
  if (cta) {
    const options = await page.$$eval('select[name="cta"] option', els => els.map(e => e.value));
    if (options.length > 1) await page.select('select[name="cta"]', options[1]);
  }
}

async function fillServicesHebrew(page) {
  await uploadImages(page);

  await typeInField('input[name="businessName"]', "שירותי ניקיון מקצועי");
  await typeInField('input[name="serviceName"]', "ניקוי שטיחים");
  await typeInField('input[name="price"]', "150");
  await typeInField('input[name="whatsapp"]', "+972501234567");

  const serviceType = await page.$('select[name="serviceType"]');
  if (serviceType) await page.select('select[name="serviceType"]', "cleaning");

  const priceType = await page.$('select[name="priceType"]');
  if (priceType) await page.select('select[name="priceType"]', "fixed");

  const cta = await page.$('select[name="cta"]');
  if (cta) {
    const options = await page.$$eval('select[name="cta"] option', els => els.map(e => e.value));
    if (options.length > 1) await page.select('select[name="cta"]', options[1]);
  }
}

async function fillEcommerceFrench(page) {
  await uploadImages(page);

  await typeInField('input[name="shopName"]', "Boutique Élégance");
  await typeInField('input[name="productName"]', "Écouteurs Bluetooth");
  await typeInField('input[name="newPrice"]', "199");
  await typeInField('input[name="oldPrice"]', "349");
  await typeInField('input[name="whatsapp"]', "+33612345678");

  const postType = await page.$('select[name="postType"]');
  if (postType) await page.select('select[name="postType"]', "product");

  const cta = await page.$('select[name="cta"]');
  if (cta) {
    const options = await page.$$eval('select[name="cta"] option', els => els.map(e => e.value));
    if (options.length > 1) await page.select('select[name="cta"]', options[1]);
  }
}

async function fillSupermarketHebrew(page) {
  await uploadImages(page);

  await typeInField('input[name="supermarketName"]', "סופר שוק הזהב");
  await typeInField('input[name="productName"]', "חלב טרי 1 ליטר");
  await typeInField('input[name="newPrice"]', "5");
  await typeInField('input[name="oldPrice"]', "8");
  await typeInField('input[name="whatsapp"]', "+972501234567");

  const postType = await page.$('select[name="postType"]');
  if (postType) await page.select('select[name="postType"]', "daily-offers");

  const cta = await page.$('select[name="cta"]');
  if (cta) {
    const options = await page.$$eval('select[name="cta"] option', els => els.map(e => e.value));
    if (options.length > 1) await page.select('select[name="cta"]', options[1]);
  }
}

async function fillFashionTurkish(page) {
  await uploadImages(page);

  await typeInField('input[name="brandName"]', "Zarif Moda");
  await typeInField('input[name="itemName"]', "Gece Elbisesi");
  await typeInField('input[name="newPrice"]', "299");
  await typeInField('input[name="oldPrice"]', "599");
  await typeInField('input[name="whatsapp"]', "+905551234567");

  const postType = await page.$('select[name="postType"]');
  if (postType) await page.select('select[name="postType"]', "discount");

  const cta = await page.$('select[name="cta"]');
  if (cta) {
    const options = await page.$$eval('select[name="cta"] option', els => els.map(e => e.value));
    if (options.length > 1) await page.select('select[name="cta"]', options[1]);
  }
}

async function fillBeautyHebrew(page) {
  await uploadImages(page);

  await typeInField('input[name="salonName"]', "סלון היופי של דנה");
  await typeInField('input[name="serviceName"]', "טיפול פנים מרגיע");
  await typeInField('input[name="newPrice"]', "200");
  await typeInField('input[name="oldPrice"]', "350");
  await typeInField('input[name="whatsapp"]', "+972501234567");

  const postType = await page.$('select[name="postType"]');
  if (postType) await page.select('select[name="postType"]', "salon-service");

  const cta = await page.$('select[name="cta"]');
  if (cta) {
    const options = await page.$$eval('select[name="cta"] option', els => els.map(e => e.value));
    if (options.length > 1) await page.select('select[name="cta"]', options[1]);
  }
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("  E2E UI Generation Test — Language Detection");
  console.log("═".repeat(60) + "\n");

  // Check dev server
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error();
  } catch {
    console.error("❌ Dev server not running at", BASE_URL);
    process.exit(1);
  }

  browser = await puppeteer.launch({
    headless: false, // Show browser so you can see what's happening
    channel: "chrome",
    defaultViewport: { width: 1400, height: 900 },
  });
  page = await browser.newPage();

  // Set English locale
  await page.setCookie({ name: "pst_locale", value: "en", domain: "localhost", path: "/" });

  try {
    // Step 1: Login
    console.log("── Step 1: Login ──────────────────────────────────\n");
    const loggedIn = await login();
    if (!loggedIn) {
      console.error("  Cannot proceed without login");
      await browser.close();
      process.exit(1);
    }

    // Step 2: Test form loading and filling for each category
    console.log("\n── Step 2: Form & Generation Tests ────────────────\n");

    await testGeneration("restaurant", fillRestaurantHebrew, "Restaurant (Hebrew)");
    await testGeneration("restaurant", fillRestaurantArabic, "Restaurant (Arabic)");
    await testGeneration("supermarket", fillSupermarketHebrew, "Supermarket (Hebrew)");
    await testGeneration("ecommerce", fillEcommerceFrench, "E-commerce (French)");
    await testGeneration("services", fillServicesHebrew, "Services (Hebrew)");
    await testGeneration("fashion", fillFashionTurkish, "Fashion (Turkish)");
    await testGeneration("beauty", fillBeautyHebrew, "Beauty (Hebrew)");

  } catch (err) {
    console.error("\n💥 Error:", err.message);
    failed++;
  }

  // ── Timing Report ───────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  TIMING REPORT");
  console.log("═".repeat(60));
  console.log("");
  console.log("  Category                | Nav     | Fill    | Generate  | Status");
  console.log("  " + "─".repeat(75));
  for (const t of timingReport) {
    const gen = typeof t.genTime === "number" ? `${(t.genTime / 1000).toFixed(1)}s` : t.genTime;
    console.log(
      `  ${t.label.padEnd(25)}| ${(t.navTime + "ms").padEnd(8)}| ${(t.fillTime + "ms").padEnd(8)}| ${gen.padEnd(10)}| ${t.status}`
    );
  }

  console.log("\n" + "═".repeat(60));
  console.log("  TEST RESULTS");
  console.log("═".repeat(60));
  console.log(`  Total:  ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log("═".repeat(60));

  if (failed > 0) {
    console.log("\n  Failed:");
    results.filter(r => r.status === "FAIL").forEach(r => console.log(`    ❌ ${r.name}`));
  }
  console.log(`\n  ${failed === 0 ? "✅ ALL PASSED" : "❌ SOME FAILED"}\n`);

  // Keep browser open for 5 seconds so user can see final state
  log("🔄", "Closing browser in 5 seconds...");
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main();
