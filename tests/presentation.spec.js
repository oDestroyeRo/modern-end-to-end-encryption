import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

test('navigates all slides, deep links, and browser history', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy is a group effort.');
  await page.getByRole('button', { name: 'Let’s start' }).click();
  await expect(page).toHaveURL(/#slide=2$/);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Who holds the keys?');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#slide=3$/);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Who holds the keys?');
  await page.keyboard.press('End');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Private by design. Built for the group.');
  await expect(page.getByRole('button', { name: 'Next slide', exact: true })).toBeDisabled();
  await page.keyboard.press('Home');
  await expect(page.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
  for (let slide = 1; slide <= 13; slide++) {
    await page.goto(`/#slide=${slide}`);
    await expect(page.locator('#slide-title')).toBeVisible();
    await expect(page.locator('#counter')).toHaveText(`${String(slide).padStart(2, '0')} / 13`);
  }
  expect(errors).toEqual([]);
});

test('compares encryption boundaries and supports arrow keys inside tabs', async ({ page }) => {
  await page.goto('/#slide=2');
  await expect(page.getByText('Can read content', { exact: true })).toBeVisible();
  const tls = page.getByRole('tab', { name: 'Transport / TLS' });
  await tls.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'End-to-end / E2EE' })).toBeFocused();
  await expect(page.getByText('Sees ciphertext', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#slide=2$/);
  await page.keyboard.press('ArrowLeft');
  await expect(tls).toBeFocused();
  await expect(page.getByText('Can read content', { exact: true })).toBeVisible();
});

