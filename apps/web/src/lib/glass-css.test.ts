import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles/app.css"),
  "utf8",
);

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `missing ${selector}`);
  const end = css.indexOf("\n}", start);
  assert.ok(end > start, `unclosed ${selector}`);
  return css.slice(start, end);
}

test("glass tokens keep a 26px / 1.8 saturate backdrop via a custom property", () => {
  assert.match(css, /--glass-blur:\s*26px;/);
  assert.match(css, /--glass-saturate:\s*1\.8;/);
  assert.match(css, /--glass-brightness:\s*1\.05;/);
  assert.match(
    css,
    /--glass-backdrop:\s*blur\(var\(--glass-blur\)\)\s+saturate\(var\(--glass-saturate\)\)/,
  );
});

test("pill and FAB apply backdrop-filter through --glass-backdrop, not a literal that LightningCSS drops", () => {
  for (const selector of [".glass-pill", ".glass-pill-nav-mobile", ".glass-fab"]) {
    const body = block(selector);
    assert.match(body, /backdrop-filter:\s*var\(--glass-backdrop\)/);
    assert.match(body, /-webkit-backdrop-filter:\s*var\(--glass-backdrop\)/);
    assert.doesNotMatch(body, /backdrop-filter:\s*blur\(/);
    assert.doesNotMatch(body, /isolation:\s*isolate/);
  }
});

test("dark glass tint is opaque enough that 15px countdown type cannot survive 26px blur", () => {
  assert.match(css, /--glass-tint:\s*oklch\(0\.2 0\.012 45 \/ 0\.72\)/);
  assert.match(css, /--glass-tint-nav:\s*oklch\(0\.16 0\.01 45 \/ 0\.88\)/);
});
