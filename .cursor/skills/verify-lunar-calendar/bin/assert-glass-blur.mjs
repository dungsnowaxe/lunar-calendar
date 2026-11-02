#!/usr/bin/env node
/**
 * Visual gate: high-contrast probe text behind the glass pill/FAB must be at
 * least 5× less sharp inside the glass rect than the same text outside it.
 *
 * QA_PROBE=countdown scrolls the live memorial countdown behind the pill and
 * uses that text as the probe (same Laplacian method). Otherwise a synthetic
 * high-contrast overlay is injected.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createClient } from "../../../../apps/web/node_modules/@supabase/supabase-js/dist/index.mjs";
import { chromium } from "../node_modules/playwright/index.mjs";

const URL = process.env.QA_URL || "http://127.0.0.1:4318";
const OUT = process.env.QA_OUT || "/opt/cursor/artifacts";
const MIN_RATIO = 5;
const EXPECTED_FILTER = "blur(26px) saturate(1.8) brightness(1.05)";
const PROBE = process.env.QA_PROBE === "countdown" ? "countdown" : "synthetic";
const COUNTDOWN = process.env.QA_COUNTDOWN || "09/01/2027";
const SETTLE_MS = Number(process.env.QA_SETTLE_MS || (PROBE === "countdown" ? 2500 : 400));
const THEMES = (process.env.QA_THEMES || "light,dark")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const PREFIX = "[verify-glass-v7]";

function laplacianVariance(gray, width, height) {
  let count = 0;
  let sum = 0;
  let sumSq = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const response =
        gray[i - width] + gray[i - 1] + gray[i + 1] + gray[i + width] - 4 * gray[i];
      sum += response;
      sumSq += response * response;
      count += 1;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

async function scorePng(page, buf) {
  const pixels = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
    return { data: Array.from(data), width, height };
  }, buf.toString("base64"));
  const gray = new Float64Array(pixels.width * pixels.height);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * pixels.data[o] + 0.587 * pixels.data[o + 1] + 0.114 * pixels.data[o + 2];
  }
  return {
    width: pixels.width,
    height: pixels.height,
    score: laplacianVariance(gray, pixels.width, pixels.height),
  };
}

function inspectComputed() {
  const BACKDROP_PROPS = [
    "backdrop-filter",
    "-webkit-backdrop-filter",
    "isolation",
    "opacity",
    "filter",
    "background-color",
  ];
  function dump(el, label) {
    if (!(el instanceof HTMLElement)) return { label, missing: true };
    const cs = getComputedStyle(el);
    const out = { label, className: String(el.className).slice(0, 80) };
    for (const prop of BACKDROP_PROPS) out[prop] = cs.getPropertyValue(prop);
    out["--glass-blur"] = cs.getPropertyValue("--glass-blur").trim();
    out["--glass-saturate"] = cs.getPropertyValue("--glass-saturate").trim();
    out["--glass-brightness"] = cs.getPropertyValue("--glass-brightness").trim();
    out["--glass-backdrop"] = cs.getPropertyValue("--glass-backdrop").trim();
    out["--glass-tint"] = cs.getPropertyValue("--glass-tint").trim();
    return out;
  }
  function ancestorFlags(el) {
    const list = [];
    let node = el?.parentElement;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      const flags = [];
      if (Number(cs.opacity) < 1) flags.push(`opacity=${cs.opacity}`);
      if (cs.filter && cs.filter !== "none") flags.push(`filter=${cs.filter}`);
      if (cs.isolation === "isolate") flags.push("isolation=isolate");
      if (cs.mixBlendMode && cs.mixBlendMode !== "normal") flags.push(`blend=${cs.mixBlendMode}`);
      if (cs.willChange && cs.willChange !== "auto") flags.push(`will-change=${cs.willChange}`);
      if (cs.transform && cs.transform !== "none") flags.push(`transform=${cs.transform}`);
      if (cs.clipPath && cs.clipPath !== "none") flags.push(`clip-path=${cs.clipPath}`);
      const bf = cs.getPropertyValue("backdrop-filter");
      if (bf && bf !== "none") flags.push(`backdrop-filter=${bf}`);
      if (flags.length) {
        list.push({ el: `${node.tagName}.${String(node.className).slice(0, 60)}`, flags });
      }
      node = node.parentElement;
    }
    return list;
  }
  const pill =
    document.querySelector(".glass-pill-nav-mobile") || document.querySelector("nav .glass-pill");
  const fab = document.querySelector(".glass-fab");
  return {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    reducedTransparency: matchMedia("(prefers-reduced-transparency: reduce)").matches,
    supportsBackdrop: CSS.supports("backdrop-filter", "blur(1px)"),
    supportsWebkit: CSS.supports("-webkit-backdrop-filter", "blur(1px)"),
    pill: dump(pill, "pill"),
    fab: dump(fab, "fab"),
    pillAncestors: ancestorFlags(pill),
    fabAncestors: ancestorFlags(fab),
  };
}

function envGet(text, key) {
  const line = text
    .split(/\n/)
    .reverse()
    .find((row) => row.trim().startsWith(`${key}=`));
  if (!line) return "";
  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

async function seedCountdowns() {
  const envText = await readFile("/workspace/.dev.vars", "utf8").catch(async () =>
    readFile("/workspace/.env", "utf8"),
  );
  const supabase = createClient(
    envGet(envText, "SUPABASE_URL"),
    envGet(envText, "SUPABASE_ANON_KEY"),
  );
  const seeds = [
    { title: `${PREFIX} Giỗ ông nội`, lunar_day: 13, lunar_month: 10, notes: null },
    { title: `${PREFIX} Giỗ bà ngoại`, lunar_day: 13, lunar_month: 10, notes: null },
    { title: `${PREFIX} Giỗ ông ngoại`, lunar_day: 1, lunar_month: 1, notes: null },
    { title: `${PREFIX} Giỗ cha`, lunar_day: 10, lunar_month: 3, notes: null },
    { title: `${PREFIX} Giỗ mẹ`, lunar_day: 20, lunar_month: 7, notes: null },
    { title: `${PREFIX} Giỗ cô`, lunar_day: 5, lunar_month: 5, notes: null },
    { title: `${PREFIX} Giỗ chú`, lunar_day: 15, lunar_month: 8, notes: null },
    { title: `${PREFIX} Giỗ bác`, lunar_day: 2, lunar_month: 12, notes: null },
  ];
  const { data: inserted, error } = await supabase.from("memorial_events").insert(seeds).select("id");
  if (error) throw new Error(`seed insert failed: ${error.message}`);
  return {
    supabase,
    ids: inserted.map((row) => row.id),
  };
}

async function hideNavChrome(page) {
  await page.evaluate(() => {
    document.getElementById("glass-blur-probe-hide")?.remove();
    const hide = document.createElement("style");
    hide.id = "glass-blur-probe-hide";
    hide.textContent = `
      .glass-nav-item, .glass-nav-bubble, .glass-refract-rim, .glass-fab svg { visibility: hidden !important; }
      .glass-fab.is-fab-hidden { opacity: 1 !important; pointer-events: auto !important; translate: 0 !important; }
    `;
    document.head.appendChild(hide);
  });
}

async function mountProbe(page) {
  await page.evaluate(() => {
    document.getElementById("glass-blur-probe")?.remove();
    const probe = document.createElement("div");
    probe.id = "glass-blur-probe";
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = [
      "position:fixed",
      "left:0",
      "right:0",
      "bottom:0",
      "height:240px",
      "z-index:30",
      "pointer-events:none",
      "background:#fff",
      "color:#000",
      "font:900 18px/18px ui-monospace,SFMono-Regular,Menlo,monospace",
      "letter-spacing:0",
      "overflow:hidden",
      "padding:8px 10px",
      "white-space:normal",
      "word-break:break-all",
    ].join(";");
    probe.textContent = "HHIJ 13/10 AM 18 NGAY GIO CO ".repeat(200);
    document.body.appendChild(probe);
  });
  await hideNavChrome(page);
}

async function mountCountdownProbe(page, needle) {
  await page.evaluate((text) => {
    const article = [...document.querySelectorAll("article")].find((el) =>
      (el.textContent || "").includes(text),
    );
    const dateEl = [...(article?.querySelectorAll("p") ?? [])].find((p) =>
      (p.textContent || "").includes(text),
    );
    const daysEl = article?.querySelector("[data-countdown-value]");
    if (!dateEl || !daysEl) throw new Error(`countdown ${text} missing`);
    const dateText = dateEl.textContent?.trim() ?? text;
    const daysText = (daysEl.textContent || "").replace(/\s+/g, " ").trim();
    document.getElementById("glass-blur-probe")?.remove();
    const probe = document.createElement("div");
    probe.id = "glass-blur-probe";
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = [
      "position:fixed",
      "left:0",
      "right:0",
      "bottom:0",
      "height:240px",
      "z-index:30",
      "pointer-events:none",
      "background:var(--cream-elevated)",
      "color:var(--ink)",
      "overflow:hidden",
      "padding:8px 12px",
      "display:flex",
      "flex-wrap:wrap",
      "align-content:flex-start",
      "gap:8px 20px",
    ].join(";");
    const unit = `${dateText}  ${daysText}  `;
    for (let i = 0; i < 80; i++) {
      const date = document.createElement("span");
      date.style.cssText = "font:500 15px/22px ui-sans-serif,system-ui,sans-serif; font-variant-numeric:tabular-nums;";
      date.textContent = dateText;
      const days = document.createElement("span");
      days.style.cssText = "font:600 24px/24px ui-serif,Georgia,serif;";
      days.textContent = daysText;
      probe.append(date, days);
    }
    probe.dataset.unit = unit;
    document.body.appendChild(probe);
  }, needle);
  await hideNavChrome(page);
}

async function scrollCountdownBehindPill(page, needle) {
  await page.evaluate((text) => {
    const article = [...document.querySelectorAll("article")].find((el) =>
      (el.textContent || "").includes(text),
    );
    const pill = document.querySelector("nav .glass-pill");
    const target =
      [...(article?.querySelectorAll("p") ?? [])].find((p) => (p.textContent || "").includes(text)) ||
      article?.querySelector("[data-countdown-value]");
    if (!article || !pill || !target) throw new Error("missing countdown or pill");
    const t = target.getBoundingClientRect();
    const p = pill.getBoundingClientRect();
    window.scrollBy(0, t.top + t.height / 2 - (p.top + p.height / 2));
  }, needle);
  await page.waitForTimeout(200);
}

async function clipOf(page, selector) {
  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!(el instanceof HTMLElement)) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, selector);
  if (!box || box.width < 8 || box.height < 8) {
    throw new Error(`missing clip for ${selector}`);
  }
  return {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    width: Math.min(375 - Math.max(0, box.x), box.width),
    height: box.height,
  };
}

async function controlClip(page, sample) {
  return page.evaluate((box) => {
    const probe = document.getElementById("glass-blur-probe");
    if (!probe) throw new Error("probe missing");
    const p = probe.getBoundingClientRect();
    const width = Math.min(box.width, p.width - 24);
    const height = Math.min(box.height, 72);
    const x = p.x + 12;
    const y = p.y + 16;
    if (y + height > box.y - 4) {
      throw new Error("control clip overlaps sample");
    }
    return { x, y, width, height };
  }, sample);
}

async function measure(page, selector, label) {
  const insideClip = await clipOf(page, selector);
  const outsideClip = await controlClip(page, insideClip);
  const insidePng = await page.screenshot({ type: "png", clip: insideClip });
  const outsidePng = await page.screenshot({ type: "png", clip: outsideClip });
  const inside = await scorePng(page, insidePng);
  const outside = await scorePng(page, outsidePng);
  const ratio = inside.score <= 0 ? Infinity : outside.score / inside.score;
  const stem = `${OUT}/v7-blur-gate-${label}`;
  await writeFile(`${stem}-inside.png`, insidePng);
  await writeFile(`${stem}-outside.png`, outsidePng);
  return { label, insideClip, outsideClip, inside, outside, ratio };
}

async function runTheme(browser, theme) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: theme,
    deviceScaleFactor: 1,
    ...(PROBE === "countdown" ? { reducedMotion: "reduce" } : {}),
  });
  await context.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
  const page = await context.newPage();
  await page.goto(`${URL}/su-kien`, { waitUntil: "networkidle" });
  await page.locator('nav[aria-label="Điều hướng di động"]').waitFor({ state: "visible" });
  await page.waitForTimeout(SETTLE_MS);
  if (PROBE === "countdown") {
    await scrollCountdownBehindPill(page, COUNTDOWN);
    await page.waitForTimeout(200);
  }
  const computed = await page.evaluate(inspectComputed);
  if (PROBE === "countdown") {
    await mountCountdownProbe(page, COUNTDOWN);
  } else {
    await mountProbe(page);
  }
  await page.waitForTimeout(200);
  const pill = await measure(page, "nav .glass-pill", `${theme}-pill`);
  const fab = await measure(page, ".glass-fab", `${theme}-fab`);
  await context.close();
  return { theme, computed, pill, fab, probe: PROBE, countdown: PROBE === "countdown" ? COUNTDOWN : null };
}

function assertGlass(computed, label) {
  const got = computed["backdrop-filter"]?.replace(/\s+/g, " ").trim();
  if (got !== EXPECTED_FILTER) {
    throw new Error(
      `${label} computed backdrop-filter is ${JSON.stringify(got)}, expected ${EXPECTED_FILTER}`,
    );
  }
  if (computed.isolation && computed.isolation !== "auto") {
    throw new Error(`${label} isolation is ${computed.isolation}, expected auto`);
  }
  if (computed["--glass-blur"] !== "26px") {
    throw new Error(`${label} --glass-blur is ${computed["--glass-blur"]}`);
  }
}

function assertSharp(sample) {
  if (sample.ratio < MIN_RATIO) {
    throw new Error(
      `${sample.label} sharpness ratio ${sample.ratio.toFixed(2)} < ${MIN_RATIO}× (outside=${sample.outside.score.toFixed(2)} inside=${sample.inside.score.toFixed(2)})`,
    );
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const seeded = PROBE === "countdown" ? await seedCountdowns() : null;
  const browser = await chromium.launch({ headless: true });
  const reports = [];
  try {
    for (const theme of THEMES) {
      const report = await runTheme(browser, theme);
      reports.push(report);
      console.log(
        JSON.stringify(
          {
            theme,
            media: {
              reducedMotion: report.computed.reducedMotion,
              reducedTransparency: report.computed.reducedTransparency,
              supportsBackdrop: report.computed.supportsBackdrop,
              supportsWebkit: report.computed.supportsWebkit,
            },
            pill: {
              backdrop: report.computed.pill["backdrop-filter"],
              webkit: report.computed.pill["-webkit-backdrop-filter"],
              isolation: report.computed.pill.isolation,
              "--glass-backdrop": report.computed.pill["--glass-backdrop"],
            },
            fab: {
              backdrop: report.computed.fab["backdrop-filter"],
              webkit: report.computed.fab["-webkit-backdrop-filter"],
              isolation: report.computed.fab.isolation,
              opacity: report.computed.fab.opacity,
            },
            ancestors: {
              pill: report.computed.pillAncestors,
              fab: report.computed.fabAncestors,
            },
            sharpness: {
              pill: {
                inside: report.pill.inside.score,
                outside: report.pill.outside.score,
                ratio: report.pill.ratio,
              },
              fab: {
                inside: report.fab.inside.score,
                outside: report.fab.outside.score,
                ratio: report.fab.ratio,
              },
            },
          },
          null,
          2,
        ),
      );
      assertGlass(report.computed.pill, `${theme} pill`);
      assertGlass(report.computed.fab, `${theme} fab`);
      assertSharp(report.pill);
      assertSharp(report.fab);
    }
  } finally {
    await browser.close();
    if (seeded) await seeded.supabase.from("memorial_events").delete().in("id", seeded.ids);
  }
  await writeFile(`${OUT}/v7-glass-blur-gate.json`, JSON.stringify(reports, null, 2));
  console.log("GLASS_BLUR_GATE_OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