test('explores history, scaling, and the selected tree path', async ({ page }) => {
  await page.goto('/#slide=3');
  await page.getByRole('tab', { name: '2023 MLS' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('July 2023');
  await page.getByRole('tab', { name: '2025 Architecture' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('April 2025');
  await page.goto('/#slide=4');
  await page.getByRole('tab', { name: 'Explore update costs' }).click();
  const range = page.getByRole('slider');
  await range.fill('10');
  await expect(page.locator('#group-size')).toHaveText('1,024');
  await expect(page.locator('#scale-counts')).toContainText('1,023');
  await expect(page.locator('#scale-counts')).toContainText('10');
  await range.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#group-size')).toHaveText('512');
  await expect(page).toHaveURL(/#slide=4$/);
  await page.goto('/#slide=6');
  await page.getByRole('button', { name: 'Hana', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hana', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tree-reading')).toContainText('Hana');
  await expect(page.locator('#tree-diagram svg')).toHaveAttribute('aria-label', /Hana's update/);
});

test('switches group comparisons, preserves group size, and scrolls without changing slides', async ({ page }) => {
  await page.goto('/#slide=4');
  const compare = page.getByRole('tab', { name: 'Compare approaches' });
  const costs = page.getByRole('tab', { name: 'Explore update costs' });
  await expect(compare).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('table')).toBeVisible();
  await costs.click();
  await page.getByRole('slider').fill('8');
  await costs.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(compare).toBeFocused();
  await expect(page.getByRole('table')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(costs).toBeFocused();
  await expect(page.getByRole('slider')).toHaveValue('8');
  await expect(page.locator('#group-size')).toHaveText('256');
  await compare.click();
  await page.setViewportSize({ width: 390, height: 844 });
  const comparison = page.getByRole('region', { name: 'Group protocol comparison, horizontally scrollable' });
  await comparison.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => comparison.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await expect(page).toHaveURL(/#slide=4$/);
});

test('applies membership only on commit and catches an offline client up', async ({ page }) => {
  await page.goto('/#slide=7');
  const lab = page.locator('#lab-content');
  await expect(lab.getByText('Epoch 0', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Commit change' })).toBeDisabled();
  await page.getByRole('button', { name: 'Add Dana', exact: true }).click();
  await expect(lab.getByText('3 active devices', { exact: true })).toBeVisible();
  await expect(lab.getByText('Dana', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Commit change' }).click();
  await expect(lab.getByText('Epoch 1', { exact: true })).toBeVisible();
  await expect(lab.getByText('4 active devices', { exact: true })).toBeVisible();
  await expect(lab.getByText('Dana', { exact: true })).toBeVisible();
  await expect(page.getByRole('log')).toContainText('Earlier history is not included');
  await expect(page.getByRole('button', { name: 'Add Dana', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Take Chen offline' }).click();
  await page.getByRole('button', { name: 'Update Alice' }).click();
  await page.getByRole('button', { name: 'Commit change' }).click();
  await page.getByRole('button', { name: 'Remove Bob', exact: true }).click();
  await page.getByRole('button', { name: 'Commit change' }).click();
  await expect(lab.getByText('Epoch 3', { exact: true })).toBeVisible();
  await expect(lab.getByText('Removed · old content retained')).toBeVisible();
  await page.getByRole('button', { name: 'Send a message from Alice' }).click();
  await expect(page.getByRole('log')).toContainText('Bob cannot decrypt');
  await expect(page.getByRole('log')).toContainText('Chen’s delivery waits');
  await page.getByRole('button', { name: 'Reconnect Chen' }).click();
  await expect(lab.getByText('Needs 2 Commits')).toBeVisible();
  await page.getByRole('button', { name: 'Catch up Chen' }).click();
  await expect(page.getByRole('log')).toContainText('Chen processes 2 queued Commits');
  await page.getByRole('button', { name: 'Send a message from Alice' }).click();
  await expect(page.getByRole('log')).toContainText('readable by Alice, Chen, Dana');
  await page.getByRole('button', { name: 'Reset lab' }).click();
  await expect(lab.getByText('Epoch 0', { exact: true })).toBeVisible();
  await expect(lab.getByText('Dana', { exact: true })).toHaveCount(0);
});

test('shows compromise, conditional recovery, and reset', async ({ page }) => {
  await page.goto('/#slide=8');
  await expect(page.getByRole('button', { name: 'Recover + update' })).toBeDisabled();
  await page.getByRole('button', { name: 'Expose Alice’s state' }).click();
  await expect(page.getByText('Exposed to the attacker', { exact: true })).toBeVisible();
  await expect(page.getByText('Vulnerable until a healing update', { exact: true })).toBeVisible();
  await expect(page.getByText('Protected if old secrets were erased', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recover + update' }).click();
  await expect(page.getByText('Protected after recovery', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Expose Alice’s state' })).toBeEnabled();
});

test('walks through the lifecycle, library API map, and integration details', async ({ page }) => {
  await page.goto('/#slide=9');
  await page.getByRole('tab', { name: '03 Commit' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('accepted Commit');
  await page.getByRole('tab', { name: '04 Welcome' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Earlier message history');
  await page.getByRole('tab', { name: '05 Message' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('does not advance');
  await page.goto('/#slide=10');
  for (const [tab, api] of [['Add', 'add_members'], ['Join', 'StagedWelcome'], ['Send', 'create_message'], ['Receive', 'process_message']]) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(page.locator('pre')).toContainText(api);
  }
  await page.goto('/#slide=11');
  await page.getByText('Identity & membership policy', { exact: true }).click();
  await expect(page.getByText(/identity bytes alone/)).toBeVisible();
  await page.getByText('Ordering & offline recovery', { exact: true }).click();
  await expect(page.getByText(/one accepted Commit order/)).toBeVisible();
});

test('scores quiz answers, explains mistakes, and restarts', async ({ page }) => {
  await page.goto('/#slide=12');
  await page.getByRole('button', { name: /As soon as Alice sends/ }).click();
  await expect(page.getByText('A useful distinction.')).toBeVisible();
  await expect(page.getByText('(Correct)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByRole('button', { name: /The group state for the epoch/ }).click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByRole('button', { name: /It can route ciphertext/ }).click();
  await page.getByRole('button', { name: 'See your result' }).click();
  await expect(page.locator('.quiz-score')).toHaveText('2 / 3');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('QUESTION 01 / 03')).toBeVisible();
  await expect(page.getByRole('button', { name: /As soon as Alice sends/ })).toBeEnabled();
});

test('supports overview, notes, references, keyboard help, and focus return', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('o');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button')).toHaveCount(14);
  await page.getByRole('button', { name: /07.*A group changes/ }).click();
  await expect(page).toHaveURL(/#slide=7$/);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.keyboard.press('n');
  await expect(page.getByRole('complementary', { name: 'Speaker notes' })).toBeVisible();
  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(page.locator('#notes')).toContainText('Forward secrecy');
  await page.keyboard.press('r');
  await expect(page.getByRole('dialog').getByRole('link', { name: /RFC 9420/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('?');
  await expect(page.getByRole('heading', { name: 'Make it your presentation.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('works as an offline, standalone HTML file', async ({ browser }) => {
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  await page.goto(pathToFileURL(resolve('index.html')).href);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Let’s start' }).click();
  await expect(page.getByRole('tab', { name: 'End-to-end / E2EE' })).toBeVisible();
  await page.getByRole('tab', { name: 'End-to-end / E2EE' }).click();
  await expect(page.getByText('Sees ciphertext', { exact: true })).toBeVisible();
  await context.close();
});

test('fits the presentation to the screen in fullscreen mode', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#slide=4');
  await page.getByRole('button', { name: 'Enter fullscreen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exit fullscreen', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.getElementById('app').getBoundingClientRect().bottom <= innerHeight)).toBe(true);
  await page.getByRole('tab', { name: 'Explore update costs' }).click();
  await expect.poll(() => page.evaluate(() => document.getElementById('app').getBoundingClientRect().bottom <= innerHeight)).toBe(true);
  await page.keyboard.press('n');
  await expect(page.locator('#notes')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.getElementById('app').getBoundingClientRect().bottom <= innerHeight)).toBe(true);
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enter fullscreen', exact: true })).toBeVisible();
});

test('keeps every slide inside desktop, tablet, and mobile widths', async ({ page }) => {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (let slide = 1; slide <= 13; slide++) {
      await page.goto(`/#slide=${slide}`);
      await expect(page.locator('#slide-title')).toBeVisible();
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      expect(dimensions.scroll, `Slide ${slide} overflows at ${width}px`).toBeLessThanOrEqual(dimensions.width);
      if (slide === 4) {
        await page.getByRole('tab', { name: 'Explore update costs' }).click();
        const costs = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        expect(costs.scroll, `Group update chart overflows at ${width}px`).toBeLessThanOrEqual(costs.width);
      }
    }
  }
});

test('has no WCAG A/AA accessibility violations across all slides', async ({ page }) => {
  test.setTimeout(90_000);
  const violations = [];
  for (let slide = 1; slide <= 13; slide++) {
    await page.goto(`/#slide=${slide}`);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    violations.push(...result.violations.map(v => ({ slide, id: v.id, targets: v.nodes.map(n => n.target) })));
    if (slide === 4) {
      await page.getByRole('tab', { name: 'Explore update costs' }).click();
      const costs = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      violations.push(...costs.violations.map(v => ({ slide, view: 'update costs', id: v.id, targets: v.nodes.map(n => n.target) })));
    }
  }
  expect(violations).toEqual([]);
});
