import { expect, test } from '@playwright/test';

test('home leads with the brand, the next stop and one h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Good coffee');
  await expect(page.getByText('Next stop', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find the trailer' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book us for your event' })).toBeVisible();
});

test('the calendar shows stops, hides who booked a private event, and the feed lists public stops only', async ({ page }) => {
  await page.goto('/calendar/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the trailer');
  await expect(page.getByRole('heading', { name: 'Every stop' })).toBeVisible();
  const list = page.locator('#list-title').locator('xpath=following-sibling::ul[1]');
  await expect(list.getByText('Private event').first()).toBeVisible();
  await expect(list.getByText('The trailer is booked for a private event that day.').first()).toBeVisible();
  await expect(list.getByRole('link', { name: /Add to calendar/ }).first()).toHaveAttribute('href', /calendar\.google\.com/);
  const download = await page.getByRole('link', { name: 'Download calendar file' }).getAttribute('href');
  if (!download) throw new Error('The calendar download link has no href');
  const feed = await page.request.get(download);
  expect(feed.status()).toBe(200);
  const text = await feed.text();
  expect(text).toContain('BEGIN:VCALENDAR');
  expect(text).toContain('BEGIN:VEVENT');
  expect(text).not.toContain('Private event');
});

test('the month grid is a real table with a heading per month', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/calendar/');
  await expect(page.locator('table')).toHaveCount(3);
  await expect(page.locator('table caption').first()).toContainText(/20\d\d/);
});

test('menu lists drinks in sections', async ({ page }) => {
  await page.goto('/menu/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The menu');
  await expect(page.getByRole('heading', { name: 'Flat white' })).toBeVisible();
});

test('booking: errors are explained, the date a private event holds is refused, a valid request is handed back for sending', async ({ page }) => {
  await page.goto('/book/');
  await page.getByRole('button', { name: 'Send my request' }).click();
  await expect(page.getByRole('alert').first()).toContainText('Please fix');
  await expect(page.getByText('Tell us your name.')).toBeVisible();
  await expect(page.getByLabel('Your name')).toBeFocused();

  const booked = await page.locator('[data-booking-form]').getAttribute('data-booked');
  const [bookedDate = ''] = (booked ?? '').split(',');
  expect(bookedDate).not.toBe('');
  await page.getByLabel('Date').fill(bookedDate);
  await page.getByLabel('Your name').fill('Aoife Murphy');
  await page.getByLabel('Email').fill('aoife@example.com');
  await page.getByLabel('Kind of event').selectOption('Wedding');
  await page.getByLabel(/Where is it/).fill('Eaton Hall, Chester');
  await page.getByRole('button', { name: 'Send my request' }).click();
  await expect(page.getByText(/already booked that day/)).toBeVisible();

  await page.getByLabel('Date').fill('2099-06-06');
  await page.getByRole('button', { name: 'Send my request' }).click();
  const result = page.locator('[data-result]');
  await expect(result).toBeVisible();
  await expect(result.getByRole('heading')).toContainText('send us your request');
  await expect(result.locator('textarea')).toHaveValue(/Date: 2099-06-06/);
  await expect(result.getByRole('link', { name: 'Message us on Instagram' })).toHaveAttribute('href', /instagram\.com/);
});

