# Browser Acceptance Tests

Portfolio value validation using TypeScript and Playwright.

## Setup

Requires Node.js 20+.

```bash
npm install
npx playwright install --with-deps
cp .env.example .env
```

Fill in `.env`:

- `BASE_URL` – sign-in page URL
- `TEST_USERNAME` – account email
- `TEST_PASSWORD` – account password
- `EXPECTED_PORTFOLIO_VALUE` – expected total as a number (e.g. `1.07`)
- `TEST_TOTP_SECRET` – base32 TOTP secret for authenticator app 2FA

## Run

```bash
npm test                # headless
npm run test:headed     # visible browser
```

On failure, screenshots are saved to `test-results/`. Traces are recorded on first retry — view with `npx playwright show-trace <path>`.

## Notes

- Runs headless on Linux out of the box. `--with-deps` installs Chromium's system dependencies on Ubuntu/Debian.
- All config lives in `.env` — swap accounts or environments by editing it.
- A persistent browser profile (`playwright-user-data/`) avoids repeated device-approval emails. Delete the folder to start fresh.
