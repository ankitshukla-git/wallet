import { test, expect } from './fixtures';
import * as speakeasy from 'speakeasy';

/** Strip currency symbols, commas, whitespace and parse to a number. */
function parseCurrency(text: string): number {
  const cleaned = text.replace(/[$,£€\s]/g, '').trim();
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) throw new Error(`Cannot parse currency: "${text}"`);
  return value;
}

test.describe('Portfolio', () => {
  test('displays expected portfolio value', async ({ page }) => {
    const baseUrl = (process.env.BASE_URL ?? '').replace(/\/$/, '');
    const username = process.env.TEST_USERNAME!;
    const password = process.env.TEST_PASSWORD!;
    const expected = parseFloat(process.env.EXPECTED_PORTFOLIO_VALUE!);
    const totpSecret = process.env.TEST_TOTP_SECRET?.trim();

    if (!baseUrl || !username || !password || Number.isNaN(expected)) {
      throw new Error(
        'Missing required env: BASE_URL, TEST_USERNAME, TEST_PASSWORD, EXPECTED_PORTFOLIO_VALUE',
      );
    }

    // --- Login ---
    await page.goto(baseUrl);
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('form button[type="submit"]').click();

    // --- 2FA (TOTP) — skipped if session valid or account has no 2FA ---
    const codeInput = page.locator('input[name="tfa"]');
    const needsTwoFa = await Promise.race([
      codeInput.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true),
      page.waitForURL((url) => !url.pathname.includes('sign-in'), { timeout: 15_000 }).then(() => false),
    ]);

    if (needsTwoFa) {
      if (!totpSecret) throw new Error('2FA required. Set TEST_TOTP_SECRET in .env.');
      const token = speakeasy.totp({ secret: totpSecret, encoding: 'base32' });
      await codeInput.fill(token);

      const enterBtn = page.getByRole('button', { name: /^enter$/i });
      await expect(enterBtn).toBeEnabled({ timeout: 10_000 });
      await enterBtn.click();

      await page.waitForURL(
        (url) =>
          !url.pathname.includes('sign-in') && !url.pathname.includes('confirm'),
        { timeout: 15_000 },
      );
    }

    // Device approval cannot be automated
    if (await page.getByText(/approve new device/i).first().isVisible().catch(() => false)) {
      throw new Error('Device approval required. Approve via email, then re-run.');
    }

    // --- Navigate to portfolio ---
    const portfolioLink = page.getByRole('link', { name: /portfolio/i });
    if (await portfolioLink.isVisible()) await portfolioLink.click();

    // --- Read and validate portfolio value ---
    const valueEl = page.getByTestId('portfolio-value');
    await expect(valueEl).toBeVisible();

    const srOnly = valueEl.locator('.sr-only').first();
    const raw =
      (await srOnly.isVisible().then((v) => (v ? srOnly.textContent() : null))) ??
      (await valueEl.textContent()) ??
      '';
    if (!raw.trim()) throw new Error('Portfolio value element is empty');

    const actual = parseCurrency(raw);
    console.log(`Portfolio: raw="${raw.trim()}" parsed=${actual} expected=${expected}`);

    expect(actual).toBe(expected);
  });
});
