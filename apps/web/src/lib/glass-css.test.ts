import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(dir, "../styles/app.css"), "utf8");
const nav = readFileSync(join(dir, "../components/mobile-glass-nav.tsx"), "utf8");
const theme = readFileSync(join(dir, "../components/theme-switch.tsx"), "utf8");

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `missing ${selector}`);
  const end = css.indexOf("\n}", start);
  assert.ok(end > start, `unclosed ${selector}`);
  return css.slice(start, end);
}

test("light glass tokens stay 26px / 1.05 via a custom property", () => {
  assert.match(css, /--glass-tint:\s*oklch\(0\.97 0\.01 85 \/ 0\.38\)/);
  assert.match(css, /--glass-blur:\s*26px;/);
  assert.match(css, /--glass-brightness:\s*1\.05;/);
  assert.match(css, /--glass-saturate:\s*1\.8;/);
});

test("dark glass is see-through 0.58 fill / 40px blur, shared by pill and FAB", () => {
  assert.match(css, /--glass-tint:\s*oklch\(0\.24 0\.012 45 \/ 0\.58\)/);
  assert.match(css, /--glass-tint-nav:\s*var\(--glass-tint\)/);
  assert.match(css, /--glass-blur:\s*40px;/);
  assert.match(css, /--glass-brightness:\s*0\.95;/);
  assert.match(css, /--glass-bubble:\s*oklch\(0\.18 0\.012 45 \/ 0\.82\)/);
  assert.doesNotMatch(css, /--glass-tint:\s*oklch\(0\.24 0\.012 45 \/ 0\.88\)/);
});

test("backdrop-filter lives on the host via --glass-backdrop, not a child plate", () => {
  for (const selector of [".glass-pill", ".glass-fab"]) {
    const body = block(selector);
    assert.match(body, /backdrop-filter:\s*var\(--glass-backdrop\)/);
    assert.match(body, /-webkit-backdrop-filter:\s*var\(--glass-backdrop\)/);
    assert.doesNotMatch(body, /isolation:\s*isolate/);
    assert.doesNotMatch(body, /backdrop-filter:\s*blur\(/);
  }
  assert.equal(css.includes(".glass-plate {"), false);
});

test("glass nav and theme chip do not mount SVG icon elements", () => {
  assert.doesNotMatch(nav, /lucide-react/);
  assert.doesNotMatch(nav, /<svg\b/);
  assert.match(nav, /GlassMaskIcon/);
  assert.doesNotMatch(theme, /HugeiconsIcon/);
  assert.doesNotMatch(theme, /<svg\b/);
  assert.match(theme, /GlassMaskIcon/);
});
