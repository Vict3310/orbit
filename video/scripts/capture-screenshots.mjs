/**
 * Captures real ORBIT screens for the launch film and judging deck.
 * Requires the app at http://127.0.0.1:5199 and an installed Chromium.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.ORBIT_URL ?? 'http://127.0.0.1:5199';
const OUTPUT = path.resolve('../client/public/presentation');

fs.mkdirSync(OUTPUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chromium' });
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});

async function shot(name) {
  const target = path.join(OUTPUT, `${name}.png`);
  await page.screenshot({ path: target, animations: 'disabled' });
  console.log(`captured ${target}`);
}

await page.goto(BASE, { waitUntil: 'networkidle' });
await page
  .getByRole('button', { name: /skip sequence & enter|enter mission control/i })
  .first()
  .click();
await page.waitForURL(/\/dashboard$/);
await page.waitForTimeout(900);
await shot('dashboard');

await page.getByRole('link', { name: 'Mission Simulator' }).first().click();
await page.waitForURL(/\/simulation$/);
await page.getByRole('button', { name: 'Activate scenario' }).first().click();
await page.getByRole('button', { name: '+24 h' }).click();
await page.getByRole('button', { name: '+6 h' }).click();
await page.waitForTimeout(700);
await page
  .getByLabel('Dismiss alert notification')
  .click()
  .catch(() => undefined);
await page.waitForTimeout(500);
await shot('simulation');

await page.getByRole('link', { name: 'Alerts' }).first().click();
await page.waitForURL(/\/alerts/);
await page.waitForTimeout(500);
await shot('alerts');

await page.getByRole('link', { name: 'Reports' }).first().click();
await page.waitForURL(/\/reports$/);
await page.getByRole('button', { name: 'Generate report' }).click();
await page.waitForURL(/\/reports\/.+/);
await page.waitForTimeout(800);
await shot('report');

await page.getByRole('link', { name: 'Assessments' }).first().click();
await page.waitForURL(/\/assessments$/);
await page.waitForTimeout(500);
await shot('assessments');

await page.getByRole('link', { name: 'Research' }).first().click();
await page.waitForURL(/\/research$/);
await page.waitForTimeout(500);
await shot('research');

await browser.close();
console.log('screenshots complete');
