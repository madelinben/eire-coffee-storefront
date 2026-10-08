import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// WCAG 2.1 A and AA plus axe best practices, on every public page, at desktop and phone width.
const pages = ['/', '/calendar/', '/book/', '/menu/', '/shop/', '/our-story/', '/shop/mug/', '/faqs/', '/contact/'];

for (const [name, viewport] of [['desktop', { width: 1366, height: 800 }], ['phone', { width: 360, height: 740 }]] as const) {
  for (const path of pages) {
    test(`no accessibility violations on ${path} (${name})`, async ({ page }) => {
      // Reduced motion skips the entrance animations (the site honours it), so axe never samples text mid fade-in.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(viewport);
      await page.goto(path);
      await page.waitForLoadState('load');
      // Reveal-on-scroll content starts transparent; show it so contrast is measured on what people see.
      await page.addStyleTag({ content: '[data-reveal],[data-bar]{opacity:1!important;transform:none!important;transition:none!important}' });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
      const summary = results.violations.map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(' | ')}`);
      expect(summary, summary.join('\n')).toEqual([]);
    });
  }
}

test('the booking form is accessible with errors showing and with the result panel open', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/book/');
  await page.getByRole('button', { name: 'Send my request' }).click();
  const withErrors = await new AxeBuilder({ page }).include('[data-booking-form]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  expect(withErrors.violations.map((violation) => violation.id)).toEqual([]);

  await page.getByLabel('Your name').fill('Aoife Murphy');
  await page.getByLabel('Email').fill('aoife@example.com');
  await page.getByLabel('Kind of event').selectOption('Wedding');
  await page.getByLabel('Date').fill('2099-06-06');
  await page.getByLabel(/Where is it/).fill('Chester');
  await page.getByRole('button', { name: 'Send my request' }).click();
  await expect(page.locator('[data-result]')).toBeVisible();
  const withResult = await new AxeBuilder({ page }).include('[data-booking-form]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  expect(withResult.violations.map((violation) => violation.id)).toEqual([]);
});
