#!/usr/bin/env node
/**
 * Drive the lunar month calendar feature against a launched instance.
 * Usage: node bin/drive-calendar.mjs [RUN_ID]
 *
 * Captures before/after screenshots + an ARIA dump under artifacts/<RUN_ID>/calendar/.
 * Does not mutate memorial events (read-only navigation).
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const skillDir = join(__dirname, '..')
const runsDir = join(skillDir, 'runs')

function loadRun(runIdArg) {
  let runId = runIdArg
  if (!runId) {
    const current = spawnSync('cat', [join(runsDir, 'CURRENT')], { encoding: 'utf8' })
    if (current.status !== 0) {
      throw new Error('No RUN_ID and no runs/CURRENT. Run bin/launch first.')
    }
    runId = current.stdout.trim()
  }
  const envPath = join(runsDir, runId, 'env.sh')
  const raw = spawnSync(
    'bash',
    ['-c', `set -a; source "${envPath}"; printf '%s\\n' "$URL" "$ARTIFACT_DIR" "$RUN_ID"`],
    { encoding: 'utf8' },
  )
  if (raw.status !== 0) {
    throw new Error(`Failed to load ${envPath}: ${raw.stderr}`)
  }
  const [url, artifactDir, runIdLoaded] = raw.stdout.trim().split('\n')
  return { url, artifactDir, runId: runIdLoaded }
}

async function main() {
  const { url, artifactDir, runId } = loadRun(process.argv[2])
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
    await page.getByRole('button', { name: 'Hôm nay' }).click()
    await page.waitForTimeout(300)
    log.push('STEP homnay')

    const titleToday = await page.locator('[data-slot="card-title"]').first().innerText()
    log.push(`title_after_homnay=${titleToday}`)
    if (!/^Tháng \d+ năm \d{4}$/.test(titleToday)) {
      throw new Error(`Unexpected month title after Hôm nay: "${titleToday}"`)
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
