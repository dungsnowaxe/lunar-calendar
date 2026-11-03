#!/usr/bin/env node
/** GPU-rasterized full + nav-2x shots of dark events-mid and dark home-mid. */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "../node_modules/playwright/index.mjs";

const URL = process.env.QA_URL || "http://127.0.0.1:4317";
const OUT = process.env.QA_OUT || "/opt/cursor/artifacts";
const GPU_ARGS = [
  "--enable-gpu",
  "--ignore-gpu-blocklist",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-gpu-rasterization",
  "--enable-accelerated-2d-canvas",
];
const COUNTDOWN = "09/01/2027";

async function open(browser, theme, path) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: theme,
    deviceScaleFactor: 2,
  });
  await context.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
  const page = await context.newPage();
  await page.goto(`${URL}${path}`, { waitUntil: "networkidle" });
  await page.locator('nav[aria-label="Điều hướng di động"]').waitFor({ state: "visible" });
  await page.addStyleTag({
    content: `.TanStackRouterDevtools, .tsrd { display: none !important; }`,
  });
  await page.waitForTimeout(1800);
  return { context, page };
}

async function scrollDate(page) {
  await page.evaluate((text) => {
    const article = [...document.querySelectorAll("article")].find((el) =>
      (el.textContent || "").includes(text),
    );
    const dateEl = [...(article?.querySelectorAll("p") ?? [])].find(
      (p) => (p.textContent || "").trim() === text,
    );
    const pill = document.querySelector("nav .glass-pill");
    const target = dateEl || article;
    if (!target || !pill) throw new Error("missing date or pill");
    const t = target.getBoundingClientRect();
    const p = pill.getBoundingClientRect();
    window.scrollBy(0, t.top + t.height / 2 - (p.top + p.height / 2));
  }, COUNTDOWN);
  await page.waitForTimeout(250);
}

async function scrollHomeMid(page) {
  await page.evaluate(() => {
    const row = [...document.querySelectorAll("[data-countdown-value]")].at(-1);
    const pill = document.querySelector("nav .glass-pill");
    if (!row || !pill) {
      window.scrollTo(0, 420);
      return;
    }
    const t = row.getBoundingClientRect();
    const p = pill.getBoundingClientRect();
    window.scrollBy(0, t.top + t.height / 2 - (p.top + p.height / 2));
  });
  await page.waitForTimeout(250);
}

async function shot(page, stem) {
  await page.screenshot({
    path: `${stem}.png`,
    type: "png",
    animations: "disabled",
  });
  await page.screenshot({
    path: `${stem}-nav-2x.png`,
    type: "png",
    clip: { x: 0, y: 592, width: 375, height: 220 },
    animations: "disabled",
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: GPU_ARGS });
  const events = await open(browser, "dark", "/su-kien");
  await scrollDate(events.page);
  await shot(events.page, `${OUT}/v7-375-dark-events-mid`);
  await events.context.close();

  const home = await open(browser, "dark", "/");
  await scrollHomeMid(home.page);
  await shot(home.page, `${OUT}/v7-375-dark-home-mid`);
  await home.context.close();

  await writeFile(
    `${OUT}/v7-reshoot-meta.json`,
    JSON.stringify({ compositor: "swiftshader-gpu-rasterization", url: URL }, null, 2),
  );
  await browser.close();
  console.log("RESHOOT_OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