test('booking: a configured endpoint receives the request as JSON', async ({ page }) => {
  await page.goto('/book/');
  await page.locator('[data-booking-form]').evaluate((form) => form.setAttribute('data-endpoint', 'https://forms.example.test/eire'));
  let posted = '';
  await page.route('https://forms.example.test/eire', async (route) => {
    posted = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.getByLabel('Your name').fill('Aoife Murphy');
  await page.getByLabel('Email').fill('aoife@example.com');
  await page.getByLabel('Kind of event').selectOption('Festival or market');
  await page.getByLabel('Date').fill('2099-06-06');
  await page.getByLabel(/Where is it/).fill('Chester Racecourse');
  await page.getByRole('button', { name: 'Send my request' }).click();
  await expect(page.locator('[data-result]').getByRole('heading')).toHaveText('Request sent. Thank you!');
  expect(JSON.parse(posted)).toMatchObject({ name: 'Aoife Murphy', date: '2099-06-06', eventType: 'Festival or market' });
});

test('our story presents the earlier venture as new-but-experienced, with its photo and reviews', async ({ page }) => {
  await page.goto('/our-story/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('New venture, not our first');
  await expect(page.getByText('Capuchin Coffee').first()).toBeVisible();
  await expect(page.getByRole('img', { name: /Inside Capuchin Coffee in Hale/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kind words' })).toBeVisible();
  expect(await page.locator('blockquote').count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByRole('link', { name: 'See the Capuchin Coffee site' })).toHaveAttribute('href', 'https://www.capuchincoffee.co.uk/');
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Read our story' })).toBeVisible();
});

test('faq accordion opens', async ({ page }) => {
  await page.goto('/faqs');
  await page.locator('summary').first().click();
  await expect(page.locator('details[open]')).toHaveCount(1);
});

test('add to cart reaches the checkout link', async ({ page }) => {
  await page.goto('/shop/mug');
  await page.getByRole('button', { name: 'Add To Cart' }).click();
  await expect(page.getByRole('button', { name: /Added/ })).toBeVisible();
  await page.getByRole('button', { name: /^Cart/ }).click();
  await expect(page.getByRole('dialog').getByText('£14.00')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to checkout' })).toHaveAttribute('href', /checkout/);
});

test('shop shows the products with their pictures', async ({ page }) => {
  await page.goto('/shop/');
  await expect(page.getByRole('heading', { name: 'Éire House Blend' })).toBeVisible();
  const picture = page.locator('li img').first();
  await picture.scrollIntoViewIfNeeded();
  await expect.poll(() => picture.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

for (const path of ['/', '/calendar/', '/book/', '/menu/', '/shop/', '/our-story/', '/faqs/', '/contact/']) {
  test(`no horizontal scroll on a phone at ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await page.waitForLoadState('load');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('reduced motion stops the lighthouse beam and the ticker', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  expect(await page.locator('.beam').first().evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
  expect(await page.locator('.marquee-track').first().evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
  await context.close();
});

test('no console errors, uncaught exceptions or failed requests on any page', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => message.type() === 'error' && problems.push(`console: ${message.text()}`));
  page.on('pageerror', (error) => problems.push(`exception: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`failed: ${request.url()}`));
  page.on('response', (response) => response.status() >= 400 && problems.push(`${response.status()}: ${response.url()}`));
  for (const path of ['/', '/calendar/', '/book/', '/menu/', '/shop/', '/our-story/', '/shop/mug/', '/shop/house-blend/', '/faqs/', '/contact/', '/llms.txt', '/robots.txt']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    });
  }
  const feed = await page.request.get('/eire-coffee-stops.ics');
  if (feed.status() >= 400) problems.push(`${feed.status()}: /eire-coffee-stops.ics`);
  expect(problems).toEqual([]);
});

for (const width of [768, 1024]) {
  for (const path of ['/', '/calendar/', '/book/', '/shop/']) {
    test(`header and layout fit at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const header = await page.locator('header').boundingBox();
      expect(header?.height ?? 0).toBeLessThan(130);
    });
  }
}

test('buttons respond to hover and press with whole-pixel offsets, never a transform', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('link', { name: 'Find the trailer' });
  await button.hover();
  await page.waitForTimeout(250);
  expect(await button.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
  expect(await button.evaluate((node) => getComputedStyle(node).top)).toBe('-2px');
  await page.mouse.down();
  await page.waitForTimeout(250);
  expect(await button.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
  expect(await button.evaluate((node) => getComputedStyle(node).top)).toBe('2px');
  await page.mouse.up();
});

test('the header cart button stays on one line, and shop cards in a row are the same height', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.goto('/');
  const cart = await page.getByRole('button', { name: /^Cart/ }).boundingBox();
  expect(cart?.height ?? 999).toBeLessThan(60);
  const cards = page.locator('main section', { has: page.getByRole('heading', { name: 'Take a bit of Éire home' }) }).locator('li');
  await cards.first().scrollIntoViewIfNeeded();
  const heights = await cards.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().height)));
  expect(heights.length).toBeGreaterThan(1);
  expect(new Set(heights).size).toBe(1);
});
