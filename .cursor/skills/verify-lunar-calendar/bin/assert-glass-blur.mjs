#!/usr/bin/env node
/**
 * Visual gate for glass blur.
 *
 * Default (synthetic): high-contrast overlay behind the pill/FAB.
 * QA_PROBE=countdown: live memorial countdown on /su-kien, contrast-
 * normalized Sobel. A clone overlay is not used — that missed the
 * "dimmed but sharp" failure when SVG descendants skipped the backdrop.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createClient } from "../../../../apps/web/node_modules/@supabase/supabase-js/dist/index.mjs";
import { chromium } from "../node_modules/playwright/index.mjs";

const URL = process.env.QA_URL || "http://127.0.0.1:4318";
const OUT = process.env.QA_OUT || "/opt/cursor/artifacts";
const MIN_RATIO = 5;
const MIN_CONTROL_SPAN = 60;
const MIN_OVERLAP_AREA = 400;
const FILTER_BY_THEME = {
  light: { filter: "blur(26px) saturate(1.8) brightness(1.05)", blur: "26px" },
  dark: { filter: "blur(40px) saturate(1.8) brightness(0.95)", blur: "40px" },
};
const PROBE = process.env.QA_PROBE === "countdown" ? "countdown" : "synthetic";
const COUNTDOWN = process.env.QA_COUNTDOWN || "09/01/2027";
const SETTLE_MS = Number(process.env.QA_SETTLE_MS || (PROBE === "countdown" ? 2500 : 400));
const THEMES = (process.env.QA_THEMES || "light,dark")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const PREFIX = "[verify-glass-v7]";

function percentile(values, p) {
  const arr = Array.from(values);
  arr.sort((a, b) => a - b);
  const i = Math.min(arr.length - 1, Math.max(0, Math.floor(p * (arr.length - 1))));
  return arr[i];
}

function contrastNormalize(gray) {
  const lo = percentile(gray, 0.05);
  const hi = percentile(gray, 0.95);
  const span = Math.max(hi - lo, 1);
  const out = new Float64Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.min(255, Math.max(0, ((gray[i] - lo) / span) * 255));
  }
  return out;
}

function sobelMean(gray, width, height) {
  let sum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx =
        -gray[i - width - 1] +
        gray[i - width + 1] -
        2 * gray[i - 1] +
        2 * gray[i + 1] -
        gray[i + width - 1] +
        gray[i + width + 1];
      const gy =
        -gray[i - width - 1] -
        2 * gray[i - width] -
        gray[i - width + 1] +
        gray[i + width - 1] +
        2 * gray[i + width] +
        gray[i + width + 1];
      sum += Math.hypot(gx, gy);
      count += 1;
    }
  }
  return sum / count;
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
  const normalized = contrastNormalize(gray);
  return {
    width: pixels.width,
    height: pixels.height,
    score: sobelMean(normalized, pixels.width, pixels.height),
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
    const before = getComputedStyle(el, "::before");
    const svgCount = el.querySelectorAll("svg").length;
    const out = { label, className: String(el.className).slice(0, 80), svgCount };
    for (const prop of BACKDROP_PROPS) out[prop] = cs.getPropertyValue(prop);
    out["::before-backdrop-filter"] = before.getPropertyValue("backdrop-filter");
    out["::before-content"] = before.content;
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
      .glass-nav-item, .glass-nav-bubble, .glass-refract-rim, .glass-mask-icon { visibility: hidden !important; }
      .glass-fab.is-fab-hidden { opacity: 1 !important; pointer-events: auto !important; translate: 0 !important; }
    `;
    document.head.appendChild(hide);
  });
}

async function paintLiveCountdown(page, needle) {
  await page.evaluate((text) => {
    const article = [...document.querySelectorAll("article")].find((el) =>
      (el.textContent || "").includes(text),
    );
    if (!article) throw new Error(`countdown article ${text} missing`);
    const dateEl = [...article.querySelectorAll("p")].find((p) =>
      (p.textContent || "").includes(text),
    );
    const daysEl = article.querySelector("[data-countdown-value]");
    if (!dateEl || !daysEl) throw new Error(`countdown ${text} missing`);
    article.style.backgroundImage =
      "repeating-linear-gradient(90deg, #000 0 6px, #fff 6px 12px)";
    article.style.backgroundColor = "#000";
    for (const el of article.querySelectorAll("h3, p, span, time")) {
      el.style.color = "#fff";
      el.style.background = "#000";
      el.style.textShadow = "none";
    }
    for (const el of [dateEl, daysEl]) {
      el.style.font = "700 18px/22px ui-monospace,SFMono-Regular,Menlo,monospace";
      el.style.letterSpacing = "0";
      el.style.padding = "2px 6px";
    }
  }, needle);
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

async function scrollCountdownBehindPill(page, needle) {
  const info = await page.evaluate((text) => {
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
    const t2 = target.getBoundingClientRect();
    const p2 = pill.getBoundingClientRect();
    const overlapX = Math.max(0, Math.min(t2.right, p2.right) - Math.max(t2.left, p2.left));
    const overlapY = Math.max(0, Math.min(t2.bottom, p2.bottom) - Math.max(t2.top, p2.top));
    return {
      overlapArea: overlapX * overlapY,
      dateRect: { x: t2.x, y: t2.y, w: t2.width, h: t2.height },
      pillRect: { x: p2.x, y: p2.y, w: p2.width, h: p2.height },
      scrollY: window.scrollY,
    };
  }, needle);
  if (info.overlapArea < MIN_OVERLAP_AREA) {
    throw new Error(`countdown does not overlap pill: ${JSON.stringify(info)}`);
  }
  await page.waitForTimeout(200);
  return info;
}

async function clipOf(page, selector) {
  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!(el instanceof HTMLElement)) return null;
    const r = el.getBoundingClientRect();
    const inset = sel.includes("glass-fab") ? 12 : 0;
    return {
      x: r.x + inset,
      y: r.y + inset,
      width: r.width - inset * 2,
      height: r.height - inset * 2,
    };
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

async function measureSynthetic(page, selector, label) {
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

async function liveProbeClip(page, selector, needle) {
  const clip = await page.evaluate(
    ({ sel, text }) => {
      const host = document.querySelector(sel);
      const article = [...document.querySelectorAll("article")].find((el) =>
        (el.textContent || "").includes(text),
      );
      const dateEl = [...(article?.querySelectorAll("p") ?? [])].find((p) =>
        (p.textContent || "").includes(text),
      );
      const daysEl = article?.querySelector("[data-countdown-value]");
      if (!(host instanceof HTMLElement) || !dateEl || !daysEl) return null;
      const hostBox = host.getBoundingClientRect();
      const a = dateEl.getBoundingClientRect();
      const b = daysEl.getBoundingClientRect();
      const textBox = {
        left: Math.min(a.left, b.left),
        top: Math.min(a.top, b.top),
        right: Math.max(a.right, b.right),
        bottom: Math.max(a.bottom, b.bottom),
      };
      const articleBox = article.getBoundingClientRect();
      const probe = sel.includes("glass-fab") ? articleBox : textBox;
      const x = Math.max(hostBox.left, probe.left);
      const y = Math.max(hostBox.top, probe.top);
      const right = Math.min(hostBox.right, probe.right);
      const bottom = Math.min(hostBox.bottom, probe.bottom);
      const inset = sel.includes("glass-fab") ? 12 : 0;
      const width = right - x - inset * 2;
      const height = bottom - y - inset * 2;
      const overlapArea = Math.max(0, width) * Math.max(0, height);
      return {
        overlapArea,
        clip:
          overlapArea >= 400
            ? {
                x: Math.max(0, x + inset),
                y: Math.max(0, y + inset),
                width: Math.min(375 - Math.max(0, x + inset), width),
                height,
              }
            : null,
        host: { x: hostBox.x, y: hostBox.y, w: hostBox.width, h: hostBox.height },
        probe: { x: probe.left, y: probe.top, w: probe.right - probe.left, h: probe.bottom - probe.top },
      };
    },
    { sel: selector, text: needle },
  );
  if (!clip?.clip) {
    throw new Error(`live probe does not overlap ${selector}: ${JSON.stringify(clip)}`);
  }
  return clip.clip;
}

async function setPlatesHidden(page, hidden) {
  await page.evaluate((hide) => {
    document.getElementById("glass-blur-probe-hide-material")?.remove();
    if (hide) {
      const style = document.createElement("style");
      style.id = "glass-blur-probe-hide-material";
      style.textContent = `
        .glass-pill, .glass-fab {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(style);
    }
    const fab = document.querySelector(".glass-fab");
    if (fab instanceof HTMLElement) {
      fab.style.opacity = "1";
      fab.style.translate = "0";
      fab.classList.remove("is-fab-hidden");
    }
  }, hidden);
  await page.waitForTimeout(80);
}

async function measureLive(page, selector, label, needle) {
  const clip = await liveProbeClip(page, selector, needle);
  await setPlatesHidden(page, false);
  const withPng = await page.screenshot({ type: "png", clip, animations: "disabled" });
  await setPlatesHidden(page, true);
  const withoutPng = await page.screenshot({ type: "png", clip, animations: "disabled" });
  await setPlatesHidden(page, false);
  const inside = await scorePng(page, withPng);
  const outside = await scorePng(page, withoutPng);
  const grayOutside = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    const gray = [];
    for (let i = 0; i < data.length; i += 4) {
      gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    gray.sort((a, b) => a - b);
    const p5 = gray[Math.floor(0.05 * (gray.length - 1))];
    const p95 = gray[Math.floor(0.95 * (gray.length - 1))];
    return { span: p95 - p5, p5, p95 };
  }, withoutPng.toString("base64"));
  if (grayOutside.span < MIN_CONTROL_SPAN) {
    throw new Error(
      `${label} without-glass contrast span ${grayOutside.span.toFixed(1)} < ${MIN_CONTROL_SPAN}; probe text is not in the clip`,
    );
  }
  const ratio = inside.score <= 0 ? Infinity : outside.score / inside.score;
  const stem = `${OUT}/v7-blur-gate-${label}`;
  await writeFile(`${stem}-inside.png`, withPng);
  await writeFile(`${stem}-outside.png`, withoutPng);
  return {
    label,
    insideClip: clip,
    outsideClip: clip,
    inside,
    outside,
    ratio,
    controlSpan: grayOutside.span,
  };
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
    await paintLiveCountdown(page, COUNTDOWN);
    await hideNavChrome(page);
  } else {
    await mountProbe(page);
  }
  await page.waitForTimeout(200);
  const pill =
    PROBE === "countdown"
      ? await measureLive(page, "nav .glass-pill", `${theme}-pill`, COUNTDOWN)
      : await measureSynthetic(page, "nav .glass-pill", `${theme}-pill`);
  const fab =
    PROBE === "countdown"
      ? await measureLive(page, ".glass-fab", `${theme}-fab`, COUNTDOWN)
      : await measureSynthetic(page, ".glass-fab", `${theme}-fab`);
  await context.close();
  return {
    theme,
    computed,
    pill,
    fab,
    probe: PROBE,
    countdown: PROBE === "countdown" ? COUNTDOWN : null,
  };
}

function assertGlass(computed, label, theme) {
  const expected = FILTER_BY_THEME[theme];
  if (!expected) throw new Error(`unknown theme ${theme}`);
  if (computed.svgCount > 0) {
    throw new Error(`${label} still has ${computed.svgCount} SVG descendant(s)`);
  }
  const got = computed["backdrop-filter"]?.replace(/\s+/g, " ").trim();
  if (got !== expected.filter) {
    throw new Error(`${label} backdrop-filter is ${JSON.stringify(got)}, expected ${expected.filter}`);
  }
  const before = computed["::before-backdrop-filter"]?.replace(/\s+/g, " ").trim();
  if (before && before !== "none") {
    throw new Error(`${label} ::before backdrop-filter is ${JSON.stringify(before)}, expected none`);
  }
  if (computed.isolation && computed.isolation !== "auto") {
    throw new Error(`${label} isolation is ${computed.isolation}, expected auto`);
  }
  if (computed["--glass-blur"] !== expected.blur) {
    throw new Error(`${label} --glass-blur is ${computed["--glass-blur"]}, expected ${expected.blur}`);
  }
}

function assertSharp(sample) {
  if (sample.ratio < MIN_RATIO) {
    throw new Error(
      `${sample.label} contrast-normalized Sobel ratio ${sample.ratio.toFixed(2)} < ${MIN_RATIO}× (without=${sample.outside.score.toFixed(2)} with=${sample.inside.score.toFixed(2)})`,
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
              hostBackdrop: report.computed.pill["backdrop-filter"],
              svgCount: report.computed.pill.svgCount,
              isolation: report.computed.pill.isolation,
              "--glass-backdrop": report.computed.pill["--glass-backdrop"],
            },
            fab: {
              hostBackdrop: report.computed.fab["backdrop-filter"],
              svgCount: report.computed.fab.svgCount,
              isolation: report.computed.fab.isolation,
              opacity: report.computed.fab.opacity,
            },
            ancestors: {
              pill: report.computed.pillAncestors,
              fab: report.computed.fabAncestors,
            },
            sharpness: {
              pill: {
                withGlass: report.pill.inside.score,
                withoutGlass: report.pill.outside.score,
                ratio: report.pill.ratio,
              },
              fab: {
                withGlass: report.fab.inside.score,
                withoutGlass: report.fab.outside.score,
                ratio: report.fab.ratio,
              },
            },
          },
          null,
          2,
        ),
      );
      assertGlass(report.computed.pill, `${theme} pill`, theme);
      assertGlass(report.computed.fab, `${theme} fab`, theme);
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
