#!/usr/bin/env node
/**
 * Drive the lunar month calendar feature against a launched instance.
 * Usage: node bin/drive-calendar.mjs [RUN_ID]
 *
 * Captures before/after screenshots + an ARIA dump under artifacts/<RUN_ID>/calendar/.
 * Does not mutate memorial events (read-only navigation).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const skillDir = join(__dirname, '..')
const runsDir = join(skillDir, 'runs')
const RUN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/

function assertRunId(runId) {
  if (!RUN_ID_RE.test(runId)) {
    throw new Error(
      `Invalid RUN_ID '${runId}'. Use 1-64 chars of [A-Za-z0-9._-], starting with alphanumeric.`,
    )
  }
}

/** Parse env.sh written with `printf 'export KEY=%q\\n'`. */
function parseEnvSh(text) {
  const env = {}
  for (const line of text.split(/\n/)) {
    const match = line.match(/^export ([A-Z_]+)=(.*)$/)
    if (!match) continue
    const [, key, raw] = match
    env[key] = decodeShellPrintfQ(raw)
  }
  return env
}

function decodeShellPrintfQ(raw) {
  // bash printf %q for simple values is often $'...' or '...' or unquoted.
  if (raw.startsWith("$'")) {
    let out = ''
    for (let i = 2; i < raw.length; i++) {
      const ch = raw[i]
      if (ch === "'" && raw[i - 1] !== '\\') break
      if (ch === '\\') {
        const next = raw[++i]
        const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'" }
        out += map[next] ?? next
        continue
      }
      out += ch
    }
    return out
  }
  if (
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
  ) {
    return raw.slice(1, -1)
  }
  // Unquoted printf %q output (e.g. \[verify-id\]).
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\' && i + 1 < raw.length) {
      out += raw[++i]
      continue
    }
    out += raw[i]
  }
  return out
}

async function loadRun(runIdArg) {
  let runId = runIdArg
  if (!runId) {
    const current = (await readFile(join(runsDir, 'CURRENT'), 'utf8')).trim()
    runId = current
  }
  assertRunId(runId)

  const envPath = join(runsDir, runId, 'env.sh')
  const text = await readFile(envPath, 'utf8')
  const env = parseEnvSh(text)
  if (!env.URL || !env.ARTIFACT_DIR || !env.RUN_ID) {
    throw new Error(`Incomplete env.sh at ${envPath}`)
  }
  assertRunId(env.RUN_ID)
  return { url: env.URL, artifactDir: env.ARTIFACT_DIR, runId: env.RUN_ID }
}

async function main() {
  const { url, artifactDir, runId } = await loadRun(process.argv[2])
  const outDir = join(artifactDir, 'calendar')
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const log = []

  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: 'Lịch Âm' }).waitFor()
    log.push('STEP goto-home')

    await page.screenshot({ path: join(outDir, '01-home-before.png'), fullPage: true })

    const titleBefore = await page.locator('[data-slot="card-title"]').first().innerText()
    log.push(`title_before=${titleBefore}`)

    await page.getByRole('button', { name: 'Tháng sau' }).click()
    await page.waitForTimeout(300)
    log.push('STEP next-month')

    const titleAfterNext = await page.locator('[data-slot="card-title"]').first().innerText()
    log.push(`title_after_next=${titleAfterNext}`)
    if (titleAfterNext === titleBefore) {
      throw new Error(`Expected month title to change after next; still "${titleBefore}"`)
    }

    await page.screenshot({ path: join(outDir, '02-after-next-month.png'), fullPage: true })

    await page.getByRole('button', { name: 'Tháng trước' }).click()
    await page.waitForTimeout(300)
    log.push('STEP prev-month')

    const titleAfterPrev = await page.locator('[data-slot="card-title"]').first().innerText()
    log.push(`title_after_prev=${titleAfterPrev}`)
    if (titleAfterPrev !== titleBefore) {
      throw new Error(
        `Expected month title to restore to "${titleBefore}" after prev; got "${titleAfterPrev}"`,
      )
    }

    await page.getByRole('button', { name: 'Tháng sau' }).click()
    await page.getByRole('button', { name: 'Tháng sau' }).click()
    const titleAway = await page.locator('[data-slot="card-title"]').first().innerText()
    log.push(`title_away=${titleAway}`)
    if (titleAway === titleBefore) {
      throw new Error('Expected to be two months away before clicking Hôm nay')
    }

    await page.getByRole('button', { name: 'Hôm nay' }).click()
    await page.waitForTimeout(300)
    log.push('STEP homnay')

    const titleToday = await page.locator('[data-slot="card-title"]').first().innerText()
    log.push(`title_after_homnay=${titleToday}`)
    if (titleToday !== titleBefore) {
      throw new Error(
        `Expected Hôm nay to restore month "${titleBefore}"; got "${titleToday}"`,
      )
    }

    const detail = await page.locator('text=Âm lịch:').first().innerText()
    log.push(`selected_detail=${detail}`)

    await page.screenshot({ path: join(outDir, '03-after-homnay.png'), fullPage: true })

    const aria = await page.locator('body').ariaSnapshot()
    await writeFile(join(outDir, 'aria.yml'), `${aria}\n`)
    await writeFile(join(outDir, 'drive.log'), `${log.join('\n')}\n`)

    console.log(`drive-calendar: PASSED (RUN_ID=${runId})`)
    console.log(`artifacts: ${outDir}`)
    for (const line of log) console.log(`  ${line}`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(`drive-calendar: FAILED: ${err.message}`)
  process.exit(1)
})
