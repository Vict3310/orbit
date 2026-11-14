import { expect, test, type Page } from '@playwright/test';

async function enterMissionControl(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: /skip sequence & enter|enter mission control/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('critical health workflow reaches an explained alert and a report', async ({ page }) => {
  await enterMissionControl(page);
  await expect(page.getByRole('heading', { level: 1, name: /astronaut health intelligence/i })).toBeVisible();
  await expect(page.getByText('SIMULATED TELEMETRY').first()).toBeVisible();

  await page.getByRole('link', { name: 'Mission Simulator' }).first().click();
  await expect(page).toHaveURL(/\/simulation$/);
  await expect(page.getByRole('heading', { level: 1, name: /selene-4 habitat operations/i })).toBeVisible();

  // Scenario 01 is the fatigue scenario. Activate it, then advance past the
  // restricted sleep window so detection has consecutive hourly observations.
  await page.getByRole('button', { name: 'Activate scenario' }).first().click();
  await page.getByRole('button', { name: '+24 h' }).click();
  await page.getByRole('button', { name: '+6 h' }).click();

  await page.getByRole('link', { name: 'Alerts' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Health alerts' })).toBeVisible();
  await expect(page.getByText('Triggering evidence')).toBeVisible();
  await expect(page.getByText('Possible contributing factors')).toBeVisible();
  await expect(page.getByText(/not a clinical risk category/i)).toBeVisible();

  await page.getByRole('link', { name: 'Reports' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Health reports' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate report' }).click();
  await expect(page).toHaveURL(/\/reports\/.+/);
  await expect(page.getByText(/Educational prototype/i).first()).toBeVisible();
  await expect(page.getByText(/not intended for clinical decision-making/i).first()).toBeVisible();

  // The workspace autosave is debounced. After it settles, a reload must restore
  // the generated report from IndexedDB rather than returning an empty archive.
  await page.waitForTimeout(2000);
  await page.reload();
  await expect(page).toHaveURL(/\/reports\/.+/);
  await expect(page.getByText(/Educational prototype/i).first()).toBeVisible({ timeout: 15_000 });
});

test('mobile navigation remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterMissionControl(page);
  const mobileNav = page.getByRole('navigation', { name: 'Mobile primary navigation' });
  await expect(mobileNav).toBeVisible();
  await mobileNav.getByRole('link', { name: 'Crew' }).click();
  await expect(page).toHaveURL(/\/astronauts$/);
});
